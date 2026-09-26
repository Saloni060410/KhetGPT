"""Over- and under-application risk, with soil-health and yield-impact explanations
(contract C6). Two pure functions -- no file I/O, no randomness, same inputs always give
the same Risk. Thresholds come only from agronomy_rules.yaml (passed in as `rules`) and
soil_test_ratings.csv (via feature_engineering.soil_rating); nothing here is hardcoded.
"""

from datetime import UTC, date, datetime

from src.data_pipeline.soil_data_loader import ReferenceTables, load_reference_tables
from src.evaluation.explainability import render_template

ACRE_TO_HA = 2.4711  # 1 ha = 2.4711 acre (docs/api-contract.md's stated conversion)
_LEVEL_ORDER = {"low": 0, "medium": 1, "high": 2}
_NUTRIENT_PCT_COLUMN = {"n": "n_pct", "p": "p2o5_pct", "k": "k2o_pct"}
_NUTRIENT_LABEL = {"n": "N", "p": "P2O5", "k": "K2O"}


def _product_pct(product_id: str, nutrient: str, tables: ReferenceTables) -> float | None:
    column = _NUTRIENT_PCT_COLUMN[nutrient]
    for row in tables.fertilizer_products:
        if row["product_id"] == product_id:
            return float(row[column])
    return None  # unknown product -- ignored for credit, per docs/api-contract.md's policy


def _applied_kg_ha(applications: list[dict], nutrient: str, tables: ReferenceTables,
                    within_days: int | None = None, reference_date: date | None = None) -> float:
    """Sum applications' contribution to one nutrient, in kg/ha. Unknown product ids are
    silently skipped (matches the contract's "ignored for credit and cost" policy for
    previous-usage entries the reference tables don't recognise)."""
    reference_date = reference_date or datetime.now(tz=UTC).date()
    total = 0.0
    for app in applications:
        product_id = app.get("type") or app.get("fertilizer_type")
        if within_days is not None:
            applied_on = app.get("applied_on")
            if applied_on is None:
                continue
            applied_date = datetime.fromisoformat(applied_on).date() if isinstance(applied_on, str) else applied_on
            if (reference_date - applied_date).days > within_days:
                continue  # outside the credit window -- doesn't count toward this assessment

        pct = _product_pct(product_id, nutrient, tables)
        if pct is None:
            continue
        quantity_kg_per_acre = app["quantity_kg_per_acre"]
        total += quantity_kg_per_acre * (pct / 100) * ACRE_TO_HA
    return total


def _ratio(applied: float, needed: float) -> float:
    if needed > 0:
        return applied / needed
    return float("inf") if applied > 0 else 1.0


