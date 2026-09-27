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

## Done, but verification is still open

- **S3 — product classifier.** Code is complete and tested (19 tests): seeding, config,
  cross-validation, leakage smell test, versioned registry, run records.
  **What's unverified:** it has only ever run on Richa's 48-row dev-fallback sample
  (`data/processed/sample_train.csv`), because the real dataset needs the raw Kaggle file,
  which is gitignored and has never been on this machine (see "Blocked on" below). On that
  fallback data, XGBoost does **not** beat the baseline (macro-F1 mean-std 0.091 vs the
  strongest baseline's mean+std 0.185) — expected at n=48, not yet a real result.
  **To close this out:** get the raw file → `data/processed/train.csv` exists →
  `python -m src.models.train --config configs/train.yaml` → re-check the comparison table →
  once the model is trusted, `--final-test` once, and only once.

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

- `data/raw/fertilizer_prediction.csv` (Kaggle) doesn't exist anywhere: not on this machine, not
  in git (correctly gitignored), not on any branch. Needed for real S3 training and for
  `--final-test`.
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

**One important correction to her summary's framing:** the synthetic file does **not**, on
its own, unblock building a real `train.csv`. I ran her own suggested command
(`python -m src.data_pipeline.ingest && python -m src.data_pipeline.build_dataset`) and it
still fails — `clean.py`'s `_load_raw()` unconditionally reads the real 99-row file first;
the synthetic file is only ever combined with it, never a substitute. **The real Kaggle raw
file is still genuinely required and still absent from this machine.** S3 is not closeable
yet on that basis alone; the fallback-sample training result reported earlier in this
conversation still stands as the only one that has actually been run.

## Not started yet

S7 (API hardening and contract tests) onward per the pack. S6 is done, but its output quality
is only as good as S3's model (not yet trained on real data — see above) and S4's calculator
(potash still blocked on MOP's price, re-confirmed by Richa as genuinely unresolved).
