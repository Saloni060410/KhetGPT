# Richa — KhetGPT Prompt Pack

**Role:** AI/ML data: datasets, features, weather, evaluation  
**Branch:** `feature/richa-ml-data`  
**Repo:** https://github.com/Saloni060410/KhetGPT.git

Smart India Hackathon, PSAI01: Sustainable Fertilizer Usage Optimizer. This pack is generated from one shared plan, so the four packs always agree on steps, contracts and integration points.

## 1. Your role

You own the truth the model stands on: which data we use, the ICAR-based reference tables, the feature code, weather features, and the evidence that the results are trustworthy.

Saloni's model is only as good as what you hand her. Two things are non-negotiable and everyone waits on them: the vocabulary and table schemas in the first phase, and the feature module in the second. Which datasets we use is your decision.

**You own**

- `ml/data/**` (raw, processed, external, README.md)
- `ml/src/data_pipeline/` (ingest.py, clean.py, feature_engineering.py, build_dataset.py)
- `ml/src/weather/` (weather_client.py)
- `ml/src/evaluation/` (metrics.py, explainability.py)
- `ml/notebooks/`
- `docs/data-dictionary.md, docs/evaluation-report.md, docs/demo-scenarios.md`

**Hands off (owned by someone else)**

- `ml/src/models/ and ml/src/api/` (Saloni)
- `backend/** and docker-compose.yml` (Josh)
- `frontend/**` (Darsh)

### Your call, and what is fixed

**You decide**

- Which datasets we use, and how many. Search the net yourself, combine sources if it helps, and reject anything that is not good enough.
- Which 4 to 6 crops and which demo region (confirm with the team in R1, then it is fixed).
- How you clean, encode and split the data, as long as the outputs match C4 and C5.
- Which sources you cite for norms, prices and cut-offs, as long as every value has one.
- Notebook style, charts and how you present findings.

**Non-negotiable**

- Every dataset has documented provenance: URL, licence, date retrieved, sha256, rows, columns, units.
- Anything paid, unlicensed or of unclear origin is out. Synthetic data is allowed only if it is labelled as synthetic everywhere it is used.
- The interfaces other people code against exist on time: C5 schemas in R1, C5 v0 values in R3, C4 in R6.
- The data has to be able to answer the product question: soil N, P, K, pH, organic carbon, moisture, crop, growth stage and weather in, fertilizer product and, ideally, applied quantity out. Say clearly what each dataset can and cannot support.
- No raw data or secrets in git. Reproducible from one command.

**How to judge a dataset**

- Relevance: Indian crops and conditions, our 4 to 6 crops covered.
- Labels: does it give a fertilizer product, a quantity, or only a crop? Quantity labels are rare and valuable.
- Units: N, P, K in kg/ha, or clearly convertible. Say so if not.
- Size and honesty: row count, duplicates, and whether it looks real or synthetic.
- Licence: can we use it in a hackathon project and cite it?
- Independence: rows that are not near-copies of each other, so the test set means something.

## 2. Initialize your system

**1. Check your machine**

```bash
python3 --version   # 3.11 or newer
git --version
```

Expected: Python 3.11+. No API keys are needed: weather comes from Open-Meteo.

**2. Clone and switch to your branch**

```bash
git clone https://github.com/Saloni060410/KhetGPT.git
cd KhetGPT
git checkout feature/richa-ml-data
git pull origin main --rebase
```

Expected: Branch feature/richa-ml-data, rebased on the latest main.

**3. Create the environment**

```bash
cd ml
python3.11 -m venv .venv
source .venv/bin/activate      # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m ipykernel install --user --name khetgpt
```

Expected: Jupyter, pandas, scikit-learn, xgboost and httpx are installed. The khetgpt kernel appears in VS Code and Jupyter.

**4. Verify the scaffold**

```bash
pytest -q
ruff check .
ls data/raw data/processed data/external
```

Expected: 2 tests pass, ruff clean. data/raw and data/processed are empty apart from .gitkeep. They are gitignored, so raw files never enter git.

**5. Optional: dataset download tools**

```bash
pip install kaggle      # dev tool, do not add to requirements.txt
# put your token in ~/.kaggle/kaggle.json (Kaggle account settings)
```

Expected: Only needed if you pick Kaggle datasets. Manual download works too.

