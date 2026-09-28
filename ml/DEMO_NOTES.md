# Demo notes (S11)

Written the night before the demo (2026-09-28), after actually running the full compose stack
and every scenario below against it -- not written from memory of what should happen.

## Before you start the demo: read this

**Two real bugs were found and fixed tonight while preparing this.** Both are already
committed; this section is what to actually do tomorrow morning, not just background.

1. **`docker-compose.yml` had no volume mount for `ml/models_artifacts/`.** Without it, the
   classifier never loads (`/health` stays `"degraded"`, `model_version: "unloaded+rules-..."`)
   -- the S9 Dockerfile deliberately never bakes the gitignored `.joblib` artifact into the
   image, so it has to reach the container this way. Already fixed (a `volumes:` entry on the
   `ml` service). If `/health` ever shows `"degraded"` on demo day, this is the first thing to
   check: `docker compose config` should show that mount, and `ls ml/models_artifacts/*.joblib`
   on the host should show a real file.
2. **The three demo scenarios' recorded outcomes were produced with a pinned `demo_today`
   (via a direct engine call), but `/recommend` and `/risk-score` always use the server's real
   wall-clock date.** POSTing `docs/contract-fixtures/demo_scenarios.json`'s payloads to the
   live endpoint as-is will NOT reproduce the numbers below on any day except the one this was
   written on -- `sowing_date`/`applied_on` will have drifted out of (or, for wheat, still be
   in the future relative to) `agronomy_rules.yaml`'s 60-day credit window, and every
   `prior_credit_kg_ha` will silently come back 0.

   **Fix: always run `scripts/demo_requests.py` first to get today-anchored payloads**, rather
   than reusing the static fixture file directly:
   ```bash
   cd ml && python -m scripts.demo_requests > /tmp/demo_requests.json   # today's real date
   python3 -c "import json; d=json.load(open('/tmp/demo_requests.json'));
     [json.dump(v, open(f'/tmp/req_{k}.json','w')) for k,v in d.items()]"
   curl -X POST http://localhost:8001/recommend -d @/tmp/req_wheat_over_application.json
   curl -X POST http://localhost:8001/recommend -d @/tmp/req_rice_low_n_rain_hold.json
   curl -X POST http://localhost:8001/recommend -d @/tmp/req_maize_healthy.json
   python -m scripts.demo_requests --risk-score > /tmp/risk_score_wheat.json  # scenario 1's over-application check
   curl -X POST http://localhost:8001/risk-score -d @/tmp/risk_score_wheat.json
   ```
   This re-anchors every date by the same day-offset it already had from its own scenario's
   `demo_today`, so the *relative* timing (days since sowing, days since the fertilizer was
   applied) is preserved exactly -- verified below to reproduce the documented numbers exactly,
   on the day this was written, and will keep working on any later day the demo actually runs.

## Model version being demoed

```
fertilizer-classifier-0.1.1+rules-4b2ba173
```
(from a live `GET /health` against the compose stack, `status: "ok"`.) `0.1.1` is marked as
the demo model in `src/models/model_registry/registry.json`'s top-level `demo_model` key.
`0.1.1` is a same-numbers retrain of `0.1.0` run to confirm the `feature/richa-ml-data` merge's
data fixes didn't silently change the classifier -- see `MODEL_CARD.md` and `PROGRESS.md`.
Served version always comes from `recommendation_engine.py` loading `registry.json`'s last
entry automatically; nothing needs to be configured by hand.

## Cold start timing

`docker compose up --build` from a clean state (no images, no containers, base image layers
already pulled locally -- a genuinely empty Docker daemon would take longer for the first
`python:3.11-slim` pull): **55 seconds** from command start to `ml`'s `/health` responding.
With images already built (`docker compose up -d` only), containers reach a healthy `/health`
in **9 seconds**. Postgres's healthcheck (`pg_isready`) gates the backend's own startup, so
nothing races.

## The three scenarios, verified against the live compose stack tonight

All three sent through the real, running `/recommend` endpoint (not a direct engine call) with
today-anchored dates from `scripts/demo_requests.py`. Every number below matches
`docs/demo-scenarios.md`'s documented outcome exactly.

### 1. Wheat, history of over-application
- **Risk: high** -- "Applied N is 170.5 kg/ha, 335% of the 51.0 kg/ha the crop needs."
- Recommended: **urea, 22.4 kg/acre** (vs. 150 kg/acre previously applied)
- Cost: ₹132.71/acre now vs. ₹888.00/acre previously -- **saving ₹755.29/acre** (85.1% reduction)

### 2. Rice, low soil N + heavy rain forecast
- **Risk: medium** -- "Soil N tests low, and only 0.0 kg/ha was applied against the 103.8 kg/ha needed (0%)."
- Recommended: **urea, 60.9 kg/acre**, split across two stages, both delayed 2 days for forecast rain (25mm forecast, above the 20mm rain-hold threshold)
- Cost: ₹360.58/acre -- no previous cost/saving (no fertilizer log exists for this field; never invented)

