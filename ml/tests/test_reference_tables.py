"""Consistency checks for the C5 reference tables (contract C5, Richa + Saloni).

Coverage note: crops.csv lists all 6 target crops, but crop_requirements.csv and
split_schedule.csv are filled in incrementally -- v0 for wheat and rice first (this
pass), the rest in a follow-up. So these tests check *internal* consistency between
crop_requirements.csv and split_schedule.csv for whichever crops are currently
present in them, not that every crop in crops.csv has requirements yet. Once all 6
crops are filled in, this same test suite keeps holding -- nothing here needs to
change.
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


def test_nutrient_efficiency_values_are_between_zero_and_one_when_present():
    for row in _read_csv("nutrient_efficiency.csv"):
        for col in ("soil_supply_factor", "fertilizer_use_efficiency"):
            if _is_number(row[col]):
                value = float(row[col])
                assert 0 <= value <= 1, f"{row['nutrient']}.{col} = {value}, expected [0, 1]"


def test_soil_test_ratings_low_below_less_than_high_above():
    for row in _read_csv("soil_test_ratings.csv"):
        low = float(row["low_below"])
        high = float(row["high_above"])
        assert low < high, f"{row['parameter']}: low_below ({low}) >= high_above ({high})"


def test_soil_test_ratings_sources_are_non_empty():
    for row in _read_csv("soil_test_ratings.csv"):
        assert row["source"].strip(), f"{row['parameter']} has an empty source"


def test_nutrient_efficiency_sources_are_non_empty():
    for row in _read_csv("nutrient_efficiency.csv"):
        assert row["source"].strip(), f"{row['nutrient']} has an empty source"
