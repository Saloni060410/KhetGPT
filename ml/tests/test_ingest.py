import pytest

from src.data_pipeline.ingest import IngestError, load_manifest, verify_all, verify_dataset


def test_verify_all_passes_for_current_manifest():
    verified = verify_all()
    assert "fertilizer_prediction" in verified
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
    entry = dict(load_manifest()["datasets"][0])
    entry["sha256"] = "0" * 64
    with pytest.raises(IngestError, match="sha256 mismatch"):
        verify_dataset(entry)


def test_verify_dataset_raises_on_row_count_mismatch():
    entry = dict(load_manifest()["datasets"][0])
    entry["rows"] = entry["rows"] + 1
    with pytest.raises(IngestError, match="row count mismatch"):
        verify_dataset(entry)