**6. Open Claude Code**

```bash
cd ..            # repo root
claude
```

Expected: Run every prompt below from the repo root.

## 3. Features you implement

| PRD reference | Feature | Steps |
|---|---|---|
| Data 6 / PRD section 6 | Dataset selection, cleaning, validation gates, provenance | R2, R4, R5 |
| NFR5 | Crop, region and fertilizer reference data in files, not code | R1, R3 |
| FR6 / Must-have 3 | Weather features from Open-Meteo (forecast and historical) | R7 |
| Should-have 10 | Plain-language 'why this recommendation' | R9 |
| Success metrics | Model evaluation, error analysis, impact estimate for the judges | R8, R10 |
| Should-have 11 | Hindi names and template sentences that the UI can translate | R1, R9 |
| Demo | Three realistic scenarios usable by ML, backend seed and frontend | R12 |
| Standards | Reproducibility, leakage checks, dataset versioning | R4, R6, R11 |

## 4. Who you depend on, and who depends on you

Hard need = you cannot finish the step without it. Integrates with = you can start on a mock or fixture, but the step is only complete once the other person's work is merged and you have tested against it. Pairs with = you finish it together.

| Step | Blocked by (hard) | Pairs with | Integrates with | Unblocks | Gate |
|---|---|---|---|---|---|
| **R0** Verify your ML environment | none | none | none | none |  |
| **R1** Decide crops and region, publish vocabularies and table schemas | none | none | none | R2, R3, R4, S2, J6, D6, D10 | G0 |
| **R2** Find, judge and choose your datasets | R1 | none | none | R4 | G1 |
| **R3** Sourced norm, split, product and rule tables | R1 | none | none | S4, S5, S6, R6, R9, R12 | G1 |
| **R4** Cleaning pipeline with validation gates | R2, R1 | none | none | S3, R5, R6 | G1 |
| **R5** EDA and leakage review | R4 | none | none | S3 |  |
| **R6** Shared feature module and dataset build | R4, R3 | none | none | S3, S7, R7, R8, R11, R13 | G2 |
| **R7** Open-Meteo weather client and weather features | R6 | none | J7 | J7 |  |
| **R8** Evaluation metrics module | R6 | none | S3 | S9, R10, S3 | G3 |
| **R9** Explanation templates and explain() | R3 | none | S4 | S7, S4, S5 | G3 |
| **R12** Three demo scenarios | R3 | none | S7 | J11, S9, S12, D7, D12 | G3 |
| **R10** Error analysis and impact estimate for the judges | S3, R8, S9 | none | none | S11 | G4 |
| **R11** Reproducible data commands and final docs | R6 | none | none | none | G5 |
| **R13** Stretch: satellite soil reference for fields without a soil test | R6 | none | none | none |  |

## 5. Team timeline and integration gates

- **Phase 0: Kickoff and contracts.** Everyone sets up, and the shared contracts are agreed and merged before anyone builds against them.
- **Phase 1: Foundations in parallel.** Each person builds their base layer against contracts and fixtures. Nobody waits for anybody.
- **Phase 2: Real data and real CRUD.** Real datasets and tables land, the model trains, the API stores real farm data, forms save it.
- **Phase 3: Real recommendation.** Mock mode is switched off. Data, model, backend and UI produce one real recommendation.
- **Phase 4: Packaging and standout.** One-command stack, CI green, the 3D feature, Hindi toggle, evaluation evidence.
- **Phase 5: Demo hardening.** Rehearse, freeze, write the model card, prepare fallbacks.

### G0 — Contracts locked (end of Phase 0)

C1 (ML predict API), C3 (backend REST API), fixtures and the vocabulary files are merged to main. Nobody changes them without the change protocol.

**Your steps at this gate:** R1 (Decide crops and region, publish vocabularies and table schemas)

**Who delivers what**

- Saloni + Josh: docs/api-contract.md v1.0 and docs/contract-fixtures/ merged (S1, J1)
- Josh + Darsh: docs/backend-api.md merged (J1)
- Richa: crops.csv, growth_stages.csv and header-only C5 tables merged (R1)
- Everyone: dev environment running on their own branch (S0, R0, J0, D0)

**Acceptance test:** Every teammate can read the fixtures and say what each endpoint returns. Josh, Saloni and Darsh have all approved the contract PRs.

