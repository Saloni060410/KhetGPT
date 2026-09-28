# Team assignments

Each person has a prompt pack in `docs/prompt-packs/` with setup, features, ordered steps, co-requisites and integration gates.

## Saloni: AI/ML core (recommendation engine, model, API)
Branch `feature/saloni-ml-core`. Owns `ml/src/api/`, `ml/src/engine/`, `ml/src/models/`, `ml/Dockerfile`, `ml/MODEL_CARD.md`.
- `engine/npk_calculator.py`: the dose formula. Standard dose for the crop, plus the soil-test adjustment (or an STCR equation where one exists), minus credit from recent applications. Returns per-nutrient numbers and a rule trace.
- `engine/recommendation_engine.py`: products, dated split schedule, weather adjustment, cost and saving, and the call to Richa's risk analyzer and explanations.
- `models/`: trains and versions the product classifier on Richa's dataset.
- `api/`: `POST /recommend`, `POST /risk-score`, `GET /health`, `GET /reference/*`, mock mode for parallel work.
- Contract with Josh (`api-contract.md`), tests, packaging and the model card.

## Richa: AI/ML data, weather, risk, evaluation
Branch `feature/richa-ml-data`. Owns `ml/data/`, `ml/src/data_pipeline/`, `ml/src/weather/`, `ml/src/degradation/`, `ml/src/evaluation/`, `ml/notebooks/`.
- Finds, judges and chooses the datasets, and documents provenance. Crop, variety and stage vocabularies.
- `data/external/`: crop requirements, use efficiencies, fertilizer products and prices, soil rating cut-offs, agronomy rules, explanation templates, seasonal weather fallback. Every value sourced.
- `degradation/risk_analyzer.py`: over- and under-application risk with plain-language soil-health and yield impact.
- `weather/weather_client.py`: Open-Meteo client and weather features.
- Feature module shared with training and serving, evaluation metrics, explanations, demo scenarios.

## Josh: backend, auth, database, infra
Branch `feature/josh-backend`. Owns `backend/**`, `docker-compose.yml`, `.github/workflows/`.
- Prisma schema and migrations, auth with token rotation, farms, fields, soil tests, usage log.
- Weather with cache and seasonal fallback, place-name geocoding, reference proxy.
- Recommendation orchestration and history, risk check, trends.
- Contract with Saloni (C1) and with Darsh (`backend-api.md`). Compose stack and CI. No cloud deployment.

## Darsh: frontend, UI, 3D
Branch `feature/darsh-frontend`. Owns `frontend/**`.
- All pages and forms, Zustand stores, the single API layer, and a mock mode so work never waits on the backend.
- Full creative freedom over the design. The fixed parts are the API calls and a short list of basics (accessibility, low-end Android performance, Devanagari fonts, real content).
- Schedule and PDF view, field profile with trends, what-if dose check, the 3D visualization, Hindi toggle.

## Shared checkpoints

1. Contracts merged to `main` before feature code (gate G0).
2. Mock vertical slice across all services (G1).
3. Data to model handoff (G2), real end to end (G3), one-command stack (G4), demo freeze (G5).
