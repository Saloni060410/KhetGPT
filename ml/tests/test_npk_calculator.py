"""Golden tests for the S4 NPK dose calculator. Small, hand-computed cases plus tests against
Richa's real merged reference tables where a case naturally occurs there."""

from datetime import date

import pytest

from src.data_pipeline.soil_data_loader import load_reference_tables
from src.engine.npk_calculator import (
    ACRES_PER_HECTARE,
    ReferenceDataIncomplete,
    UnknownStageError,
    compute_balance,
    to_products,
)

TABLES = load_reference_tables()
TODAY = date(2026, 11, 20)

FIXTURE_SOIL = {"n": 210.0, "p": 9.0, "k": 90.0, "ph": 7.4, "organic_carbon": 0.42, "moisture": 18.0}


FIRST_STAGE = {"wheat": "sowing", "rice": "nursery_sowing", "chickpea": "sowing", "maize": "sowing"}


def balance(crop_id, variety=None, irrigation=None, growth_stage=None, soil=None, prior_usage=None, today=TODAY):
    growth_stage = growth_stage or FIRST_STAGE[crop_id]
    return compute_balance(
        crop_id, variety, irrigation, growth_stage, soil or FIXTURE_SOIL, prior_usage or [], TABLES, today
    )


# ---------- compute_balance: reference-dose method ----------


def test_reference_dose_with_low_k_soil_adjustment_matches_the_hand_computed_example():
    result, trace = balance("wheat", soil={**FIXTURE_SOIL, "k": 90.0})  # 90 kg/ha is "low" (below 108)
    assert result["n"]["fertilizer_needed_kg_ha"] == 123.6
    assert result["p"]["fertilizer_needed_kg_ha"] == 61.8
    assert result["k"]["fertilizer_needed_kg_ha"] == 29.7
    assert result["k"]["method"] == "reference_dose"
    assert result["k"]["soil_rating"] == "low"
    assert result["k"]["soil_adjustment_kg_ha"] == 29.7
    assert any(entry["rule_id"] == "soil_adjustment" and entry["nutrient"] == "k" for entry in trace)


def test_a_soil_rating_with_no_adjustment_row_means_zero_not_an_error():
    # wheat/n has no real (non-TODO) soil_adjustments.csv row for any rating: adjustment must
    # be 0, not raise, per contract C1 ("a missing row means the source publishes no adjustment").
    result, _ = balance("wheat", soil={**FIXTURE_SOIL, "n": 50.0})  # "low" n rating
    assert result["n"]["soil_adjustment_kg_ha"] == 0.0
    assert result["n"]["fertilizer_needed_kg_ha"] == 123.6


def test_rice_skips_the_standard_p_and_k_dose_when_soil_tests_medium_or_high():
    # PAU: apply P/K only when soil tests deficient (low). Medium/high subtracts the whole
    # standard dose via a negative adjustment row -- fertilizer_needed clamps to 0, never negative.
    result, _ = balance("rice", soil={**FIXTURE_SOIL, "p": 18.0, "k": 200.0})  # p medium, k medium
    assert result["p"]["fertilizer_needed_kg_ha"] == 0.0
    assert result["k"]["fertilizer_needed_kg_ha"] == 0.0
    assert result["p"]["soil_adjustment_kg_ha"] == -29.7


def test_exact_variety_dose_overrides_the_generic_one():
    generic, _ = balance("rice", variety=None)
    pr_132, _ = balance("rice", variety="pr_132")
    assert generic["n"]["fertilizer_needed_kg_ha"] == pytest.approx(103.8)
    assert pr_132["n"]["fertilizer_needed_kg_ha"] == pytest.approx(77.8)
    assert pr_132["p"]["standard_dose_kg_ha"] == generic["p"]["standard_dose_kg_ha"]  # p2o5/k2o unchanged


def test_negative_total_clamps_to_zero_not_negative():
    huge_credit_usage = [{"type": "dap", "quantity_kg_per_acre": 1000.0, "applied_on": TODAY.isoformat()}]
    result, _ = balance("rice", soil={**FIXTURE_SOIL, "p": 18.0}, prior_usage=huge_credit_usage)  # p adjustment already -29.7
    assert result["p"]["fertilizer_needed_kg_ha"] == 0.0


# ---------- compute_balance: STCR method (synthetic tables, isolates the formula) ----------


def _stcr_tables(a=5.0, b=1.0, target=40.0):
    from dataclasses import replace

    return replace(
        TABLES,
        stcr_equations=[
            {
                "crop_id": "wheat", "variety_id": "generic", "region": "Test", "applies_to": "irrigated",
                "nutrient": "n", "a": str(a), "b": str(b), "target_yield_default_q_ha": str(target),
                "source": "test", "notes": "",
            }
        ],
    )


