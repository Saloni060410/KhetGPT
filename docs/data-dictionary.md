# Data dictionary

Units and meaning of the fields shared across services. Keep in step with `api-contract.md`
and `backend/prisma/schema.prisma`.

## Soil

| Field | Meaning | Unit |
|---|---|---|
| `n` | Available nitrogen | TODO(data): confirm unit (kg/ha or ppm) against the training dataset |
| `p` | Available phosphorus | TODO(data): confirm unit |
| `k` | Available potassium | TODO(data): confirm unit |
| `ph` | Soil pH | 0–14 |
| `organic_carbon` | Organic carbon content | % |
| `moisture` | Soil moisture | % |

## Weather

| Field | Meaning | Unit |
|---|---|---|
| `temperature_c` | Current air temperature | °C |
| `humidity_pct` | Relative humidity | % |
| `rainfall_mm_forecast` | Forecast rainfall for the short-range window | mm |

## Recommendation

| Field | Meaning | Unit |
|---|---|---|
| `quantity_kg_per_acre` | Fertilizer quantity | kg/acre |
| `risk.level` | Over-/under-application risk | `low` / `medium` / `high` |
| `model_version` | Version of the model that produced the result | string |
