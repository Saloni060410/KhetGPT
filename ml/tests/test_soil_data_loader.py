import pytest

from src.data_pipeline.soil_data_loader import (
    ReferenceDataError,
    load_reference_tables,
    ready_crops,
)


def test_load_reference_tables_reads_every_c5_table():
    tables = load_reference_tables()
    assert len(tables.crops) == 6
    assert len(tables.reference_doses) > 0
    assert len(tables.fertilizer_products) > 0


def test_load_reference_tables_raises_clearly_for_a_missing_column(tmp_path, monkeypatch):
    from src.data_pipeline import soil_data_loader as loader

    bad_dir = tmp_path
    (bad_dir / "crops.csv").write_text("crop_id,name_en\nwheat,Wheat\n", encoding="utf-8")
    monkeypatch.setattr(loader, "EXTERNAL_DIR", bad_dir)
    with pytest.raises(ReferenceDataError, match="missing expected column"):
        loader._read_table("crops", "crops.csv", ("crop_id", "name_en", "name_hi", "dataset_label", "season", "source"))


def test_ready_crops_matches_known_v0_coverage():
    tables = load_reference_tables()
    readiness = ready_crops(tables)
    assert readiness["wheat"]["ready"] is True
    assert readiness["rice"]["ready"] is True
    assert readiness["chickpea"]["ready"] is True
    assert readiness["maize"]["ready"] is False
    assert readiness["maize"]["reason"]