def test_stcr_formula_matches_the_hand_computed_example():
    # FN = a*T - b*SN = 5*40 - 1*100 = 100
    tables = _stcr_tables(a=5.0, b=1.0, target=40.0)
    result, trace = compute_balance(
        "wheat", None, "irrigated", "sowing", {**FIXTURE_SOIL, "n": 100.0}, [], tables, TODAY
    )
    assert result["n"]["method"] == "stcr"
    assert result["n"]["standard_dose_kg_ha"] == 200.0
    assert result["n"]["soil_adjustment_kg_ha"] == -100.0
    assert result["n"]["fertilizer_needed_kg_ha"] == 100.0
    assert any(entry["rule_id"] == "dose_stcr" for entry in trace)


def test_stcr_is_skipped_when_the_target_yield_is_not_filled():
    # The real, merged stcr_equations.csv has exactly this: a row exists, but
    # target_yield_default_q_ha is TODO(data), so method 2 (reference_dose) must be used instead.
    result, _ = balance("wheat", variety="wh_542")
    assert result["n"]["method"] == "reference_dose"  # falls back since wh_542 has no reference_doses.csv row either... 


def test_stcr_row_with_unfilled_target_falls_back_to_reference_dose_generic():
    result, _ = balance("wheat")  # generic; real stcr row for wheat/n has no usable target yield
    assert result["n"]["method"] == "reference_dose"
    assert result["n"]["fertilizer_needed_kg_ha"] == 123.6


# ---------- prior credit ----------


def test_a_recent_urea_application_credits_nitrogen():
    recent = [{"type": "urea", "quantity_kg_per_acre": 50.0, "applied_on": "2026-11-10"}]  # 10 days before TODAY
    result, trace = balance("rice", prior_usage=recent)  # rice/n has a usable default efficiency (0.426)
    assert result["n"]["prior_credit_kg_ha"] > 0
    expected_credit = 50.0 * 0.46 * ACRES_PER_HECTARE * 0.426
    assert result["n"]["prior_credit_kg_ha"] == pytest.approx(expected_credit, rel=1e-3)
    assert any(entry["rule_id"] == "prior_credit" and entry["nutrient"] == "n" for entry in trace)


def test_an_old_application_outside_the_credit_window_is_not_credited():
    old = [{"type": "urea", "quantity_kg_per_acre": 200.0, "applied_on": "2026-01-01"}]  # >60 days before TODAY
    result, _ = balance("rice", prior_usage=old)
    assert result["n"]["prior_credit_kg_ha"] == 0.0


def test_a_missing_efficiency_skips_the_credit_with_a_trace_entry():
    # rice/p and rice/k only have a "default" nutrient_efficiency.csv row, and it is
    # TODO(data) for both -- so a P application must not be credited, and must say why.
    usage = [{"type": "dap", "quantity_kg_per_acre": 80.0, "applied_on": "2026-11-10"}]
    result, trace = balance("rice", soil={**FIXTURE_SOIL, "p": 5.0}, prior_usage=usage)  # p "low", dose applies
    assert result["p"]["prior_credit_kg_ha"] == 0.0
    assert any(entry["rule_id"] == "credit_skipped_no_efficiency" and entry["nutrient"] == "p" for entry in trace)


def test_an_unknown_previous_product_is_ignored_for_credit_and_traced():
    usage = [{"type": "some-unlisted-product", "quantity_kg_per_acre": 100.0, "applied_on": "2026-11-10"}]
    result, trace = balance("rice", prior_usage=usage)
    assert result["n"]["prior_credit_kg_ha"] == 0.0
    assert any(entry["rule_id"] == "credit_ignored_unknown_product" for entry in trace)


def test_kg_per_acre_to_kg_per_hectare_conversion_is_correct_to_three_decimals():
    usage = [{"type": "urea", "quantity_kg_per_acre": 100.0, "applied_on": "2026-11-10"}]
    result, _ = balance("rice", prior_usage=usage)
    raw_kg_ha = 100.0 * 0.46 * ACRES_PER_HECTARE
    expected = round(raw_kg_ha * 0.426, 3)
    assert result["n"]["prior_credit_kg_ha"] == pytest.approx(expected, abs=1e-3)


# ---------- errors ----------


def test_a_crop_with_no_reference_dose_row_at_all_raises_reference_data_incomplete():
    with pytest.raises(ReferenceDataIncomplete):
        balance("maize")  # crops.csv lists maize; reference_doses.csv has no row for it yet


def test_an_unknown_growth_stage_raises_unknown_stage_error():
    with pytest.raises(UnknownStageError):
        balance("wheat", growth_stage="not-a-real-stage")


# ---------- to_products ----------


