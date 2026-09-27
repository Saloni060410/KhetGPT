import pytest

from src.data_pipeline.ingest import IngestError, load_manifest, verify_all, verify_dataset


def _committed_entry() -> dict:
    """A manifest entry that's always present on any checkout (committed: true), unlike
    fertilizer_prediction (the real Kaggle file -- committed: false, gitignored, requires a
    manual, logged-in download; genuinely absent on a fresh clone). Tests that need a real,
    on-disk entry to mutate must use one of these, never datasets[0] blindly -- that was a
    real bug caught by actually running a fresh-clone reproducibility check (no manual
    fetch step taken): these tests silently passed for the wrong reason (verify_dataset's
    "not present and committed: false -> skip" path) whenever the real file happened to be
    missing, rather than genuinely exercising the sha256/row-count mismatch branches."""
    return next(d for d in load_manifest()["datasets"] if d.get("committed") is True)


def test_verify_all_passes_for_current_manifest():
    # Only asserts on datasets guaranteed present on any checkout (committed: true).
    # fertilizer_prediction (committed: false) is correctly, silently absent from `verified`
    # unless someone has manually fetched it -- asserting its presence here would make this
    # test fail on a fresh clone for no real reason, exactly the bug this fix addresses.
    verified = verify_all()
    assert "fertilizer_prediction_synthetic" in verified
    assert "isric_sotwis_igp_soil_profiles" in verified


def test_verify_dataset_raises_on_missing_file():
    entry = {
        "id": "missing_dataset",
        "path": "data/raw/does_not_exist.csv",
        "url": "https://example.com",
        "sha256": "0" * 64,
        "rows": 1,
        "columns": ["a"],
    }
    with pytest.raises(IngestError, match="not found"):
        verify_dataset(entry)


def test_verify_dataset_raises_on_sha256_mismatch():
    entry = dict(_committed_entry())
    entry["sha256"] = "0" * 64
    with pytest.raises(IngestError, match="sha256 mismatch"):
        verify_dataset(entry)


def test_verify_dataset_raises_on_row_count_mismatch():
    entry = dict(_committed_entry())
    entry["rows"] = entry["rows"] + 1
    with pytest.raises(IngestError, match="row count mismatch"):
        verify_dataset(entry)
