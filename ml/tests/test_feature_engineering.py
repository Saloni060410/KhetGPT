import pandas as pd
import pytest

from src.data_pipeline.feature_engineering import (
    CLASSIFIER_TARGET,
    FEATURE_COLUMNS,
    UnknownCropError,
    build_features,
    load_training_frame,
    request_to_record,
    rule_inputs,
)
from src.data_pipeline.soil_data_loader import (
    SoilValidationError,
    load_reference_tables,
    validate_soil,
)

VALID_SOIL = {"n": 100.0, "p": 15.0, "k": 120.0, "ph": 7.2, "organic_carbon": 0.6, "moisture": 40.0}
VALID_WEATHER = {
    "temperature_c": 26.0,
    "humidity_pct": 52.0,
    "rainfall_mm_forecast": 5.0,
    "source": "live",
}


def _request(**overrides) -> dict:
    req = {
        "field_id": "f1",
        "crop_type": "wheat",
        "variety": None,
        "irrigation": "irrigated",
        "growth_stage": "sowing",
        "sowing_date": "2026-11-01",
        "soil": dict(VALID_SOIL),
        "weather": dict(VALID_WEATHER),
        "previous_fertilizer_usage": [],
    }
    req.update(overrides)
    return req


def test_parity_between_training_path_and_request_path():
    """The same underlying record, fed through the training path (a train.csv row) and the
    serving path (request_to_record + build_features), must produce identical features."""
    tables = load_reference_tables()

    train_row = load_training_frame("train").iloc[0].to_dict()

    req = _request(
        crop_type=train_row["crop_id"],
        variety=None if train_row["variety_id"] == "generic" else train_row["variety_id"],
    )
    req["weather"]["temperature_c"] = train_row["temperature_c"]
    req["weather"]["humidity_pct"] = train_row["humidity_pct"]
    req["soil"]["moisture"] = train_row["moisture_pct"]

    record_from_request = request_to_record(req, tables=tables)

    features_from_training = build_features([train_row], tables=tables)
    features_from_request = build_features([record_from_request], tables=tables)

    pd.testing.assert_frame_equal(features_from_training, features_from_request)


def test_unknown_crop_raises_a_clear_error():
    with pytest.raises(UnknownCropError, match="banana"):
        request_to_record(_request(crop_type="banana"))


def test_build_features_raises_for_unknown_crop_id_in_a_record():
    with pytest.raises(UnknownCropError):
        build_features([{"crop_id": "banana", "variety_id": "generic", "temperature_c": 25,
                          "humidity_pct": 50, "moisture_pct": 40}])


def test_build_features_has_no_nans():
    tables = load_reference_tables()
    df = load_training_frame("train")
    records = df.to_dict(orient="records")
    features = build_features(records, tables=tables)
    assert not features.isna().any().any()


def test_build_features_columns_are_fixed_regardless_of_batch_content():
    """A batch containing only one crop must still produce every crop/variety's one-hot
    column -- fixed vocabulary, not vocabulary-from-the-batch."""
    tables = load_reference_tables()
    one_record = [{"crop_id": "wheat", "variety_id": "generic", "temperature_c": 26,
                   "humidity_pct": 52, "moisture_pct": 40}]
    features = build_features(one_record, tables=tables)
    assert any(col.startswith("crop_id__rice") for col in features.columns)
    assert any(col.startswith("crop_id__cotton") for col in features.columns)


def test_validate_soil_rejects_ph_of_19():
    bad_soil = dict(VALID_SOIL, ph=19)
    with pytest.raises(SoilValidationError, match="ph"):
        validate_soil(bad_soil)


def test_validate_soil_accepts_a_valid_soil_dict():
    validate_soil(VALID_SOIL)  # should not raise


def test_validate_soil_rejects_missing_field():
    incomplete = dict(VALID_SOIL)
    del incomplete["ph"]
    with pytest.raises(SoilValidationError, match="missing"):
        validate_soil(incomplete)


def test_validate_soil_rejects_extra_field():
    extra = dict(VALID_SOIL, soil_type="Sandy")
    with pytest.raises(SoilValidationError, match="outside the fixed schema"):
        validate_soil(extra)


def test_request_to_record_computes_soil_ratings():
    tables = load_reference_tables()
    record = request_to_record(_request(), tables=tables)
    assert record["soil_rating_n"] in {"very_low", "low", "medium", "high", "unknown"}


def test_rule_inputs_flags_rain_hold_above_threshold():
    high_rain_req = _request()
    high_rain_req["weather"]["rainfall_mm_forecast"] = 100.0
    result = rule_inputs(high_rain_req)
    assert result["rain_hold"] is True

    low_rain_req = _request()
    low_rain_req["weather"]["rainfall_mm_forecast"] = 0.0
    result = rule_inputs(low_rain_req)
    assert result["rain_hold"] is False


def test_feature_columns_and_target_are_stable_constants():
    assert CLASSIFIER_TARGET == "fertilizer_product_id"
    assert FEATURE_COLUMNS == ["crop_id", "variety_id", "temperature_c", "humidity_pct", "moisture_pct"]
