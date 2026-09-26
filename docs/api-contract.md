# API Contract: Backend to ML Service (v1.0 draft)

Owned jointly by **Josh** (backend) and **Saloni** (ML). This draft is pre-filled so both sides can build in parallel. Review it, change what you disagree with, then lock it (prompt-pack steps S1 and J1). After it is locked, change it only through the process at the bottom.

Fixtures for every request and response live in `docs/contract-fixtures/`. Their numbers are illustrative. Contract tests on both sides validate against them.

## Decisions baked into this version

1. **Soil schema is fixed by the problem statement:** `n`, `p`, `k`, `ph`, `organic_carbon`, `moisture`. Do not add, remove or rename soil fields.
2. Units: kg/acre in the API. Soil N, P, K in kg/ha. `organic_carbon` and `moisture` in percent. The ML service converts internally (1 ha = 2.4711 acre).
3. `crop_type`, `variety` and `growth_stage` are ids from `GET /reference/crops`. `variety` is optional and only exists if Richa's chosen data has varieties.
4. `sowing_date` is optional. It dates the schedule. If missing, the engine assumes today is the middle of the current stage.
5. The core engine is the transparent deficit formula: `fertilizer needed = (crop demand - soil supply) / use efficiency - credit from recent applications`. The ML model refines the product choice on top of it. Every response shows the formula inputs (`explanation.nutrient_balance`).
6. Weather is fetched by the backend (Open-Meteo) and sent in the request. `weather.source` says whether it was `live`, `cached` or a `seasonal_average` fallback.
7. Cost is compared with the farmer's logged previous usage. If nothing is logged the comparison fields are `null`. Never invent a baseline.
8. Errors: `422 { detail: [...] }` for invalid input, `503 { detail }` when the model or reference data is unavailable.

## POST /recommend

**Request** (sent by backend)
```json
{
  "field_id": "string",
  "crop_type": "wheat",
  "variety": "string | null",
  "growth_stage": "sowing",
  "sowing_date": "YYYY-MM-DD | null",
  "soil": { "n": 0.0, "p": 0.0, "k": 0.0, "ph": 0.0, "organic_carbon": 0.0, "moisture": 0.0 },
  "weather": {
    "temperature_c": 0.0,
    "humidity_pct": 0.0,
    "rainfall_mm_forecast": 0.0,
    "source": "live | cached | seasonal_average"
  },
  "previous_fertilizer_usage": [
    { "type": "urea", "quantity_kg_per_acre": 0.0, "applied_on": "YYYY-MM-DD" }
  ]
}
```

**Response**
```json
{
  "recommendation": {
    "fertilizer_type": "urea",
    "quantity_kg_per_acre": 0.0,
    "schedule": [
      { "stage": "sowing", "fertilizer_type": "dap", "quantity_kg_per_acre": 0.0, "apply_by": "YYYY-MM-DD" }
    ]
  },
  "risk": {
    "level": "low | medium | high",
    "reason": "string",
    "soil_health_impact": "string",
    "yield_impact": "string"
  },
  "explanation": {
    "top_factors": ["string"],
    "nutrient_balance": {
      "n": {
        "crop_demand_kg_ha": 0.0,
        "soil_supply_kg_ha": 0.0,
        "deficit_kg_ha": 0.0,
        "use_efficiency": 0.0,
        "prior_credit_kg_ha": 0.0,
        "fertilizer_needed_kg_ha": 0.0
      },
      "p": { "...": "same keys, P2O5 basis" },
      "k": { "...": "same keys, K2O basis" }
    },
    "formula": "string"
  },
  "cost": {
    "estimated_cost_inr_per_acre": 0.0,
    "previous_cost_inr_per_acre": "number | null",
    "saving_inr_per_acre": "number | null"
  },
  "impact": { "over_application_reduction_pct": "number | null" },
  "model_version": "<model>-<semver>+rules-<hash8>"
}
```

- `recommendation.fertilizer_type` is the primary product. Its `quantity_kg_per_acre` is that product's total across the schedule. Every application, including other products, is in `schedule`.
- `risk` covers over- and under-application, soil health (organic carbon, pH) and runoff from forecast rain. `soil_health_impact` and `yield_impact` state the consequence in plain language, as the problem statement asks.
- `saving_inr_per_acre` can be negative. The UI explains it.

## POST /risk-score

Scores a farmer's own planned dose ("what if I apply this?"). Same soil, weather, crop and usage fields as `/recommend`, plus:
```json
"planned_application": [ { "fertilizer_type": "urea", "quantity_kg_per_acre": 200 } ]
```
**Response**
```json
{
  "risk": {
    "level": "low | medium | high",
    "reason": "string",
    "soil_health_impact": "string",
    "yield_impact": "string",
    "over_application_pct": "number | null"
  },
  "nutrient_balance": {
    "n": { "applied_kg_ha": 0.0, "recommended_kg_ha": 0.0, "ratio": 0.0 },
    "p": { "...": "same keys" },
    "k": { "...": "same keys" }
  },
  "model_version": "string"
}
```

## GET /health

Liveness check the backend can poll.
```json
{ "status": "ok | degraded", "model_version": "string" }
```
`degraded` (HTTP 200) means the service is up but the model artifact or a reference table is missing. The reason is included in a `detail` field.

## GET /reference/*

Read-only lists built from `ml/data/external/`. The backend proxies and caches them. Nothing here is hardcoded in the backend or the frontend.

| Path | Returns |
|---|---|
| `/reference/crops` | `[{ id, name_en, name_hi, varieties: [{ id, name_en, name_hi }], stages: [{ id, name_en, name_hi, order }] }]` |
| `/reference/soil-ratings` | low and high cut-offs per soil parameter, with units |
| `/reference/fertilizers` | `[{ id, name, n_pct, p2o5_pct, k2o_pct, price_inr_per_kg, price_date }]` |
| `/reference/seasonal-weather?lat=&lng=&month=` | a weather block with `source: "seasonal_average"`, used when live weather and cache both fail |

## Change process

1. Propose the change in a docs-only PR to `main` titled `docs: api-contract <change>`.
2. Both owners approve it in the PR.
3. Merge, then both owners run `git pull origin main --rebase` on their branches the same day.
4. Update `ml/src/api/schemas.py`, `backend/src/services/mlService.js` and the fixtures in the same change. Keep `model_version` in every response so a bad result traces to the model and rule tables that made it.
