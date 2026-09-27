# Saloni's progress — ml/src/api, ml/src/engine, ml/src/models

Branch `feature/saloni-ml-core`. Last checked against `origin/feature/saloni-ml-core`: local
had 2 unpushed commits (S5 + this update) — push before telling anyone S5 is available.

Pack reference: `docs/prompt-packs/saloni.md`. Step ids below (S0, S1, ...) match that file.

## Done, and not blocked

- **S0 — environment.** Verified: venv, pinned deps, pytest, ruff, uvicorn boot. No fixes needed.
- **S1 — API contract review.** `docs/api-contract.md` reviewed against Richa's real tables (not
  just the fixtures), rewritten to v1.0, and merged to `main` via PR #1 (docs/contract-v1).
  Added: units table, a missing-data policy, optional `irrigation`, nullable `apply_by` +
  `timing_note`, `cost.breakdown` + `prices_as_of`, `explanation.data_notes`, `bag_size_kg`.
- **S2 — mock mode + reference endpoints.** `/recommend` and `/risk-score` mock mode reacts to
  the request (soil N, soil K, sowing date, rain, growth stage). `/reference/*` reads
  `data/external/` in real mode, 503s with a reason when a table or column is missing. 39 tests.
- **S4 — NPK dose calculator.** `src/engine/npk_calculator.py`: `compute_balance` (STCR, then
  reference dose + soil adjustment, else `ReferenceDataIncomplete`) and `to_products` (dated
  schedule, DAP/MOP/urea mapping, rain-hold delay). 23 golden tests, all passing.
- **S5 — cost and history comparison.** `src/engine/cost.py`: `estimate_cost`, `compare_to_history`
  (nulls when there's no usable logged history, saving can be negative, over-application
  reduction sums N+P2O5+K2O and clamps to 0), plus `cost_breakdown`/`prices_as_of` for contract
  C1. 13 tests, all passing. **One decision worth revisiting:** `agronomy_rules.yaml` has no
  dedicated "season window" key, so `compare_to_history` reuses `credit_window_days` (60 days)
  as an interim proxy — flagged in code and here, not silently assumed. A real crop season is
  100-150+ days, so this likely undercounts early-season applications (e.g. a wheat basal DAP
  dose applied at sowing, ~80+ days before a mid-season recommendation) until Richa adds a
  dedicated key. Ask her.
- **S6 — recommendation engine, real API mode is on.** `src/engine/recommendation_engine.py`
  wires request_to_record/build_features (Richa), `compute_balance`/`to_products` (S4), cost
  (S5) and `risk_analyzer.assess_recommendation`/`score_planned` (Richa's R8) into a full
  `RecommendResponse`/`RiskScoreResponse`. `PREDICT_MODE` now defaults to `real` in
  `.env.example` (mock stays available, e.g. for Darsh, by setting it locally). 12 new tests,
  165 passing overall (same 13 pre-existing environment-only failures, unchanged). p50 48ms /
  p95 69ms over 50 calls against the fixture — well inside NFR1's 3s.
  **One deliberate deviation from the literal S6 spec, documented in the module docstring:**
  the classifier is treated as optional, not a hard requirement. `to_products()` already
  deterministically and transparently picks every product from sourced PAU tables (DAP for P,
  MOP for K, urea for remaining N) — `ml/AGENTS.md` itself says "the model only refines the
  product choice." Making a missing classifier a hard 503 would mean `/recommend` can never
  succeed until S3's real training data exists, which defeats the point of building this now
  while that data is still unavailable. `/health` still reports `degraded` with a clear reason
  when no classifier is registered (surfaced for monitoring, not hidden), but `/recommend`
  still returns a complete, correct answer from the rule-based calculator alone. If its top-1
  guess disagrees with the calculator's own choice, the calculator wins and the disagreement
  is recorded in `rule_trace` and `explanation.data_notes` — never silently dropped.
  **Also standing in for Richa's R10 (not built yet):** `explanation.top_factors` falls back to
  the first two `rule_trace` effects as plain sentences (clearly a lesser-quality placeholder)
  until her real `explain()` exists — the code tries to import it and catches any failure, so
  swapping it in later needs no change here.
  **Tested against a locally-run fallback classifier** (trained on the dev-fallback sample,
  same as S3 — not committed, per the same reasoning as before) to exercise the
  classifier-comparison path; the committed tests otherwise run with no model registered,
  which is the real current state of the repo.

## Done, and not blocked (continued)

- **S3 — product classifier, closed.** Explicit product decision (2026-09-27): the real
  99-row Kaggle file is not being waited on any longer. `fertilizer_prediction_synthetic.csv`
  **is** this project's raw training data now, not a train-only supplement bolted onto an
  assumed real file — see "Synthetic-as-raw-data policy" below for what changed to make that
  actually true end to end.
  **Model comparison (16 candidates + 2 baselines, identical 5-fold CV, `sample_weight`
  balanced or native `class_weight` throughout):**
  - Round 1 (6): dummy majority/stratified, `logistic_regression`, 3 XGBoost variants.
    XGBoost's original hyperparameters (3 estimators, depth 3 — sized for the old 48-row
    fallback) underfit the new 2,800-row set; relaxing to 200 estimators / depth 5 /
    `learning_rate 0.1` clearly helped (controlled before/after comparison, not a guess).
  - Round 2 (10 more): `random_forest` (3 depth/tree-count variants), `extra_trees`,
    `gradient_boosting`, `hist_gradient_boosting`, `knn`, `linear_svm`, `gaussian_nb`, plus a
    stratified-dummy recheck.
  - **Winner: `random_forest`**, 150 estimators, max_depth 6, `class_weight: balanced_subsample`
    — beat every other candidate on macro-F1 and MCC, and did it without the sharp
    accuracy-vs-fairness trade-off `logistic_regression`/`gaussian_nb`/`linear_svm` made trying
    the same imbalance. Shallower/fewer trees beat deeper/more on every metric that matters
    here — more capacity was not better at this dataset size. Locked in as `candidate` in
    `configs/train.yaml` (`xgboost`'s config also carries the round-1 fix, kept as a documented
    runner-up).
  - Considered and rejected: using `data/processed/sample_train.csv` as a second, "independent"
    validation set alongside `train.csv` — checked empirically (row-value join on both files)
    and found 100% of `sample_train.csv`'s 200 rows are a subsample of the exact same synthetic
    pool that feeds `train.csv`. Would have been silent leakage, not real held-out signal.
  **Genuine held-out result (`--final-test`, run once, registered as `fertilizer-classifier-0.1.0`):**
  5-fold CV on train+val (2,379 rows): macro-F1 0.394 ± 0.024, balanced-accuracy 0.489 ± 0.054,
  MCC 0.330 ± 0.013, accuracy 0.555 ± 0.008. **Frozen test split (421 rows, never touched
  before this one evaluation):** macro-F1 0.469, balanced-accuracy 0.601, MCC 0.367,
  accuracy 0.582 — beats CV's own numbers, so there's no sign of the model being CV-tuned onto
  noise. This is the real S3 "done when" (`python -m src.models.train` prints the comparison
  table, `registry.json` has v0.1.0 with the dataset hash, `--final-test` evaluated once and
  refuses to rerun on this version) — not committed (gitignored/untracked, same as always;
  training data is still 100% synthetic, so this is a genuine result on the data we have, not
  yet a real-world one).

