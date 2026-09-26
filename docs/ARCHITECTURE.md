# Architecture

Three services, one boundary each. Full diagram and rationale: `PRD.md` §4.

```
Frontend (React + R3F + GSAP) ──HTTPS──▶ Backend (Express + Prisma + Postgres) ──REST──▶ ML service (FastAPI + XGBoost)
                                                                                              │
                                                                                              ▼
                                                                                       Weather API
```

## Request flow

1. The farmer enters soil, crop, growth stage and previous fertilizer usage in the frontend.
2. The backend persists the input, fetches weather for the field location, and assembles the
   `POST /predict` payload defined in `api-contract.md`.
3. The ML service returns fertilizer type, quantity, split schedule, risk level, top factors and
   `model_version`.
4. The backend stores the recommendation (with `model_version`) and returns it to the frontend,
   which renders the schedule, risk indicator and cost saving.

## Ports (local)

| Service | Port |
|---|---|
| Frontend (Vite) | 5173 |
| Backend | 4000 |
| ML service | 8001 |
| Postgres | 5432 |

## Decisions

- The ML service is a separate deployable so the model can change without touching the backend.
- The backend never reimplements ML logic; it only calls `/predict` through `services/mlService.js`.
- Crop, region and fertilizer reference data live in data files, not application code (NFR5).