**If it slips:** Do not start Phase 1 code that depends on an unmerged contract. Build only environment and non-contract work until it merges.

### G1 — Mock vertical slice (end of Phase 1)

One request travels the whole chain with fake numbers: frontend, backend, database and the ML service in mock mode.

**Your steps at this gate:** R2 (Find, judge and choose your datasets), R3 (Sourced norm, split, product and rule tables), R4 (Cleaning pipeline with validation gates)

**Who delivers what**

- Saloni: ML service mock mode plus reference endpoints on main (S2)
- Josh: seeded database, real auth and the thin recommendation route (J2, J3, J4)
- Darsh: shell, auth pages and a first recommendation screen (D2, D3, D4)
- Richa: raw data acquired, norms and rules v0 for two crops, cleaning pipeline (R2, R3, R4)

**Acceptance test:** Log in as the seeded farmer, open the seeded field, press Get recommendation, see a mocked plan on screen, and find the stored row in Postgres.

**If it slips:** Darsh runs with VITE_USE_MOCK=true. Josh stubs the ML call with the fixture. Neither blocks on the other.

### G2 — Data to model handoff (end of Phase 2)

Richa's dataset and feature module are consumed by Saloni's trainer, the dosage engine runs on Richa's tables, and the app stores real farm data.

**Your steps at this gate:** R6 (Shared feature module and dataset build)

**Who delivers what**

- Richa: feature module, dataset build and frozen test split on main (R6)
- Saloni: first trained model v0.1.0 in the registry (S3) and a passing dosage engine (S4)
- Josh: CRUD, reference proxy and weather route on main (J5, J6, J7)
- Darsh: farm, field, soil, crop and fertilizer log screens saving real data (D5, D6)

**Acceptance test:** python -m src.models.train runs from a clean checkout on Richa's dataset and prints a comparison table. Darsh creates a farm, field and soil test in the UI and Josh's database holds them.

**If it slips:** Saloni trains on sample_train.csv. Dosage tests use the v0 tables. The UI keeps using the mock for anything unmerged.

### G3 — Real end to end (end of Phase 3)

Mock mode is off. A real model, real weather and real stored data produce the recommendation the user sees.

**Your steps at this gate:** R8 (Evaluation metrics module), R9 (Explanation templates and explain()), R12 (Three demo scenarios)

**Who delivers what**

- Saloni: predict pipeline in real mode with risk and cost (S5, S6, S7, S8)
- Richa: metrics, explanation templates, demo scenarios (R8, R9, R12)
- Josh: full recommendation orchestration and history (J8)
- Darsh: full recommendation screen and history (D7, D8)

**Acceptance test:** Signup, farm, field, soil test, crop and stage, Get recommendation. The result shows a real model_version, schedule with dates, risk, cost, factors. History shows it afterwards.

**If it slips:** Ship G3 with PREDICT_MODE=mock and label it in the UI as sample output. Do not hide that it is a mock.

### G4 — One-command stack (end of Phase 4)

docker compose up brings up Postgres, ML and backend healthy from a clean clone. CI is green. The standout UI features work on the real stack.

**Your steps at this gate:** R10 (Error analysis and impact estimate for the judges)

**Who delivers what**

- Josh: compose and CI (J9), hardening (J10)
- Saloni: ML image, artifact strategy, sanity gate, final test evaluation (S9, S10)
- Richa: evaluation report with impact estimate (R10)
- Darsh: 3D visualization, language toggle, landing (D9, D10, D11)

**Acceptance test:** A teammate who has never run the project clones it, follows the README and reaches a working recommendation in under 15 minutes.

**If it slips:** Frontend runs from npm run dev against the compose stack. Ship the standout feature only if it meets the performance contract.

### G5 — Demo freeze (end of Phase 5)

Rehearsed on two machines. Fallbacks work. Model card and evaluation report are written. main is tagged.

**Your steps at this gate:** R11 (Reproducible data commands and final docs)

**Who delivers what**

- Saloni: model card and demo readiness (S11, S12)
- Josh: demo seed and reset (J11)
- Darsh: launch pass and offline fallback build (D12)
- Richa: reproducible data commands and docs (R11)

