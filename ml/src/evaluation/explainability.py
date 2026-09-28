"""Plain-language explanations (contract C6).

render_template() was built in R8 as a dependency of risk_analyzer.py. explain() (this file,
R10) ranks a recommendation's rule_trace by effect size, turns the top_k into sentences, and
adds one sentence for the product choice.

explain()'s rule_id coverage matches src/engine/npk_calculator.py's actual rule_trace output,
read directly from her code rather than the prompt pack's placeholder list: dose_reference,
soil_adjustment, dose_stcr, stcr_soil_adjustment, prior_credit, credit_skipped_no_efficiency,
credit_ignored_unknown_product, classifier_disagreement. rain_hold and split_stage, named in
the pack, are NOT rule_trace rule_ids in her implementation -- rain-hold delay and the split
schedule are applied straight to the schedule array, never traced as a rule.

The product-choice sentence: the pack's spec assumes XGBoost's native pred_contribs, but the
currently locked-in production model is random_forest (see PROGRESS.md), which has no
per-row attribution API (no SHAP, per the pack's own instruction). explain() checks the
ACTIVE model's classifier step: pred_contribs when it really is an XGBClassifier, a
feature_importances_-based fallback (global, not per-row, honestly a coarser statement) for
anything else that exposes one, and no product-choice sentence at all if neither is
available. Loading the model is independent of recommendation_engine.py's own loader (no
import between them) to avoid a circular import; any failure here is caught locally so a
model-loading problem costs only the one product-choice sentence, never the rule_trace
sentences already computed -- recommendation_engine.py's caller treats any exception from
explain() as total failure (falls back to a two-line placeholder), so explain() must not
raise for a partial, recoverable problem.
"""

import json
import re
from pathlib import Path

import yaml

EXTERNAL_DIR = Path(__file__).resolve().parents[2] / "data" / "external"
TEMPLATES_PATH = EXTERNAL_DIR / "explanation_templates.yaml"
ML_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = ML_ROOT / "src" / "models" / "model_registry" / "registry.json"

DEFAULT_LANGUAGE = "en"

_NUTRIENT_LABEL = {"n": "N", "p": "P2O5", "k": "K2O"}

_FEATURE_LABELS = {
    "n": "soil nitrogen", "p": "soil phosphorus", "k": "soil potassium",
    "temperature_c": "temperature", "humidity_pct": "humidity", "moisture_pct": "soil moisture",
}


class TemplateError(Exception):
    """A template id doesn't exist, or a required {placeholder} wasn't supplied."""


def _load_templates() -> dict:
    with TEMPLATES_PATH.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def render_template(template_id: str, language: str = DEFAULT_LANGUAGE, **params) -> str:
    """Render explanation_templates.yaml's template_id with **params. Raises TemplateError
    for a missing id or a missing placeholder -- never silently drops a value or renders a
    sentence with an unfilled {placeholder} in it."""
    templates = _load_templates()
    if template_id not in templates:
        raise TemplateError(f"template_id {template_id!r} not found in {TEMPLATES_PATH.name}")

    entry = templates[template_id]
    if language not in entry:
        raise TemplateError(f"template {template_id!r} has no {language!r} sentence")

    try:
        return entry[language].format(**params)
    except KeyError as exc:
        raise TemplateError(f"template {template_id!r} is missing param {exc} (got {sorted(params)})") from exc


_NUMBER_RE = re.compile(r"[-+]?\d+\.?\d*")


def _numeric_effect(entry: dict) -> float:
    """Absolute magnitude to rank a rule_trace item by. entry["effect"] is a human string
    ("+123.6 kg/ha", "-29.7 kg/ha") for dose/adjustment/credit rules, but a non-numeric phrase
    ("ignored for credit and cost", "no credit given") for the two credit-skip rules -- those
    rank last (0.0), never invented a number to sort them by."""
    match = _NUMBER_RE.search(str(entry.get("effect", "")))
    if match:
        return abs(float(match.group()))
    if isinstance(entry.get("value"), (int, float)):
        return abs(float(entry["value"]))
    return 0.0


def _round(value, digits=1):
    return round(value, digits) if isinstance(value, (int, float)) else value


