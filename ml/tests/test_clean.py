import pandas as pd
import pytest

from src.data_pipeline.clean import (
    RAW_PATH,
    CleaningError,
    harmonise,
    map_labels,
    reconcile_npk_units,
    run,
)

# RAW_PATH (the real, gitignored 99-row Kaggle file) requires a manual, logged-in download --
# genuinely absent on a fresh clone (see ml/data/README.md's "Reproduce from a fresh clone").
# A caught-by-actually-running-a-fresh-clone-check bug: two tests below used to assume this
# file was always present and failed for the wrong reason (a real, on-disk file missing) when
# it wasn't, rather than skipping honestly.
requires_real_kaggle_file = pytest.mark.skipif(
    not RAW_PATH.exists(), reason="real Kaggle file not fetched on this machine -- see ml/data/README.md"
)


def test_run_produces_a_validation_report_with_expected_shape():
    report = run()
    # raw_row_count is the real 99-row Kaggle file plus the synthetic supplement (if
    # generate_synthetic_data.py has been run) -- not a fixed 99, since data_source combines
    # the two. clean_row_count + dropped_row_count must still reconcile exactly either way.
    assert report["raw_row_count"] >= 99
    assert report["clean_row_count"] > 0
    assert report["clean_row_count"] + report["dropped_row_count"] == report["raw_row_count"]
    assert set(report["class_balance_crop_id"]) <= {
        "wheat", "rice", "maize", "cotton", "sugarcane", "chickpea", "barley",
    }


@requires_real_kaggle_file
def test_out_of_vocab_crop_labels_are_dropped_not_kept():
    report = run()
    # Pulses is a known gap (generic label, not chickpea-specific) -- must be dropped, from
    # the REAL file specifically. chickpea can legitimately appear in the combined
    # class_balance now (via the synthetic supplement, which generates chickpea rows
    # directly rather than mapping them from "Pulses") -- that's not the same claim.
    assert "Pulses" in report["dropped_crop_labels"]
    assert "chickpea" not in report["real_class_balance_crop_id"]


def test_reconcile_npk_units_blanks_real_rows_and_keeps_synthetic():
    df = pd.DataFrame({
        "nitrogen_raw": [37, 300],
        "potassium_raw": [0, 150],
        "phosphorous_raw": [19, 40],
        "data_source": ["real", "synthetic"],
    })
    out = reconcile_npk_units(df)
    assert set(out.columns) >= {"n", "p", "k"}
    assert out.loc[0, ["n", "p", "k"]].isna().all()  # real row -- blanked, never passed through
    assert out.loc[1, "n"] == 300 and out.loc[1, "p"] == 40 and out.loc[1, "k"] == 150  # synthetic -- kept


def test_no_missing_values_in_the_cleaned_output_except_real_rows_n_p_k():
    # n/p/k are deliberately NaN for real rows (reconcile_npk_units -- their unit is
    # empirically inconsistent with kg/ha, not just unstated, so there's nothing to
    # reconcile them to). Every other column, and n/p/k for synthetic rows, must have zero
    # missingness.
    report = run()
    # .get(..., 0), not ["real"]: row_count_by_data_source (a value_counts().to_dict()) has no
    # "real" key at all when the real Kaggle file is absent (0 real rows) -- a real KeyError
    # this test used to hit on a fresh clone, not a hypothetical.
    real_rows = report["row_count_by_data_source"].get("real", 0)
    for column, count in report["missingness_per_column"].items():
        if column in ("n", "p", "k"):
            assert count == real_rows
        else:
            assert count == 0, f"{column} has {count} missing value(s)"


def test_map_labels_drops_rows_with_unknown_crop_and_keeps_known_ones():
    df = pd.DataFrame(
        {
            "temperature_c": [26, 26],
            "humidity_pct": [52, 52],
            "moisture_pct": [38, 38],
            "soil_type": ["Sandy", "Sandy"],
            "crop_type_raw": ["Wheat", "Tobacco"],
            "nitrogen_raw": [37, 37],
            "potassium_raw": [0, 0],
            "phosphorous_raw": [0, 0],
            "fertilizer_name_raw": ["Urea", "Urea"],
        }
    )
    cleaned, dropped = map_labels(df)
    assert len(cleaned) == 1
    assert cleaned.iloc[0]["crop_id"] == "wheat"
    assert len(dropped) == 1
    assert dropped[0]["crop_type_raw"] == "Tobacco"


def test_map_labels_raises_on_unknown_fertilizer_label():
    df = pd.DataFrame(
        {
            "temperature_c": [26],
            "humidity_pct": [52],
            "moisture_pct": [38],
            "soil_type": ["Sandy"],
            "crop_type_raw": ["Wheat"],
            "nitrogen_raw": [37],
            "potassium_raw": [0],
            "phosphorous_raw": [0],
            "fertilizer_name_raw": ["NotARealProduct"],
        }
    )
    with pytest.raises(CleaningError, match="not in fertilizer_products.csv"):
        map_labels(df)


def test_harmonise_renames_raw_columns_to_snake_case():
    raw = pd.DataFrame(
        {
            "Temparature": [26],
            "Humidity": [52],
            "Moisture": [38],
            "Soil Type": ["Sandy"],
            "Crop Type": ["Wheat"],
            "Nitrogen": [37],
            "Potassium": [0],
            "Phosphorous": [0],
            "Fertilizer Name": ["Urea"],
        }
    )
    out = harmonise(raw)
    assert set(out.columns) == {
        "temperature_c", "humidity_pct", "moisture_pct", "soil_type", "crop_type_raw",
        "nitrogen_raw", "potassium_raw", "phosphorous_raw", "fertilizer_name_raw",
    }
