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

## Not started yet

S10 (model card) and S11 (demo readiness) per the pack -- both gated on inputs I don't have
yet: S10 needs Richa's evaluation report (R12), S11 needs Josh's compose changes above (J10).
S12 (learned quantity refinement) is a stretch goal conditional on Richa having found a
dataset with real applied-quantity labels -- unknown status, hers to say.
