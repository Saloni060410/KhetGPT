"""Tests for the S3 training harness. All run on the small dev-fallback sample_train.csv,
never on the real train.csv."""

import json

import pandas as pd
import pytest

from src.models import train as train_module
from src.models.fertilizer_model import build_pipeline
from src.models.seeding import seed_everything

CONFIG_PATH = train_module.ML_ROOT / "configs" / "train.yaml"


@pytest.fixture
def config():
    import yaml

    return yaml.safe_load(CONFIG_PATH.read_text())


@pytest.fixture(autouse=True)
def isolated_artifacts(tmp_path_factory, monkeypatch):
    """Every test writes registry/artifacts/runs to its own fresh scratch directory, never
    the real one. Uses tmp_path_factory (always a brand-new directory) rather than tmp_path,
    whose numbered slots pytest can reuse across runs -- a reused, non-empty slot previously
    caused a registry.json from an earlier test run to leak into this one."""
    scratch = tmp_path_factory.mktemp("khet_train_test")
    monkeypatch.setattr(train_module, "REGISTRY_PATH", scratch / "registry.json")
    monkeypatch.setattr(train_module, "ARTIFACT_DIR", scratch / "models_artifacts")
    monkeypatch.setattr(train_module, "RUNS_DIR", scratch / "models_artifacts" / "runs")
    return scratch


def test_seed_everything_is_repeatable():
    import random

    import numpy as np

    seed_everything(42)
    first = (random.random(), np.random.rand())
    seed_everything(42)
    second = (random.random(), np.random.rand())
    assert first == second


def test_config_loads_and_has_the_expected_models(config):
    assert set(config["models"]) == {"majority", "stratified", "logistic_regression", "xgboost"}
    assert config["candidate"] == "xgboost"
    assert "npk_10_26_26" in config["excluded_classes"]


def test_build_pipeline_rejects_an_unknown_kind():
    with pytest.raises(ValueError, match="Unknown model kind"):
        build_pipeline("linear_regression", 42, {})


def test_load_train_and_val_falls_back_to_the_sample_when_train_csv_is_missing(config):
    train_frame, val_frame = train_module.load_train_and_val(config["excluded_classes"])
    assert train_frame.source == "fallback"
    assert val_frame is None
    assert "npk_10_26_26" not in train_frame.target.values
    assert train_module.FALLBACK_NOTE in train_frame.note


def test_fallback_train_and_val_do_not_double_count_rows(config):
    """Regression test: an earlier version of load_frame() re-read the whole fallback file
    once per split, so concatenating train+val silently duplicated every row."""
    train_frame, val_frame = train_module.load_train_and_val(config["excluded_classes"])
    raw = pd.read_csv(train_module.PROCESSED_DIR / "sample_train.csv")
    expected_rows = (raw[train_module.FALLBACK_TARGET_COLUMN] != "npk_10_26_26").sum()
    assert val_frame is None
    assert len(train_frame.target) == expected_rows


def test_load_frame_for_test_split_refuses_to_use_the_fallback(config):
    with pytest.raises(FileNotFoundError, match="frozen test split"):
        train_module.load_frame("test", config["excluded_classes"])


def test_cv_scores_reduces_folds_to_the_smallest_class_size():
    y = pd.Series(["a"] * 10 + ["b"] * 2)
    X = pd.DataFrame({"x": range(12)})
    scores = train_module.cv_scores("t", "dummy", {"strategy": "most_frequent"}, 42, folds=5, X=X, y=y)
    assert scores["n_splits"] == 2


def test_cv_scores_raises_when_a_class_has_only_one_row():
    y = pd.Series(["a"] * 10 + ["b"])
    X = pd.DataFrame({"x": range(11)})
    with pytest.raises(ValueError, match="fewer than the 2 needed"):
        train_module.cv_scores("t", "dummy", {"strategy": "most_frequent"}, 42, folds=5, X=X, y=y)


def test_leakage_smell_test_flags_a_suspiciously_high_macro_f1(config):
    results = {"perfect": {"macro_f1": {"mean": 0.99, "std": 0.0}, "n_splits": 5}}
    warnings = train_module.leakage_smell_test(results, config)
    assert any("above 0.98" in w for w in warnings)


def test_leakage_smell_test_flags_a_dominant_feature(config):
    results = {
        "m": {
            "macro_f1": {"mean": 0.5, "std": 0.1},
            "n_splits": 5,
            "max_feature_importance_share": 0.9,
            "top_feature": "crop_id__wheat",
        }
    }
    warnings = train_module.leakage_smell_test(results, config)
    assert any("crop_id__wheat" in w for w in warnings)


