"""Sample output for PREDICT_MODE=mock.

The mock lets the backend and frontend integrate before the real engine exists. It is built from
the contract fixtures and reacts to the request so the UI sees output change with its inputs.
Every number here is a stand-in. The real engine reads its numbers from data/external/, and
nothing in this module is agronomic advice.
"""

import json
from copy import deepcopy
from datetime import UTC, date, datetime, timedelta
from functools import lru_cache
from pathlib import Path

from src.api.schemas import (
    RecommendRequest,
    RecommendResponse,
    RiskScoreRequest,
    RiskScoreResponse,
)

MOCK_DIR = Path(__file__).resolve().parent / "mock_data"
MOCK_MODEL_VERSION = "mock-0.0.0+rules-mock"
ACRES_PER_HECTARE = 2.4711

# Mock-only stand-ins for values that live in data/external/ for the real engine.
TEMPLATE_SOWING = date(2026, 11, 5)
TEMPLATE_STAGES = ["sowing", "crown_root_initiation", "second_irrigation"]
REFERENCE_SOIL_N = 210.0
SOIL_CUTOFFS = {"n": (280.0, 560.0), "p": (10.0, 25.0), "k": (108.0, 280.0)}
STANDARD_DOSE = {"n": 123.6, "p": 61.8, "k": 0.0}
LOW_K_ADJUSTMENT = 29.7
RAIN_HOLD_MM = 20.0
RAIN_HOLD_DAYS = 2
OVER_MEDIUM, OVER_HIGH, UNDER = 1.25, 1.75, 0.75
STAGE_OFFSET_DAYS = (0, 21, 42)
NUTRIENT_NAMES = {"n": "nitrogen", "p": "phosphorus", "k": "potash"}


@lru_cache
def mock_json(name: str) -> dict:
    return json.loads((MOCK_DIR / name).read_text(encoding="utf-8"))


def mock_items(name: str) -> list[dict]:
    return mock_json(name)["items"]


def _products() -> dict[str, dict]:
    return {item["id"]: item for item in mock_items("fertilizers.json")}


def _rating(parameter: str, value: float) -> str:
    low, high = SOIL_CUTOFFS[parameter]
    return "low" if value < low else "high" if value > high else "medium"


def _needs(soil) -> dict[str, float]:
    """Fertilizer needed per nutrient in kg/ha: N reacts to soil N, K adds potash when soil K is low."""
    factor = min(1.4, max(0.6, 1 + (REFERENCE_SOIL_N - soil.n) / 700))
    return {
        "n": round(STANDARD_DOSE["n"] * factor, 1),
        "p": STANDARD_DOSE["p"],
        "k": LOW_K_ADJUSTMENT if soil.k < SOIL_CUTOFFS["k"][0] else 0.0,
    }


def _nutrients_per_acre(quantity_kg: float, product: dict) -> dict[str, float]:
    return {
        "n": quantity_kg * product["n_pct"] / 100,
        "p": quantity_kg * product["p2o5_pct"] / 100,
        "k": quantity_kg * product["k2o_pct"] / 100,
    }


def _crop(crop_type: str) -> dict | None:
    return next((crop for crop in mock_items("crops.json") if crop["id"] == crop_type), None)


def _stage_slots(request: RecommendRequest, sowing: date) -> list[tuple[str, date | None, str, int]]:
    """Three slots: (stage id, apply_by, note, group). Group 0 is the basal dose, 1 and 2 are top-dresses."""
    template = {item["stage"]: item for item in mock_json("recommend_response.json")["recommendation"]["schedule"]}
    if request.growth_stage in TEMPLATE_STAGES:
        delta = (sowing - TEMPLATE_SOWING).days
        slots = []
        for group, stage in enumerate(TEMPLATE_STAGES):
            if group < TEMPLATE_STAGES.index(request.growth_stage):
                continue
            item = template[stage]
            due = date.fromisoformat(item["apply_by"]) + timedelta(days=delta) if item["apply_by"] else None
            slots.append((stage, due, item["timing_note"], group))
        return slots

    crop = _crop(request.crop_type)
    stage_ids = [stage["id"] for stage in crop["stages"]] if crop else TEMPLATE_STAGES
    start = stage_ids.index(request.growth_stage) if request.growth_stage in stage_ids else 0
    slots = []
    for group in range(3):
        stage = stage_ids[min(start + group, len(stage_ids) - 1)]
        due = sowing + timedelta(days=STAGE_OFFSET_DAYS[group])
        slots.append((stage, due, f"Sample timing for {stage.replace('_', ' ')}", group))
    return slots