### Synthetic-as-raw-data policy (2026-09-27) — changed `build_dataset.py`

Per explicit product decision, stopped treating `fertilizer_prediction_synthetic.csv` as a
train-only supplement to an assumed-but-never-arriving real Kaggle file. Changed
`src/data_pipeline/build_dataset.py` (Richa's file — flagged here, not silently owned) so
every row, real or synthetic, goes through the same stratified 70/15/15 split, instead of
synthetic rows being confined to `train` unconditionally. Regenerated `data/external/test_ids.json`
fresh from the full pool (the old frozen set was 10 ids from the tiny real-only subset — stale
under the new policy). Result: `train.csv` now has genuine val (421 rows) and test (421 rows)
splits instead of being empty-by-construction, which is what let the `--final-test` result
above happen for the first time.
**Flag for Richa:** three of her tests in `test_clean.py`/`test_build_dataset.py`/`test_ingest.py`
assert facts specific to the literal, separate real Kaggle file (a "Pulses" crop label,
`npk_10_26_26` having exactly 3 *real* rows once barley's real mapping lands, the `datasets[0]`
manifest entry's sha256/row-count against a file at `data/raw/fertilizer_prediction.csv`) —
these premises no longer hold under the new policy and are failing for that reason, not a
regression. Left them as-is rather than rewriting her assertions about her own data myself;
her call whether to retire, skip, or repoint them.

- **S4 — NPK dose calculator, closed (potash gap resolved by product decision, 2026-09-27).**
  Richa re-verified MOP's price: IFFCO's own price list doesn't carry it, and market listings
  were too inconsistent to cite responsibly, so it stays genuinely unpriced -- not invented.
  But per her call, that's no longer a blocker: a needed-but-unpriced product (MOP) is still
  selected and dosed with a real quantity/schedule; it's excluded from `cost.breakdown`/
  `estimated_cost_inr_per_acre` (never priced at 0 or guessed) and `explanation.data_notes`
  says its cost is unavailable. Only a product with no *row at all* in `fertilizer_products.csv`
  still raises `ReferenceDataIncomplete` -- a different, structural gap (quantity itself can't
  be computed without n_pct/p2o5_pct/k2o_pct), not a pricing one. Changed: `npk_calculator.py`'s
  `to_products()` (no longer requires a price to select a product), `cost.py`'s `estimate_cost`/
  `cost_breakdown`/`prices_as_of` (skip unpriced items instead of raising), and
  `recommendation_engine.py` (a new data_notes entry when a scheduled product has no cost
  line). `docs/api-contract.md`'s missing-data-policy table and `/recommend` section updated to
  match. Both the potash and no-potash paths are now verified end-to-end against the fixture.
  Golden tests rewritten in `test_npk_calculator.py`/`test_cost.py`/`test_api.py`/
  `test_recommendation_engine.py`/`test_contract.py` (previously asserted the old "never
  selected" behavior).

## Blocked on (not mine to fix — Richa's data-sourcing lane, R2/R3)

- ~~`data/raw/fertilizer_prediction.csv` (Kaggle) doesn't exist~~ — no longer being waited on
  (2026-09-27 policy change, see the synthetic-as-raw-data note above). Not a blocker anymore.
- ~~MOP's price in `fertilizer_products.csv`~~ — still genuinely `TODO(data)` (re-verified
  2026-09-27), but no longer a blocker either: see S4's entry above for the resolution.
- Smaller gaps that don't block anything yet, worth tracking: `seasonal_weather.csv` has only
  2 of 12 months and no lat/lng columns (blocks the seasonal-weather fallback beyond mock mode);
  `stcr_equations.csv`'s wheat N/P equations have no `target_yield_default_q_ha`, so STCR never
  actually fires yet, only the reference-dose path does; `reference_doses.csv` has no rows at
  all for maize, cotton or sugarcane (those crops raise `ReferenceDataIncomplete` for every
  nutrient right now); most `growth_stages.csv` `das_start`/`das_end` cells for maize, cotton
  and sugarcane are `TODO(data)`.

## Flag to teammates (found, not touched — not my files)

- **Richa:** her `feature_engineering.py` names the constant `CLASSIFIER_TARGET =
  "fertilizer_product_id"`, but the actual training-data column is `product_id`. Not a bug in
  the S3 trainer (it uses the real column name explicitly and notes why), just a naming
  mismatch worth fixing on her side for consistency.
- **Josh:** the contract now has a few fields his backend schema needs to pick up —
  `irrigation` (optional, defaults to `irrigated`), nullable `apply_by` + `timing_note`,
  `cost.breakdown` + `prices_as_of`, `explanation.data_notes`. Listed in PR #1's description.
  **Behavior change, no field added/renamed (2026-09-27):** `recommendation.schedule` can now
  legitimately contain a product that never appears in `cost.breakdown` (an unpriced-but-needed
  product, e.g. MOP) — don't assume every `schedule` line has a matching `breakdown` line when
  summing or displaying cost; `data_notes` says which product's cost is missing and why. Also
  new: a `413` can now happen (request body over 64KB) — not part of the documented 422/503
  taxonomy, worth checking `mlService.js` doesn't choke on an unrecognized status code.
- **Darsh:** same fields as above need showing on screen (`timing_note` when `apply_by` is
  null, `data_notes` list, the cost breakdown). Same note as Josh's: a scheduled product with
  no cost-breakdown line is expected now, not a bug — show it with its dose, cost "unavailable".

## Richa's second data delivery, verified (not just the summary taken at face value)

Merged, adapted and pushed (`5011dce`, `75fd17d`). Actually verified, not just relayed:

- **Real, sourced doses for maize, cotton, sugarcane, barley** (all previously
  `ReferenceDataIncomplete` for every nutrient) — confirmed present in `reference_doses.csv`.
- **Wheat's STCR now genuinely fires** for `variety="wh_542"` (target yield sourced, 50 q/ha)
  — confirmed by running it. Generic wheat still uses the flat reference dose (STCR has no
  `variety_id="generic"` row), so the fixture demo numbers are unaffected.
- **Season window fixed properly**: `feature_engineering.season_length_days()` gives a real
  season length from `growth_stages.csv` where one exists (wheat, barley); everything else
  falls back to `credit_window_days` explicitly, with a warning, never silently. Adopted the
  same function in `cost.py`'s `compare_to_history` (was reusing `credit_window_days` as a
  flagged interim proxy since S5 — now resolved for real).
- **N/P/K added as classifier features**, NaN for the real 99-row dataset's rows (genuinely
  not kg/ha — Richa found empirical proof, not just an unstated unit) and real kg/ha for
  synthetic rows and every live request. Required adding a `SimpleImputer` to the
  `logistic_regression` baseline's pipeline (XGBoost handles NaN natively already).