**Acceptance test:** Full demo run on two laptops, once with internet and once with mock fallbacks. The three demo scenarios behave as documented in docs/demo-scenarios.md.

**If it slips:** Cut features, never the rehearsal. Anything unfinished is removed from the demo path, not left half-working.

## 6. Contracts you share with the team

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

## 7. Step-by-step prompts

Run each prompt in Claude Code from the repo root, on your own branch, in order. Check the Done when line before you move on.

### Phase 0: Kickoff and contracts

#### R0. Verify your ML environment

**Done when:** pytest shows 2 passed, ruff is clean and the khetgpt kernel opens a notebook.

````text
Read AGENTS.md (root), ml/AGENTS.md and docs/PRD.md sections 5, 6 and 11. I am Richa, owner of ml/data, ml/src/data_pipeline, ml/src/weather, ml/src/evaluation and ml/notebooks on branch feature/richa-ml-data. Work only inside those.

1. Confirm the branch and that it is rebased on origin/main.
2. In ml/, activate .venv (Python 3.11), pip install -r requirements.txt, run pytest -q and ruff check .
3. Confirm a Jupyter notebook can be created and the khetgpt kernel is available.
4. Summarise, in five lines, what ml/data/README.md and ml/AGENTS.md ask of me.
Fix only environment problems. Show me the outputs.
````

#### R1. Decide crops and region, publish vocabularies and table schemas

**Integration gate G0** · Unblocks R2, R3, R4, S2, J6, D6, D10

**Done when:** A PR to main is merged with crops.csv, growth_stages.csv and header-only versions of every other C5 table. Saloni, Josh and Darsh have all seen it.

> Everyone uses your crop and stage ids: the API, the database, the UI. Do this first and merge it fast.

````text
Read docs/PRD.md sections 1, 5, 6 and 11, ml/AGENTS.md and docs/data-dictionary.md. The PRD leaves the target crops and region open. We decide now because every service uses these ids.

1. Ask me the two open questions first if I have not answered them: which 4 to 6 crops (a sensible starting proposal is wheat, rice, maize, cotton, sugarcane and one pulse) and which demo region (state and district).
2. Create ml/data/external/crops.csv (crop_id, name_en, name_hi, dataset_label, season, source) and growth_stages.csv (crop_id, stage_id, name_en, name_hi, order, das_start, das_end, source). Use snake_case ids. das_start and das_end are days after sowing. Fill values only from ICAR or state agriculture university material and cite it in source. Where you cannot find a value write TODO(data) in the cell instead of inventing it. Leave dataset_label empty until datasets are chosen in R2.
3. In the same PR add header-only versions, plus one example row each, of the other C5 tables: crop_nutrient_norms.csv, split_schedule.csv, fertilizer_products.csv, soil_test_ratings.csv and agronomy_rules.yaml. Saloni codes against these headers, so they must match the C5 schema in the pack exactly.
4. Update docs/data-dictionary.md with the columns, units and allowed values of every file.
Open the PR against main (docs and data files only, no code).
````

### Phase 1: Foundations in parallel

#### R2. Find, judge and choose your datasets

**Integration gate G1** · Needs R1 · Unblocks R4

**Done when:** ml/data/README.md and ml/data/external/dataset_manifest.json describe every chosen dataset, and a short decision log explains what was rejected and why.

> Nobody hands you a dataset here. Finding good data is the job. Take the time to look properly, then commit to a choice.

````text
Read ml/data/README.md, docs/PRD.md section 6 and .gitignore (raw/ and processed/ are ignored). Help me find and judge datasets for this product. I make the decisions, you do the searching and the checking.

What the product needs: soil N, P, K, pH, organic carbon, moisture, crop, growth stage and weather in; fertilizer product and, ideally, applied quantity out, for Indian conditions and our chosen crops.

