# KhetGPT — Product Requirements Document

Smart India Hackathon · PSAI01 — Sustainable Fertilizer Usage Optimizer

Sep 26, 2026 · Owner: @saloni

## 1. Problem Statement & Objectives

**Background (from the PS)** Excessive and improper fertilizer use degrades soil health and depresses long-term yields, directly cutting farmer income. Most farmers apply fertilizer by habit or dealer advice rather than by what the soil and crop actually need.

**What we're building** KhetGPT is a data-driven fertilizer optimization app that recommends the right fertilizer type, quantity, and timing for a specific field, based on soil health, crop type, growth stage, prior fertilizer usage, and local weather. It surfaces a simple application schedule and flags the yield/soil-health risk of over- or under-application.

**Objectives**

- Cut unnecessary fertilizer spend for the farmer without hurting yield.
- Reduce nutrient runoff and long-term soil degradation.
- Make the recommendation legible to a non-technical user (schedule + plain-language reasoning), not just a number.
- Ship a working end-to-end demo (soil input → recommendation → schedule) for the hackathon evaluation.

**Non-goals (for this build)**

- Not a full farm-management ERP.
- Not a hardware/IoT soil-sensor product (manual/soil-health-card input for v1; sensor ingestion is a stretch goal).
- Not attempting nationwide crop coverage — pick 4–6 major crops (e.g. wheat, rice, cotton, sugarcane, maize, pulses) and do them well.

## 2. Scope

### Functional Requirements

- FR1: User can register/log in (farmer or agronomist role).
- FR2: User can create a Farm and one or more Fields under it.
- FR3: User can enter soil health parameters per field (N, P, K, pH, organic carbon, moisture) — manual entry, with soil-health-card upload as a stretch.
- FR4: User can select crop type and current growth stage.
- FR5: User can log previous fertilizer usage for that field.
- FR6: System fetches current + short-range weather forecast for the field's location.
- FR7: System returns a fertilizer recommendation: type(s), quantity (kg/acre or kg/hectare), and a split-application schedule with dates.
- FR8: System shows a soil-degradation / over-use risk indicator alongside the recommendation.
- FR9: User can view recommendation history for a field.
- FR10: System shows the estimated cost and cost-saving vs. the farmer's previous usage pattern.

### Non-Functional Requirements

- NFR1: Recommendation response time under 3s for the ML call (excluding cold weather-API calls).
- NFR2: Works on low-end Android devices / patchy connectivity (lightweight frontend bundle, graceful degradation).
- NFR3: Model and API versioned so recommendations are reproducible/auditable.
- NFR4: Auth tokens (JWT) expire and refresh; passwords hashed (bcrypt/argon2).
- NFR5: Region/crop/fertilizer reference data kept in config/data files, not hardcoded, so the team can extend crop coverage without code changes.
- NFR6: Codebase split cleanly by service (frontend / backend / ml) so all 4 people can work in parallel without merge conflicts.

## 3. Tech Stack

### Frontend — owned by Darsh

| Layer | Choice |
| --- | --- |
| Build tool | Vite (React + JavaScript, no TS) |
| UI framework | React 18 |
| 3D / visualization | Three.js via `@react-three/fiber`, helpers via `@react-three/drei` |
| Animation | GSAP + `@gsap/react` (`useGSAP` hook) |
| Styling | Tailwind CSS |
| State management | Zustand |
| Icons | `lucide-react` |
| HTTP | `axios` |

### Backend — owned by Josh

| Layer | Choice | Why |
| --- | --- | --- |
| Runtime | Node.js + Express | Fast to stand up; team already knows JS from the frontend stack |
| Database | PostgreSQL | Relational data (users, farms, fields, soil tests, recommendation logs) benefits from real schema + relations |
| ORM | Prisma | Type-safe queries, easy migrations for a short build window |
| Auth | JWT (access + refresh) + bcrypt | Simple, no external dependency needed |
| Inter-service call | REST (JSON) to the ML service | Keeps ML swappable / independently deployable |

### AI/ML — owned by Saloni & Richa

| Layer | Choice | Why |
| --- | --- | --- |
| Language | Python 3.11+ | Standard for the ML ecosystem |
| Data handling | pandas, numpy | Cleaning / feature engineering |
| Modeling | scikit-learn + XGBoost | Strong on tabular data, fast to train/tune, easy to explain via feature importance |
| Model serving | FastAPI | Async, typed request/response schemas (Pydantic), easy to containerize |
| Weather data | Open-Meteo API | Free, no API key, current + forecast (non-commercial use) |
| Model persistence | joblib | Simple artifact save/load |
| Notebooks | Jupyter | EDA and experiment tracking |

