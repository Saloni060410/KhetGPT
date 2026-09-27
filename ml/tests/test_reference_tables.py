"""Consistency checks for the C5 reference tables (contract C5, Richa + Saloni).

Formula: fertilizer needed = standard dose (reference_doses.csv) + soil-test adjustment
(soil_adjustments.csv) - credit from recent applications (agronomy_rules.yaml's
credit_window_days x nutrient_efficiency.csv's fertilizer_use_efficiency). This is the
corrected formula -- the original demand/supply/efficiency design double-counted the
soil's contribution, because reference_doses.csv (then crop_requirements.csv) holds
PAU's already-net fertilizer-dose recommendations, not gross crop nutrient demand.

Coverage note: crops.csv lists all 6 target crops, but reference_doses.csv and
split_schedule.csv are filled in incrementally -- v0 for wheat and rice first, the rest
in a follow-up. These tests check *internal* consistency between the tables for
whichever crops are currently present, not that every crop in crops.csv has a
reference dose yet.

Not tested here: hiding a crop from GET /reference/crops when it has any required
TODO(data) value is Saloni's engine/API responsibility (ml/src/api, ml/src/engine),
which this branch does not touch.
"""

import csv
import math
from pathlib import Path

EXTERNAL = Path(__file__).resolve().parents[1] / "data" / "external"


def _read_csv(name: str) -> list[dict]:
    with (EXTERNAL / name).open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _is_number(value: str) -> bool:
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


# Was {"barley"}: PAU POP Rabi 2025-26 p.24 gave the flat N/P2O5/K2O rates but the
# split-timing sentence was on the following page, not yet captured. Now sourced (p.25:
# "Drill all fertilizers at sowing" -- same single-stage pattern as chickpea) and closed --
# Saloni's S8/S9 review had already found and fixed the two real consumer-side bugs this gap
# caused (/reference/crops listing barley as ready when it wasn't, and /recommend returning a
# fake empty schedule instead of a 503), so this was worth closing promptly rather than
# leaving as a known gap. Kept as an empty set (not deleted) so a *future* real gap has
# somewhere to go without re-deriving this test's structure.
_KNOWN_MISSING_SPLIT_SCHEDULE: set[str] = set()


def test_every_reference_dose_crop_has_split_rows_and_vice_versa():
    dose_crops = {row["crop_id"] for row in _read_csv("reference_doses.csv")}
    split_crops = {row["crop_id"] for row in _read_csv("split_schedule.csv")}
    assert dose_crops, "reference_doses.csv has no rows"
    assert split_crops, "split_schedule.csv has no rows"
    assert dose_crops - _KNOWN_MISSING_SPLIT_SCHEDULE == split_crops, (
        f"Mismatch between reference_doses.csv crops {dose_crops} and "
        f"split_schedule.csv crops {split_crops} -- every crop with a reference dose "
        "needs a split schedule and vice versa, aside from the explicitly named "
        f"{_KNOWN_MISSING_SPLIT_SCHEDULE} gap."
    )


def test_reference_dose_varieties_are_generic_or_declared():
    declared = {(row["crop_id"], row["variety_id"]) for row in _read_csv("crop_varieties.csv")}
    for row in _read_csv("reference_doses.csv"):
        variety_id = row["variety_id"]
        assert variety_id == "generic" or (row["crop_id"], variety_id) in declared, (
            f"{row['crop_id']}.{variety_id} is not 'generic' and not declared in "
            "crop_varieties.csv"
        )


def test_crop_varieties_never_lists_generic():
    for row in _read_csv("crop_varieties.csv"):
        assert row["variety_id"] != "generic", (
            f"{row['crop_id']}: crop_varieties.csv must never list the 'generic' "
            "fallback id as a real variety"
        )


def test_split_fractions_sum_to_one_per_nutrient_per_crop():
    rows = _read_csv("split_schedule.csv")
    by_crop: dict[str, list[dict]] = {}
    for row in rows:
        by_crop.setdefault(row["crop_id"], []).append(row)

    for crop_id, crop_rows in by_crop.items():
        for nutrient in ("n_fraction", "p_fraction", "k_fraction"):
            total = sum(float(row[nutrient]) for row in crop_rows)
            assert math.isclose(total, 1.0, abs_tol=1e-6), (
                f"{crop_id}.{nutrient} sums to {total}, expected 1.0"
            )