def build_mock_recommendation(request: RecommendRequest, today: date | None = None) -> RecommendResponse:
    template = deepcopy(mock_json("recommend_response.json"))
    products = _products()
    today = today or datetime.now(UTC).date()
    sowing = request.sowing_date or today
    needs = _needs(request.soil)
    notes = ["This is sample output from the ML mock, not a real recommendation."]

    dap_qty = round(needs["p"] / ACRES_PER_HECTARE / (products["dap"]["p2o5_pct"] / 100), 1)
    mop_qty = round(needs["k"] / ACRES_PER_HECTARE / (products["mop"]["k2o_pct"] / 100), 1) if needs["k"] else 0.0
    n_per_acre = needs["n"] / ACRES_PER_HECTARE
    dap_n = dap_qty * products["dap"]["n_pct"] / 100
    urea_pct = products["urea"]["n_pct"] / 100
    urea_first = round(max(0.0, n_per_acre / 2 - dap_n) / urea_pct, 1)
    urea_second = round(n_per_acre / 2 / urea_pct, 1)

    rain_hold = request.weather.rainfall_mm_forecast >= RAIN_HOLD_MM
    schedule = []
    for stage, due, note, group in _stage_slots(request, sowing):
        lines = {0: [("dap", dap_qty), ("mop", mop_qty)], 1: [("urea", urea_first)], 2: [("urea", urea_second)]}[group]
        for product, quantity in lines:
            if quantity <= 0:
                continue
            item_due, item_note = due, note
            if rain_hold and group > 0:
                item_due = due + timedelta(days=RAIN_HOLD_DAYS) if due else None
                item_note = f"{note}, delayed {RAIN_HOLD_DAYS} days for forecast rain"
            schedule.append(
                {
                    "stage": stage,
                    "fertilizer_type": product,
                    "quantity_kg_per_acre": quantity,
                    "apply_by": item_due.isoformat() if item_due else None,
                    "timing_note": item_note,
                }
            )
    if rain_hold:
        notes.append(f"Heavy rain is forecast, so top-dress dates are delayed by {RAIN_HOLD_DAYS} days.")
    if request.sowing_date is None:
        notes.append("No sowing date was given, so sample dates count from today.")

    totals: dict[str, float] = {}
    for item in schedule:
        totals[item["fertilizer_type"]] = round(totals.get(item["fertilizer_type"], 0.0) + item["quantity_kg_per_acre"], 1)
    primary = max(totals, key=totals.get)

    breakdown = [
        {"fertilizer_type": product, "quantity_kg_per_acre": quantity, "cost_inr_per_acre": float(round(quantity * products[product]["price_inr_per_kg"]))}
        for product, quantity in totals.items()
    ]
    estimated_cost = float(sum(line["cost_inr_per_acre"] for line in breakdown))
    prices_as_of = min(products[product]["price_date"] for product in totals)

    planned_nutrients = {"n": 0.0, "p": 0.0, "k": 0.0}
    for product, quantity in totals.items():
        for nutrient, kg in _nutrients_per_acre(quantity, products[product]).items():
            planned_nutrients[nutrient] += kg
    planned_total = sum(planned_nutrients.values())

    previous_cost = saving = reduction = None
    risk_level, ratio = "low", None
    if request.previous_fertilizer_usage:
        previous_nutrients, previous_cost_total, ignored = 0.0, 0.0, []
        for usage in request.previous_fertilizer_usage:
            product = products.get(usage.type)
            if product is None:
                ignored.append(usage.type)
                continue
            previous_cost_total += usage.quantity_kg_per_acre * product["price_inr_per_kg"]
            previous_nutrients += sum(_nutrients_per_acre(usage.quantity_kg_per_acre, product).values())
        if ignored:
            notes.append(f"Unknown product(s) in previous use were ignored: {', '.join(sorted(set(ignored)))}.")
        if previous_nutrients > 0 and planned_total > 0:
            previous_cost = float(round(previous_cost_total))
            saving = previous_cost - estimated_cost
            reduction = round(max(0.0, (previous_nutrients - planned_total) / previous_nutrients * 100), 1)
            ratio = previous_nutrients / planned_total
            risk_level = "high" if ratio >= OVER_HIGH else "medium" if ratio >= OVER_MEDIUM else "low"

    fixture_risk = template["risk"]
    if ratio is not None and risk_level != "low":
        risk = {
            "level": risk_level,
            "reason": f"Last season's fertilizer was about {ratio:.1f} times what this crop needs.",
            "soil_health_impact": fixture_risk["soil_health_impact"],
            "yield_impact": fixture_risk["yield_impact"],
            "over_application_pct": None,
        }
    else:
        reason = (
            "Previous fertilizer use is close to what this crop needs."
            if ratio is not None
            else "No previous fertilizer use is logged, so over-application cannot be checked."
        )
        risk = {
            "level": "low",
            "reason": reason,
            "soil_health_impact": "No soil health harm is expected at this dose.",
            "yield_impact": "No yield loss is expected from this dose.",
            "over_application_pct": None,
        }

    crop = _crop(request.crop_type)
    crop_name = crop["name_en"].lower() if crop else request.crop_type
    variety = next((v["name_en"] for v in (crop or {}).get("varieties", []) if v["id"] == request.variety), request.variety)
    label = f"{request.irrigation or 'irrigated'} {crop_name}" + (f" ({variety})" if variety else "")
    factors = [
        f"The standard dose for {label} is {STANDARD_DOSE['n']:g} kg/ha of nitrogen and {STANDARD_DOSE['p']:g} kg/ha of phosphorus.",
        (
            f"Your soil potassium is low ({request.soil.k:g} kg/ha), so {LOW_K_ADJUSTMENT:g} kg/ha of potash is added."
            if needs["k"]
            else f"Your soil potassium is {_rating('k', request.soil.k)} ({request.soil.k:g} kg/ha), so no extra potash is needed."
        ),
        (
            f"Your last-season use was about {ratio:.1f} times what this crop needs, so this plan is smaller."
            if ratio is not None and ratio > 1
            else f"Your soil nitrogen is {_rating('n', request.soil.n)} ({request.soil.n:g} kg/ha), so {needs['n']:g} kg/ha of nitrogen fertilizer is planned."
        ),
    ]
    notes += [
        f"No credit was given for last season's fertilizer because no use-efficiency figure is available for {crop_name}.",
        "Fertilizer prices are from 1 January 2025.",
    ]
    if request.weather.source != "live":
        notes.append(f"Weather is a {request.weather.source.replace('_', ' ')} value, not a live forecast.")

    def plan(nutrient: str) -> dict:
        needed = needs[nutrient]
        adjustment = round(needed - STANDARD_DOSE[nutrient], 1)
        return {
            "method": "reference_dose",
            "soil_rating": _rating(nutrient, getattr(request.soil, nutrient)),
            "standard_dose_kg_ha": STANDARD_DOSE[nutrient],
            "soil_adjustment_kg_ha": adjustment,
            "prior_credit_kg_ha": 0,
            "fertilizer_needed_kg_ha": needed,
        }

    response = {
        "recommendation": {
            "fertilizer_type": primary,
            "quantity_kg_per_acre": totals[primary],
            "schedule": schedule,
        },
        "risk": risk,
        "explanation": {
            "top_factors": factors,
            "nutrient_balance": {"n": plan("n"), "p": plan("p"), "k": plan("k")},
            "formula": template["explanation"]["formula"],
            "data_notes": notes,
        },
        "cost": {
            "estimated_cost_inr_per_acre": estimated_cost,
            "previous_cost_inr_per_acre": previous_cost,
            "saving_inr_per_acre": saving,
            "prices_as_of": prices_as_of,
            "breakdown": breakdown,
        },
        "impact": {"over_application_reduction_pct": reduction},
        "model_version": MOCK_MODEL_VERSION,
    }
    return RecommendResponse.model_validate(response)