### 3. Maize, recently over-applied nitrogen
- **Risk: high** -- "Applied N is 135.9 kg/ha, 207% of the 65.7 kg/ha the crop needs."
- Recommended: **DAP 42.2 kg/acre + MOP 20.0 kg/acre + urea 2.7 kg/acre** at sowing, urea split 19.2 + 19.3 kg/acre at knee-high/pre-tasseling
- Cost: ₹2,068.33/acre vs. ₹1,942.00/acre previously -- **costs ₹126.33/acre more** (the field genuinely needed potash the farmer hadn't bought; a correctly-priced complete plan beats an incomplete cheaper one)
- **This scenario's risk verdict was corrected tonight** -- see `docs/demo-scenarios.md` §3 and "Two real bugs" above. It used to say low risk; that was a bug (risk_analyzer silently using the server's wall-clock date instead of the request's own reference date), not a "healthy field" finding.

### Scenario 1's over-application check via `/risk-score` (a *planned* dose, not a logged one)
Same field, same-day planned application of 150 kg/acre urea (no other history in this call):
- **Risk: medium** -- "Applied N is 170.5 kg/ha, 138% of the 123.6 kg/ha the crop needs."
- Reads sensibly: 138% of the crop's full standard N need (no prior credit in this call, since
  none was logged) is correctly flagged as a moderate over-application, distinct from `/recommend`'s
  "high" verdict for the same field's *actual, already-applied* history (335% of the much
  smaller *remaining* need) -- the two endpoints are answering different questions
  ("what if I apply this" vs. "given what you already applied"), and both answers are internally
  consistent with what they're each comparing against.

## `PREDICT_MODE=mock` -- offline fallback, verified working

Confirmed in a throwaway container tonight: `PREDICT_MODE=mock` gives `/health` → `status: "ok"`,
`model_version: "mock-0.0.0+rules-mock"`; `/recommend` returns sample output built from
`docs/contract-fixtures/`, clearly labeled in `data_notes` ("This is sample output from the ML
mock, not a real recommendation."). No internet or model artifact needed. If the demo venue's
network or the model artifact is ever unavailable, set `PREDICT_MODE=mock` in `ml/.env` (or
override at the compose level: `PREDICT_MODE=mock docker compose up ml`) and the whole flow
still works end to end, just with clearly-labeled sample numbers instead of real ones.

## "Isn't this just a tabular model?" -- what to say

No. The product classifier is a small, secondary piece; it is not what sets the dose. Say it in
this order:

1. **The quantity and timing come from a transparent formula, not the model:**
   `fertilizer needed = standard dose for the crop (PAU Package of Practices) + soil-test
   adjustment (ICAR-IISS rules, or an STCR equation where one exists) - credit for what was
   recently applied`. Every number in that formula is a published agronomy value from a real
   table in `data/external/` -- nothing is learned or inferred by a model. This is what actually
   decides how much fertilizer, of what nutrient, and when.
2. **The classifier only ever refines *which product name* gets shown**, and only when it
   agrees with the rule-based choice. If the classifier's top guess disagrees with the
   rule-based plan (which happens in two of tonight's three scenarios), the rule-based plan is
   kept and the disagreement is written into the response's own `data_notes` -- visible, never
   silently overridden. A missing or broken classifier degrades `/health` but never blocks a
   recommendation.
3. **Every recommendation shows its own inputs**: standard dose, soil adjustment, prior credit,
   and the resulting need, per nutrient (N, P₂O₅, K₂O) -- that's the `nutrient_balance` block in
   every response, plus a `rule_trace` a judge can ask to see. It's explainable by construction,
   not after the fact.
4. **The risk assessment and cost comparison are also rule-based** (threshold comparisons
   against the same published tables), not model output.

If pressed further: the classifier itself *is* a plain tabular model (random forest, 5-fold
cross-validated, beats a majority baseline 3x on macro-F1) -- that's an honest, correct
description of that one component. The point above is architectural: it's a small piece
layered on top of a transparent formula, not the thing making the recommendation.

## Known limitations (say these before a judge finds them)

- **Every training/evaluation row for the classifier is synthetic.** 57 real rows total (from
  the 99-row public Kaggle dataset) across train/val/test combined; every accuracy number is an
  upper bound on real-world performance, not an estimate of it. See `MODEL_CARD.md`.
- **Chickpea's classifier output should not be trusted** (it collapses to predicting "dap" for
  nearly every misclassified row, regardless of actual soil values) -- the dose calculator's
  own numbers for chickpea are unaffected and remain correct.
- **Region is fixed to Punjab.** Every standard dose is a PAU number; there is no signal at all
  for another state's agro-climatic zone, and the request has no region field to even ask.
- **Not validated by a real agronomist against real farmer outcomes.** This is a Smart India
  Hackathon prototype; every scenario above was checked for internal consistency and formula
  correctness, not against a real field's actual result.
- **Two remaining unpriced products**: `ssp` and `npk_14_35_14` (also `npk_17_17_17` and
  `np_20_20_0`) have no sourced retail price yet -- if the formula ever calls for one, it's
  still recommended with a real dose, just excluded from the cost breakdown with a `data_notes`
  entry, never priced at zero or guessed.
- **The risk-analyzer date bug (see top of this file) was found and fixed tonight, not caught
  earlier** -- worth saying plainly if asked "how do you catch your own bugs": by actually
  running the real endpoints against realistic data before the demo, the same way this file was
  produced, not by trusting a fixture that was last verified weeks before it's shown to anyone.
