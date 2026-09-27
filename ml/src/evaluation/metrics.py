"""Evaluation metrics (contract C7). Called by Saloni's trainer and formula sanity gate --
signatures here are load-bearing for both; don't change one without telling her.

- evaluate_classifier(y_true, y_pred, y_proba=None, classes=None, groups=None, n_boot=1000,
  seed=42) -> dict: accuracy, balanced_accuracy, macro_f1, mcc, per-class precision/recall/f1,
  confusion_matrix, bootstrap 95% CIs for accuracy/balanced_accuracy/macro_f1, and (only when
  y_proba is given) calibration.brier_score/ece. JSON-serialisable (plain floats/lists/dicts,
  no numpy scalars). `groups` is accepted but unused by this function itself -- reserved for
  a future grouped-bootstrap (e.g. resample whole fields, not rows); per_slice() is the
  slice-by-slice breakdown today.
- cv_summary(fold_scores: list[dict]) -> dict: mean and std per metric key, for scalar (not
  nested) values -- pass each fold's evaluate_classifier() output with confusion_matrix /
  per_class dropped, or your own scalar dict.
- baseline_report(y_train, y_test) -> dict: {"majority_class": {...}, "stratified_random":
  {...}}, each accuracy/balanced_accuracy/macro_f1 on y_test, so a real model's score is
  read against how hard the label distribution alone would be to beat.
- formula_conformity(recs, tables, tol) -> dict: independently recomputes standard_dose_kg_ha
  and soil_adjustment_kg_ha from `tables` (a soil_data_loader.ReferenceTables) for each rec,
  compares max(0, standard_dose + soil_adjustment - prior_credit_kg_ha) against the rec's
  own fertilizer_needed_kg_ha within `tol` kg/ha. `prior_credit_kg_ha` itself is taken as
  given, not recomputed -- crediting prior applications is R8's job and already covered
  there; this function's only claim is about the standard-dose + soil-adjustment arithmetic.
  Each rec: {"crop_id", "variety_id", "irrigation", "region", "nutrient_balance": {"n": {...},
  "p": {...}, "k": {...}}}. Each nutrient sub-dict needs "method" ("reference_dose" | "stcr"),
  "prior_credit_kg_ha", "fertilizer_needed_kg_ha", plus "soil_rating" (reference_dose) or
  "soil_test_value" and optionally "target_yield_q_ha" (stcr, falls back to
  stcr_equations.csv's target_yield_default_q_ha when omitted). Returns {"conformity_rate":
  float, "n_checked": int, "violators": [{"crop_id", "nutrient", "expected", "actual",
  "diff", "reason"}]} -- a rec/nutrient combination that can't be recomputed at all (missing
  table row, missing required field) is reported as a violator with a reason, not raised.
- per_slice(y_true, y_pred, slice_col) -> dict: {slice_value: {accuracy, balanced_accuracy,
  macro_f1, n}} for each distinct value in slice_col (e.g. crop_id, or a soil_rating column).
"""

import numpy as np
from sklearn.metrics import (
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    matthews_corrcoef,
    precision_recall_fscore_support,
)

_NUTRIENT_DOSE_COLUMN = {"n": "n_kg_ha", "p": "p2o5_kg_ha", "k": "k2o_kg_ha"}


def _to_list(x):
    return list(np.asarray(x).tolist())


def _classification_scores(y_true, y_pred, classes) -> dict:
    accuracy = float(np.mean(np.asarray(y_true) == np.asarray(y_pred)))
    balanced_accuracy = float(balanced_accuracy_score(y_true, y_pred))
    macro_f1 = float(f1_score(y_true, y_pred, labels=classes, average="macro", zero_division=0))
    return {"accuracy": accuracy, "balanced_accuracy": balanced_accuracy, "macro_f1": macro_f1}


def _expected_calibration_error(y_true_binary: np.ndarray, y_proba: np.ndarray, n_bins: int = 10) -> float:
    """Mean, over equal-width confidence bins, of |accuracy - mean confidence| in that bin,
    weighted by bin size -- the standard ECE definition (Guo et al. 2017)."""
    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    bin_indices = np.clip(np.digitize(y_proba, bin_edges[1:-1], right=True), 0, n_bins - 1)
    ece = 0.0
    n = len(y_proba)
    for b in range(n_bins):
        mask = bin_indices == b
        if not mask.any():
            continue
        bin_confidence = float(y_proba[mask].mean())
        bin_accuracy = float(y_true_binary[mask].mean())
        ece += (mask.sum() / n) * abs(bin_accuracy - bin_confidence)
    return float(ece)


