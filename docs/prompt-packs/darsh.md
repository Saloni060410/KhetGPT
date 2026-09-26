# Darsh — KhetGPT Prompt Pack

**Role:** Frontend: UI, 3D, animation  
**Branch:** `feature/darsh-frontend`  
**Repo:** https://github.com/Saloni060410/KhetGPT.git

Smart India Hackathon, PSAI01: Sustainable Fertilizer Usage Optimizer. This pack is generated from one shared plan, so the four packs always agree on steps, contracts and integration points.

## 1. Your role

You make everything the other three build visible and usable. This pack gives you the API calls and the basic needs. How it looks, feels and moves is yours.

You get the endpoints, the data shapes, the states that must be handled and a short list of non-negotiables. You choose the visual direction, layout, typography, motion and the concept for the 3D feature. Work against the mock first, then switch to the real backend as each endpoint lands.

**You own**

- `frontend/**` (React, R3F, GSAP, Tailwind, Zustand)
- `frontend/DEMO.md`
- `docs/backend-api.md` (review, with Josh)

**Hands off (owned by someone else)**

- `backend/** and docker-compose.yml` (Josh)
- `ml/**` (Saloni and Richa)

### Your call, and what is fixed

**You decide**

- The whole visual direction: style, palette, type, layout, spacing, iconography, illustration.
- Page structure, navigation pattern and how information is grouped and prioritised.
- Motion: what animates, where, and how much. GSAP is there for you to use, not a requirement on every screen.
- The concept for the 3D feature (PRD feature 12): what the scene shows and how people explore it.
- The landing page: message, structure and tone.
- Component and folder details inside src/, as long as all backend calls stay in src/services/.

**Non-negotiable**

- All backend calls go through src/services/api.js and endpoints.js. Components never call axios or fetch directly.
- Use design tokens (CSS variables mapped into Tailwind). No magic numbers in components.
- Text and interactive elements are legible and operable: readable contrast, visible keyboard focus, touch targets of at least 44 px, labels on icon-only buttons, respect prefers-reduced-motion.
- Every screen handles loading, empty, error and success. Every button has hover, active, focus, disabled and loading states.
- Works on a low-end Android phone on a slow connection (NFR2): no horizontal scroll from 320 px up, lazy-load anything heavy, keep the initial bundle small.
- The font you choose must include Devanagari glyphs for the Hindi toggle. Self-host fonts as woff2.
- Real content only: no invented statistics, testimonials or logos. Numbers on screen come from the API.
- Risk level is never conveyed by colour alone.
- No dead links, no console.log, no commented-out code in what you commit.

## 2. Initialize your system

**1. Check your machine**

```bash
node -v      # 22 or newer (CI uses 22)
npm -v
git --version
```

Expected: Node 22+.

**2. Clone and switch to your branch**

```bash
git clone https://github.com/Saloni060410/KhetGPT.git
cd KhetGPT
git checkout feature/darsh-frontend
git pull origin main --rebase
```

Expected: Branch feature/darsh-frontend, rebased on the latest main.

**3. Install and configure**

```bash
cd frontend
cp .env.example .env
npm install
```

Expected: .env has VITE_API_BASE_URL=http://localhost:4000/api. You will add VITE_USE_MOCK in D2.

**4. Run and verify**

```bash
npm run lint
npm run build
npm run dev      # http://localhost:5173
```

Expected: Lint and build clean. Every route renders its stub: /, /login, /register, /dashboard, /fields/1/soil, /fields/1/recommendation, /fields/1/history.

**5. Optional: run the real backend**

```bash
# in another terminal, from the repo root, once Josh's J3 and J4 are merged:
docker compose up -d postgres
cd backend && npm install && npm run db:reset && npm run dev
# ML mock (Saloni's S2):
cd ml && source .venv/bin/activate && PREDICT_MODE=mock uvicorn src.api.main:app --port 8001
```

Expected: You only need this for the integration steps. Before that, VITE_USE_MOCK=true is enough.

**6. Open Claude Code**

```bash
cd ..            # repo root
claude
```

Expected: Run every prompt below from the repo root.

## 3. Features you implement

| PRD reference | Feature | Steps |
|---|---|---|
| FR1 | Register, log in, log out, role choice | D2, D3 |
| FR2 | Create and manage farms and fields | D5 |
| FR3, FR4, FR5 | Soil input, crop and stage selection, previous fertilizer log | D6 |
| FR6 | Show current and forecast weather for the field | D7 |
| FR7, FR8, FR10 | Show product, quantity, dated schedule, risk indicator, cost and saving | D4, D7 |
| FR9 / Should-have 9 | Recommendation history with a trend view | D8 |
| Should-have 10 | Show the plain-language reasons | D7 |
| Should-have 11 | Hindi and English toggle | D10 |
| Could-have 12 | The standout 3D and animated visualization | D9 |
| Could-have 13 | Offline-friendly last recommendation | D12 |
| NFR2 | Lightweight, low-end Android friendly | D1, D9, D12 |