def _sentence_for_rule(entry: dict, features: dict) -> str | None:
    """One rendered sentence for a rule_trace entry, or None if its rule_id isn't in
    explanation_templates.yaml's rule.* set (a rule_id genuinely unknown to this module --
    skipped, never guessed at)."""
    rule_id = entry["rule_id"]
    nutrient = entry.get("nutrient")
    label = _NUTRIENT_LABEL.get(nutrient, nutrient)
    params = dict(entry.get("params") or {})
    params["nutrient_label"] = label
    params["value"] = _round(entry.get("value"))
    params["effect"] = entry.get("effect")

    if rule_id == "dose_reference":
        params["crop"] = features.get("crop_id", "this crop")
    elif rule_id == "credit_ignored_unknown_product":
        params["unknown_product_ids"] = ", ".join(params.get("unknown_product_ids", []))
    elif rule_id == "classifier_disagreement":
        top3 = params.get("classifier_top3") or []
        params["classifier_choice"] = top3[0]["product"] if top3 else entry.get("value")
        params["balance_choice"] = params.get("balance_choice")

    try:
        return render_template(f"rule.{rule_id}", **params)
    except TemplateError:
        return None  # unknown rule_id or a param this rule_id's template doesn't expect -- skip, don't crash


def _load_active_classifier():
    """Independent of recommendation_engine.py's _load_active_model() (no import between the
    two modules, to avoid a circular import: recommendation_engine imports explain from
    here). Returns (pipeline, labels) or (None, None) on any problem -- never raises."""
    import joblib

    try:
        if not REGISTRY_PATH.exists():
            return None, None
        registry = json.loads(REGISTRY_PATH.read_text())
        models = registry.get("models", [])
        if not models:
            return None, None
        entry = models[-1]
        artifact_path = ML_ROOT / entry["artifact"]
        labels_path = ML_ROOT / entry["labels"]
        if not artifact_path.exists() or not labels_path.exists():
            return None, None
        return joblib.load(artifact_path), json.loads(labels_path.read_text())
    except Exception:  # noqa: BLE001 -- a model-loading problem costs only the product sentence
        return None, None


def _feature_label(column: str) -> str:
    if column in _FEATURE_LABELS:
        return _FEATURE_LABELS[column]
    if column.startswith("crop_id__"):
        return f"crop type ({column.removeprefix('crop_id__')})"
    if column.startswith("variety_id__"):
        return f"variety ({column.removeprefix('variety_id__')})"
    return column


def _product_choice_sentence(features: dict, prediction: list[dict] | None) -> str | None:
    if not prediction:
        return None

    from src.data_pipeline.feature_engineering import build_features

    pipeline, labels = _load_active_classifier()
    if pipeline is None:
        return None

    try:
        clf = pipeline.named_steps.get("clf")
        row = build_features([features]).iloc[[0]]
        product = prediction[0]["product"]

        if type(clf).__name__ == "XGBClassifier":
            import xgboost as xgb

            transformed = row
            for name, step in pipeline.steps[:-1]:  # apply any preprocessing before 'clf'
                transformed = step.transform(transformed)
            booster = clf.get_booster()
            dmatrix = xgb.DMatrix(transformed, feature_names=list(row.columns))
            contribs = booster.predict(dmatrix, pred_contribs=True)[0]
            class_index = labels.index(product) if product in labels else 0
            # multiclass pred_contribs is (n_classes, n_features+1); binary is (n_features+1,)
            per_class = contribs[class_index] if contribs.ndim == 2 else contribs
            feature_contribs = per_class[:-1]  # drop the bias term
            top_idx = int(abs(feature_contribs).argmax())
            column = row.columns[top_idx]
            return render_template(
                "rule.product_choice.pred_contribs",
                feature_label=_feature_label(column),
                feature_value=_round(float(row.iloc[0, top_idx])),
                product=product,
            )

        importances = getattr(clf, "feature_importances_", None)
        if importances is not None:
            top_idx = int(importances.argmax())
            column = row.columns[top_idx]
            return render_template(
                "rule.product_choice.feature_importance",
                feature_label=_feature_label(column),
                feature_value=_round(float(row.iloc[0, top_idx])),
            )
        return None
    except Exception:  # noqa: BLE001 -- same reasoning as _load_active_classifier
        return None


def explain(features: dict, prediction: list[dict] | None, rule_trace: list[dict], top_k: int = 3) -> list[str]:
    """Rank rule_trace by absolute effect on fertilizer_needed_kg_ha (largest first), render
    the top_k as plain-language sentences, then append one sentence for the product choice
    if `prediction` (the classifier's top-3 {product, probability} list, or None if no
    classifier is registered) is given. With prediction=None, returns exactly top_k or fewer
    sentences (never more) -- with a real prediction, one more may be appended. Sentences
    never blame the farmer (per explanation_templates.yaml's own rule) and always carry the
    numbers that drove them, sourced from rule_trace's own value/effect/params fields."""
    ranked = sorted(rule_trace, key=_numeric_effect, reverse=True)

    sentences: list[str] = []
    for entry in ranked:
        if len(sentences) >= top_k:
            break
        sentence = _sentence_for_rule(entry, features)
        if sentence is not None:
            sentences.append(sentence)

    product_sentence = _product_choice_sentence(features, prediction)
    if product_sentence is not None:
        sentences.append(product_sentence)

    return sentences