def _compute_risk(applied_kg_ha: dict[str, float], nutrient_balance: dict, soil: dict,
                   weather: dict, rules: dict, tables: ReferenceTables) -> dict:
    from src.data_pipeline.feature_engineering import soil_rating

    signals: list[tuple[str, str, str | None, dict]] = []  # (level, template_prefix, nutrient_key, render params)
    ratios: dict[str, float] = {}

    for nutrient in ("n", "p", "k"):
        needed = nutrient_balance[nutrient]["fertilizer_needed_kg_ha"]
        applied = applied_kg_ha.get(nutrient, 0.0)
        ratio = _ratio(applied, needed)
        ratios[nutrient] = ratio
        label = _NUTRIENT_LABEL[nutrient]
        render_params = {"nutrient_label": label, "applied": round(applied, 1),
                          "needed": round(needed, 1), "ratio_pct": round(ratio * 100)}

        if ratio >= rules["over_application_ratio_high"]:
            signals.append(("high", "over_application", nutrient, render_params))
        elif ratio >= rules["over_application_ratio_medium"]:
            signals.append(("medium", "over_application", nutrient, render_params))

        nb_soil_rating = nutrient_balance[nutrient].get("soil_rating")
        if nb_soil_rating == "low" and ratio < rules["under_application_ratio"]:
            signals.append(("medium", "under_application", nutrient, render_params))

    high_nutrients = [n for n in ("n", "p", "k") if ratios[n] >= rules["over_application_ratio_high"]]
    low_nutrients = [n for n in ("n", "p", "k") if ratios[n] < rules["under_application_ratio"]]
    if high_nutrients and low_nutrients:
        high_n, low_n = high_nutrients[0], low_nutrients[0]
        signals.append(("high", "imbalance", None, {
            "high_nutrient_label": _NUTRIENT_LABEL[high_n], "high_ratio_pct": round(ratios[high_n] * 100),
            "low_nutrient_label": _NUTRIENT_LABEL[low_n], "low_ratio_pct": round(ratios[low_n] * 100),
        }))

    oc_rating = soil_rating(tables, "organic_carbon", soil["organic_carbon"])
    if oc_rating == "low":
        signals.append(("medium", "low_organic_carbon", None, {"value": soil["organic_carbon"]}))

    ph_rating = soil_rating(tables, "ph", soil["ph"])
    if ph_rating not in ("medium", "unknown"):
        ph_row = next(r for r in tables.soil_test_ratings if r["parameter"] == "ph")
        signals.append(("medium", "ph_out_of_band", None, {
            "value": soil["ph"], "low_below": ph_row["low_below"], "high_above": ph_row["high_above"],
        }))

    rainfall = weather.get("rainfall_mm_forecast")
    n_needed = nutrient_balance["n"]["fertilizer_needed_kg_ha"]
    if rainfall is not None and rainfall >= rules["rain_hold_mm"] and n_needed > 0:
        signals.append(("medium", "runoff", None, {"rainfall": rainfall}))

    if not signals:
        level, prefix, nutrient_key, params = "low", "healthy", None, {}
    else:
        # max() over a stable list keeps the FIRST-appended signal among same-level ties --
        # i.e. per-nutrient over/under-application (checked first, above) outranks imbalance,
        # soil-health and runoff signals of the same "medium"/"high" level. That's intentional:
        # a farmer's own applied-vs-needed gap is the most actionable single thing to report,
        # and this ordering is deterministic given `signals`' construction order, not incidental.
        level, prefix, nutrient_key, params = max(signals, key=lambda s: _LEVEL_ORDER[s[0]])

    over_application_pct = None
    if prefix == "over_application":
        over_application_pct = round((ratios[nutrient_key] - 1) * 100, 1)

    return {
        "level": level,
        "reason": render_template(f"risk.{prefix}.reason", **params),
        "soil_health_impact": render_template(f"risk.{prefix}.soil_health_impact"),
        "yield_impact": render_template(f"risk.{prefix}.yield_impact"),
        "over_application_pct": over_application_pct,
    }


def assess_recommendation(nutrient_balance: dict, schedule: list[dict], soil: dict, weather: dict,
                           prior_usage: list[dict], rules: dict, tables: ReferenceTables | None = None) -> dict:
    """Risk for the field, based on the farmer's own recent application history (prior_usage
    within agronomy_rules.yaml's credit_window_days) versus what the crop actually needs --
    not a judgement of the new recommendation, which by construction meets need."""
    tables = tables or load_reference_tables()
    applied = {
        nutrient: _applied_kg_ha(prior_usage, nutrient, tables, within_days=rules["credit_window_days"])
        for nutrient in ("n", "p", "k")
    }
    return _compute_risk(applied, nutrient_balance, soil, weather, rules, tables)


def score_planned(planned_application: list[dict], nutrient_balance: dict, soil: dict, weather: dict,
                   prior_usage: list[dict], rules: dict, tables: ReferenceTables | None = None) -> dict:
    """Score a farmer's own planned dose ("what if I apply this?") for /risk-score. Returns
    {risk, nutrient_balance} where nutrient_balance holds applied_kg_ha, recommended_kg_ha
    and ratio per nutrient, per docs/api-contract.md."""
    tables = tables or load_reference_tables()
    applied = {
        nutrient: _applied_kg_ha(planned_application, nutrient, tables)
        for nutrient in ("n", "p", "k")
    }
    risk = _compute_risk(applied, nutrient_balance, soil, weather, rules, tables)

    balance = {
        nutrient: {
            "applied_kg_ha": round(applied[nutrient], 2),
            "recommended_kg_ha": nutrient_balance[nutrient]["fertilizer_needed_kg_ha"],
            "ratio": round(_ratio(applied[nutrient], nutrient_balance[nutrient]["fertilizer_needed_kg_ha"]), 3),
        }
        for nutrient in ("n", "p", "k")
    }

    return {"risk": risk, "nutrient_balance": balance}