## 4. API calls you can use (contract C3)

Base URL `/api` (`VITE_API_BASE_URL`), JSON in camelCase, bearer access token. The full contract with examples is `docs/backend-api.md` once Josh merges it (J1).

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/auth/register` | { email, password, name, role } | 201 { user, accessToken, refreshToken } |
| POST | `/auth/login` | { email, password } | 200 { user, accessToken, refreshToken } |
| POST | `/auth/refresh` | { refreshToken } | 200 { accessToken, refreshToken } (rotated) |
| POST | `/auth/logout` | { refreshToken } | 204 |
| GET | `/auth/me` | none | 200 user |
| GET | `/farms` | ?page&limit | 200 { items, page, limit, total } |
| POST | `/farms` | { name } | 201 farm |
| GET | `/farms/:id` | none | 200 farm with field summaries |
| DELETE | `/farms/:id` | none | 204 |
| GET | `/farms/:farmId/fields` | ?page&limit | 200 paginated fields |
| POST | `/farms/:farmId/fields` | { name, areaAcres?, latitude?, longitude?, pincode? } | 201 field |
| GET | `/fields/:id` | none | 200 field with latest soil test and latest recommendation |
| PATCH | `/fields/:id` | { cropType?, growthStage?, sowingDate?, latitude?, longitude?, areaAcres? } | 200 field |
| POST | `/fields/:id/soil-tests` | { n, p, k, ph, organicCarbon, moisture, testedOn? } | 201 soil test |
| GET | `/fields/:id/soil-tests` | ?page&limit | 200 newest first |
| POST | `/fields/:id/fertilizer-logs` | { type, quantityKgPerAcre, appliedOn } | 201 log |
| GET | `/fields/:id/fertilizer-logs` | ?page&limit | 200 newest first |
| GET | `/fields/:id/weather` | none | 200 { temperatureC, humidityPct, rainfallMmForecast, fetchedAt, stale } |
| POST | `/fields/:id/recommendations` | { soilTestId?, cropType?, growthStage? } | 201 Recommendation |
| GET | `/fields/:id/recommendations` | ?page&limit | 200 history, newest first |
| GET | `/recommendations/:id` | none | 200 Recommendation |
| GET | `/reference/crops` | none | 200 [{ id, nameEn, nameHi, stages: [{ id, nameEn, nameHi, order }] }] |
| GET | `/reference/soil-ratings` | none | 200 cut-offs for n, p, k, organicCarbon, ph |
| GET | `/reference/fertilizers` | none | 200 [{ id, name, nPct, p2o5Pct, k2oPct, priceInrPerKg, priceDate }] |

```text
Recommendation {
  id, fieldId, soilTestId, cropType, growthStage,
  fertilizerType, quantityKgPerAcre,
  schedule: [{ stage, fertilizerType, quantityKgPerAcre, applyBy }],
  risk: { level: "low" | "medium" | "high", reason },
  topFactors: [string],
  cost: { estimatedCostPerAcre, previousCostPerAcre | null, savingPerAcre | null, savingTotal | null },
  impact: { overApplicationReductionPct | null },
  weatherStale: boolean,
  modelVersion, createdAt
}
Errors: { error: string, details?: [] }. Codes: 400 validation, 401, 403, 404 (also for other users' resources), 409 missing prerequisite, 502 ML unavailable, 503 weather unavailable.
```

## 5. Who you depend on, and who depends on you

Hard need = you cannot finish the step without it. Integrates with = you can start on a mock or fixture, but the step is only complete once the other person's work is merged and you have tested against it. Pairs with = you finish it together.

| Step | Blocked by (hard) | Pairs with | Integrates with | Unblocks | Gate |
|---|---|---|---|---|---|
| **D0** Verify your frontend environment | none | none | none | none |  |
| **D1** Choose your direction and build your foundation | none | none | none | D2, D11 |  |
| **D2** API layer, mock mode, shell and routing | D1, J1 | none | none | D3, D4, D5 |  |
| **D3** Sign up, log in, log out | D2 | none | J3 | none | G1 |
| **D4** First recommendation screen | D2 | none | J4, S2 | D7, J4 | G1 |
| **D5** Farms and fields | D2 | none | J5 | D6, J5 | G2 |
| **D6** Soil input, crop selection and fertilizer log | D5 | none | J5, J6, R1 | D10, J5 | G2 |
| **D7** The full recommendation screen | D4 | none | J8, S7, R12 | D8, D9, J8 | G3 |
| **D8** History and trend | D7 | none | J8 | J8 | G3 |
| **D9** The standout visualization | D7 | none | J6 | D12 | G4 |
| **D10** English and Hindi toggle | D6 | none | R1 | D12 | G4 |
| **D11** Landing page and brand finish | D1 | none | none | D12 | G4 |
| **D12** Launch checks, offline fallback and demo path | D9, D10, D11 | none | R12 | none | G5 |

## 6. Team timeline and integration gates

- **Phase 0: Kickoff and contracts.** Everyone sets up, and the shared contracts are agreed and merged before anyone builds against them.
- **Phase 1: Foundations in parallel.** Each person builds their base layer against contracts and fixtures. Nobody waits for anybody.
- **Phase 2: Real data and real CRUD.** Real datasets and tables land, the model trains, the API stores real farm data, forms save it.
- **Phase 3: Real recommendation.** Mock mode is switched off. Data, model, backend and UI produce one real recommendation.
- **Phase 4: Packaging and standout.** One-command stack, CI green, the 3D feature, Hindi toggle, evaluation evidence.
- **Phase 5: Demo hardening.** Rehearse, freeze, write the model card, prepare fallbacks.

### G0 — Contracts locked (end of Phase 0)

C1 (ML predict API), C3 (backend REST API), fixtures and the vocabulary files are merged to main. Nobody changes them without the change protocol.

**Who delivers what**

- Saloni + Josh: docs/api-contract.md v1.0 and docs/contract-fixtures/ merged (S1, J1)
- Josh + Darsh: docs/backend-api.md merged (J1)
- Richa: crops.csv, growth_stages.csv and header-only C5 tables merged (R1)
- Everyone: dev environment running on their own branch (S0, R0, J0, D0)

**Acceptance test:** Every teammate can read the fixtures and say what each endpoint returns. Josh, Saloni and Darsh have all approved the contract PRs.

**If it slips:** Do not start Phase 1 code that depends on an unmerged contract. Build only environment and non-contract work until it merges.

### G1 — Mock vertical slice (end of Phase 1)

One request travels the whole chain with fake numbers: frontend, backend, database and the ML service in mock mode.

**Your steps at this gate:** D3 (Sign up, log in, log out), D4 (First recommendation screen)

**Who delivers what**

- Saloni: ML service mock mode plus reference endpoints on main (S2)
- Josh: seeded database, real auth and the thin recommendation route (J2, J3, J4)
- Darsh: shell, auth pages and a first recommendation screen (D2, D3, D4)
- Richa: raw data acquired, norms and rules v0 for two crops, cleaning pipeline (R2, R3, R4)

**Acceptance test:** Log in as the seeded farmer, open the seeded field, press Get recommendation, see a mocked plan on screen, and find the stored row in Postgres.

**If it slips:** Darsh runs with VITE_USE_MOCK=true. Josh stubs the ML call with the fixture. Neither blocks on the other.

### G2 — Data to model handoff (end of Phase 2)

Richa's dataset and feature module are consumed by Saloni's trainer, the dosage engine runs on Richa's tables, and the app stores real farm data.

**Your steps at this gate:** D5 (Farms and fields), D6 (Soil input, crop selection and fertilizer log)

**Who delivers what**

- Richa: feature module, dataset build and frozen test split on main (R6)
- Saloni: first trained model v0.1.0 in the registry (S3) and a passing dosage engine (S4)
- Josh: CRUD, reference proxy and weather route on main (J5, J6, J7)
- Darsh: farm, field, soil, crop and fertilizer log screens saving real data (D5, D6)

**Acceptance test:** python -m src.models.train runs from a clean checkout on Richa's dataset and prints a comparison table. Darsh creates a farm, field and soil test in the UI and Josh's database holds them.

**If it slips:** Saloni trains on sample_train.csv. Dosage tests use the v0 tables. The UI keeps using the mock for anything unmerged.

### G3 — Real end to end (end of Phase 3)

Mock mode is off. A real model, real weather and real stored data produce the recommendation the user sees.

**Your steps at this gate:** D7 (The full recommendation screen), D8 (History and trend)

**Who delivers what**

- Saloni: predict pipeline in real mode with risk and cost (S5, S6, S7, S8)
- Richa: metrics, explanation templates, demo scenarios (R8, R9, R12)
- Josh: full recommendation orchestration and history (J8)
- Darsh: full recommendation screen and history (D7, D8)

**Acceptance test:** Signup, farm, field, soil test, crop and stage, Get recommendation. The result shows a real model_version, schedule with dates, risk, cost, factors. History shows it afterwards.

**If it slips:** Ship G3 with PREDICT_MODE=mock and label it in the UI as sample output. Do not hide that it is a mock.

### G4 — One-command stack (end of Phase 4)

docker compose up brings up Postgres, ML and backend healthy from a clean clone. CI is green. The standout UI features work on the real stack.

**Your steps at this gate:** D9 (The standout visualization), D10 (English and Hindi toggle), D11 (Landing page and brand finish)

**Who delivers what**

- Josh: compose and CI (J9), hardening (J10)
- Saloni: ML image, artifact strategy, sanity gate, final test evaluation (S9, S10)
- Richa: evaluation report with impact estimate (R10)
- Darsh: 3D visualization, language toggle, landing (D9, D10, D11)

**Acceptance test:** A teammate who has never run the project clones it, follows the README and reaches a working recommendation in under 15 minutes.

**If it slips:** Frontend runs from npm run dev against the compose stack. Ship the standout feature only if it meets the performance contract.

### G5 — Demo freeze (end of Phase 5)

Rehearsed on two machines. Fallbacks work. Model card and evaluation report are written. main is tagged.

**Your steps at this gate:** D12 (Launch checks, offline fallback and demo path)

**Who delivers what**

- Saloni: model card and demo readiness (S11, S12)
- Josh: demo seed and reset (J11)
- Darsh: launch pass and offline fallback build (D12)
- Richa: reproducible data commands and docs (R11)

**Acceptance test:** Full demo run on two laptops, once with internet and once with mock fallbacks. The three demo scenarios behave as documented in docs/demo-scenarios.md.

**If it slips:** Cut features, never the rehearsal. Anything unfinished is removed from the demo path, not left half-working.

## 7. Contracts you share with the team

| # | Contract | Where | Owners | Locks at |
|---|---|---|---|---|
| C1 | ML predict API: POST /predict and GET /health between the backend and the ML service. Code sides: ml/src/api/schemas.py and backend/src/services/mlService.js. | `docs/api-contract.md, docs/contract-fixtures/` | Saloni, Josh | G0 |
| C2 | Reference data API: Crops, growth stages, soil rating cut-offs and fertilizer products. Richa authors the files, Saloni serves them, Josh proxies them, Darsh reads them. Nothing is hardcoded in the UI or the backend. | `ml/data/external/*.csv, ML /reference/*, backend /api/reference/*` | Richa, Saloni, Josh, Darsh | G0 (shape), G2 (real data) |
| C3 | Backend REST API: Every endpoint the frontend calls: auth, farms, fields, soil tests, fertilizer logs, weather, recommendations, reference. | `docs/backend-api.md` | Josh, Darsh | G0 |
| C4 | Feature module: The single feature code path used by training and by serving, so the two can never drift. | `ml/src/data_pipeline/feature_engineering.py` | Richa, Saloni | G2 |
| C5 | External reference tables: Crop nutrient norms, split schedules, fertilizer products and prices, soil rating cut-offs, agronomy rules. Column schemas are agreed in R1, values arrive in R3. | `ml/data/external/` | Richa, Saloni | G0 (schemas), G1 (v0 values) |
| C6 | Rule trace and explanations: Saloni's engines emit a rule_trace. Richa's explain() turns it into plain sentences. | `ml/src/evaluation/explainability.py, ml/data/external/explanation_templates.yaml` | Saloni, Richa | G2 |
| C7 | Evaluation and run records: Richa's metric functions, Saloni's run record format. Both feed the model card. | `ml/src/evaluation/metrics.py, models_artifacts/runs/` | Richa, Saloni | G3 |

**C1 decisions to lock in G0**

1. Request gains an optional sowing_date (YYYY-MM-DD). Backend adds Field.sowingDate. Frontend collects it.
2. Each schedule[] item gains fertilizer_type. Top-level recommendation.fertilizer_type is the primary product, and its quantity_kg_per_acre is that product's total across the schedule.
3. Response gains cost { estimated_cost_inr_per_acre, previous_cost_inr_per_acre (nullable), saving_inr_per_acre (nullable) } and impact { over_application_reduction_pct (nullable) }. Nulls mean no history was logged, never a made-up baseline.
4. Units: kg/acre in the API. Soil N, P, K in kg/ha. Organic carbon and moisture in percent. The ML service converts internally (1 ha = 2.4711 acre).
5. crop_type and growth_stage are ids from GET /reference/crops, for example wheat and tillering.
6. Errors: 422 { detail: [...] } for invalid input. 503 { detail } when the model or reference data is unavailable. The backend maps these to 400 and 502 for the client.
7. model_version format: <model>-<semver>+rules-<hash8>, so a result can be traced to both the model and the rule tables.

**C3 Recommendation object and errors**

```text
Recommendation {
  id, fieldId, soilTestId, cropType, growthStage,
  fertilizerType, quantityKgPerAcre,
  schedule: [{ stage, fertilizerType, quantityKgPerAcre, applyBy }],
  risk: { level: "low" | "medium" | "high", reason },
  topFactors: [string],
  cost: { estimatedCostPerAcre, previousCostPerAcre | null, savingPerAcre | null, savingTotal | null },
  impact: { overApplicationReductionPct | null },
  weatherStale: boolean,
  modelVersion, createdAt
}
Errors: { error: string, details?: [] }. Codes: 400 validation, 401, 403, 404 (also for other users' resources), 409 missing prerequisite, 502 ML unavailable, 503 weather unavailable.
```

**C4 Feature module interface**

```text
FEATURE_COLUMNS: list[str]            # classifier inputs, fixed order
CLASSIFIER_TARGET = "fertilizer_product_id"
request_to_record(req: dict) -> dict            # /predict request -> one flat record
build_features(records) -> pd.DataFrame          # same code for training and serving
rule_inputs(req: dict) -> dict                    # soil ratings, prior-usage nutrient credit, rain flags
load_training_frame(split: "train"|"val"|"test") -> pd.DataFrame
```

**C5 External table schemas**

```text
crops.csv                 crop_id,name_en,name_hi,dataset_label,season,source
growth_stages.csv         crop_id,stage_id,name_en,name_hi,order,das_start,das_end,source
crop_nutrient_norms.csv   crop_id,irrigation,n_kg_ha,p2o5_kg_ha,k2o_kg_ha,region,source,notes
split_schedule.csv        crop_id,stage_id,n_fraction,p_fraction,k_fraction        (fractions sum to 1 per crop)
fertilizer_products.csv   product_id,name,n_pct,p2o5_pct,k2o_pct,price_inr_per_kg,price_date,source
soil_test_ratings.csv     parameter,unit,low_below,high_above,source
agronomy_rules.yaml       soil-rating multipliers, credit window days, rain_hold_mm / rain_hold_days,
                          over_application_ratio_medium / _high, norm tolerance. Every key has a source comment.
```

**C6 Rule trace and explain()**

```text
rule_trace item: { rule_id, nutrient: "n"|"p"|"k"|null, value, threshold, effect, params: {} }
explain(features: dict, prediction: dict, rule_trace: list[dict], top_k: int = 3) -> list[str]
render_template(template_id: str, **params) -> str      # explanation_templates.yaml, en + hi
```

**C7 Evaluation functions and run record**

```text
evaluate_classifier(y_true, y_pred, y_proba=None, classes=None, groups=None, n_boot=1000, seed=42) -> dict
cv_summary(fold_scores: list[dict]) -> dict              # mean and std per metric
baseline_report(y_train, y_test) -> dict
norm_conformity(recs, norms, tol) -> dict                # share within tolerance + violators
per_slice(y_true, y_pred, slice_col) -> dict
run record (Saloni): { run_id, name, tags, git_sha, config_hash, dataset_hash, env, params, metrics, wall_clock_s }
```

**How to change a contract**

1. Propose the change in a docs-only PR to main titled docs: <contract> <change>.
2. Both owners of the contract approve it in the PR.
3. Merge to main, then both owners run git pull origin main --rebase on their branches the same day.
4. Update code, schemas and fixtures immediately. The contract tests fail if code and docs drift.

## 8. Step-by-step prompts

Run each prompt in Claude Code from the repo root, on your own branch, in order. Check the Done when line before you move on.

### Phase 0: Kickoff and contracts

#### D0. Verify your frontend environment

**Done when:** Lint and build pass and every stub route renders in the browser.

````text
Read AGENTS.md (root) and frontend/AGENTS.md. I am Darsh, owner of frontend/** on branch feature/darsh-frontend. Work only inside frontend/.
1. Confirm the branch and that it is rebased on origin/main.
2. In frontend/: cp .env.example .env, npm install, npm run lint, npm run build, then npm run dev (Vite on 5173). Open every route in the browser and confirm it renders its stub.
3. Note the Node version (CI uses 22).
Report any error. Fix only environment problems.
````

### Phase 1: Foundations in parallel

#### D1. Choose your direction and build your foundation

Unblocks D2, D11

**Done when:** frontend/DESIGN.md explains your direction in a few lines, the tokens exist, and a temporary /kit route shows your components at 390 px and 1280 px.

> Everything else in the frontend builds on this. The look is entirely your decision.

````text
Read frontend/AGENTS.md. I am choosing the visual direction myself. Do not impose one. Start by asking me what I have in mind, or offer three short contrasting directions with a one-paragraph rationale each (fit for farmers on low-end phones, a memorable identity, room for a standout 3D moment) and let me pick.

Once I have chosen:
1. Write frontend/DESIGN.md: the direction in a few lines, the palette, the type pairing, the spacing scale and the motion principles.
2. Produce the token set first: src/styles/tokens.css with --color-*, --font-*, --space-*, --radius-*, --shadow-*, --ease-* and --dur-*, mapped into tailwind.config.js. Components use tokens only.
3. Fonts: self-host woff2 (Fontsource), subset, font-display: swap, and make sure the family (or a paired fallback) has Devanagari glyphs, because the Hindi toggle comes later.
4. Build the components I will need in src/components/ui/: Button, Input, Select, Textarea, FormField (label, hint, error), Card, Badge, a risk badge for low, medium and high (colour, icon and text together), Skeleton, Toast, Modal, EmptyState. Every interactive component has hover, active, focus-visible, disabled and loading states, and touch targets of at least 44 px.
5. Add a temporary /kit route that shows all components; I remove it in D12.
Show me screenshots of /kit at 390 px and 1280 px.
````

#### D2. API layer, mock mode, shell and routing

Needs D1, J1 · Unblocks D3, D4, D5

**Done when:** With VITE_USE_MOCK=true every route navigates, the mobile menu works by keyboard, and there is no horizontal scroll at 320 px.

> You need docs/backend-api.md merged (Josh's J1) so the mock and the real API have the same shape.

````text
Read docs/backend-api.md (contract C3) and frontend/AGENTS.md. Build the plumbing. Layout and look are my decision (use my tokens and components from D1).

1. src/services/api.js stays the only place that talks to the backend: attach the bearer token, on a 401 call POST /auth/refresh once and retry the original request, otherwise log out; normalise errors to { status, message, details }.
2. src/services/endpoints.js with one function per endpoint in contract C3: auth, farms, fields, soil tests, fertilizer logs, weather, recommendations and reference.
3. src/services/mock/: an in-memory mock implementing the same functions with realistic data from docs/contract-fixtures/, switched on by VITE_USE_MOCK=true. Add VITE_USE_MOCK to .env.example. I must never be blocked on the backend.
4. Zustand: useUserStore (user, tokens, login, logout, hydrate from localStorage inside try and catch), useFarmStore, useRecommendationStore.
5. Routing in App.jsx: public routes (landing, login, register) and protected routes through a RequireAuth wrapper; a 404 page; an error boundary around each route.
6. A navigation shell of my design. If it collapses on mobile it needs a real off-canvas menu: focus trap, Escape closes, scroll lock, aria-expanded on the toggle, closes on route change. Include a skip-to-content link.
7. Dynamic document titles in the form "Page — KhetGPT".
Verify with VITE_USE_MOCK=true and show me the results.
````

#### D3. Sign up, log in, log out

**Integration gate G1** · Needs D2 · Integrates with J3

**Done when:** Auth works against the mock and against Josh's real endpoints, including refresh after the access token expires.

````text
Build the login and register screens (pages/Auth/). The design is mine. The API calls and rules:
- POST /auth/register { email, password, name, role: "FARMER" | "AGRONOMIST" } gives 201 { user, accessToken, refreshToken }; 409 means the email is taken.
- POST /auth/login { email, password } gives 200 { user, accessToken, refreshToken }; 401 means "Invalid email or password".
- POST /auth/logout { refreshToken }; GET /auth/me.
Must handle: inline validation, submit disabled while pending, input preserved on error, clear messages from the API, a role choice on register, redirect back to the page the user came from, and logout available from the shell.
Develop against the mock (VITE_USE_MOCK=true), then switch to Josh's real auth (J3) with VITE_USE_MOCK=false and test register, login, refresh after the access token expires (set JWT_ACCESS_TTL=30s locally to prove it) and logout. Show me screenshots of both modes.
````

#### D4. First recommendation screen

**Integration gate G1** · Needs D2 · Integrates with J4, S2 · Unblocks D7, J4

**Done when:** For the seeded field, one button press shows a plan on screen, working against the mock and against Josh's J4 route with Saloni's ML mock.

> This is the frontend half of Gate G1. It proves the whole chain works before any real model exists.

````text
Build the first version of the recommendation screen. Layout and visual treatment are mine. The call:
POST /fields/:id/recommendations (body optional) gives 201 with:
Recommendation { id, fieldId, soilTestId, cropType, growthStage, fertilizerType, quantityKgPerAcre, schedule: [{ stage, fertilizerType, quantityKgPerAcre, applyBy }], risk: { level: "low"|"medium"|"high", reason }, topFactors: [string], cost: { estimatedCostPerAcre, previousCostPerAcre|null, savingPerAcre|null, savingTotal|null }, impact: { overApplicationReductionPct|null }, weatherStale, modelVersion, createdAt }
Errors: 409 means a soil test or crop is missing (the message says which), 502 means the recommendation service is unavailable.
Must show at minimum: the product and quantity in kg/acre, the schedule (what, how much, when), the risk level with its reason, the top factors, and cost and saving when present. The model version can be small.
Must handle: a skeleton while loading (no spinner for under 300 ms), error with a Retry, and the 409 case with a link to fix it.
For Gate G1 a temporary way to trigger it for the seeded field is fine. Show me the screen at 390 px with data from the whole chain.
````

### Phase 2: Real data and real CRUD

#### D5. Farms and fields

**Integration gate G2** · Needs D2 · Integrates with J5 · Unblocks D6, J5

**Done when:** You can create, list and open farms and fields against the real backend, with optimistic updates that roll back on failure.

````text
Build farm and field management. Design is mine. The calls:
GET /farms (paginated), POST /farms { name }, GET /farms/:id, DELETE /farms/:id
GET /farms/:farmId/fields, POST /farms/:farmId/fields { name, areaAcres?, latitude?, longitude?, pincode? }
GET /fields/:id (includes latest soil test and latest recommendation), PATCH /fields/:id
Must have: a place to see farms with their fields; create farm; create field with a way to set coordinates (typing them, and a "use my location" button that handles a denied permission gracefully); a field view that shows the crop, stage, sowing date, latest soil test and latest recommendation with links onward. Optimistic UI for create and delete with a rollback and message on failure. Skeletons for lists and an empty state that shows the next action. Build against the mock, then Josh's J5.
````

#### D6. Soil input, crop selection and fertilizer log

**Integration gate G2** · Needs D5 · Integrates with J5, J6, R1 · Unblocks D10, J5

**Done when:** A user can save a soil test, choose crop, stage and sowing date, log past fertilizer, and reach Get recommendation. No crop, stage or fertilizer list lives in the frontend code.

> Check the units and labels against Richa's docs/data-dictionary.md. Crop and stage ids come from the reference API.

````text
Build the data entry flow (PRD FR3 to FR5). Design is mine. The calls:
POST /fields/:id/soil-tests { n, p, k, ph, organicCarbon, moisture, testedOn? } (n, p, k in kg/ha, organicCarbon and moisture in percent)
PATCH /fields/:id { cropType, growthStage, sowingDate }
POST and GET /fields/:id/fertilizer-logs { type, quantityKgPerAcre, appliedOn }
GET /reference/crops gives [{ id, nameEn, nameHi, stages: [{ id, nameEn, nameHi, order }] }]
GET /reference/soil-ratings gives low and high cut-offs per parameter
GET /reference/fertilizers gives products with names and ids
Must have: soil fields with plain-language help, units and valid ranges, plus a rating (low, medium, high) computed from /reference/soil-ratings, never from numbers in the UI; a crop and stage chooser filled from /reference/crops; a sowing date; a fertilizer log with product from /reference/fertilizers, quantity in kg/acre and a date that cannot be in the future, plus the list of past applications; a clear path to "Get recommendation". Until Richa's tables are merged the mock serves the reference lists, so leave no crop list in the code.
Must handle: inline validation, no double submit, input preserved on error. Test against the mock, then Josh's J5 and J6.
````

### Phase 3: Real recommendation

#### D7. The full recommendation screen

**Integration gate G3** · Needs D4 · Integrates with J8, S7, R12 · Unblocks D8, D9, J8

**Done when:** The three demo scenarios each render correctly against the real chain, with every case and state handled.

> This is the frontend half of Gate G3. The screen every judge will look at.

````text
Upgrade the recommendation screen for the real model. How it is laid out and presented is my decision. What it must communicate to a non-technical farmer, using the same Recommendation object as D4:
- what to apply, how much and when, with split doses visible, and any rain delay mentioned by the reasons,
- the risk level and what to do about it, understandable without colour,
- cost per acre, the previous cost, the saving per acre and the field total when area exists. When saving is null show a prompt to log previous fertilizer use instead of a number. When saving is negative explain that this plan costs more than recent use and why, using the top factors,
- the 2 to 3 reasons (topFactors) as readable sentences,
- the weather that was used, from GET /fields/:id/weather { temperatureC, humidityPct, rainfallMmForecast, fetchedAt, stale }, flagged when stale,
- the over-application reduction only when impact returns it,
- a way to keep or share the plan (for example a copy-text of the schedule or a printable view).
Handle every error and empty case. Run against the real chain (Saloni S7 and Josh J8) and show me the screen for the three scenarios in docs/demo-scenarios.md.
````

#### D8. History and trend

**Integration gate G3** · Needs D7 · Integrates with J8 · Unblocks J8

**Done when:** History pages through many rows, opens a past recommendation, and shows a trend with a text alternative.

````text
Build recommendation history and a trend view. Design is mine. The calls: GET /fields/:id/recommendations?page&limit gives { items, page, limit, total } newest first, and GET /recommendations/:id gives one Recommendation.
Must have: a list showing when, crop and stage, product, quantity, risk and saving; opening a past item; pagination; a trend of quantity and cost over time. NFR2 says lightweight, so avoid a heavy chart library: a hand-written SVG is fine. Whatever the chart looks like it needs labelled axes, an emphasised latest point and an accessible table alternative. Skeleton, empty and error states. Test with many rows from the mock.
````

### Phase 4: Packaging and standout

#### D9. The standout visualization

**Integration gate G4** · Needs D7 · Integrates with J6 · Unblocks D12

**Done when:** The scene runs smoothly on a throttled CPU, degrades to a text and CSS version, and the initial bundle did not grow.

> PRD feature 12 asks for an explorable 3D or animated view of nutrient balance using React Three Fiber and GSAP. The concept is yours.

````text
Load the threejs-r3f-mastery skill if you have it. Before writing code, propose two or three concepts for an explorable visualization of a field's nutrient balance and let me choose. The concept, look and interaction are mine.

Data you have: the soil test values (n, p, k in kg/ha, ph, organicCarbon and moisture in percent), the low and high cut-offs from GET /reference/soil-ratings, and the recommendation (product, quantities, risk). It should animate when the soil test or recommendation changes (GSAP with useGSAP so timelines are cleaned up by the hook).

Fixed by the project:
- Lazy-load the scene (React.lazy with Suspense and a real skeleton). The initial JS bundle must not grow.
- Canvas: dpr={[1, 1.5]} and frameloop="demand" (render on change), no realtime shadows, simple or instanced geometry, dispose imperative geometries and materials, pause when the tab is hidden.
- Fallback: when WebGL is unavailable, on webglcontextlost, when prefers-reduced-motion is set, or on very low-end devices (navigator.hardwareConcurrency of 2 or less, or deviceMemory of 2 or less), show a lightweight 2D version with the same numbers.
- Accessibility: the same values are available as text under the scene, and the scene can be operated without a mouse.
Show me the bundle report before and after and a performance profile on a throttled CPU.
````

#### D10. English and Hindi toggle

**Integration gate G4** · Needs D6 · Integrates with R1 · Unblocks D12

**Done when:** Every screen works in both languages with no clipped text at 320 px, and the choice is remembered.

````text
Add the English and Hindi toggle (PRD feature 11) without a heavy library: src/i18n/en.js and hi.js, a useT() hook backed by a Zustand language store persisted in localStorage (in try and catch), the lang attribute on <html> kept in sync, and the Devanagari font loaded only when Hindi is selected. Translate all UI text: labels, errors, empty states, risk labels. Crop, stage and fertilizer names come from the reference API (nameHi from Richa's tables). The explanation sentences returned by the ML service stay English in v1: show a small note when Hindi is on and leave a TODO(i18n) for a later template-id based approach. Check the layout with long Hindi strings at 320 px and check that numbers and dates format correctly.
````

#### D11. Landing page and brand finish

**Integration gate G4** · Needs D1 · Unblocks D12

**Done when:** The landing page, favicon set, share tags and error pages exist and match your direction.

````text
Build the landing page and the finishing pieces. The message, structure, tone, imagery and motion are mine. Fixed: real copy only (no invented statistics, testimonials or logos), everything visible without scrolling or waiting for an animation, motion respects prefers-reduced-motion, and it is fast on a phone. Add: a favicon set (favicon.ico, icon.svg, a 180 px apple-touch icon and a manifest), Open Graph and Twitter tags with a 1200 by 630 image under 1 MB and an absolute URL, robots.txt and sitemap.xml, and custom 404 and 500 pages in the same style. If time remains, PRD features 14 (field map picker), 15 (voice input) or 16 (assistant) are open for you to propose. Raise it with the team first because 14 and 16 need backend work.
````

### Phase 5: Demo hardening

#### D12. Launch checks, offline fallback and demo path

**Integration gate G5** · Needs D9, D10, D11 · Integrates with R12

**Done when:** Every check passes, a mock build runs with no backend, and frontend/DEMO.md describes the demo path with screenshots.

````text
Load the launch-readiness-polisher skill if you have it. Pre-launch pass. Run and fix:
- zero horizontal scroll at 320, 360, 390, 768, 1024, 1280 and 1440 px (document.documentElement.scrollWidth === clientWidth); content still reflows at 200 percent zoom,
- touch targets of at least 44 px and a keyboard-only run through signup to recommendation,
- Lighthouse on a throttled mobile profile (targets: Performance 90 or more, Accessibility 95 or more, Best Practices 100, SEO 100),
- report the initial JS size (gzip) and confirm the 3D chunk is lazy,
- clean console, remove the /kit route, console.log calls and commented-out code.
Offline-friendly mode (PRD feature 13): cache the last recommendation and the reference lists (localStorage or IndexedDB, in try and catch) and show them with an offline notice.
Fallback build: VITE_USE_MOCK=true npm run build must produce a bundle that runs with no backend, using the fixtures, so the demo survives a network failure.
Write frontend/DEMO.md with the 2 minute demo path and a screenshot of each screen.
````

## 9. Definition of done

- [ ] All backend calls go through src/services/. No crop, stage, fertilizer or rating list in the code.
- [ ] Every screen has loading, empty, error and success states.
- [ ] No horizontal scroll from 320 px. Keyboard-only run works. Reduced motion respected.
- [ ] Initial bundle stays small and the 3D chunk is lazy.
- [ ] Risk is readable without colour. Hindi fits without clipping.
- [ ] The mock build runs with no backend.
- [ ] Lint and build pass in CI. No console.log or commented-out code committed.

## 10. Daily sync questions

- Josh: which endpoint or field are you waiting on? Did any response shape surprise you?
- Saloni: are the risk reasons and factors readable on screen? Any new field in the recommendation?
- Richa: are crop and stage names, units and Hindi names final?

## 11. Ground rules for everyone

- Work on your own branch. Never commit to main directly, except docs-only contract PRs that both owners have approved.
- Stay inside your folders (root AGENTS.md). If you need a change in someone else's folder, ask them or record it in the contract doc.
- Commit messages use the form <area>: <what changed>, for example ml: add dosage engine. No AI co-author trailers and no "Generated with" lines in commits or PR descriptions.
- Never commit .env, raw datasets, models_artifacts/, node_modules or .venv. Add new variables to that service's .env.example.
- Before a PR: git pull origin main --rebase, lint and tests pass, and the PR description states the change, the reason and how to test it. UI PRs include screenshots. One teammate reviews before merge.
- Open a PR only when a feature works end to end. Small, focused commits, one logical change each.
- Run every prompt in Claude Code from the repo root on your own branch. Each prompt begins by reading the project context files.
- Reference numbers (crop norms, prices, thresholds) live in data or config files, never in application code.