- **Synthetic dataset**: `data/raw/fertilizer_prediction_synthetic.csv`, 2,800 rows, additive
  not a replacement, confined to `train` only (real `test`/`val` unaffected), weighted toward
  the 4 priced products as asked.
- Caught and fixed three real breaks the merge caused: `assess_recommendation()` gained a
  required leading `crop_id` param (updated the S6 call site); two S4 tests were coupled to
  real data's current gaps and needed rewriting against isolated synthetic tables so they
  can't go stale the same way again; the regenerated `sample_train.csv` happened to leave two
  classes at 1 row each, which the trainer's static `excluded_classes` list didn't cover —
  made class exclusion for unlearnable classes automatic, not just config-driven.
- 196 tests pass, ruff clean.

**One important correction to her summary's framing, at the time:** the synthetic file did
**not**, on its own, unblock building a real `train.csv` — `clean.py`'s `_load_raw()`
unconditionally required the real 99-row file. **Superseded 2026-09-27**: per explicit product
decision, that requirement was dropped (`ingest.py`/`clean.py` fixes, then the
`build_dataset.py` split fix above) — the synthetic file is now treated as this project's raw
data outright, not a supplement waiting on a real file. S3 is closed on that basis; see its
entry above.

## Done, and not blocked (S7)

- **S7 — API hardening and contract tests.**
  - `tests/test_contract.py` (9 tests): round-trips both fixtures through both endpoints in
    both modes and validates the response against `RecommendResponse`/`RiskScoreResponse`
    (types and required keys, never the illustrative numbers). Also exercises the documented
    error shapes end to end: pydantic-native 422, business-logic 422, 503, and the new 413.
  - **Real drift found and fixed**: `docs/api-contract.md` rule 9 has always said
    `422 { detail: [...] }`, matching FastAPI's own pydantic validation-error shape
    (`docs/contract-fixtures/error_422.json`). But `UnknownCropError`/`UnknownStageError` were
    being turned into `422 { detail: "<string>" }` by each endpoint's own try/except — a real
    mismatch between actual behavior and the always-correct doc. Fixed by adding
    `src/api/errors.py`: global FastAPI exception handlers that convert both business-logic
    exception pairs to the exact contract shapes (422 list-of-details for the first pair, 503
    detail-string for `ReferenceDataIncomplete`/`EngineUnavailable`), registered once in
    `main.py`. This also let `recommend.py`/`risk_score.py` drop their duplicated try/except
    entirely.
  - Added a request-size limit (413 above 64KB — an engineering hardening default, not sourced
    from any traffic data; typical payloads are a few KB) and structured JSON request logging
    (`src/api/logging_utils.py`): `field_id`, `crop_type`, `model_version`, `latency_ms` only,
    never the soil/weather payload. Logged from inside `recommend.py`/`risk_score.py` around
    the mock/real branch, so it covers both modes.
  - `/docs` (OpenAPI): every request/response schema (`RecommendRequest/Response`,
    `RiskScoreRequest/Response`, and the smaller reference/error/health models) now carries a
    full `json_schema_extra["example"]`, sourced directly from `docs/contract-fixtures/` where
    one exists (read at import time, not hand-copied, so it can't drift from the fixture).
    Added `ValidationErrorResponse`/`ServiceUnavailableResponse` schemas so 422/503 show up in
    `/docs` with their own example too, wired via each router's `responses=`.
  - Re-read `docs/api-contract.md` end to end against `schemas.py`: no request/response *body*
    field actually changed — the contract was already right, only the implementation's error
    handling needed to catch up to it. **New, not previously documented:** a 413 response can
    now happen (request body over 64KB) — this is a transport-level hardening guard, not a
    documented `/recommend` or `/risk-score` error case; flagging for Josh rather than quietly
    assuming it belongs in the contract's error taxonomy or that his `mlService.js` already
    tolerates an unrecognized status code.

## Done, and not blocked (S8)

- **S8 — formula sanity gate.** `tests/test_formula_sanity.py` (57 tests): for every ready
  crop (`ready_crops()` -- barley excluded, `no split_schedule rows`, listed explicitly) and
  every variety (`crop_varieties.csv`'s `rice/pr_132`, `chickpea/kabuli`, plus `wheat/wh_542`
  added manually -- it's a real, sourced STCR variety but isn't in `crop_varieties.csv` yet,
  **flagged for Richa**), at low/medium/high soil, an independent recomputation via Richa's
  `evaluation.metrics.formula_conformity` (reading `reference_doses.csv`/`soil_adjustments.csv`/
  `stcr_equations.csv` directly -- `compute_balance()` is called exactly once per case, only to
  produce the recommendation this test then checks, never to recompute the formula a second
  time) matches within `agronomy_rules.yaml`'s `formula_tolerance_pct`. Also asserts no
  negative quantities anywhere, that schedule quantities sum to the primary product's
  top-level total, and that a credit larger than the dose clamps to zero (wheat N, the one
  nutrient where crediting is actually sourced -- P/K's `nutrient_efficiency.csv` default rows
  are both `TODO(data)`, which skips crediting entirely, so that clamp can't be exercised via
  credit for those two yet).
  **One real finding, not a bug:** `formula_conformity` correctly reports wheat/n, wheat/p and
  rice/n as violators for a *different* reason than a numeric mismatch -- `soil_adjustments.csv`
  has no adjustment source at all for those three (its own `TODO(data)`-in-`soil_rating` rows,
  already documented in that file). Allowlisted explicitly in the test (by exact
  crop/nutrient, not broadly) so a genuinely new gap wouldn't silently pass as "expected" too.
  **`docs/demo-scenarios.md` doesn't exist yet** -- checked the working tree and every branch
  (`main`, `feature/richa-ml-data`, `feature/josh-backend`, `feature/darsh-frontend`,
  `docs/contract-v1`, `docs/richa-c5-v1`), genuinely absent everywhere, not something I should
  invent content for. Not a blocker: "every crop and variety in crops.csv, low/medium/high
  soil" is itself a fully specified, exhaustive test matrix without it -- but whoever owns that
  file should know it's referenced by the pack and doesn't exist yet.

- **S8 — final test-split evaluation, enriched with confidence intervals.** The frozen test
  split was already evaluated once (`--final-test`, this conversation, registered as
  `fertilizer-classifier-0.1.0`). Re-running `python -m src.models.train --final-test` was
  **not** done again: `_next_version()` auto-increments on every call, so it would have silently
  registered a new `0.1.1` and genuinely touched the frozen test split a second time -- not a
  re-run of the same evaluation, a second one. Instead: loaded the already-registered artifact
  and predicted once, purely as inference, on the same already-frozen test rows; verified the
  resulting point estimates matched the already-recorded ones exactly (macro-F1 0.4686,
  balanced-accuracy 0.6007, MCC 0.3665, accuracy 0.5819, n=421) as proof this is the same
  evaluation, not a new one; then ran Richa's `evaluate_classifier` on those exact predictions
  for the enrichment (bootstrap 95% CI, per-class precision/recall/F1, confusion matrix) and
  wrote it into the registry entry in place. **95% CIs: macro-F1 [0.370, 0.548], balanced-accuracy
  [0.458, 0.691], accuracy [0.534, 0.627]** -- wide, at n=421 with one class (`npk_17_17_17`,
  support 3) this thin, expected and reported plainly rather than hidden. Per-class recall is
  uneven: `dap` 1.00, `urea` 0.72, `np_28_28_0` 0.45, `np_20_20_0` 0.17 -- worth knowing before
  calling this "done," not just the headline numbers. The enrichment script is archived at
  `models_artifacts/runs/20260927T132419Z/enrich_test_metrics.py` for audit; both `registry.json`
  and that run's `metrics.json` are gitignored/untracked as always. **The test split must not be
  evaluated again for this model version -- this is final.**

## Done, and not blocked (S9)

- **S9 — package the ML service for compose.** `ml/Dockerfile` now copies `configs/` and
  `data/external/` alongside `src/` (previously only `src/` was copied -- the rule tables
  are read at runtime by every request, so `/recommend`/`/risk-score` could never have
  worked in the container before this), runs as a non-root user, and adds a `HEALTHCHECK`
  against `/health` using Python's own `urllib` (no extra package -- `python:3.11-slim` has
  no `curl`).
  **Real bug found by actually building and running the image, not just reading the
  Dockerfile:** `schemas.py`'s OpenAPI-example loader (S7) reads `docs/contract-fixtures/`
  assuming it's a sibling of `ml/` -- true in the monorepo checkout, false in the Docker
  image, which packages only `ml/`'s own contents. The whole service crashed on import
  inside the container (`FileNotFoundError` before FastAPI even started). Fixed:
  `_fixture_example` now returns `None` on a missing/unreadable fixture instead of raising,
  and each model's `json_schema_extra` falls back to no example (pydantic's own generated
  one) rather than taking the service down -- a missing OpenAPI example is cosmetic, never
  a reason `/recommend` shouldn't start.
  **Verified for real** (`docker build ml/`, `docker run`, not just inspected):
  - No model mounted, `PREDICT_MODE=real`: `/health` → `degraded` (200) with a clear reason,
    `/recommend` still returns a complete plan via the rule-based calculator (the S6 design
    deviation, working as intended in a container for the first time).
  - `PREDICT_MODE=mock` (the image's default -- no `.env` is baked in, correctly, it's
    gitignored): `/recommend` answers the fixture.
  - Model bind-mounted (`-v $(pwd)/models_artifacts:/app/models_artifacts:ro`): `/health` →
    `ok` with `fertilizer-classifier-0.1.0+rules-f22bca59`, `/risk-score` matches the
    fixture's risk level.
  - `ml/AGENTS.md`'s Commands section now has the exact `python -m src.models.train` (recreate
    the artifact) and `docker build`/`docker run` commands.
  **For Josh (`docker-compose.yml`, his file, not touched here):** the `ml` service needs
  `volumes: ["./ml/models_artifacts:/app/models_artifacts:ro"]` and a healthcheck matching
  the Dockerfile's own (`test: ["CMD", "python", "-c", "import urllib.request as u; import sys; sys.exit(0 if u.urlopen('http://localhost:8001/health', timeout=2).status == 200 else 1)"]`,
  10s interval / 3s timeout / 5s start period / 5 retries) so `depends_on: ml: condition:
  service_healthy` can work the same way it already does for `postgres`.
  **Aside, not fixed (not S9's ask):** the built image is ~2.4GB -- `requirements.txt`
  installs `jupyter`/`jupyterlab`/`notebook` etc. for `notebooks/`, none of which the served
  API needs. Worth a follow-up (a slimmer serving-only requirements file) but out of scope
  for "install the pinned requirements" as written.

## External code review response (2026-09-27) -- verified and fixed, my territory only

A teammate reviewed everything I own (`src/api`, `src/engine`, `src/models`, `Dockerfile`,
`configs/`, `tests/`) by reading the code, running the suite, and spinning up the service live
-- not just skimming. Every finding was verified myself before fixing (not taken on trust),
and nothing outside my area was touched (no `data_pipeline/`, `weather/`, `degradation/`,
`evaluation/`, and `docker-compose.yml` stayed Josh's).

**Critical, both verified live before fixing:**
- **`/recommend` silently returned a fake "nothing needed" plan for a crop with no
  `split_schedule.csv` rows.** Verified: `crop_type: "barley"` returned `200`, `fertilizer_type:
  "none"`, an empty schedule -- while `explanation.nutrient_balance` correctly showed a real
  61.8 kg/ha N need. Root cause: `to_products()`'s `ReferenceDataIncomplete` guard only lived
  inside the `if p_lines`/`if k_lines`/`if n_lines` branches; a crop with zero schedule rows at
  all makes every one of those lists empty, so every branch is skipped and it returns
  `schedule=[]` -- exactly `ready_crops()`'s own "not ready" condition ("no split_schedule
  rows"), reaching `/recommend` as a confident wrong answer instead of a 503. Fixed:
  `to_products()` now checks `tables.split_schedule` for the crop *unfiltered by stage* right
  at the top and raises `ReferenceDataIncomplete` if there's nothing at all -- left untouched
  is the legitimate case a later stage has already passed its only split (existing test
  `test_a_later_growth_stage_drops_the_basal_stage`).
- **`/reference/crops` listed crops `ready_crops()` says aren't ready** -- including barley,
  the same one above. `ready_crops()`'s own docstring says "Saloni's /reference/crops lists
  only the ready ones," but `src/api/reference_data.py::load_crops()` still had a stale
  "readiness filtering... added when the shared loader lands" comment describing a filter that
  was never actually wired in, even though that loader (`ready_crops()`) has existed since S8.
  Fixed with `_ready_crop_ids()`, a local readiness check mirroring `ready_crops()`'s exact
  criteria (generic reference dose, no `TODO(data)` nutrient cells, at least one
  `split_schedule` row) -- not a call to `ready_crops()` itself, because it only reads from
  the fixed `soil_data_loader.EXTERNAL_DIR`, not the `directory` this module is parameterized
  by (this module's own tests point it at a different `tmp_path`); documented in code why, and
  to switch to the real function if `load_reference_tables()` ever takes a directory argument.

**High:** local `.env` on this machine only had `MODEL_ARTIFACT_DIR` -- never regenerated
after S6 changed `.env.example` to add `PREDICT_MODE=real`/`DATA_EXTERNAL_DIR`. The ML service
had been running in mock mode locally without me noticing (`/health` still said `"ok"`, just
with the mock model_version). Fixed locally (`.env` is gitignored, nothing to commit);
confirmed `/health` now returns the real classifier's version.

**Medium, both fixed in `npk_calculator.py`:**
- **`region` is a real `reference_doses.csv`/`stcr_equations.csv` column never used to
  disambiguate a lookup.** `_reference_dose_row()`/`_stcr_dose()` matched on crop/variety/
  irrigation (or nutrient) only, silently taking the first match. Harmless today because every
  combination happens to have exactly one region -- not a guarantee once a second region exists
  for the same crop. No request field for region to filter on (contract C1 has none, and adding
  one is a contract change I'm not making unilaterally), so instead: both functions now raise
  `ReferenceDataIncomplete` if more than one usable row matches for a given variety candidate,
  naming the ambiguous regions, rather than picking one silently.
- **`train.py --final-test`'s recorded confidence intervals for v0.1.0 weren't reproducible by
  anyone, including me.** They came from a one-off `enrich_test_metrics.py` script whose
  source only lived in the gitignored `models_artifacts/runs/.../` directory (done carefully --
  it verified point estimates matched before enriching -- but not by code anyone could rerun).
  Fixed: `evaluate_classifier` (Richa's, contract C7 -- bootstrap 95% CIs, per-class precision/
  recall/F1, a confusion matrix) is now called directly inside `run()`'s `--final-test` branch,
  so every future version gets the same enrichment from the same committed code, automatically.

**Low, all fixed:**
- `src/models/predict.py` was a dead 2-line stub (`MODEL_VERSION = "unloaded"`) nothing
  imported, left over from before S6 wired all real loading through
  `recommendation_engine.py`. Deleted; `ml/AGENTS.md`'s folder map updated to stop describing
  a file that did nothing.
- `to_products()` only ever used `p_lines[0]`/`k_lines[0]`, correct today (every crop's
  `split_schedule.csv` gives P and K one basal stage) but nothing enforced it -- a future data
  change splitting P or K across stages would have silently dropped every stage but the first.
  Now raises `ReferenceDataIncomplete` if more than one P or K line exists, instead of guessing
  which one matters.
- `beats_baseline()`'s baseline set only ever included "dummy" kinds, never
  `logistic_regression` -- the ml-ds-standards "simple model" baseline, sitting in the same
  config, described that way in this file's own comments, but never actually part of the gate.
  `random_forest` does beat it (separately verified: 0.394-0.024=0.370 mean-std vs
  0.301+0.010=0.311 mean+std on the post-split-fix numbers), but that was true by the numbers,
  not because the check was looking. Extracted into `_baseline_model_names()` and fixed to
  include it.
- **Investigated, deliberately left as-is:** `Engine()` is constructed twice in `main.py` --
  once eagerly at import time, once again in the lifespan hook. The obvious "fix" (skip the
  second build if `app.state.engine` already exists) would break `client_without_classifier`
  and every other test that monkeypatches something (`REGISTRY_PATH`, `EXTERNAL_DIR`) *before*
  entering `with TestClient(app)`, deliberately relying on the lifespan hook rebuilding a fresh
  `Engine()` that reflects the patch -- confirmed by reading how those S7 fixtures actually
  work, not assumed. The real-world cost is one redundant `Engine()` build at process startup
  (not per-request), which is genuinely low-stakes. Left alone rather than risk a regression to
  fix a startup-time inefficiency.

8 new regression tests added (`test_npk_calculator.py` x4, `test_mock_and_reference.py` x1,
`test_recommendation_engine.py` x1, `test_train.py` x2) -- one per verified finding, so none of
these can silently reappear. Full suite: 290 passed, same 6 pre-existing environment-only
failures (absent real Kaggle file), unrelated to any of this.

## Done, and not blocked (S10)

- **S10 — model card.** `ml/MODEL_CARD.md` written, every number pulled from
  `registry.json`'s `fertilizer-classifier-0.1.0` entry or re-verified directly against the
  live data rather than trusted from memory -- caught and corrected two things while writing
  it: (1) the classifier's own 5 target classes include `np_20_20_0` and `npk_17_17_17`, which
  are *also* currently unpriced (same situation as MOP), not just the 3 obviously-priced ones
  I first assumed; (2) `configs/train.yaml`'s `excluded_classes` comment claiming
  `npk_10_26_26` has "2 rows" is stale -- verified directly, it has **zero** rows in the
  current 2,800-row `train.csv` (fixed the comment in the same change, reasoning holds either
  way).
  **Per-crop metrics, requested by S10 but not previously computed anywhere:** added properly,
  not as a one-off -- extended `train.py`'s `--final-test` branch to call Richa's `per_slice()`
  automatically for every future version (`Frame` gained an optional `crop_id` field, since
  `build_features()` one-hot-encodes the raw column away), then applied the same rigor as the
  earlier CI enrichment to add it to v0.1.0's already-frozen entry: predicted once more with
  the already-registered artifact on the already-frozen test rows, verified the point estimates
  matched exactly (proof it's the same evaluation), then wrote `per_crop` in. Finding worth
  reading, not just archiving: every per-crop macro-F1 (0.19-0.32) is well below the pooled
  0.469 -- expected (a crop only sees 2-3 of the 5 products), but the pooled number alone would
  have overstated it. `chickpea` (0.192) is the weakest crop.
  **`wall_clock_seconds` is now persisted** in every future run's `env.json` -- previously only
  `main()` printed it, `run()` itself never captured it, so it was never actually recorded
  anywhere a later reproducibility report could read it back from. v0.1.0's own figure (10.7s)
  is cited in the model card from the printed log, not re-derived.
  **`docs/evaluation-report.md` (R12, Richa's) doesn't exist yet** -- checked every branch,
  genuinely absent, `TODO(richa-eval-report)` in the model card rather than a self-written
  substitute for her failure-mode analysis.
  2 new/extended tests (`test_train.py`): `env.json` gets `wall_clock_seconds`; `--final-test`'s
  registry entry gets `per_crop`. Full suite: 290 passed, same 6 pre-existing failures.

## Merged `feature/richa-ml-data` into `feature/saloni-ml-core` (2026-09-28)

Clean merge, no conflicts, 33 files changed. Verified rather than trusted: full suite green
(321 passed, 2 properly-skipped, 0 failed) after the merge, and her adaptations of my own
tests (barley, the P/K credit comment, MOP->SSP swap in cost tests) checked line-by-line, not
just re-run. Confirmed the merge changes nothing about how `compute_balance()` behaves for
existing crops: reproduced all three of her new `docs/demo-scenarios.md` scenarios by calling
`recommendation_engine.recommend()` directly with each fixture's pinned `demo_today` -- exact
match on `recommendation`/`risk.level` for `wheat_over_application`, `rice_low_n_rain_hold`,
`maize_healthy`. Also ran all three through the live `/recommend` endpoint (real-clock date,
2026-09-28, not the fixture's pinned date) per her explicit request -- all three return 200,
validate against the `RecommendResponse` contract, and tell a sensible story (correct primary
product, no unexpected errors/`data_notes`); exact quantities/risk levels differ from the
fixture because a live call always uses today's real date while the fixture pins a specific
one for reproducibility -- expected drift, not a regression, already confirmed via the
pinned-date direct-engine check above.

Gaps this closed, previously flagged as blocking in this file or the model card:
- **MOP price resolved** (PIB Release ID 2237470, ₹34.21/kg, dated 2026-03-10) -- the
  "MOP has no verified price" limitation is gone; `ssp`/`npk_14_35_14`/`npk_17_17_17`/
  `np_20_20_0` remain unpriced.
- **P/K nutrient efficiency sourced** (PIB Release ID 2237709, national NUE averages,
  P=0.20/K=0.55) -- prior-credit crediting for P and K is no longer unavailable.
- **Barley now ready** -- a `split_schedule.csv` row was added; `test_npk_calculator.py`'s
  barley-specific "not ready" regression test was correctly split into a barley-specific "now
  works" test plus a new crop-agnostic synthetic-table version so future readiness changes for
  other crops won't make it go stale.
- **`explainability.py`'s `explain()` is now real** (+195 lines), wired into
  `test_explainability.py`.
- **`docs/evaluation-report.md` (R12) now exists.** `ml/MODEL_CARD.md`'s "Limitations" section
  updated from it directly -- the `TODO(richa-eval-report)` is gone.

**Retrained (2026-09-28) to resolve the open decision Richa's evaluation report flagged:** the
registered `fertilizer-classifier-0.1.0` was trained *before* this merge's data fixes, and her
report's fresh local reproduction showed a 6th class (`npk_14_35_14`, 9 rows) with different
metrics (macro F1 0.341 vs the registered 0.469, `docs/evaluation-report.md` §1.3). Ran the real
pipeline on this checkout to settle it: `python -m src.data_pipeline.build_dataset --config
configs/data.yaml` (deterministic, reproduces the same `content_hash` a second local rebuild
already showed) then `python -m src.models.train --config configs/train.yaml --final-test`.
**Result: no 6th class, and every CV/test metric reproduces `0.1.0` identically** -- same 5
labels (verified directly against `data/raw/fertilizer_prediction_synthetic.csv`'s own
`Fertilizer Name` value counts: Urea 1339, 28-28 1013, 20-20 279, DAP 151, 17-17-17 18, nothing
else), same class counts after the train+val split, same macro F1/balanced accuracy/MCC to the
last digit, and the *same* file-level `dataset_hash` (`9eb97903`) `0.1.0` was registered
against -- i.e. `train.csv`'s actual byte content never changed. This is expected in hindsight:
the classifier's `FEATURE_COLUMNS` (crop/variety/n/p/k/weather) and its target label never read
`split_schedule.csv` or `nutrient_efficiency.csv` -- those two tables only feed
`npk_calculator.py`'s dose formula. Richa's "fresh reproduction" showing a 6th class must
reflect some local state on her machine (an uncommitted regeneration of the raw synthetic file,
most likely) rather than anything in the merged repo -- flagged back to her, not something to
chase further here since this checkout's own numbers are the ones that matter for what's
actually registered.

Registered `fertilizer-classifier-0.1.1` anyway (current git commit's own build,
`models_artifacts/runs/20260927T200512Z/`) -- it's the actively served version now
(`recommendation_engine.py` always loads the registry's last entry). Full suite re-run after
registering: 321 passed, 2 properly-skipped, unchanged. `ml/MODEL_CARD.md` updated throughout
(title, reproducibility block, Limitations) to `0.1.1`'s real values, not `0.1.0`'s.

Merge commit and the retrain both pushed to `origin/feature/saloni-ml-core`.

## S11 -- demo readiness (2026-09-28, night before the demo)

**Done when:** `ml/DEMO_NOTES.md` exists, the three scenarios return sensible output through
the full compose stack, and the model version is tagged demo. All three met -- but two real
bugs were found and fixed doing it, not just a checklist run.

**1. Cold start, timed.** `docker compose up --build` from a clean state (no images, no
containers; base image layers already pulled locally): 55s to `ml`'s `/health` responding.
Images already built: 9s. Postgres's healthcheck gates backend startup correctly.

**2. `docker-compose.yml` had no volume mount for `ml/models_artifacts/` -- a real,
demo-blocking gap, not something S9 or J10 finished.** The S9 Dockerfile deliberately never
bakes the gitignored `.joblib` into the image ("the model artifact is bind-mounted read-only so
it never needs to be in the image" -- its own comment). Without the mount, `/health` came back
`"degraded"` (`model_version: "unloaded+rules-..."`) through the full compose stack. This is
root infra, not backend application code, and it was blocking my own service's model from
loading with the actual acceptance test failing, so fixed directly: added a `volumes:` entry to
the `ml` service in `docker-compose.yml`. Verified: `/health` → `"ok"`,
`fertilizer-classifier-0.1.1+rules-4b2ba173`.

**3. Real bug found while checking "outputs read sensibly": `assess_recommendation()` never
received `today`.** `recommend()` threads `today` through `compute_balance`/`to_products`/
`compare_to_history` correctly, but its call to `assess_recommendation()`
(`recommendation_engine.py`) never passed it at all -- `risk_analyzer.py`'s `_applied_kg_ha()`
silently defaulted its window check to real wall-clock `datetime.now()` instead. Consequence:
the dose/cost/schedule numbers in any response are always correct and reproducible for whatever
`today` was used; the **risk verdict was not** -- it silently depended on the actual calendar
day the server happened to be running on, regardless of what date the rest of the request used.

Found this via `maize_healthy`: reproducing the documented dose/cost numbers exactly (byte-
identical `nutrient_balance` to the fixture) still gave **high** risk instead of the documented
**low**. Traced it to the fixture's own "low risk, healthy field" verdict being a false
negative -- whenever it was generated, real wall-clock time put the June application ~103 days
before the *actual* generation date, outside any window, so risk saw "nothing applied recently"
and defaulted to low. It was never a genuine "well-managed field" finding.

**Fixed properly, not patched around**: `assess_recommendation()` gained a `today: date | None`
parameter, threaded to `_applied_kg_ha(..., reference_date=today)`; `recommend()` now passes
`today=today` at its call site. `score_planned`/`score_planned_risk` (the `/risk-score` path)
were unaffected -- planned applications carry no date, so `_applied_kg_ha` there never took
`within_days` in the first place. Full suite re-run after the fix: 321 passed, 2 skipped,
unchanged -- no test relied on the old (buggy) behaviour.

**Corrected the demo content, not just the code**: `docs/contract-fixtures/demo_scenarios.json`'s
`maize_healthy.recommend_response.risk` updated to the honest **high** verdict (surgical,
5-line diff -- not a full reformat, which a first attempt at this accidentally did and was
reverted); `docs/demo-scenarios.md` §3 rewritten from "healthy field, low risk" to "recently
over-applied nitrogen, high risk" with the bug explained inline. This is Richa's R11 content --
flagged clearly in both files and here, not silently rewritten. Worth a look from her when she's
back, but it had to be right for tomorrow morning regardless.

**4. `scripts/demo_requests.py` (new).** The fixture's dates are fixed calendar dates; the live
endpoint always uses the real server clock, so POSTing the fixture's payloads as-is only
reproduces the documented numbers on the one day they happen to line up with
`agronomy_rules.yaml`'s 60-day credit window -- confirmed directly (every `prior_credit_kg_ha`
came back 0 through the live compose stack on unshifted dates). This script re-anchors every
date by the same day-offset that already existed between it and that scenario's own
`demo_today`, preserving the exact relative timing regardless of what day it's actually run.
Verified: all three scenarios reproduce the documented outcome exactly through the live,
rebuilt compose stack, on this day and (by construction) on any later day. Also generates
scenario 1's over-application `/risk-score` payload (the same field, its 150 kg/acre urea
reframed as a *planned* dose rather than logged history) -- verified sensible: medium risk,
138% of the full standard N need (no prior credit in that call, since none was logged),
correctly distinct from `/recommend`'s "high" verdict for the same field's actual applied
history (335% of the much smaller post-credit remaining need) -- both internally consistent
with what they're each comparing against.

**5. `PREDICT_MODE=mock` reconfirmed working** in a throwaway container: `/health` → `"ok"`,
`mock-0.0.0+rules-mock`; `/recommend` returns clearly-labeled sample output. No internet or
model artifact needed -- a real offline fallback, not just a config flag that's never been run.

**6. `registry.json` gained a top-level `demo_model` key** (`{model_name, version: "0.1.1",
marked_on, note}`) -- doesn't change which model is actually served (that's always
`models[-1]`, unaffected), just states once, explicitly, which version is the demo's, rather
than leaving it as "whatever happens to be last in the list."

**7. `ml/DEMO_NOTES.md` written** -- model version, cold-start timing, all three scenarios'
verified live output, the scenario-1 risk-score check, the mock-mode fallback, a
judge-facing answer to "isn't this just a tabular model" (dose is formula-driven and
published-table-sourced; the classifier only ever refines which product name is shown, and
only when it agrees with the rule-based choice), and known limitations stated up front rather
than waiting to be asked.

## Not started yet

S12 (learned quantity refinement) is a stretch goal conditional on Richa having found a
dataset with real applied-quantity labels -- unknown status, hers to say.