1. Search the web for candidate datasets. Look at more than one kind: labelled fertilizer recommendation tables, Soil Health Card style soil data, crop response or yield-with-fertilizer data, published research datasets with kg/ha quantities, and government open data. Combining several sources is fine.
2. For each candidate, fetch what you can and record: URL, licence and terms, date, rows, columns, units, crops covered, whether it has product labels, quantity labels, or neither, whether it looks real or synthetic, and how many rows are near-duplicates. If something needs a paid subscription or has no clear licence, reject it and say so.
3. Score each candidate against these criteria: relevance to our crops, label type, units, size and honesty, licence, and row independence. Give me a ranked shortlist and a recommendation, and wait for my choice before downloading anything.
4. After I choose: download to ml/data/raw/ (never commit raw files), write src/data_pipeline/ingest.py to verify each raw file against ml/data/external/dataset_manifest.json (sha256, row count, column names) and fail loudly if a file is missing or changed, and commit the manifest, not the data.
5. Update ml/data/README.md with, for every dataset, the exact URL, licence, date retrieved, sha256, rows, columns, units and what it is used for. State plainly which datasets are small or synthetic, and add a Decision log section listing what we rejected and why.
Show me the shortlist first, then the manifest and the ingest output.
````

#### R3. Sourced norm, split, product and rule tables

**Integration gate G1** · Needs R1 · Unblocks S4, S5, S6, R6, R9, R12

**Done when:** tests/test_reference_tables.py passes, wheat and rice v0 is merged to main, and the values with their sources are reviewed by a teammate.

> Saloni's dosage engine (S4) is blocked on this. Push a v0 for two crops the same day, then complete the rest.

````text
Fill the C5 tables with sourced values. Priority: deliver a v0 for two crops first and push it to main the same day, because Saloni's dosage engine (S4) is blocked on it. Then complete the remaining crops.

- crop_nutrient_norms.csv: N, P2O5, K2O in kg/ha per crop and irrigation type. Find authoritative sources yourself (ICAR crop production guides, ICAR institute bulletins, state agriculture university package of practices). Cite the exact document in the source column. Treat any number quoted from a blog or a summary as unverified until you find the primary document.
- split_schedule.csv: fractions per stage that sum to 1 per nutrient per crop (for example how much N goes basal and how much at each top-dress).
- fertilizer_products.csv: urea, DAP, MOP, SSP and every complex grade that appears in the datasets you chose, with N, P2O5 and K2O percentages and a current retail price in INR/kg with price_date and source (Department of Fertilizers or state maximum retail price). Never guess a price; leave TODO(data).
- soil_test_ratings.csv: the low and high cut-offs Soil Health Cards use for available N, P and K (kg/ha), organic carbon (percent) and pH bands. Find the official guideline and cite it.
- agronomy_rules.yaml: soil-rating multipliers (low, medium, high), credit window days for previous applications, rain_hold_mm and rain_hold_days, over_application_ratio_medium and _high, and the norm tolerance for the sanity test. Every key gets a comment with its source or the words "team assumption".

Add tests/test_reference_tables.py checking: every crop in crops.csv has norms and split rows, split fractions sum to 1, no negative numbers, product percentages are at most 100, and every source cell is non-empty. Show me the test output and a table of the values with their sources so a teammate can review them.
````

#### R4. Cleaning pipeline with validation gates

**Integration gate G1** · Needs R2, R1 · Unblocks S3, R5, R6

**Done when:** clean.csv and validation_report.json exist, a violation fails the run, and a sample_train.csv of at most 200 rows is on main.

````text
Read ml/AGENTS.md and the data validation gates in the ML standards (section 6). Implement src/data_pipeline/clean.py:

1. Load the raw files through ingest.py, harmonise column names to snake_case, map crop labels to our crop_id (fill the dataset_label column in crops.csv and add crop_aliases.csv if labels use different spellings) and fertilizer labels to product ids from fertilizer_products.csv. Log every dropped or renamed value.
2. Validate against a schema (add pandera to requirements.txt, pinned. That file is shared with Saloni, so append one line only): dtypes, allowed categories, ranges (pH 0 to 14, moisture 0 to 100, non-negative N, P and K), no duplicate rows, class balance report, missingness per column and row count against the manifest. Any violation must fail the run.
3. Unit reconciliation: write down in docs/data-dictionary.md the unit and scale of N, P and K in each chosen dataset and how, or whether, they map to the kg/ha used by the API and by Soil Health Card ratings. If a mapping is not defensible, do not fake one. Document the assumption and flag it as a limitation.
4. Write the validated table to ml/data/processed/clean.csv and a validation_report.json next to it (processed/ is gitignored). Also commit a sample of at most 200 rows as ml/data/processed/sample_train.csv by adding !ml/data/processed/sample_*.csv to .gitignore in the same PR, so Saloni can start without downloading anything.
Show me the validation report and the class balance.
````

