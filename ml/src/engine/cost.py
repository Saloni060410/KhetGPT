"""Cost estimate and comparison to the farmer's logged fertilizer history (S5).

Both figures are priced at today's fertilizer_products.csv rates, never a historical price
the farmer may actually have paid (we don't have that), so the comparison is apples to
apples: what this plan costs today, versus what already-applied fertilizer would cost today.
"""

from __future__ import annotations

import warnings
from datetime import date

import yaml

from src.data_pipeline.feature_engineering import season_length_days
from src.data_pipeline.soil_data_loader import EXTERNAL_DIR, ReferenceTables
from src.engine.npk_calculator import PCT_FIELD, ReferenceDataIncomplete, _parse_float


def _products_by_id(products_table: list[dict]) -> dict[str, dict]:
    return {row["product_id"]: row for row in products_table}


def _price(product: dict, fertilizer_type: str) -> float:
    price = _parse_float(product["price_inr_per_kg"])
    if price is None:
        raise ReferenceDataIncomplete(
            "cost", fertilizer_type, f"fertilizer_products.csv: {fertilizer_type}.price_inr_per_kg is missing"
        )
    return price


def _season_window_days(tables: ReferenceTables, crop_id: str) -> int:
    """The window for 'the same crop season' in compare_to_history. Uses
    feature_engineering.season_length_days() (a real, sourced season length from
    growth_stages.csv's maturity/harvest stage) where one exists for crop_id. Falls back to
    agronomy_rules.yaml's credit_window_days explicitly, with a warning, when it doesn't --
    the same fallback risk_analyzer.assess_recommendation() uses, and the same reasoning:
    a season (100-150+ days) is longer than the 60-day credit window, so this fallback likely
    undercounts early-season applications until a sourced season length exists for the crop."""
    season_days = season_length_days(tables, crop_id)
    if season_days is not None:
        return season_days
    with (EXTERNAL_DIR / "agronomy_rules.yaml").open(encoding="utf-8") as handle:
        rules = yaml.safe_load(handle)
    window_days = int(rules["credit_window_days"])
    warnings.warn(
        f"compare_to_history: no sourced season length for crop_id={crop_id!r} "
        f"(growth_stages.csv has no maturity/harvest row) -- falling back to "
        f"credit_window_days ({window_days}) as a same-season proxy, which is NOT "
        "the same concept and may undercount early-season applications.",
        stacklevel=2,
    )
    return window_days


def estimate_cost(schedule: list[dict], products_table: list[dict]) -> float:
    """INR per acre: sum of quantity_kg_per_acre x price_inr_per_kg over the schedule.
    Raises ReferenceDataIncomplete for an unknown or unpriced product -- to_products()
    (npk_calculator) never puts one in a real schedule, so this only fires on malformed
    input, but it must never silently cost a plan at a wrong (e.g. zero) price."""
    products = _products_by_id(products_table)
    total = 0.0
    for item in schedule:
        product = products.get(item["fertilizer_type"])
        if product is None:
            raise ReferenceDataIncomplete(
                "cost", item["fertilizer_type"], f"fertilizer_products.csv: no row for {item['fertilizer_type']!r}"
            )
        total += item["quantity_kg_per_acre"] * _price(product, item["fertilizer_type"])
    return round(total, 3)


def cost_breakdown(schedule: list[dict], products_table: list[dict]) -> list[dict]:
    """Supports contract C1's cost.breakdown: one line per product actually used, quantities
    combined across stages. Not asked for by name in the S5 prompt, but the contract needs it
    and it is assembled from exactly the same priced totals as estimate_cost."""
    products = _products_by_id(products_table)
    totals: dict[str, float] = {}
    for item in schedule:
        totals[item["fertilizer_type"]] = totals.get(item["fertilizer_type"], 0.0) + item["quantity_kg_per_acre"]
    return [
        {
            "fertilizer_type": fertilizer_type,
            "quantity_kg_per_acre": round(quantity, 3),
            "cost_inr_per_acre": round(quantity * _price(products[fertilizer_type], fertilizer_type), 3),
        }
        for fertilizer_type, quantity in totals.items()
    ]