### Infra / cross-cutting

- Docker + docker-compose to run backend + ML service + Postgres together locally.
- GitHub Actions for basic lint/test CI on PRs into main.
- `.env` files per service, never committed.

> This is the proposed stack — swap anything the team already has stronger footing in (e.g. Mongo instead of Postgres). The important constraint is the three-service boundary (frontend / backend / ml) so work doesn't collide.

## 4. System Architecture

```
┌──────────────────────┐  HTTPS  ┌───────────────────────┐  REST  ┌────────────────────────┐
│       FRONTEND        │────────▶│        BACKEND         │───────▶│      ML SERVICE         │
│  React + R3F + GSAP    │◀───────│  Node/Express + Auth   │◀──────│  FastAPI + XGBoost      │
│  Zustand + Tailwind    │         │  PostgreSQL (Prisma)   │        │  scikit-learn model     │
└──────────────────────┘         └───────────┬───────────┘        └───────────┬────────────┘
                                              │                                │
                                              ▼                                ▼
                                   Users / Farms / Fields /              Weather API
                                   SoilTests / Recommendations           (Open-Meteo)
                                   (Postgres)
```

**Flow:** Farmer enters soil + crop + field data in the frontend → backend persists it and calls the ML service with the assembled feature payload (soil params + crop + growth stage + weather + prior usage) → ML service returns fertilizer type, quantity, schedule, and a confidence/explanation → backend stores the recommendation and returns it to the frontend → frontend renders the schedule + risk indicator (and the 3D soil-health visualization).

The ML service is a separate deployable unit on purpose, so Saloni/Richa can iterate on the model without touching the backend, and Josh can mock its response contract early and build against that mock while the model is still being trained.

## 5. Features

### Must-have (directly from the PS — MVP)

1. Soil health input (N, P, K, pH, organic carbon, moisture)
2. Crop type + growth-stage selection
3. Weather integration (current + forecast, by field location)
4. Fertilizer type + quantity recommendation
5. Application schedule (what, how much, when — including split doses)
6. Over-/under-fertilization impact warning (soil-health risk indicator)
7. Previous fertilizer usage log, used to refine future recommendations

### Should-have (strengthens the PS ask)

8. Cost estimate + savings vs. the farmer's previous usage pattern
9. Recommendation history per field, with trend view
10. Plain-language "why this recommendation" explanation (top 2–3 driving factors)
11. Hindi/regional-language UI toggle

### Could-have (differentiators, if time allows)

12. 3D interactive soil/field visualization (React Three Fiber) — nutrient balance as an explorable 3D model, animated with GSAP on state change
13. Offline-friendly / low-data mode (PWA, cached last recommendation)
14. Geo/map field picker with satellite soil reference (e.g. SoilGrids) for farmers without a soil test report
15. Voice input for soil/crop entry (regional-language speech-to-text) for low-literacy users
16. "KhetGPT assistant" — a small Q&A chat surface answering farmer questions about the recommendation
17. Agronomist/admin view — aggregated, anonymized regional over-use patterns

**Recommendation:** build 1–7 solid first — that's what's graded against the PS — get 8–11 in if time allows, and use #12 (3D visualization) as the single standout differentiator, since it's the one that makes the specified R3F/GSAP stack visibly pay off in the demo. Don't spread thin across many could-haves.

## 6. Data Sources & Datasets

- **Fertilizer recommendation dataset** — Kaggle "Fertilizer Prediction" dataset (soil N-P-K, moisture, temperature, humidity, crop → fertilizer label), as the seed for the classification model.
- **Soil Health Card data** — data.gov.in Soil Health Card scheme datasets, for realistic N/P/K/pH ranges per district.
- **Crop nutrient requirement norms** — ICAR / state agriculture department fertilizer recommendation tables (per-crop, per-stage NPK requirement), used both as training features and as a rule-based sanity check / explainability layer on top of the ML output.
- **Weather data** — Open-Meteo (current conditions + 5-day forecast) by lat/long. No API key needed.
- **(Stretch) Satellite soil reference** — SoilGrids / Bhuvan, for fields with no manual soil test.

