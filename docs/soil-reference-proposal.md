# Proposal: estimated soil properties from coordinates (PRD could-have)

**Status: proposed, not integrated. Needs an endpoint from Josh and a screen from Darsh before
this goes any further than the standalone module below.** Nothing in `docs/api-contract.md` or
`docs/backend-api.md` has been touched — those need both owners' sign-off per `AGENTS.md`, and
this doc is that sign-off request.

**Not a contradiction of `ml/data/README.md`'s decision log (Round 1):** SoilGrids was earlier
rejected as a *bulk training-dataset source* in favor of ISRIC SOTWIS (more stable, India-region
static extract, fetched once). That's a different use case from this one -- a *live,
per-request* lookup at recommendation time, where SoilGrids' beta status and occasional gaps
(see below) are tolerable for an optional pre-fill in a way they wouldn't be for training data
baked into the classifier.

## What exists today

`ml/src/data_pipeline/soil_reference.py` + `ml/tests/test_soil_reference.py` (7 tests, passing).
`get_soil_estimate(lat, lon)` calls ISRIC's free, no-key SoilGrids v2.0 REST API
(`https://rest.isric.org/soilgrids/v2.0/properties/query`, CC-BY 4.0, global 250m resolution) and
returns:

```python
{
  "ph": float | None,                  # pH units
  "organic_carbon_pct": float | None,  # percent
  "n": None, "p": None, "k": None, "moisture": None,  # always None, see below
  "source": "soilgrids_v2.0 (ISRIC), 0-5cm topsoil, CC-BY 4.0 -- https://rest.isric.org",
  "coverage": {"ph": bool, "organic_carbon_pct": bool},
}
```

It never raises for "no data here" -- only for a genuine network/API failure -- matching
`src/weather/weather_client.py`'s existing degrade-gracefully pattern.

## Why only 2 of the 6 fixed soil fields are covered

The soil schema is `n, p, k, ph, organic_carbon, moisture` (fixed by the problem statement, never
renamed). Checked each against what SoilGrids v2.0 actually provides (its full property list is
`bdod, cec, cfvo, clay, nitrogen, phh2o, sand, silt, soc, ocd, ocs` -- confirmed against ISRIC's
own docs, not assumed):

| our field | SoilGrids equivalent | verdict |
|---|---|---|
| `ph` | `phh2o` | **Maps.** Same underlying measurement (pH in water). Caveat: SoilGrids' shallowest band is 0-5cm topsoil; Indian Soil Health Card samples are typically 0-15/0-20cm (plough layer) -- a real depth mismatch, not identical, but pH doesn't usually vary sharply enough with depth in that range to invalidate it as an estimate. |
| `organic_carbon` | `soc` | **Maps**, after two unit conversions (SoilGrids returns a scaled integer in dg/kg; ÷10 for the d_factor, ÷10 again for g/kg→percent -- both confirmed against ISRIC's own `unit_measure` metadata in the live API response, not guessed). Same depth caveat as pH. |
| `n` | `nitrogen` (exists, but doesn't map) | **Does not map.** SoilGrids' `nitrogen` is TOTAL soil nitrogen (g/kg) -- mostly nitrogen locked in organic matter, not plant-available. Our schema's `n` is AVAILABLE nitrogen in kg/ha (Soil Health Card convention, alkaline-permanganate method). These are two different soil properties, not two units of the same thing. No defensible conversion exists between them -- same conclusion `docs/data-dictionary.md` already reached for the Kaggle training data's N/P/K columns. |
| `p` | *(none)* | **Cannot map -- SoilGrids has no phosphorus property at all.** |
| `k` | *(none)* | **Cannot map -- SoilGrids has no potassium property at all.** |
| `moisture` | *(none)* | **Cannot map.** SoilGrids is a static long-term-average map; moisture is dynamic and already sourced live from Open-Meteo elsewhere in this project. A different kind of data source entirely. |

**Net effect: at best, this pre-fills 2 of 6 required fields (pH, organic carbon). N, P and K --
the three numbers the dose formula actually needs most -- still require the farmer's own soil
test, always.** This is not a partial version of a feature that will eventually cover all six;
it structurally can't, with this or (as far as I could find) any other free global soil API,
because available N/P/K from a lab soil test isn't something satellite/covariate-based global
soil mapping estimates anywhere in the world today.

## A real, verified coverage gap -- not hypothetical

While building this I queried SoilGrids live for our own R11 demo coordinates (Ludhiana district,
~30.9,75.85) and got **`null` for every property, at every one of our three demo fields**,
reproduced across repeated calls. Points 10-50km away, off the city, returned real values. This
looks like an urban/built-up land-cover masking gap in SoilGrids' underlying model, not a bug on
our side or a transient error -- and it means **a field near any sizeable town could plausibly
get no estimate at all.** `coverage: {ph: false, organic_carbon_pct: false}` is how the module
reports this; it's a real, expected response, not an edge case to paper over.

## What the UI must say (for Darsh, if/when this ships)

However this ends up presented, it must never look like a completed soil test:

1. **Label it an estimate, every time it's shown**, e.g. "Estimated from satellite soil mapping
   (SoilGrids/ISRIC) -- not a lab test." Never present a pre-filled pH/organic-carbon value the
   same way as a farmer-entered one without that label attached.
2. **Only pre-fills 2 of 6 fields, and says so.** N, P, K and moisture must show as empty,
   required, farmer-entered fields regardless -- never zero-filled, never guessed.
3. **Handle "no coverage" as a real, expected outcome, not an error state.** When
   `coverage.ph`/`coverage.organic_carbon_pct` is `false` (which, per the finding above, is
   likely for any field near a town), the UI should say something like "No estimate available for
   this location" and leave those fields as plain farmer-entry too -- not a spinner stuck forever,
   not a generic error toast.
4. **The farmer can always overwrite it.** This is a convenience pre-fill, never a locked or
   authoritative value.
5. Cite the source somewhere reachable (CC-BY 4.0 requires attribution): "Soil property estimates
   from SoilGrids (ISRIC — World Soil Information), CC-BY 4.0."

## What I'm asking Josh and Darsh for

- **Josh:** a backend endpoint (e.g. `GET /soil-reference?lat=&lon=`) that calls this ML-side
  module (or a thin backend-side equivalent, if you'd rather not add an ML round-trip just for
  this) and returns the shape above. ISRIC's own fair-use limit is 5 calls/minute -- worth
  caching per-field on the backend too, not just the ML-side file cache this module already has.
- **Darsh:** a screen/section on the soil-input form that offers this as an optional "estimate
  from location" pre-fill for pH and organic carbon only, with the UI behavior in the section
  above -- and leaves N/P/K/moisture as plain required fields regardless.

Not building past the standalone module and its tests until we've agreed on the above --
per `AGENTS.md`, this crosses into backend and frontend territory and I'd rather get it right
once than build ahead of a contract nobody's agreed to yet.