### Phase 2: Real data and real CRUD

#### R5. EDA and leakage review

Needs R4 · Unblocks S3

**Done when:** notebooks/EDA.ipynb runs top to bottom and ml/data/EDA_FINDINGS.md (one page) tells Saloni what the data can support.

````text
Load the eda-autoprofiler skill if you have it. Create notebooks/EDA.ipynb on clean.csv: dtypes, cardinality, missingness, distributions per crop and per fertilizer, correlation and collinearity, target relationships, duplicates that would straddle the future train and test split, group structure (are rows independent?), and leakage red flags (features that nearly determine the label, anything that looks too good). Finish with a short section called "What this data can and cannot support": label balance, whether accuracy above the majority baseline is even plausible with this row count, and a recommendation for Saloni on model families, the CV scheme and whether to merge rare classes. Export the conclusions to ml/data/EDA_FINDINGS.md (one page at most). The notebook is exploration only: nothing under src/ may import from it. Clear notebook outputs before committing.
````

#### R6. Shared feature module and dataset build

**Integration gate G2** · Needs R4, R3 · Unblocks S3, S7, R7, R8, R11, R13

**Done when:** tests/test_feature_engineering.py parity test passes, train.csv has train, val and test splits, and dataset_manifest.json has the dataset version. PR is merged to main.

> Saloni's trainer (S3) and her predict pipeline (S7) import this. Open the PR into main as soon as the parity test passes.

````text
Implement the shared feature module, contract C4, in src/data_pipeline/feature_engineering.py and src/data_pipeline/build_dataset.py.

- FEATURE_COLUMNS in a fixed order, and CLASSIFIER_TARGET = "fertilizer_product_id".
- request_to_record(req: dict) -> dict: flatten a /predict request (contract C1) into one record: soil values, weather, crop_id, stage ordinal from growth_stages.csv and soil ratings via soil_test_ratings.csv.
- build_features(records) -> DataFrame: pure and deterministic, using fixed vocabularies from crops.csv so serving can never produce different columns than training.
- rule_inputs(req) -> dict: soil ratings, nutrient credit from previous_fertilizer_usage and weather flags (rain hold), for Saloni's dosage and risk engines. Prior-usage features are not classifier inputs unless our chosen datasets contain them.
- load_training_frame(split) reads ml/data/processed/train.csv, which has a split column.
- build_dataset.py creates train.csv with seed 42: a stratified split by fertilizer label into train, val and test (70, 15, 15), group-aware if a group exists, de-duplicated across splits. The test row ids are frozen in ml/data/external/test_ids.json and never regenerated silently.
- Record the dataset version in ml/data/external/dataset_manifest.json: row counts per split, content hash and feature schema hash.

Tests in tests/test_feature_engineering.py: a parity test that feeds the same record through the training path and the request path and asserts identical features, an unknown crop raises a clear error, and there are no NaNs. Show me the head of train.csv, the split sizes and the manifest.
````

#### R7. Open-Meteo weather client and weather features

Needs R6 · Integrates with J7 · Unblocks J7

**Done when:** Mocked tests pass and one live call for the demo region matches the backend's keys and units for the same coordinates.

> At runtime the backend fetches weather and sends it in the /predict request (contract C1). Your client serves notebooks, tests, historical enrichment and demos.

````text
Implement src/weather/weather_client.py with Open-Meteo (no API key, use httpx):
- get_forecast(lat, lon, days=5) -> { temperature_c, humidity_pct, rainfall_mm_forecast }: same keys and meaning as the weather block in contract C1. Endpoint https://api.open-meteo.com/v1/forecast with current=temperature_2m,relative_humidity_2m and daily=precipitation_sum. Josh's backend/src/services/weatherService.js does the same at runtime.
- get_historical_climate(lat, lon, start, end) -> DataFrame of daily mean temperature, humidity and rainfall from https://archive-api.open-meteo.com/v1/archive, for enriching training rows with regional climatology if our datasets lack weather.
- File cache in ml/data/raw/weather_cache/ (gitignored), 5 second timeout, one retry, a typed WeatherError, and treat null rain values as 0.
- Add weather_features(weather, rules) to feature_engineering.py: a rain_hold flag from agronomy_rules.yaml.
Tests use a mocked httpx transport, no live calls in CI. Then make one live call for the demo region, compare it with the backend's output for the same coordinates, and tell Josh if keys or units differ.
````

