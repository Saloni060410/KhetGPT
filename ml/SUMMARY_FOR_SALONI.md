# Data-side changes — summary for Saloni

Updated version. Branch `feature/richa-ml-data` now includes your `feature/saloni-ml-core`
work through S9 and your review fixes too — everything below is committed and pushed except
the MOP/P-K resolution in §3/§3b, about to be. 316/316 tests pass, ruff clean.

---

## 1. Real reference-table gaps fixed

**`reference_doses.csv` had zero rows for maize, cotton, or sugarcane** — despite all three
being in `crops.csv`/`growth_stages.csv`. Every recommendation for those crops was raising
`ReferenceDataIncomplete`. Fixed with real PAU POP Kharif 2026 doses, parsed directly from
the primary PDF:
- Maize: N=50, P2O5=24, K2O=12 kg/acre (p.33)
- Cotton: N=55, P2O5=12 kg/acre, K2O soil-adjustment only (p.49)
- Sugarcane: N=60 kg/acre, P2O5/K2O soil-adjustment only (p.82)

Added corresponding `soil_adjustments.csv` and `split_schedule.csv` rows for all three (same
PDF pages).

**Added Barley as crop #7** (`crops.csv`, real PAU Rabi 2025-26 dose, p.23-24). Millets was
considered and **rejected** — PAU splits it into at least two agronomically distinct species
(Bajra in Kharif, Proso/Foxtail "Minor Millets" in Rabi), the same generic-label problem that
already ruled out mapping "Pulses" → chickpea. Adding Barley also let the real 99-row Kaggle
file's own Barley rows start mapping (real classifier data: 50 → 57 rows).

**`stcr_equations.csv`**: wheat's STCR equation had no `target_yield_default_q_ha`, so STCR
never actually fired. Re-fetched the primary source (ICAR-IISS "Four Decades of STCR
Research", p.92) directly: the equation's own documented target range is 45-55 q/ha, verified
at farmers' fields specifically at 45 and 50 q/ha. Set default = 50 (sourced, not invented).

**Barley's `split_schedule.csv` row — resolved.** Was a known, disclosed gap (dose sourced, but
the split-timing sentence wasn't in what I'd originally captured); the gap caused two real bugs
your S8/S9 review correctly caught (barley wrongly listed as "ready", `/recommend` silently
returning an empty schedule instead of a 503). Closed with the real row: PAU POP Rabi 2025-26
p.25, "Drill all fertilizers at sowing" — same single-stage pattern as chickpea. Barley is now
ready like every other crop; `_KNOWN_MISSING_SPLIT_SCHEDULE` is empty (kept as a named slot,
not deleted, in case a future crop needs it).

## 2. Season window vs. credit window (risk_analyzer.py)

`assess_recommendation()` was reusing `agronomy_rules.yaml`'s `credit_window_days` (60 days)
as the same-season cutoff — conflating "nutrient credit decay" with "is this still the current
crop cycle." A real season is often much longer (wheat 148-158 days, barley 137-146). Fixed
with `feature_engineering.season_length_days()` — a real, sourced season length from
`growth_stages.csv`'s maturity/harvest stage where one exists (only wheat/barley so far).
Every other crop falls back to `credit_window_days` **explicitly**, with a `UserWarning`,
never silently.

**You already picked this up** — `cost.py`'s `compare_to_history()` calls the same
`_season_window_days()`/`season_length_days()` logic (commit `75fd17d`). Good — that's exactly
the intent. Just know: rice and maize will both emit that `UserWarning` in server logs (no
sourced season length yet for either) — expected, not a bug.

## 3. MOP price — resolved (real price sourced on a third pass)

