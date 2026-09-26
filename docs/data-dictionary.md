# Data dictionary

Units and meaning of the fields shared across services. Keep in step with `api-contract.md`, `backend/prisma/schema.prisma` and `ml/data/external/`.

## Soil (fixed by the problem statement)

Never add, remove or rename these fields.

| Field | Meaning | Unit |
|---|---|---|
| `n` | Available nitrogen | kg/ha. TODO(data): Richa confirms how each chosen dataset maps to this |
| `p` | Available phosphorus | kg/ha. TODO(data): confirm |
| `k` | Available potassium | kg/ha. TODO(data): confirm |
| `ph` | Soil pH | 0 to 14 |
| `organic_carbon` | Organic carbon content | percent |
| `moisture` | Soil moisture | percent |

## Crop

| Field | Meaning | Values |
|---|---|---|
| `crop_type` | Crop id | from `GET /reference/crops` (`ml/data/external/crops.csv`) |
| `variety` | Optional variety id | from the same endpoint, only where Richa's data has varieties |
| `growth_stage` | Stage id | from the same endpoint (`growth_stages.csv`) |
| `sowing_date` | Sowing date | `YYYY-MM-DD`, optional. Dates the schedule |

## Weather

| Field | Meaning | Unit |
|---|---|---|
| `temperature_c` | Current air temperature | degrees C |
| `humidity_pct` | Relative humidity | percent |
| `rainfall_mm_forecast` | Forecast rainfall for the next 5 days | mm |
| `source` | `live`, `cached` or `seasonal_average` | |

## Recommendation

| Field | Meaning | Unit |
|---|---|---|
| `quantity_kg_per_acre` | Fertilizer product quantity | kg/acre |
| `nutrient_balance.*_kg_ha` | Crop demand, soil supply, deficit, credit, fertilizer needed (P as P2O5, K as K2O) | kg/ha |
| `use_efficiency` | Share of applied nutrient the crop recovers | 0 to 1 |
| `risk.level` | Over- and under-application risk | `low`, `medium`, `high` |
| `cost.*_inr_per_acre` | Plan cost, previous cost, saving | INR per acre |
| `model_version` | `<model>-<semver>+rules-<hash8>` | string |

## Reference tables (`ml/data/external/`, schemas in the prompt packs, contract C5)

`crops.csv`, `crop_varieties.csv`, `growth_stages.csv`, `crop_requirements.csv`, `split_schedule.csv`, `nutrient_efficiency.csv`, `fertilizer_products.csv`, `soil_test_ratings.csv`, `agronomy_rules.yaml`, `explanation_templates.yaml`, `seasonal_weather.csv`. Every value has a `source`.