### Phase 3: Real recommendation

#### R8. Evaluation metrics module

**Integration gate G3** · Needs R6 · Integrates with S3 · Unblocks S9, R10, S3

**Done when:** Tests on tiny synthetic arrays pass and the module's docstring documents every signature.

````text
Load the model-evaluation-suite skill if you have it. Implement src/evaluation/metrics.py, contract C7:
- evaluate_classifier(y_true, y_pred, y_proba=None, classes=None, groups=None, n_boot=1000, seed=42) -> dict with accuracy, balanced accuracy, macro-F1, MCC, per-class precision, recall and F1, the confusion matrix, bootstrap 95 percent intervals, and calibration (Brier score, ECE) when probabilities are given. JSON-serialisable.
- cv_summary(fold_scores) -> mean and std per metric.
- baseline_report(y_train, y_test) -> majority-class and stratified-random scores on the same split.
- norm_conformity(recs, norms, tol) -> share of recommendations whose nutrient totals are within tol of the ICAR norm times the soil multiplier, and the list of violators.
- per_slice(y_true, y_pred, slice_col) -> metrics by crop or soil rating.
Tests on tiny synthetic arrays with known answers. Document the function signatures at the top of the module because Saloni's trainer and sanity gate call them. Show me one evaluate_classifier output on a toy example.
````

#### R9. Explanation templates and explain()

**Integration gate G3** · Needs R3 · Integrates with S4 · Unblocks S7, S4, S5

**Done when:** explain() returns exactly top_k readable sentences for a hand-written rule_trace, and every template renders with sample params.

> Pair with Saloni so the rule_trace format matches on both sides before either of you merges.

````text
Implement src/evaluation/explainability.py and ml/data/external/explanation_templates.yaml (contract C6).
- explanation_templates.yaml: template id to English sentence with {placeholders}, for example "Soil nitrogen is low ({value} kg/ha, cut-off {threshold}), so the full nitrogen dose is applied." Add an hi: key for each so Darsh's Hindi toggle can use them later. Cover every rule_id Saloni's dosage engine emits (agree the list with her; start from soil_rating_multiplier, prior_credit, rain_hold, split_stage), each risk reason (over_use, under_use, low_organic_carbon, ph_out_of_band, runoff) and the product choice.
- render_template(template_id, **params) -> str; a missing id or param raises a clear error.
- explain(features, prediction, rule_trace, top_k=3) -> list[str]: rank rule_trace items by absolute effect on the nutrient dose, turn the top_k into sentences with the templates, and add one sentence for the product choice using XGBoost's native pred_contribs (booster.predict(dmatrix, pred_contribs=True)) for the top feature. No SHAP dependency. Sentences are plain language a farmer can read, with units, and never blame the farmer.
Tests: given a hand-written rule_trace, explain() returns exactly top_k readable sentences, and every template renders with sample params.
````

#### R12. Three demo scenarios

**Integration gate G3** · Needs R3 · Integrates with S7 · Unblocks J11, S9, S12, D7, D12

**Done when:** docs/demo-scenarios.md and docs/contract-fixtures/demo_scenarios.json are merged, and Saloni has run all three through /predict.

> Josh seeds these into the database (J11) and Darsh uses them for the demo and the fallback build (D12).

````text
Write docs/demo-scenarios.md: three realistic scenarios we will demo, each as a ready-to-use JSON payload for /predict (fits contract C1) and as farm, field, soil and log rows Josh can seed.
1. A wheat field with a history of over-application (high risk, clear saving).
2. A rice field with low soil nitrogen and heavy rain forecast (rain hold visible in the schedule).
3. A healthy maize field (low risk, small change).
Give coordinates in the demo region, plausible soil values with units, previous fertilizer logs with dates, and the expected qualitative outcome (product, risk level, direction of saving) that you verified by hand against the norm tables. Export the same data as docs/contract-fixtures/demo_scenarios.json. Ask Saloni to run them through /predict and reconcile any surprising output before the demo.
````

### Phase 4: Packaging and standout

#### R10. Error analysis and impact estimate for the judges

