# Architecture

Three services in one monorepo. Each has its own folder, its own owner and its own git branch.

```
Frontend (React + R3F + GSAP) --HTTPS--> Backend (Express + Prisma + Postgres) --REST--> ML service (FastAPI)
                                                  |                                          |
                                                  |                                          v
                                                  v                                  Reference data (ICAR-based
                                        Open-Meteo weather + geocoding               tables in ml/data/external)
```

- The **frontend** never calls the ML service. Everything goes through the backend, so auth, history and caching stay in one place.
- The **backend** owns all persistence and orchestration. It validates the request, gathers stored soil, crop and usage data, fetches weather, calls the ML service and stores the result.
- The **ML service** is stateless: pure computation, no database access. It holds the deficit engine, the model, the risk analyzer and the reference tables.

## Request flow

1. The farmer enters soil, crop, growth stage, sowing date and previous fertilizer usage in the frontend.
2. The backend stores them, fetches weather for the field's coordinates and builds the `POST /recommend` payload (`api-contract.md`).
3. The ML service computes the nutrient deficit, picks products, dates a split schedule, scores risk and cost, and returns everything with the formula inputs and `model_version`.
4. The backend stores the recommendation (with an input snapshot) and returns it. The frontend renders the schedule, risk, cost and the reasons.

## Tech stack

| Area | Choice |
|---|---|
| Frontend | Vite + React (JavaScript), React Three Fiber + drei, GSAP + `@gsap/react`, Tailwind CSS, Zustand, lucide-react, axios, react-router-dom. A chart library and a form library are Darsh's choice, lazy-loaded. |
| Backend | Node.js + Express, PostgreSQL with Prisma, JWT (access + refresh) with bcrypt, zod, helmet, cors, morgan, express-rate-limit |
| ML service | Python 3.11, FastAPI, pandas, numpy, scikit-learn, XGBoost, joblib, httpx, pydantic |
| Weather and location | Open-Meteo forecast and geocoding APIs (no key, non-commercial use) |
| Local infra | Docker and docker-compose for Postgres, backend and ML. GitHub Actions for lint and tests on pull requests. |

## Repository structure

```
KhetGPT/
├── AGENTS.md, CLAUDE.md, GEMINI.md, README.md
├── docker-compose.yml
├── .github/workflows/ci.yml
├── docs/
│   ├── PRD.md, FEATURES.md, ARCHITECTURE.md (this file)
│   ├── GIT_WORKFLOW.md, TEAM_ASSIGNMENTS.md
│   ├── api-contract.md              backend <-> ML (C1)
│   ├── backend-api.md               frontend <-> backend (C3), written in step J1
│   ├── data-dictionary.md
│   ├── contract-fixtures/           shared request/response fixtures
│   └── prompt-packs/                one step-by-step pack per person
├── frontend/                        Darsh
│   └── src/  components/{ui,layout,forms,three,charts}  scenes/  animations/
│             pages/{Landing, Dashboard, SoilInput, Recommendation, Schedule, FieldProfile, History, Auth/}
│             store/  services/  hooks/  utils/  styles/
├── backend/                         Josh
│   ├── prisma/schema.prisma
│   └── src/  config/  routes/  controllers/  middleware/  services/  utils/
└── ml/                              Saloni + Richa
    ├── data/{raw,processed,external}/
    ├── notebooks/
    └── src/
        ├── api/                     Saloni   /recommend, /risk-score, /health, /reference/*
        ├── engine/                  Saloni   npk_calculator.py, recommendation_engine.py
        ├── models/                  Saloni   train.py, fertilizer_model.py, model_registry/
        ├── degradation/             Richa    risk_analyzer.py
        ├── data_pipeline/           Richa    ingest.py, clean.py, feature_engineering.py, soil_data_loader.py
        ├── weather/                 Richa    weather_client.py
        └── evaluation/              Richa    metrics.py, explainability.py
```

## Decisions log

| Decision | Choice and reason |
|---|---|
| Soil schema | Fixed by the problem statement: N, P, K, pH, organic carbon, moisture. Never add, remove or rename these. |
| Core method | Transparent deficit formula: fertilizer needed = (crop demand - soil supply) / use efficiency - credit from recent applications. The ML model refines the product choice. Every result shows the formula inputs, which meets the explainability requirement and the "matches the agronomic formula" success metric. |
| ML endpoints | `POST /recommend` and `POST /risk-score`. `/risk-score` scores a farmer's own planned dose, which delivers the problem statement's warning about excessive use. |
| Risk ownership | Richa owns `degradation/risk_analyzer.py`. Saloni's engine, model and API workload is the larger one. |
| Crop variety | Optional. It exists only if the datasets Richa chooses have varieties, and then it comes from her `crop_varieties.csv`. |
| Location | Coordinates are canonical. The UI offers browser location, search by place name (backend proxies Open-Meteo geocoding) and manual lat/lng. Pincode is stored as a label and never used to look up coordinates. |
| Weather fallback | Live, then cached (up to 6 hours), then a seasonal average from Richa's data. The source is reported in every response. |
| Cost baseline | The farmer's logged previous usage, as the problem statement says. Null when nothing is logged. |
| Charts and trends | The backend computes trend series from stored history. The frontend picks the chart approach. |
| Schedule export | Printable page and the browser's Save as PDF. No PDF library needed. |
| Deployment | Out of scope. The demo runs locally with docker-compose. |
| Folder and branch names | `ml/` (not `ml-service/`) and `feature/<name>-<area>` branches, kept from the first scaffold. Engine and degradation modules follow the earlier draft's names inside `ml/src/`. |
| Stretch, not planned | Soil Health Card OCR, scheme lookup, SMS or IVR, community stories. |

## Ports (local)

| Service | Port |
|---|---|
| Frontend (Vite) | 5173 |
| Backend | 4000 |
| ML service | 8001 |
| Postgres | 5432 |
