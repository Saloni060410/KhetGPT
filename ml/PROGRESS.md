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

- **S4 — NPK dose calculator (partial block, not a code problem).** The calculator itself is
  correct and tested. But running it against the real fixture (`docs/contract-fixtures/`)
  surfaced that **MOP's price is `TODO(data)`** in Richa's merged `fertilizer_products.csv`.
  Any crop/soil combination that needs potash (wheat with low soil K, rice's base K2O dose)
  correctly raises `ReferenceDataIncomplete` rather than a wrong number — this is intended
  behavior, not a bug, but it means **no potash-needing plan can be end-to-end verified until
  MOP has a real price.** The no-potash-needed path (soil K high) is verified and matches the
  contract fixture.
  **To close this out:** once Richa has a dated MOP price, rerun the fixture demo (see the S4
  report in this conversation for the exact commands) and confirm the potash path too.

## Blocked on (not mine to fix — Richa's data-sourcing lane, R2/R3)

- ~~`data/raw/fertilizer_prediction.csv` (Kaggle) doesn't exist~~ — no longer being waited on
  (2026-09-27 policy change, see the synthetic-as-raw-data note above). Not a blocker anymore.
- MOP's price in `fertilizer_products.csv` (`price_inr_per_kg`, `price_date`, `bag_size_kg` all
  `TODO(data)`). Richa's own note calls this "URGENT." Blocks S4's potash path and any full
  `/recommend` for wheat with low-K soil or rice's base dose.
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
- **Darsh:** same fields as above need showing on screen (`timing_note` when `apply_by` is
  null, `data_notes` list, the cost breakdown).

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

## Not started yet

S8 (formula sanity gate, final test evaluation) onward per the pack. S3, S4 (bar the
MOP-price potash path), S5, S6 and S7 are all done and re-verified end to end as of
2026-09-27: a real classifier is registered (`fertilizer-classifier-0.1.0`), `/health` reports
`ok` with its version, the fixture demo in real mode validates against the contract,
`/risk-score` works, p95 latency over 50 calls is 64.9ms (well inside NFR1's 3s), and the API
is hardened with contract tests, a request-size limit, structured logging and a global
error-shape handler. The one still-open gap is S4's potash path, genuinely blocked on MOP's
price (Richa's lane, re-confirmed as recently as today).
