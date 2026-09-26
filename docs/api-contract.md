# API Contract — Backend ⇄ ML Service

Owned jointly by **Josh** (backend) and **Saloni** (ML). Fill this in on day 1, before either
side writes code against it — Josh's `services/mlService.js` and Saloni's `src/api/schemas.py`
must both match this exactly. Update it in the same PR whenever the shape changes.

## POST /predict — ML service endpoint

**Request** (sent by backend):
```json
{
  "field_id": "string",
  "crop_type": "string",
  "growth_stage": "string",
  "soil": {
    "n": 0.0,
    "p": 0.0,
    "k": 0.0,
    "ph": 0.0,
    "organic_carbon": 0.0,
    "moisture": 0.0
  },
  "weather": {
    "temperature_c": 0.0,
    "humidity_pct": 0.0,
    "rainfall_mm_forecast": 0.0
  },
  "previous_fertilizer_usage": [
    { "type": "string", "quantity_kg_per_acre": 0.0, "applied_on": "YYYY-MM-DD" }
  ]
}
```

**Response** (returned by ML service):
```json
{
  "recommendation": {
    "fertilizer_type": "string",
    "quantity_kg_per_acre": 0.0,
    "schedule": [
      { "stage": "string", "quantity_kg_per_acre": 0.0, "apply_by": "YYYY-MM-DD" }
    ]
  },
  "risk": {
    "level": "low | medium | high",
    "reason": "string"
  },
  "explanation": {
    "top_factors": ["string", "string"]
  },
  "model_version": "string"
}
```

> ⚠️ This is a starting proposal, not final — Josh and Saloni: adjust field names/types here
> first, then implement. Keep `model_version` in every response so a bad prediction can be
> traced back to the model that made it.

## GET /health

Simple liveness check the backend can poll before routing traffic to the ML service.

```json
{ "status": "ok", "model_version": "string" }
```
