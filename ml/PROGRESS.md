# Saloni's progress — ml/src/api, ml/src/engine, ml/src/models

Branch `feature/saloni-ml-core`. Last checked against `origin/feature/saloni-ml-core`: in sync,
nothing unpushed (commit `a077530`). Update the "Last checked" line whenever this file is revisited.

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

## Not started yet

S5 (cost and saving), S6 (recommendation engine, real API mode — needs S3's real model and S4's
calculator, both of which have the open verifications above), S7 onward per the pack.
