"""Train and cross-validate the fertilizer-product classifier (S3).

    python -m src.models.train --config configs/train.yaml
    python -m src.models.train --config configs/train.yaml --final-test

Loads train/val frames via Richa's load_training_frame (contract C4). If the real dataset
build hasn't been run yet (data/processed/train.csv doesn't exist -- see the docstring on
FALLBACK_NOTE below), falls back to the small committed data/processed/sample_train.csv and
runs cross-validation only; --final-test then refuses to run, since there is no frozen,
never-touched test split to evaluate on in that mode.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
import xgboost
import yaml
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    matthews_corrcoef,
)
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder

from src.data_pipeline.feature_engineering import (
    CLASSIFIER_TARGET,
    FEATURE_COLUMNS,
    build_features,
    load_training_frame,
)
from src.models.fertilizer_model import build_pipeline
from src.models.seeding import seed_everything

ML_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = ML_ROOT / "data" / "processed"
REGISTRY_PATH = ML_ROOT / "src" / "models" / "model_registry" / "registry.json"
ARTIFACT_DIR = ML_ROOT / "models_artifacts"
RUNS_DIR = ARTIFACT_DIR / "runs"

# The sample_train.csv column that actually holds the label. Richa's feature_engineering.py
# names the contract constant CLASSIFIER_TARGET = "fertilizer_product_id"; the raw dataset
# column is "product_id". Both point at the same thing here -- flagged, not silently patched
# in her file.
FALLBACK_TARGET_COLUMN = "product_id"

FALLBACK_NOTE = (
    "Loaded data/processed/sample_train.csv (dev fallback), not the real train.csv. "
    "data/processed/train.csv (built by Richa's build_dataset.py) needs the raw Kaggle "
    "file at data/raw/fertilizer_prediction.csv, which is gitignored and not present on "
    "this machine. This run is cross-validation only; --final-test refuses to run because "
    "there is no frozen, never-touched test split available in this mode."
)


@dataclass
class Frame:
    features: pd.DataFrame
    target: pd.Series
    source: str  # "real" (Richa's load_training_frame) or "fallback" (sample_train.csv)
    note: str | None = None


def _records_from_frame(df: pd.DataFrame) -> list[dict]:
    return df[FEATURE_COLUMNS].to_dict(orient="records")


def _filtered(df: pd.DataFrame, target: pd.Series, excluded_classes: list[str], split: str) -> tuple[pd.DataFrame, pd.Series, str | None]:
    keep = ~target.isin(excluded_classes)
    note = None
    if (~keep).any():
        note = (
            f"Dropped {int((~keep).sum())} row(s) of excluded class(es) "
            f"{sorted(set(target[~keep]))} from the {split} split."
        )
    return df[keep].reset_index(drop=True), target[keep].reset_index(drop=True), note


def load_real_split(split: str) -> tuple[pd.DataFrame, pd.Series] | None:
    """Richa's load_training_frame (contract C4). None if data/processed/train.csv doesn't
    exist yet -- the caller decides how to handle "train"/"val" (fallback) vs "test" (refuse)."""
    try:
        df = load_training_frame(split)
    except FileNotFoundError:
        return None
    return df, df[CLASSIFIER_TARGET]


def load_frame(split: str, excluded_classes: list[str]) -> Frame:
    """Used only for the "test" split, where there is no fallback: real data or nothing."""
    loaded = load_real_split(split)
    if loaded is None:
        raise FileNotFoundError(
            "No real, frozen test split is available (data/processed/train.csv is "
            "missing). Refusing to fabricate one from the dev-fallback sample -- run "
            "src.data_pipeline.build_dataset first."
        )
    df, target = loaded
    df, target, note = _filtered(df, target, excluded_classes, split)
    return Frame(features=build_features(_records_from_frame(df)), target=target, source="real", note=note)


def load_train_and_val(excluded_classes: list[str]) -> tuple[Frame, Frame | None]:
    """Loads train (+val) via Richa's load_training_frame. If data/processed/train.csv
    doesn't exist yet, falls back to the single small sample_train.csv exactly once -- not
    once per split, which would double-count every row when train and val are concatenated
    for cross-validation."""
    real_train = load_real_split("train")
    if real_train is not None:
        real_val = load_real_split("val")
        df, target, note = _filtered(*real_train, excluded_classes, "train")
        train_frame = Frame(features=build_features(_records_from_frame(df)), target=target, source="real", note=note)
        val_frame = None
        if real_val is not None:
            df, target, note = _filtered(*real_val, excluded_classes, "val")
            val_frame = Frame(features=build_features(_records_from_frame(df)), target=target, source="real", note=note)
        return train_frame, val_frame

    df = pd.read_csv(PROCESSED_DIR / "sample_train.csv")
    target = df[FALLBACK_TARGET_COLUMN]
    df, target, exclusion_note = _filtered(df, target, excluded_classes, "train+val (fallback)")
    note = FALLBACK_NOTE + (f" {exclusion_note}" if exclusion_note else "")
    return Frame(features=build_features(_records_from_frame(df)), target=target, source="fallback", note=note), None


def _hash_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:8] if path.exists() else "unavailable"


def _git_sha() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=ML_ROOT, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def _next_version(existing: list[dict], model_name: str) -> str:
    patches = [
        int(entry["version"].split(".")[-1])
        for entry in existing
        if entry["model_name"] == model_name and entry["version"].startswith("0.1.")
    ]
    return f"0.1.{patches and max(patches) + 1 or 0}"


def cv_scores(name: str, pipeline_kind: str, params: dict, seed: int, folds: int, X: pd.DataFrame, y: pd.Series) -> dict:
    class_counts = y.value_counts()
    n_splits = min(folds, int(class_counts.min()))
    if n_splits < 2:
        raise ValueError(
            f"Cannot cross-validate: class {class_counts.idxmin()!r} has only "
            f"{class_counts.min()} row(s), fewer than the 2 needed for a fold."
        )
    if n_splits < folds:
        print(f"  [{name}] reducing folds {folds} -> {n_splits}: smallest class has only {class_counts.min()} rows")

    splitter = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    fold_scores: list[dict[str, float]] = []
    importances: list[np.ndarray] = []

    for train_idx, test_idx in splitter.split(X, y):
        pipeline = build_pipeline(pipeline_kind, seed, params)
        pipeline.fit(X.iloc[train_idx], y.iloc[train_idx])
        pred = pipeline.predict(X.iloc[test_idx])
        y_test = y.iloc[test_idx]
        fold_scores.append(
            {
                "macro_f1": f1_score(y_test, pred, average="macro", zero_division=0),
                "balanced_accuracy": balanced_accuracy_score(y_test, pred),
                "mcc": matthews_corrcoef(y_test, pred),
                "accuracy": accuracy_score(y_test, pred),
            }
        )
        importance = getattr(pipeline.named_steps.get("clf"), "feature_importances_", None)
        if importance is not None:
            importances.append(importance)

    summary = {
        metric: {
            "mean": float(np.mean([f[metric] for f in fold_scores])),
            "std": float(np.std([f[metric] for f in fold_scores])),
        }
        for metric in fold_scores[0]
    }
    summary["n_splits"] = n_splits
    summary["fold_scores"] = fold_scores
    if importances:
        mean_importance = np.mean(importances, axis=0)
        total = mean_importance.sum()
        summary["max_feature_importance_share"] = float(mean_importance.max() / total) if total > 0 else 0.0
        summary["top_feature"] = str(X.columns[int(mean_importance.argmax())])
    return summary


def print_comparison_table(results: dict[str, dict]) -> None:
    header = f"{'model':<20} {'macro_f1':>16} {'balanced_acc':>16} {'mcc':>14} {'accuracy':>14}  folds"
    print(header)
    print("-" * len(header))
    for name, scores in results.items():
        def cell(metric: str, scores: dict = scores) -> str:
            return f"{scores[metric]['mean']:.3f} +/- {scores[metric]['std']:.3f}"

        print(f"{name:<20} {cell('macro_f1'):>16} {cell('balanced_accuracy'):>16} {cell('mcc'):>14} {cell('accuracy'):>14}  {scores['n_splits']}")


def leakage_smell_test(results: dict[str, dict], config: dict) -> list[str]:
    warnings = []
    macro_f1_limit = config["leakage_smell_test"]["macro_f1_warn_above"]
    importance_limit = config["leakage_smell_test"]["feature_importance_warn_above"]
    for name, scores in results.items():
        if scores["macro_f1"]["mean"] > macro_f1_limit:
            warnings.append(
                f"{name}: macro-F1 {scores['macro_f1']['mean']:.3f} is above {macro_f1_limit} "
                f"on {scores['n_splits']} folds of a small dataset -- treat as a leakage warning, not a win."
            )
        share = scores.get("max_feature_importance_share")
        if share is not None and share > importance_limit:
            warnings.append(
                f"{name}: feature {scores['top_feature']!r} holds {share:.0%} of importance "
                f"(above {importance_limit:.0%}) -- check it is not a target proxy."
            )
    return warnings


def beats_baseline(results: dict[str, dict], candidate: str, baselines: list[str]) -> tuple[bool, str]:
    candidate_low = results[candidate]["macro_f1"]["mean"] - results[candidate]["macro_f1"]["std"]
    best_baseline_name = max(baselines, key=lambda name: results[name]["macro_f1"]["mean"])
    baseline_high = results[best_baseline_name]["macro_f1"]["mean"] + results[best_baseline_name]["macro_f1"]["std"]
    beats = candidate_low > baseline_high
    detail = (
        f"{candidate} macro-F1 mean-std ({candidate_low:.3f}) vs strongest baseline "
        f"'{best_baseline_name}' mean+std ({baseline_high:.3f})"
    )
    return beats, detail


def env_versions() -> dict:
    return {
        "python": sys.version.split()[0],
        "scikit_learn": sklearn.__version__,
        "xgboost": xgboost.__version__,
        "pandas": pd.__version__,
        "numpy": np.__version__,
    }


def run(config_path: Path, final_test: bool) -> int:
    config = yaml.safe_load(config_path.read_text())
    seed_everything(config["seed"])

    train_frame, val_frame = load_train_and_val(config["excluded_classes"])
    if train_frame.note:
        print(f"NOTE: {train_frame.note}")

    # Cross-validation is the primary evidence at this dataset size (Richa's EDA_FINDINGS.md):
    # combine train+val so every fold is stratified over the fullest label distribution
    # available, rather than trusting a single frozen split.
    if val_frame is not None:
        X = pd.concat([train_frame.features, val_frame.features], ignore_index=True)
        y = pd.concat([train_frame.target, val_frame.target], ignore_index=True)
    else:
        X, y = train_frame.features, train_frame.target

    print(f"Data source: {train_frame.source} ({len(X)} rows, {y.nunique()} classes after exclusions)")
    print(f"Class counts:\n{y.value_counts().to_string()}\n")

    label_encoder = LabelEncoder().fit(y)
    y_encoded = pd.Series(label_encoder.transform(y), index=y.index)

    results = {}
    for name, model_config in config["models"].items():
        results[name] = cv_scores(name, model_config["kind"], model_config, config["seed"], config["folds"], X, y_encoded)

    print_comparison_table(results)
    print()

    for warning in leakage_smell_test(results, config):
        print(f"LEAKAGE WARNING: {warning}")

    baselines = [name for name, model_config in config["models"].items() if model_config["kind"] == "dummy"]
    candidate = config["candidate"]
    beats, detail = beats_baseline(results, candidate, baselines)
    print(f"\n{candidate} beats the strongest baseline by more than fold noise: {beats}")
    print(f"  {detail}")

    if train_frame.source == "fallback":
        print(f"\nNOTE: {FALLBACK_NOTE}")
        if final_test:
            raise SystemExit(
                "--final-test refused: no real, frozen test split is available in fallback mode."
            )

    # ---- register the candidate model. XGBoost's sklearn API needs integer labels, so the
    # registered pipeline is fit on the encoded labels and its sibling *.labels.json (index ->
    # original product id, in label_encoder.classes_ order) is how anything loading the
    # artifact later (Saloni's S6 recommendation engine) decodes a prediction back to a
    # product id -- see the note in the registry entry below.
    pipeline = build_pipeline(config["models"][candidate]["kind"], config["seed"], config["models"][candidate])
    pipeline.fit(X, y_encoded)

    registry = json.loads(REGISTRY_PATH.read_text()) if REGISTRY_PATH.exists() else {"models": []}
    model_name = config["model_name"]
    version = _next_version(registry["models"], model_name)

    test_metrics = None
    if final_test:
        test_frame = load_frame("test", config["excluded_classes"])
        already_tested = any(
            entry["model_name"] == model_name and entry["version"] == version and entry.get("test_metrics")
            for entry in registry["models"]
        )
        if already_tested:
            raise SystemExit(f"{model_name} {version} has already been evaluated on the test split. Refusing to run again.")
        pred_encoded = pipeline.predict(test_frame.features)
        pred = label_encoder.inverse_transform(pred_encoded)
        test_metrics = {
            "macro_f1": f1_score(test_frame.target, pred, average="macro", zero_division=0),
            "balanced_accuracy": balanced_accuracy_score(test_frame.target, pred),
            "mcc": matthews_corrcoef(test_frame.target, pred),
            "accuracy": accuracy_score(test_frame.target, pred),
            "n_rows": len(test_frame.target),
        }
        print(f"\nFinal test-split metrics (evaluated once): {test_metrics}")

    ARTIFACT_DIR.mkdir(exist_ok=True)
    artifact_path = ARTIFACT_DIR / f"{model_name}-{version}.joblib"
    labels_path = ARTIFACT_DIR / f"{model_name}-{version}.labels.json"
    if artifact_path.exists():
        raise SystemExit(f"Refusing to overwrite an existing artifact: {artifact_path}")
    import joblib

    joblib.dump(pipeline, artifact_path)
    labels_path.write_text(json.dumps(label_encoder.classes_.tolist(), indent=2) + "\n")

    # Relative to ARTIFACT_DIR's parent, not the ML_ROOT constant: identical in real usage
    # (ARTIFACT_DIR is always ML_ROOT/models_artifacts), but also correct when a test
    # monkeypatches ARTIFACT_DIR to a scratch directory outside the repo.
    project_root = ARTIFACT_DIR.parent

    run_id = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    dataset_hash = _hash_file(
        PROCESSED_DIR / "train.csv" if train_frame.source == "real" else PROCESSED_DIR / "sample_train.csv"
    )
    entry = {
        "model_name": model_name,
        "version": version,
        "artifact": str(artifact_path.relative_to(project_root)),
        "labels": str(labels_path.relative_to(project_root)),
        "labels_note": "predict() returns integer class indices; decode with labels[index] (label_encoder.classes_ order)",
        "cv_metrics": {name: {k: v for k, v in scores.items() if k != "fold_scores"} for name, scores in results.items()},
        "test_metrics": test_metrics,
        "dataset_source": train_frame.source,
        "dataset_hash": dataset_hash,
        "config_hash": _hash_file(config_path),
        "git_sha": _git_sha(),
        "date": datetime.now(UTC).isoformat(),
        "run_id": run_id,
    }
    registry["models"].append(entry)
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(json.dumps(registry, indent=2) + "\n")

    run_dir = RUNS_DIR / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "config.yaml").write_text(config_path.read_text())
    (run_dir / "metrics.json").write_text(json.dumps({"cv": results, "test": test_metrics}, indent=2, default=str))
    (run_dir / "env.json").write_text(json.dumps(env_versions(), indent=2))

    print(f"\nRegistered {model_name} {version} -> {artifact_path.relative_to(project_root)}")
    print(f"Run record: {run_dir.relative_to(project_root)}")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=Path("configs/train.yaml"))
    parser.add_argument("--final-test", action="store_true")
    args = parser.parse_args()

    start = time.monotonic()
    exit_code = run(args.config, args.final_test)
    print(f"\nWall clock: {time.monotonic() - start:.1f}s")
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