Richa owns sourcing/cleaning these; Saloni owns turning them into model-ready features. Keep raw files out of git (large/licensed) — see the `.gitignore` and `ml/data/README.md` for how to fetch them locally.

## 7. Repository & File Structure

Monorepo, one service per top-level folder so each person's work stays isolated:

```
KhetGPT/
├── AGENTS.md                   # canonical AI-agent context (see below)
├── CLAUDE.md                   # Claude Code entry point → imports AGENTS.md
├── GEMINI.md                   # Antigravity/Gemini CLI entry point → imports AGENTS.md
├── README.md
├── docker-compose.yml
├── .gitignore
├── .github/workflows/ci.yml
├── docs/
│   ├── PRD.md                  # exported copy of this doc
│   ├── architecture.md
│   ├── api-contract.md         # backend ⇄ ML schema — Josh + Saloni own together
│   └── data-dictionary.md
│
├── frontend/                   # DARSH
│   ├── AGENTS.md
│   ├── index.html, package.json, vite.config.js, tailwind.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx / App.jsx
│       ├── components/
│       │   ├── ui/             # buttons, cards, inputs (lucide-react icons)
│       │   ├── layout/         # Navbar, Sidebar, Footer
│       │   ├── forms/          # SoilInputForm, CropSelector, FieldMapPicker
│       │   └── scene/          # R3F <Canvas> pieces: SoilHealthGlobe, FieldModel
│       ├── scenes/             # full R3F scene compositions per page
│       ├── animations/         # GSAP timelines / useGSAP wrapper hooks
│       ├── pages/              # Landing, Dashboard, SoilInput, Recommendation, History, Auth/
│       ├── store/              # Zustand: useUserStore, useFarmStore, useRecommendationStore
│       ├── services/           # api.js — calls to backend
│       └── hooks/, utils/, styles/
│
├── backend/                     # JOSH
│   ├── AGENTS.md
│   ├── package.json
│   ├── prisma/schema.prisma
│   └── src/
│       ├── server.js / app.js
│       ├── config/             # db.js, env.js
│       ├── models/             # User, Farm, Field, SoilTest, Recommendation, FertilizerLog
│       ├── routes/             # auth, farm, field, recommendation, weather
│       ├── controllers/, middleware/ (auth, error, validate)
│       ├── services/           # mlService.js (calls the ML API), weatherService.js
│       └── utils/
│
└── ml/                          # SALONI + RICHA
    ├── AGENTS.md
    ├── requirements.txt
    ├── data/{raw,processed,external}/   # gitignored except README + small samples
    ├── notebooks/               # EDA.ipynb, model_experiments.ipynb
    └── src/
        ├── data_pipeline/       # ingest.py, clean.py, feature_engineering.py   → RICHA
        ├── weather/             # weather_client.py                               → RICHA
        ├── evaluation/          # metrics.py, explainability.py                  → RICHA
        ├── models/              # train.py, predict.py, model_registry/          → SALONI
        └── api/                 # main.py (FastAPI app), schemas.py, endpoints/  → SALONI
```

**Why AGENTS.md at the root, plus thin CLAUDE.md/GEMINI.md:** Claude Code auto-loads `CLAUDE.md`; Antigravity/Gemini CLI auto-loads `GEMINI.md` (or reads `AGENTS.md` directly if you set `context.fileName` in its settings). Rather than maintaining project context twice, `AGENTS.md` holds the real substance and `CLAUDE.md`/`GEMINI.md` are one-line shims pointing to it (Claude Code natively supports an `@AGENTS.md` import). Each service folder also gets its own small `AGENTS.md`, so an agent working inside `ml/` only loads ML-specific conventions instead of the whole project's context.

## 8. Git Branching Workflow

`main` stays deployable/demo-ready at all times. Four long-lived feature branches, one per person, merged back via PR once a chunk of work is stable:

| Branch | Owner | Scope |
| --- | --- | --- |
| `feature/saloni-ml-core` | Saloni | `ml/src/models`, `ml/src/api` |
| `feature/richa-ml-data` | Richa | `ml/data`, `ml/src/data_pipeline`, `ml/src/weather`, `ml/src/evaluation` |
| `feature/josh-backend` | Josh | `backend/**` |
| `feature/darsh-frontend` | Darsh | `frontend/**` |

**One-time setup** (any one of you, from the repo root):

