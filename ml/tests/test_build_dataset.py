import json

import pandas as pd

from src.data_pipeline.build_dataset import EXTERNAL_DIR, PROCESSED_DIR, run


def test_run_produces_a_frozen_test_set_that_survives_a_rerun():
    first = run()
    test_ids_path = EXTERNAL_DIR / "test_ids.json"
    first_test_ids = json.loads(test_ids_path.read_text(encoding="utf-8"))

    second = run()
    second_test_ids = json.loads(test_ids_path.read_text(encoding="utf-8"))

    assert first_test_ids == second_test_ids
    assert first["split_sizes"] == second["split_sizes"]


def test_train_csv_has_a_split_column_covering_all_three_splits():
    run()
    df = pd.read_csv(PROCESSED_DIR / "train.csv")
    assert set(df["split"].unique()) == {"train", "val", "test"}


def test_no_row_appears_in_more_than_one_split():
    run()
    df = pd.read_csv(PROCESSED_DIR / "train.csv")
    feature_cols = [c for c in df.columns if c != "split"]
    assert not df.duplicated(subset=feature_cols).any()


def test_manifest_gets_a_train_dataset_version_not_mixed_into_datasets_array():
    run()
    manifest = json.loads((EXTERNAL_DIR / "dataset_manifest.json").read_text(encoding="utf-8"))
    dataset_ids = [d.get("id") for d in manifest["datasets"]]
    assert "train_dataset_version" not in dataset_ids  # never leaks into the ingest-checked array
    assert "train_dataset_version" in manifest
    assert manifest["train_dataset_version"]["seed"] == 42