First two passes (IFFCO's own official price list PDF, and market listings) genuinely came up
empty — IFFCO doesn't carry MOP, market listings too inconsistent to cite (Rs.9 to
Rs.1500+/kg-equivalent). A third pass found a real dated government source: **PIB Release ID
2237470, Ministry of Chemicals and Fertilizers, 10 Mar 2026** ("Government Stabilizes
Fertilizer Prices for Rabi 2025-26") states directly: "The average retail prices for other key
grades (per 50 kg bag) ... Muriate of Potash (MOP): Rs.1710.54" → **₹34.21/kg**, `bag_size_kg`
= 50 (also explicitly stated in that source). Written into `fertilizer_products.csv`.

MOP now prices normally, same as any other product — the missing-data policy from `docs/
api-contract.md` (commit `57b43ce`, unpriced-but-needed product still selected/dosed, excluded
from cost with a `data_notes` entry) no longer applies to MOP specifically. It's still real and
still applies to SSP and the other still-`TODO(data)` grades (§10).

## 3b. P/K prior-usage credit — resolved

`nutrient_efficiency.csv`'s `default` rows for P and K were `TODO(data)` — every
recommendation ignored prior P/K applications entirely, regardless of crop. Sourced both from
**PIB Release ID 2237709, Ministry of Chemicals and Fertilizers, 10 Mar 2026** — Smt. Anupriya
Patel (MoS) in a Rajya Sabha reply citing ICAR studies: "NUE in India is generally estimated at
30-45% for nitrogen (N), 15-25% for phosphorus (P), and 50-60% for potassium (K)." Used the
midpoint of each range: P = 0.20, K = 0.55 (same national-average-fallback pattern as N's
sourced 42.6%). A previously-applied DAP or MOP dose now genuinely credits against the new P/K
dose, the same way urea already credited against N.

## 4. Synthetic training dataset (`DATA_REQUIREMENTS.md`)

`data/raw/fertilizer_prediction_synthetic.csv` — **2,800 rows** (400/crop × 7 crops: wheat,
rice, maize, cotton, sugarcane, chickpea, barley), from `generate_synthetic_data.py`.

- Kept **separate** from the real 99-row file, not a replacement — `clean.py` tags every row
  `data_source: real|synthetic`.
- **Note: you later changed `build_dataset.py` to split test/val from the whole pool**
  (`ee289a3`, "treat the synthetic dataset as raw data, not a train-only supplement") instead
  of real-rows-only. I originally built it real-only specifically so test/val could never be
  evaluated-on synthetic data — flagged this to Richa when I found it; she confirmed it's an
  approved product decision, so it stands as your version now. Just flagging so it's a known,
  deliberate change and not a surprise if compared against the original design.
- Every value grounded in an already-sourced table: `seasonal_weather.csv`'s real monthly
  Punjab averages for temperature/humidity; `soil_test_ratings.csv`'s ICAR-IISS bands for N/P/K
  (real kg/ha).
- Fertilizer label is never assigned independently of the row's own soil values — sampled
  among real `fertilizer_products.csv` grades by closest N:P2O5:K2O match to that row's
  actual computed need, weighted toward your 4 priced products (Urea, DAP, 28-28, 10-26-26) —
  now ~89% of synthetic rows.
- Chickpea unblocked directly (not routed through the ambiguous "Pulses" mapping).

## 5. N/P/K as classifier features — real fix, not a workaround

Real Kaggle file's Nitrogen and Phosphorous columns have nearly identical numeric ranges
(4-42, 0-42), but real kg/ha values for N and P differ by an order of magnitude
(`soil_test_ratings.csv`: N ~280-560, P ~10-25) — empirical evidence the real data's N/P/K
genuinely aren't kg/ha, not just an unstated unit.

Fix: `n`/`p`/`k` are in `FEATURE_COLUMNS` (contract C4). Real Kaggle rows get `NaN` (never a
wrong-scale number passed through); synthetic rows and every live `/recommend` request get
real kg/ha.

**You already handled the NaN-tolerance requirement** — `fertilizer_model.py`'s
`random_forest`/most non-XGBoost pipelines run a `SimpleImputer(strategy="median")` ahead of
the classifier, and you locked in `random_forest` as the production model (`f234d21`). That's
a different, also-valid solution than "use an XGBoost-native-NaN model" — just noting it since
my original note assumed XGBoost specifically.

## 6. Naming check (`CLASSIFIER_TARGET`)

Checked — wasn't a bug. `build_dataset.py` already renames `product_id` → `CLASSIFIER_TARGET`
when building `train.csv`. No change made.

## 7. Line-ending bug found while reviewing your branch (`.gitattributes`)

Two hash-verified files (`fertilizer_prediction_synthetic.csv`,
`isric_sotwis_igp_soil_profiles.csv`) were showing spurious `sha256` "drift" in
`dataset_manifest.json` — pure CRLF-vs-LF difference between checkout environments (my Windows
autocrlf vs. your machine), not a real content change. You'd patched the *symptom* (updated
the manifest's hash to match your checkout, `950d7a2`) but not the cause, so it would recur on
any fresh clone or Windows checkout. Added `.gitattributes` pinning
`ml/data/**/*.{csv,json,yaml}` to `eol=lf` on every checkout. Pushed to **both** your commit
history's branch and directly to `main` (single-file commit, nothing else) at Richa's explicit
request, since it's shared infra both branches need.

## 8. R10 — `explain()` (rule_trace ranking + product-choice sentence)

`src/evaluation/explainability.py`'s `explain(features, prediction, rule_trace, top_k=3)` is
built and wired — confirmed `recommendation_engine.py`'s
`from src.evaluation.explainability import explain as _richa_explain` now succeeds instead of
hitting the `ImportError` fallback.

- **rule_id list built from your actual `npk_calculator.py`/`recommendation_engine.py` code**,
  not the prompt pack's guessed list: `dose_reference`, `soil_adjustment`, `dose_stcr`,
  `stcr_soil_adjustment`, `prior_credit`, `credit_skipped_no_efficiency`,
  `credit_ignored_unknown_product`, `classifier_disagreement`. The pack named `rain_hold`/
  `split_stage` as rule_ids — they aren't; rain-hold delay and split scheduling are applied
  straight to the schedule array, never traced. Worth knowing in case anything else assumed
  those rule_ids exist.
- **Product-choice sentence handles your actual model, not just XGBoost**: the spec assumed
  XGBoost's `pred_contribs`, but your locked-in model is `random_forest`, which has no per-row
  attribution API. `explain()` checks the real active model's `clf` step — `pred_contribs`
  only when it's genuinely `XGBClassifier`, a documented `feature_importances_`-based fallback
  for anything else that exposes one (random_forest does), and no sentence at all otherwise.
  Never raises for a model-loading problem — costs only that one sentence, never the
  rule_trace sentences already computed, since your caller treats any exception from
  `explain()` as total failure.

## 9. R11 — three demo scenarios, engine-verified

`docs/demo-scenarios.md` + `docs/contract-fixtures/demo_scenarios.json`: wheat over-application
(high risk, saving), rice low-N + rain hold (delay visible in the schedule), healthy maize (low
risk). Every `recommend_response` came from actually calling `recommend()` for real, then
independently re-run and diffed to confirm no copy-paste drift (matched exactly except
`model_version`, deliberately excluded since it hashes all of `data/external/` together).

**Please run all three through the live `/recommend` endpoint** (not just the direct engine
call I used) before the demo and reconcile anything surprising, per the original ask.

**Maize's numbers changed since the two gaps above (§3, §3b) closed** — re-run fresh and
independently rechecked (identical on a second run). `data_notes` is now empty for all three
scenarios. The story flipped: maize's saving used to be positive (₹312.14/acre) partly *because*
MOP was free and P wasn't credited; with both fixed, the honestly-priced plan now costs
₹126.33/acre *more* than what the farmer previously applied (they hadn't used MOP last time).
Risk is still low — the field isn't mis-fertilized, a complete correctly-priced plan is just
pricier than a partial one that happened to skip potash. See `docs/demo-scenarios.md` scenario 3
for the full before/after.

One thing still visible in the fixture: rice and maize both hit the season-window fallback
warning (§2) — expected, unrelated to the above.

## 10. Still open / known limitations (disclosed, not silently missing)

- **`growth_stages.csv`** — several `das_start`/`das_end` cells for maize/cotton/sugarcane stay
  `TODO(data)`; PAU's text gives relative timing only, no day-count. Not invented.
- **SSP, `14-35-14`, `17-17-17`, `20-20`** remain unpriced (same decontrolled-MRP problem MOP
  used to have) — same "skip for cost, don't block" handling applies (§3).
- **MOP price** and **Barley's `split_schedule.csv` row** and **P/K credit** are no longer open
  — see §1 and §3/§3b, resolved since the previous version of this summary.
- **S8** (formula sanity gate, final test evaluation) — `src/evaluation/metrics.py` (R9:
  `evaluate_classifier`, `cv_summary`, `baseline_report`, `formula_conformity`, `per_slice`) is
  built, tested, and ready for it, per your own `PROGRESS.md` ("not started yet").

## 11. Where to look

- `ml/data/README.md` — full provenance for every dataset, real and synthetic.
- `ml/data/external/dataset_manifest.json` — hashes/row counts, including the synthetic file's
  entry (`"real": false`).
- `ml/PROGRESS.md` — your own log of S3-S7.
- Run `python -m src.data_pipeline.ingest && python -m src.data_pipeline.build_dataset` from
  `ml/` to regenerate `train.csv` fresh.