def evaluate_classifier(y_true, y_pred, y_proba=None, classes=None, groups=None,
                         n_boot: int = 1000, seed: int = 42) -> dict:
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    if len(y_true) != len(y_pred):
        raise ValueError(f"y_true and y_pred must be the same length, got {len(y_true)} and {len(y_pred)}")
    if len(y_true) == 0:
        raise ValueError("y_true is empty")

    classes = list(classes) if classes is not None else sorted(set(y_true.tolist()) | set(y_pred.tolist()))

    scores = _classification_scores(y_true, y_pred, classes)
    mcc = float(matthews_corrcoef(y_true, y_pred)) if len(classes) > 1 else 0.0

    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=classes, average=None, zero_division=0,
    )
    per_class = {
        str(cls): {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }
        for i, cls in enumerate(classes)
    }

    cm = confusion_matrix(y_true, y_pred, labels=classes)

    rng = np.random.default_rng(seed)
    n = len(y_true)
    boot_scores: dict[str, list] = {"accuracy": [], "balanced_accuracy": [], "macro_f1": []}
    for _ in range(n_boot):
        idx = rng.integers(0, n, size=n)
        boot = _classification_scores(y_true[idx], y_pred[idx], classes)
        for key, value in boot.items():
            boot_scores[key].append(value)

    bootstrap_ci = {
        key: [float(np.percentile(values, 2.5)), float(np.percentile(values, 97.5))]
        for key, values in boot_scores.items()
    }

    result = {
        "n": int(n),
        "classes": [str(c) for c in classes],
        **scores,
        "mcc": mcc,
        "per_class": per_class,
        "confusion_matrix": _to_list(cm),
        "bootstrap_ci_95": bootstrap_ci,
    }

    if y_proba is not None:
        y_proba = np.asarray(y_proba, dtype=float)
        if y_proba.ndim == 1:
            # Binary case: y_proba is P(y_true == classes[1]) (or the single positive class).
            positive_class = classes[-1]
            y_true_binary = (y_true == positive_class).astype(float)
            brier = float(np.mean((y_proba - y_true_binary) ** 2))
            ece = _expected_calibration_error(y_true_binary, y_proba)
        else:
            # Multiclass: one-vs-rest Brier/ECE, averaged over classes -- each column of
            # y_proba is P(y == classes[i]).
            briers, eces = [], []
            for i, cls in enumerate(classes):
                y_true_binary = (y_true == cls).astype(float)
                briers.append(float(np.mean((y_proba[:, i] - y_true_binary) ** 2)))
                eces.append(_expected_calibration_error(y_true_binary, y_proba[:, i]))
            brier = float(np.mean(briers))
            ece = float(np.mean(eces))
        result["calibration"] = {"brier_score": brier, "ece": ece}

    return result


def cv_summary(fold_scores: list[dict]) -> dict:
    """Mean and std per scalar metric key across folds. Every fold must share the same keys;
    non-numeric values (e.g. a nested confusion_matrix left in by mistake) raise rather than
    silently being skipped, so a caller notices their fold dict was the wrong shape."""
    if not fold_scores:
        raise ValueError("fold_scores is empty")

    keys = set(fold_scores[0].keys())
    for i, fold in enumerate(fold_scores):
        if set(fold.keys()) != keys:
            raise ValueError(f"fold {i} has keys {sorted(fold.keys())}, expected {sorted(keys)}")

    summary = {}
    for key in keys:
        values = [fold[key] for fold in fold_scores]
        if not all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in values):
            raise ValueError(f"fold_scores[{key!r}] has a non-scalar value -- pass scalar metrics only")
        summary[key] = {"mean": float(np.mean(values)), "std": float(np.std(values))}
    return summary


def baseline_report(y_train, y_test) -> dict:
    y_train = np.asarray(y_train)
    y_test = np.asarray(y_test)
    classes = sorted(set(y_train.tolist()) | set(y_test.tolist()))

    values, counts = np.unique(y_train, return_counts=True)
    majority_class = values[np.argmax(counts)]
    majority_pred = np.full(len(y_test), majority_class, dtype=y_train.dtype)

    train_probs = counts / counts.sum()
    rng = np.random.default_rng(42)
    stratified_pred = rng.choice(values, size=len(y_test), p=train_probs)

    return {
        "majority_class": _classification_scores(y_test, majority_pred, classes),
        "stratified_random": _classification_scores(y_test, stratified_pred, classes),
    }


def _lookup_reference_dose(tables, crop_id, variety_id, irrigation, region, nutrient):
    column = _NUTRIENT_DOSE_COLUMN[nutrient]
    for row in tables.reference_doses:
        if (row["crop_id"], row["variety_id"], row["irrigation"], row["region"]) == (
            crop_id, variety_id, irrigation, region,
        ):
            value = row[column]
            if str(value).startswith("TODO"):
                return None, f"reference_doses.csv {column} is TODO(data) for {crop_id}/{variety_id}"
            return float(value), None
    return None, f"no reference_doses.csv row for ({crop_id}, {variety_id}, {irrigation}, {region})"


