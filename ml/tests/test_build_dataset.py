import json

import pandas as pd
import pytest

from src.data_pipeline.build_dataset import EXTERNAL_DIR, PROCESSED_DIR, run

TEST_IDS_PATH = EXTERNAL_DIR / "test_ids.json"


@pytest.fixture
def fresh_test_ids():
    """Ensure test_ids.json does not exist before the test, so the first run() call is
    guaranteed to take the "create frozen test set" path, not the "already frozen" path --
    without this, whether a given run() call takes one path or the other depends on
    whatever state a previous test run left behind, which is exactly what let a real bug
    (train/val sizes drifting on rerun) slip past this test suite once already."""
    original = TEST_IDS_PATH.read_text(encoding="utf-8") if TEST_IDS_PATH.exists() else None
    if TEST_IDS_PATH.exists():
        TEST_IDS_PATH.unlink()
    yield
    if original is not None:
        TEST_IDS_PATH.write_text(original, encoding="utf-8")


def test_steady_state_reruns_are_byte_identical(fresh_test_ids):
    """The FIRST run() (no test_ids.json yet) legitimately differs from later runs -- it's a
    different code path (fresh 3-way split vs. re-deriving train/val around a frozen test
    set) with no reason to agree row-for-row. What must hold is that once the frozen state
    exists, every subsequent run reproduces it exactly -- so compare run 2 against run 3,
    never run 1 against anything."""
    run()  # establishes test_ids.json -- not compared against anything
    second = run()
    second_test_ids = json.loads(TEST_IDS_PATH.read_text(encoding="utf-8"))
    second_train_csv = (PROCESSED_DIR / "train.csv").read_text(encoding="utf-8")

    third = run()
    third_test_ids = json.loads(TEST_IDS_PATH.read_text(encoding="utf-8"))
    third_train_csv = (PROCESSED_DIR / "train.csv").read_text(encoding="utf-8")

    assert second_test_ids == third_test_ids
    assert second["split_sizes"] == third["split_sizes"]
    assert second_train_csv == third_train_csv  # byte-identical, not just same sizes


def test_a_class_smaller_than_the_split_threshold_never_gets_split(fresh_test_ids):
    """Regression test: npk_10_26_26 has only 2 rows. A real bug put one in train and one in
    val, because the small-class threshold was `n < len(ratios)`, which is 3 on a fresh
    build but only 2 when re-deriving train/val around a frozen test set -- the same class
    was treated differently depending on which code path ran. Checked on both paths here."""
    run()  # fresh path
    df = pd.read_csv(PROCESSED_DIR / "train.csv")
    rare_class_splits = set(df[df["fertilizer_product_id"] == "npk_10_26_26"]["split"])
    assert len(rare_class_splits) == 1, f"npk_10_26_26 split across {rare_class_splits}"

    run()  # frozen-test / remainder path
    df = pd.read_csv(PROCESSED_DIR / "train.csv")
    rare_class_splits = set(df[df["fertilizer_product_id"] == "npk_10_26_26"]["split"])
    assert len(rare_class_splits) == 1, f"npk_10_26_26 split across {rare_class_splits}"


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
