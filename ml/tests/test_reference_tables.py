"""Consistency checks for the C5 reference tables (contract C5, Richa + Saloni).

Coverage note: crops.csv lists all 6 target crops, but crop_requirements.csv and
split_schedule.csv are filled in incrementally -- v0 for wheat and rice first (this
pass), the rest in a follow-up. So these tests check *internal* consistency between
crop_requirements.csv and split_schedule.csv for whichever crops are currently
present in them, not that every crop in crops.csv has requirements yet. Once all 6
crops are filled in, this same test suite keeps holding -- nothing here needs to
change.

Formula note: the recommendation is standard dose (crop_requirements.csv) plus a
soil-test adjustment (soil_test_adjustments.csv) minus credit for recent
applications -- not the demand/supply/efficiency formula nutrient_efficiency.csv was
built for. That table is retired; a missing (crop, nutrient, rating) row in
soil_test_adjustments.csv means "no adjustment" (0), by design -- unlike the retired
table, where a missing value had to be treated as unsafe to default. Adjustments can
be negative (e.g. skipping an already-included dose when soil tests sufficient), so
they are not constrained to be non-negative the way crop demand is.
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


def test_every_requirement_crop_has_split_rows_and_vice_versa():
    requirement_crops = {row["crop_id"] for row in _read_csv("crop_requirements.csv")}
    split_crops = {row["crop_id"] for row in _read_csv("split_schedule.csv")}
    assert requirement_crops, "crop_requirements.csv has no rows"
    assert split_crops, "split_schedule.csv has no rows"
    assert requirement_crops == split_crops, (
        f"Mismatch between crop_requirements.csv crops {requirement_crops} and "
        f"split_schedule.csv crops {split_crops} -- every crop with a requirement "
        "needs a split schedule and vice versa."
    )


def test_requirement_varieties_are_generic_or_declared():
    declared = {(row["crop_id"], row["variety_id"]) for row in _read_csv("crop_varieties.csv")}
    for row in _read_csv("crop_requirements.csv"):
        variety_id = row["variety_id"]
        assert variety_id == "generic" or (row["crop_id"], variety_id) in declared, (
            f"{row['crop_id']}.{variety_id} is not 'generic' and not declared in "
            "crop_varieties.csv"
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


def test_crop_requirements_have_no_negative_numbers():
    for row in _read_csv("crop_requirements.csv"):
        for col in ("n_kg_ha", "p2o5_kg_ha", "k2o_kg_ha"):
            if _is_number(row[col]):
                assert float(row[col]) >= 0, f"{row['crop_id']}.{col} is negative"


def test_crop_requirements_sources_are_non_empty():
    for row in _read_csv("crop_requirements.csv"):
        assert row["source"].strip(), f"{row['crop_id']} has an empty source"


def test_soil_test_adjustments_reference_a_declared_crop_requirement():
    requirements = {(row["crop_id"], row["variety_id"]) for row in _read_csv("crop_requirements.csv")}
    for row in _read_csv("soil_test_adjustments.csv"):
        key = (row["crop_id"], row["variety_id"])
        assert key in requirements, (
            f"soil_test_adjustments.csv row {key} has no matching crop_requirements.csv row"
        )


def test_soil_test_adjustments_sources_are_non_empty():
    for row in _read_csv("soil_test_adjustments.csv"):
        assert row["source"].strip(), (
            f"{row['crop_id']}.{row['nutrient']}.{row['soil_rating']} has an empty source"
        )


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


def test_fertilizer_product_sources_are_non_empty():
    for row in _read_csv("fertilizer_products.csv"):
        assert row["source"].strip(), f"{row['product_id']} has an empty source"


def test_soil_test_ratings_low_below_less_than_high_above():
    for row in _read_csv("soil_test_ratings.csv"):
        low = float(row["low_below"])
        high = float(row["high_above"])
        assert low < high, f"{row['parameter']}: low_below ({low}) >= high_above ({high})"


def test_soil_test_ratings_sources_are_non_empty():
    for row in _read_csv("soil_test_ratings.csv"):
        assert row["source"].strip(), f"{row['parameter']} has an empty source"


def test_seasonal_weather_sources_are_non_empty():
    for row in _read_csv("seasonal_weather.csv"):
        assert row["source"].strip(), (
            f"{row['region_key']} month {row['month']} has an empty source"
        )