def _lookup_soil_adjustment(tables, crop_id, nutrient, soil_rating):
    if soil_rating is None:
        return 0.0, None  # no soil-test rating supplied -- no adjustment applies
    for row in tables.soil_adjustments:
        if (row["crop_id"], row["nutrient"], row["soil_rating"]) == (crop_id, nutrient, soil_rating):
            value = row["adjustment_kg_ha"]
            if str(value).startswith("TODO"):
                return None, f"soil_adjustments.csv adjustment is TODO(data) for {crop_id}/{nutrient}/{soil_rating}"
            return float(value), None
    return 0.0, None  # no row for this (crop, nutrient, rating) -- table's convention is "no adjustment"


def _lookup_stcr(tables, crop_id, variety_id, region, nutrient, soil_test_value, target_yield_q_ha):
    if soil_test_value is None:
        return None, None, "stcr method requires soil_test_value, none given"

    for row in tables.stcr_equations:
        if (row["crop_id"], row["variety_id"], row["region"], row["nutrient"]) == (
            crop_id, variety_id, region, nutrient,
        ):
            a, b = row["a"], row["b"]
            if str(a).startswith("TODO") or str(b).startswith("TODO"):
                return None, None, f"stcr_equations.csv a/b is TODO(data) for {crop_id}/{variety_id}/{nutrient}"

            target = target_yield_q_ha
            if target is None:
                default = row["target_yield_default_q_ha"]
                if str(default).startswith("TODO"):
                    return None, None, (
                        f"stcr_equations.csv target_yield_default_q_ha is TODO(data) for "
                        f"{crop_id}/{variety_id}/{nutrient}, and no target_yield_q_ha was given"
                    )
                target = float(default)

            standard_dose = float(a) * target
            soil_adjustment = -float(b) * soil_test_value
            return standard_dose, soil_adjustment, None

    return None, None, f"no stcr_equations.csv row for ({crop_id}, {variety_id}, {region}, {nutrient})"


def formula_conformity(recs: list[dict], tables, tol: float) -> dict:
    violators = []
    n_checked = 0

    for rec in recs:
        crop_id = rec["crop_id"]
        variety_id = rec["variety_id"]
        irrigation = rec.get("irrigation")
        region = rec.get("region")

        for nutrient, entry in rec["nutrient_balance"].items():
            n_checked += 1
            method = entry["method"]
            prior_credit = entry.get("prior_credit_kg_ha", 0.0)
            actual = entry["fertilizer_needed_kg_ha"]

            if method == "reference_dose":
                standard_dose, reason = _lookup_reference_dose(
                    tables, crop_id, variety_id, irrigation, region, nutrient,
                )
                soil_adjustment = None
                if reason is None:
                    soil_adjustment, reason = _lookup_soil_adjustment(
                        tables, crop_id, nutrient, entry.get("soil_rating"),
                    )
            elif method == "stcr":
                standard_dose, soil_adjustment, reason = _lookup_stcr(
                    tables, crop_id, variety_id, region, nutrient,
                    entry.get("soil_test_value"), entry.get("target_yield_q_ha"),
                )
            else:
                standard_dose, soil_adjustment, reason = None, None, f"unknown method {method!r}"

            if reason is not None:
                violators.append({
                    "crop_id": crop_id, "nutrient": nutrient, "expected": None,
                    "actual": actual, "diff": None, "reason": reason,
                })
                continue

            expected = max(0.0, standard_dose + soil_adjustment - prior_credit)
            diff = abs(expected - actual)
            if diff > tol:
                violators.append({
                    "crop_id": crop_id, "nutrient": nutrient, "expected": expected,
                    "actual": actual, "diff": diff, "reason": "outside tolerance",
                })

    conformity_rate = (n_checked - len(violators)) / n_checked if n_checked else 1.0
    return {"conformity_rate": conformity_rate, "n_checked": n_checked, "violators": violators}


def per_slice(y_true, y_pred, slice_col) -> dict:
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    slice_col = np.asarray(slice_col)
    if not (len(y_true) == len(y_pred) == len(slice_col)):
        raise ValueError("y_true, y_pred and slice_col must be the same length")

    result = {}
    for slice_value in sorted(set(slice_col.tolist())):
        mask = slice_col == slice_value
        classes = sorted(set(y_true[mask].tolist()) | set(y_pred[mask].tolist()))
        scores = _classification_scores(y_true[mask], y_pred[mask], classes)
        result[str(slice_value)] = {**scores, "n": int(mask.sum())}
    return result