```bash
git clone https://github.com/Saloni060410/KhetGPT.git
cd KhetGPT

git checkout -b feature/saloni-ml-core   && git push -u origin feature/saloni-ml-core
git checkout main
git checkout -b feature/richa-ml-data    && git push -u origin feature/richa-ml-data
git checkout main
git checkout -b feature/josh-backend     && git push -u origin feature/josh-backend
git checkout main
git checkout -b feature/darsh-frontend   && git push -u origin feature/darsh-frontend
git checkout main
```

I can't push to your GitHub myself (no credentials to it), so one of you runs this once — after that everyone just checks out their own branch.

**Day to day, on your own branch:**

```bash
git checkout feature/<your-branch>
git pull origin main --rebase   # pull in what's merged before you start
# ... work, commit ...
git push origin feature/<your-branch>
```

**Merging into main:** open a PR from your branch once a feature works end-to-end (not mid-change); at least one other teammate reviews before merge, since everyone's code has to run together for the demo. Rebase onto main before opening the PR if main has moved.

**Avoiding overlap:** folders are owned per-branch (see table above and §9), so two branches almost never touch the same file — the one shared surface is `docs/api-contract.md`, which Josh and Saloni should agree on first, before either builds against it.

## 9. Team & Work Division

| Person | Focus | Owns (files/folders) | Key deliverables |
| --- | --- | --- | --- |
| **Saloni** | AI/ML — modeling & serving | `ml/src/models/*`, `ml/src/api/*`, model\_registry | Trained fertilizer type + quantity model; FastAPI `/predict` endpoint; `docs/api-contract.md` (with Josh) |
| **Richa** | AI/ML — data & evaluation | `ml/data/*`, `ml/src/data_pipeline/*`, `ml/src/weather/*`, `ml/src/evaluation/*`, notebooks | Cleaned/merged training dataset; weather-feature integration; model evaluation + explainability ("why this recommendation") |
| **Josh** | Backend — auth, DB, API | `backend/**`, `docker-compose.yml`, `.github/workflows/` | Auth (JWT signup/login), Postgres schema (Prisma), all REST routes, `mlService.js` bridge to the ML API |
| **Darsh** | Frontend — UI, 3D, animation | `frontend/**` | All pages, forms, Zustand stores, R3F 3D visualizations, GSAP animation, Tailwind theming |

**Shared/coordination points (don't build in isolation):**

- **Josh ⇄ Saloni** agree on the `/predict` request/response JSON shape before either writes code against it — document it in `docs/api-contract.md` on day 1, then both build in parallel against the contract (Josh mocks the response; Saloni matches the schema when the real model is ready).
- **Darsh ⇄ Josh** agree on the backend's REST response shape for farms/fields/recommendations the same way.
- **Saloni ⇄ Richa** split by pipeline stage, not by day: Richa hands off a clean, feature-engineered dataframe; Saloni trains/serves on top of it. A short daily sync avoids duplicate feature-engineering work.

## 10. Success Metrics & Evaluation Criteria

- **Model:** recommendation accuracy against held-out labeled data (fertilizer-type classification accuracy / quantity regression error, e.g. MAE); sanity-checked against ICAR nutrient norms.
- **Product:** end-to-end demo runs (signup → soil input → recommendation → schedule) without manual intervention.
- **Impact framing for judges:** estimated % reduction in fertilizer over-application and estimated cost saving per acre, shown quantitatively on the recommendation screen — this maps directly to the PS's stated goal of reducing input cost, preventing soil degradation, and improving farmer income.
- **UX:** a non-technical user can go from soil input to an understandable schedule in under 2 minutes.

## 11. Risks & Open Questions

- **Data quality/coverage:** public datasets may not cover every crop/region the team wants to demo — mitigate by scoping to 4–6 well-covered crops (see §1 non-goals).
- **Weather API availability:** Open-Meteo needs no key but is free for non-commercial use only, so cache responses per field and confirm the terms before any commercial launch.
- **Model ⇄ backend contract drift:** locked down by writing `docs/api-contract.md` first (see §9).
- **Time split for the AI/ML pair:** Saloni and Richa's work is sequential (data → model), not parallel by default — start Richa's pipeline work immediately so Saloni isn't blocked.
- **Open question:** confirm target crops and target region (for soil-norm data) with the team before Richa starts data collection.
- **Open question:** Postgres vs. MongoDB for the backend — Postgres is recommended above for the relational farm/field/recommendation-history structure, but flag if Josh has stronger Mongo experience already.