def test_split_fractions_are_non_negative():
    for row in _read_csv("split_schedule.csv"):
        for nutrient in ("n_fraction", "p_fraction", "k_fraction"):
            assert float(row[nutrient]) >= 0, f"{row['crop_id']}.{nutrient} is negative"


def test_reference_doses_have_no_negative_numbers():
    for row in _read_csv("reference_doses.csv"):
        for col in ("n_kg_ha", "p2o5_kg_ha", "k2o_kg_ha"):
            if _is_number(row[col]):
                assert float(row[col]) >= 0, f"{row['crop_id']}.{col} is negative"


def test_reference_doses_sources_are_non_empty():
    for row in _read_csv("reference_doses.csv"):
        assert row["source"].strip(), f"{row['crop_id']} has an empty source"


def test_soil_adjustments_reference_a_declared_crop():
    dose_crops = {row["crop_id"] for row in _read_csv("reference_doses.csv")}
    for row in _read_csv("soil_adjustments.csv"):
        assert row["crop_id"] in dose_crops, (
            f"soil_adjustments.csv row for {row['crop_id']}.{row['nutrient']} has no "
            "matching reference_doses.csv crop"
        )


def test_soil_adjustments_sources_are_non_empty():
    for row in _read_csv("soil_adjustments.csv"):
        assert row["source"].strip(), (
            f"{row['crop_id']}.{row['nutrient']}.{row['soil_rating']} has an empty source"
        )


def test_stcr_equations_sources_are_non_empty():
    for row in _read_csv("stcr_equations.csv"):
        assert row["source"].strip(), f"{row['crop_id']}.{row['variety_id']} has an empty source"


def test_stcr_equation_coefficients_are_numbers_when_present():
    for row in _read_csv("stcr_equations.csv"):
        for col in ("a", "b"):
            assert _is_number(row[col]), f"{row['crop_id']}.{row['nutrient']}.{col} is not a number"


def test_nutrient_efficiency_values_are_between_zero_and_one_when_present():
    for row in _read_csv("nutrient_efficiency.csv"):
        if _is_number(row["fertilizer_use_efficiency"]):
            value = float(row["fertilizer_use_efficiency"])
            assert 0 <= value <= 1, (
                f"{row['crop_id']}.{row['nutrient']}.fertilizer_use_efficiency = {value}, "
                "expected [0, 1]"
            )


def test_nutrient_efficiency_sources_are_non_empty():
    for row in _read_csv("nutrient_efficiency.csv"):
        assert row["source"].strip(), f"{row['crop_id']}.{row['nutrient']} has an empty source"


def test_fertilizer_product_percentages_are_at_most_100_and_non_negative():
    for row in _read_csv("fertilizer_products.csv"):
        total = 0.0
        for col in ("n_pct", "p2o5_pct", "k2o_pct"):
            value = float(row[col])
            assert value >= 0, f"{row['product_id']}.{col} is negative"
            total += value
        assert total <= 100, (
            f"{row['product_id']} N+P2O5+K2O = {total}%, exceeds 100%"
        )


def test_fertilizer_product_sources_and_dataset_labels_are_non_empty():
    for row in _read_csv("fertilizer_products.csv"):
        assert row["source"].strip(), f"{row['product_id']} has an empty source"
        assert row["dataset_label"].strip(), f"{row['product_id']} has an empty dataset_label"


def test_soil_test_ratings_low_below_less_than_high_above():
    for row in _read_csv("soil_test_ratings.csv"):
        low = float(row["low_below"])
        high = float(row["high_above"])
        assert low < high, f"{row['parameter']}: low_below ({low}) >= high_above ({high})"


def test_soil_test_ratings_very_low_below_less_than_low_below_when_present():
    for row in _read_csv("soil_test_ratings.csv"):
        if _is_number(row["very_low_below"]):
            very_low = float(row["very_low_below"])
            low = float(row["low_below"])
            assert very_low < low, (
                f"{row['parameter']}: very_low_below ({very_low}) >= low_below ({low})"
            )


def test_soil_test_ratings_sources_are_non_empty():
    for row in _read_csv("soil_test_ratings.csv"):
        assert row["source"].strip(), f"{row['parameter']} has an empty source"


def test_seasonal_weather_sources_are_non_empty():
    for row in _read_csv("seasonal_weather.csv"):
        assert row["source"].strip(), (
            f"{row['region_key']} month {row['month']} has an empty source"
        )