**Integration gate G4** · Needs S3, R8, S9 · Unblocks S11

**Done when:** docs/evaluation-report.md is written and Saloni has the numbers she needs for the model card.

````text
Write docs/evaluation-report.md, the judge-facing evidence (PRD section 10). Using Saloni's registry entries and your metrics module:
1. Model results: cross-validated and final-test metrics with 95 percent intervals next to the baselines, per crop; the confusion matrix; the worst errors inspected with a short explanation of why each happened; what the model cannot do (say so if the data is small or synthetic).
2. Rules-layer check: norm_conformity over a grid of soil and crop combinations; list any violation.
3. Impact estimate: cost and over-application saving per acre for the three demo scenarios, with every assumption written out (which previous-usage pattern, prices with date and source, area). Find and cite your own source for what a typical farmer applies today. Never present a made-up percentage. Label estimates as estimates.
4. notebooks/model_experiments.ipynb reading the run records under models_artifacts/runs/ for the comparison table.
Give Saloni the numbers she needs for the model card (S11).
````

#### R13. Stretch: satellite soil reference for fields without a soil test (stretch)

Needs R6

**Done when:** A client returns soil property estimates for a coordinate, with the caveat about what they do and do not mean documented.

````text
Only after everything else is done (PRD feature 14). Find a free global soil property service (SoilGrids is one option, or another you judge better) and write src/data_pipeline/soil_reference.py that returns estimated soil properties for a latitude and longitude. Document honestly which properties map to our inputs (pH and organic carbon do, available N, P and K in kg/ha usually do not) and what the UI must say to the user. This needs an endpoint from Josh and a screen from Darsh, so raise it with them before you build more.
````

### Phase 5: Demo hardening

#### R11. Reproducible data commands and final docs

**Integration gate G5** · Needs R6

**Done when:** On a fresh clone and fresh venv, one command rebuilds the dataset and prints its version, with no manual step left undocumented.

````text
Make the data side reproducible from a clean checkout.
1. One command, python -m src.data_pipeline.build_dataset --config configs/data.yaml, runs ingest, clean, features and split, and prints the dataset version.
2. Update ml/data/README.md (fetch instructions, licences, hashes), docs/data-dictionary.md (every column, unit, source and allowed value, including the API fields) and ml/data/external/dataset_manifest.json.
3. Add the data steps to the Commands list in ml/AGENTS.md.
4. Delete unused files and clear notebook outputs before committing.
5. Run everything in a fresh venv on a fresh clone. Report the time taken and any manual step still left.
````

## 8. Definition of done

- [ ] Every dataset in use has provenance, licence and hash in the README and manifest, and the reasons for rejected ones are logged.
- [ ] Every value in the C5 tables has a source, and a teammate reviewed the values.
- [ ] Training and serving use the same feature function, proven by the parity test.
- [ ] The test split is frozen and was never used for choosing anything.
- [ ] Nothing in git that should not be: no raw data, no secrets, no notebook outputs.
- [ ] The evaluation report states what the data cannot support.
- [ ] One command rebuilds the dataset from a clean checkout.

## 9. Daily sync questions

- Saloni: what did you need from me that was missing or misnamed? Is anything in C4 or C5 wrong for you?
- Josh: does the weather output of my client match your service's keys and units?
- Darsh: are the crop and stage names you show what the reference files say?

## 10. Ground rules for everyone

- Work on your own branch. Never commit to main directly, except docs-only contract PRs that both owners have approved.
- Stay inside your folders (root AGENTS.md). If you need a change in someone else's folder, ask them or record it in the contract doc.
- Commit messages use the form <area>: <what changed>, for example ml: add dosage engine. No AI co-author trailers and no "Generated with" lines in commits or PR descriptions.
- Never commit .env, raw datasets, models_artifacts/, node_modules or .venv. Add new variables to that service's .env.example.
- Before a PR: git pull origin main --rebase, lint and tests pass, and the PR description states the change, the reason and how to test it. UI PRs include screenshots. One teammate reviews before merge.
- Open a PR only when a feature works end to end. Small, focused commits, one logical change each.
- Run every prompt in Claude Code from the repo root on your own branch. Each prompt begins by reading the project context files.
- Reference numbers (crop norms, prices, thresholds) live in data or config files, never in application code.