def test_an_unpriced_product_is_never_selected():
    # MOP's price is genuinely TODO(data) in the real, merged fertilizer_products.csv.
    # A wheat field with low soil K needs potash, and there is no priced product to supply
    # it -- this must be a clear error, never a silently-dropped schedule line.
    result, _ = balance("wheat", soil={**FIXTURE_SOIL, "k": 90.0})
    assert result["k"]["fertilizer_needed_kg_ha"] > 0
    with pytest.raises(ReferenceDataIncomplete, match="mop"):
        to_products(result, "wheat", "sowing", date(2026, 11, 5), {"rainfall_mm_forecast": 0}, TABLES, TODAY)


def test_a_full_wheat_plan_when_potash_is_not_needed():
    # Soil K high enough that no potash is needed, so the schedule never touches the
    # unpriced MOP product and a full plan can be produced end to end.
    result, _ = balance("wheat", soil={**FIXTURE_SOIL, "k": 300.0})
    assert result["k"]["fertilizer_needed_kg_ha"] == 0.0
    schedule = to_products(result, "wheat", "sowing", date(2026, 11, 5), {"rainfall_mm_forecast": 0}, TABLES, TODAY)
    products_used = {item["fertilizer_type"] for item in schedule}
    assert products_used == {"dap", "urea"}
    assert all(item["quantity_kg_per_acre"] > 0 for item in schedule)


def test_rain_forecast_above_the_threshold_delays_the_top_dress_date():
    result, _ = balance("wheat", growth_stage="second_irrigation", soil={**FIXTURE_SOIL, "k": 300.0})
    calm = to_products(result, "wheat", "second_irrigation", date(2026, 11, 5), {"rainfall_mm_forecast": 0}, TABLES, TODAY)
    wet = to_products(result, "wheat", "second_irrigation", date(2026, 11, 5), {"rainfall_mm_forecast": 40}, TABLES, TODAY)
    calm_date = date.fromisoformat(next(i for i in calm if i["fertilizer_type"] == "urea")["apply_by"])
    wet_date = date.fromisoformat(next(i for i in wet if i["fertilizer_type"] == "urea")["apply_by"])
    assert (wet_date - calm_date).days == 2
    assert "delayed 2 days" in next(i for i in wet if i["fertilizer_type"] == "urea")["timing_note"].lower()


def test_a_later_growth_stage_drops_the_basal_stage():
    result, _ = balance("wheat", growth_stage="crown_root_initiation", soil={**FIXTURE_SOIL, "k": 300.0})
    schedule = to_products(
        result, "wheat", "crown_root_initiation", date(2026, 11, 5), {"rainfall_mm_forecast": 0}, TABLES, TODAY
    )
    assert {item["stage"] for item in schedule} == {"crown_root_initiation", "second_irrigation"}
    assert "dap" not in {item["fertilizer_type"] for item in schedule}


def test_an_unsourced_stage_date_gives_a_null_apply_by_with_a_timing_note():
    result, _ = balance("wheat", growth_stage="crown_root_initiation", soil={**FIXTURE_SOIL, "k": 300.0})
    schedule = to_products(
        result, "wheat", "crown_root_initiation", date(2026, 11, 5), {"rainfall_mm_forecast": 0}, TABLES, TODAY
    )
    first_split = next(i for i in schedule if i["stage"] == "crown_root_initiation")
    assert first_split["apply_by"] is None
    assert "first irrigation" in first_split["timing_note"].lower()


def test_dap_nitrogen_is_credited_against_the_first_nitrogen_stage():
    result, _ = balance("wheat", soil={**FIXTURE_SOIL, "k": 300.0})
    schedule = to_products(result, "wheat", "sowing", date(2026, 11, 5), {"rainfall_mm_forecast": 0}, TABLES, TODAY)
    dap_qty = next(i for i in schedule if i["fertilizer_type"] == "dap")["quantity_kg_per_acre"]
    dap_n_kg_ha = dap_qty * 0.18 * ACRES_PER_HECTARE
    first_urea = next(i for i in schedule if i["fertilizer_type"] == "urea")
    uncredited_first_split = 123.6 / 2 / ACRES_PER_HECTARE / 0.46
    assert first_urea["quantity_kg_per_acre"] < uncredited_first_split
    assert dap_n_kg_ha > 0


def test_no_sowing_date_falls_back_to_the_current_stages_midpoint():
    result, _ = balance("wheat", growth_stage="second_irrigation", soil={**FIXTURE_SOIL, "k": 300.0})
    schedule = to_products(result, "wheat", "second_irrigation", None, {"rainfall_mm_forecast": 0}, TABLES, TODAY)
    item = next(i for i in schedule if i["stage"] == "second_irrigation")
    assert item["apply_by"] is not None  # second_irrigation's das_start is sourced (50 days)


def test_a_chickpea_plan_never_touches_potash():
    result, _ = balance("chickpea")
    assert result["k"]["fertilizer_needed_kg_ha"] == 0.0
    schedule = to_products(result, "chickpea", "sowing", date(2026, 10, 20), {"rainfall_mm_forecast": 0}, TABLES, TODAY)
    assert "mop" not in {item["fertilizer_type"] for item in schedule}