def prices_as_of(schedule: list[dict], products_table: list[dict]) -> date | None:
    """Contract C1's cost.prices_as_of: the oldest price_date among the products used, so the
    UI can say how old the prices are. None if a used product has no price_date at all."""
    products = _products_by_id(products_table)
    dates = []
    for item in {line["fertilizer_type"] for line in schedule}:
        text = _todo_or_none(products[item].get("price_date"))
        if text is None:
            return None
        dates.append(date.fromisoformat(text))
    return min(dates) if dates else None


def _todo_or_none(value: str | None) -> str | None:
    text = (value or "").strip()
    return None if not text or text.startswith("TODO") else text


def _usable_usage(
    prior_usage: list[dict], products_table: list[dict], today: date, tables: ReferenceTables, crop_id: str
) -> list[dict]:
    """Prior usage entries within the season window (contract: 'the same crop season') whose
    product is recognized. An entry for an unknown product is ignored here exactly as it is
    for credit in npk_calculator -- we cannot cost or nutrient-compare a product we don't
    recognize."""
    products = _products_by_id(products_table)
    window_days = _season_window_days(tables, crop_id)
    usable = []
    for usage in prior_usage:
        applied_on = usage["applied_on"]
        applied_on = applied_on if isinstance(applied_on, date) else date.fromisoformat(applied_on)
        age_days = (today - applied_on).days
        if age_days < 0 or age_days > window_days:
            continue
        if usage["type"] not in products:
            continue
        usable.append(usage)
    return usable


def _nutrient_total_kg_per_acre(items: list[dict], products_table: list[dict], quantity_key: str, type_key: str) -> float:
    """Total N + P2O5 + K2O, summed together on their own bases (contract: 'on total N +
    P2O5 + K2O') -- a common simplification in Indian fertilizer literature, not a claim that
    the three are on one physical basis."""
    products = _products_by_id(products_table)
    total = 0.0
    for item in items:
        product = products[item[type_key]]
        pct_sum = sum(float(product[PCT_FIELD[nutrient]]) for nutrient in ("n", "p", "k"))
        total += item[quantity_key] * pct_sum / 100
    return total


def compare_to_history(
    schedule: list[dict],
    prior_usage: list[dict],
    products_table: list[dict],
    today: date,
    tables: ReferenceTables,
    crop_id: str,
) -> dict:
    """{ previous_cost_inr_per_acre, saving_inr_per_acre, over_application_reduction_pct },
    all None if there is no usable logged history in the same-season window -- never an
    invented baseline. today, tables and crop_id are required (not in the prompt's literal
    3-name signature): today so the season window is deterministic and testable, matching
    every other engine function in this codebase, and tables/crop_id so the window can be a
    real, sourced season length (season_length_days()) rather than always reusing
    credit_window_days as a same-season proxy."""
    usable = _usable_usage(prior_usage, products_table, today, tables, crop_id)
    if not usable:
        return {"previous_cost_inr_per_acre": None, "saving_inr_per_acre": None, "over_application_reduction_pct": None}

    previous_cost = round(
        sum(
            usage["quantity_kg_per_acre"] * _price(_products_by_id(products_table)[usage["type"]], usage["type"])
            for usage in usable
        ),
        3,
    )
    recommended_cost = estimate_cost(schedule, products_table)
    saving = round(previous_cost - recommended_cost, 3)  # can be negative -- the UI explains it

    previous_nutrients = _nutrient_total_kg_per_acre(usable, products_table, "quantity_kg_per_acre", "type")
    recommended_nutrients = _nutrient_total_kg_per_acre(schedule, products_table, "quantity_kg_per_acre", "fertilizer_type")
    reduction_pct = (
        round(max(0.0, (previous_nutrients - recommended_nutrients) / previous_nutrients * 100), 3)
        if previous_nutrients > 0
        else None
    )

    return {
        "previous_cost_inr_per_acre": previous_cost,
        "saving_inr_per_acre": saving,
        "over_application_reduction_pct": reduction_pct,
    }