def test_beats_baseline_is_false_when_intervals_overlap():
    results = {
        "candidate": {"macro_f1": {"mean": 0.30, "std": 0.10}},
        "baseline": {"macro_f1": {"mean": 0.25, "std": 0.10}},
    }
    beats, _ = train_module.beats_baseline(results, "candidate", ["baseline"])
    assert beats is False


def test_beats_baseline_is_true_when_the_candidate_clearly_wins():
    results = {
        "candidate": {"macro_f1": {"mean": 0.80, "std": 0.02}},
        "baseline": {"macro_f1": {"mean": 0.20, "std": 0.02}},
    }
    beats, _ = train_module.beats_baseline(results, "candidate", ["baseline"])
    assert beats is True


def test_run_is_deterministic_across_two_runs(config, tmp_path):
    train_module.run(CONFIG_PATH, final_test=False)
    first = json.loads(train_module.REGISTRY_PATH.read_text())["models"][0]["cv_metrics"]

    # Registering the same version twice is refused (never overwrite), so point the second
    # run's artifact directory at a fresh scratch location and compare metrics, not files.
    train_module.REGISTRY_PATH.unlink()
    train_module.ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    for item in train_module.ARTIFACT_DIR.glob("*"):
        if item.is_file():
            item.unlink()
    train_module.run(CONFIG_PATH, final_test=False)
    second = json.loads(train_module.REGISTRY_PATH.read_text())["models"][0]["cv_metrics"]

    assert first == second


def test_run_refuses_final_test_in_fallback_mode(config):
    with pytest.raises(SystemExit, match="no real, frozen test split"):
        train_module.run(CONFIG_PATH, final_test=True)
    assert not train_module.REGISTRY_PATH.exists()


def test_run_registers_a_model_with_a_labels_sidecar(config):
    train_module.run(CONFIG_PATH, final_test=False)
    registry = json.loads(train_module.REGISTRY_PATH.read_text())
    entry = registry["models"][0]
    assert entry["version"] == "0.1.0"
    labels_path = train_module.ARTIFACT_DIR.parent / entry["labels"]
    assert labels_path.exists()
    labels = json.loads(labels_path.read_text())
    assert "npk_10_26_26" not in labels
    assert train_module.ARTIFACT_DIR.parent.joinpath(entry["artifact"]).exists()


def test_run_calling_twice_always_registers_a_new_version(config):
    """By design, every run gets a new version -- versions are never reused or overwritten."""
    train_module.run(CONFIG_PATH, final_test=False)
    train_module.run(CONFIG_PATH, final_test=False)
    registry = json.loads(train_module.REGISTRY_PATH.read_text())
    versions = [entry["version"] for entry in registry["models"]]
    assert versions == ["0.1.0", "0.1.1"]
    for entry in registry["models"]:
        assert train_module.ARTIFACT_DIR.parent.joinpath(entry["artifact"]).exists()


def test_run_refuses_to_overwrite_an_existing_artifact_at_the_same_version(config, monkeypatch):
    """Forces the collision the guard exists for: two runs that would compute the same next
    version (e.g. two processes racing) must not silently clobber the first one's artifact."""
    train_module.run(CONFIG_PATH, final_test=False)
    artifact_path = next(train_module.ARTIFACT_DIR.glob("*.joblib"))
    original_mtime = artifact_path.stat().st_mtime_ns

    monkeypatch.setattr(train_module, "_next_version", lambda existing, model_name: "0.1.0")
    with pytest.raises(SystemExit, match="Refusing to overwrite"):
        train_module.run(CONFIG_PATH, final_test=False)
    assert artifact_path.stat().st_mtime_ns == original_mtime


def test_registered_model_predicts_and_decodes_to_real_product_ids(config):
    train_module.run(CONFIG_PATH, final_test=False)
    import joblib

    registry = json.loads(train_module.REGISTRY_PATH.read_text())
    entry = registry["models"][0]
    pipeline = joblib.load(train_module.ARTIFACT_DIR.parent / entry["artifact"])
    labels = json.loads((train_module.ARTIFACT_DIR.parent / entry["labels"]).read_text())

    train_frame, _ = train_module.load_train_and_val(config["excluded_classes"])
    predicted_index = pipeline.predict(train_frame.features.iloc[:3])
    predicted_labels = [labels[i] for i in predicted_index]
    assert all(label in labels for label in predicted_labels)


def test_run_writes_a_run_record_with_env_versions(config):
    train_module.run(CONFIG_PATH, final_test=False)
    run_dirs = list(train_module.RUNS_DIR.iterdir())
    assert len(run_dirs) == 1
    env = json.loads((run_dirs[0] / "env.json").read_text())
    assert {"python", "scikit_learn", "xgboost"} <= set(env)
    assert (run_dirs[0] / "metrics.json").exists()
    assert (run_dirs[0] / "config.yaml").exists()