def build_mock_risk_score(request: RiskScoreRequest) -> RiskScoreResponse:
    products = _products()
    needs = _needs(request.soil)
    applied = {"n": 0.0, "p": 0.0, "k": 0.0}
    for planned in request.planned_application:
        product = products.get(planned.fertilizer_type)
        if product is None:
            continue
        for nutrient, kg in _nutrients_per_acre(planned.quantity_kg_per_acre, product).items():
            applied[nutrient] += kg * ACRES_PER_HECTARE

    balance = {
        nutrient: {
            "applied_kg_ha": round(applied[nutrient], 1),
            "recommended_kg_ha": needs[nutrient],
            "ratio": round(applied[nutrient] / needs[nutrient], 2) if needs[nutrient] else 0.0,
        }
        for nutrient in ("n", "p", "k")
    }
    needed = [nutrient for nutrient in balance if needs[nutrient] > 0]
    worst = max(needed, key=lambda nutrient: balance[nutrient]["ratio"], default="n")
    lowest = min(needed, key=lambda nutrient: balance[nutrient]["ratio"], default="n")
    top_ratio, low_ratio = balance[worst]["ratio"], balance[lowest]["ratio"]
    name = NUTRIENT_NAMES[worst]
    unplanned = [NUTRIENT_NAMES[n] for n in needed if n != worst and balance[n]["applied_kg_ha"] == 0]

    fixture = mock_json("risk_score_response.json")["risk"]
    over_pct = round((top_ratio - 1) * 100) if top_ratio > 1 else None
    if top_ratio >= OVER_MEDIUM:
        level = "high" if top_ratio >= OVER_HIGH else "medium"
        reason = f"The planned {name} is about {top_ratio:.1f} times what this crop needs"
        reason += f", and no {' or '.join(unplanned)} is planned." if unplanned else "."
        soil_impact = fixture["soil_health_impact"] if level == "high" and worst == "n" else f"Extra {name} beyond crop need builds up in the soil and can wash out."
        verb = "is" if len(unplanned) == 1 else "are"
        short = f", and {' and '.join(unplanned)} {verb} left short" if unplanned else ""
        yield_impact = (
            f"Yield does not rise past crop need. Unbalanced feeding can lower it{short}."
            if level == "high"
            else f"Extra {name} adds cost without adding yield."
        )
    elif low_ratio < UNDER:
        level = "medium"
        reason = f"Only {round(low_ratio * 100)} percent of the {NUTRIENT_NAMES[lowest]} this crop needs is planned."
        soil_impact = f"Soil {NUTRIENT_NAMES[lowest]} reserves will be drawn down."
        yield_impact = f"Yield can fall if {NUTRIENT_NAMES[lowest]} runs short."
        over_pct = None
    else:
        level = "low"
        reason = "The planned dose is close to what this crop needs."
        soil_impact = "No soil health harm is expected at this dose."
        yield_impact = "No yield loss is expected from this dose."
        over_pct = None

    return RiskScoreResponse.model_validate(
        {
            "risk": {
                "level": level,
                "reason": reason,
                "soil_health_impact": soil_impact,
                "yield_impact": yield_impact,
                "over_application_pct": over_pct,
            },
            "nutrient_balance": balance,
            "model_version": MOCK_MODEL_VERSION,
        }
    )
