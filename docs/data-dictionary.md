# Data dictionary

Units and meaning of the fields shared across services. Keep in step with `api-contract.md`, `backend/prisma/schema.prisma` and `ml/data/external/`.

## Soil (fixed by the problem statement)

Never add, remove or rename these fields.

| Field | Meaning | Unit |
|---|---|---|
| `n` | Available nitrogen | kg/ha. TODO(data): Richa confirms how each chosen dataset maps to this |
| `p` | Available phosphorus | kg/ha. TODO(data): confirm |
| `k` | Available potassium | kg/ha. TODO(data): confirm |
| `ph` | Soil pH | 0 to 14 |
| `organic_carbon` | Organic carbon content | percent |
| `moisture` | Soil moisture | percent |

## Crop

| Field | Meaning | Values |
|---|---|---|
| `crop_type` | Crop id | from `GET /reference/crops` (`ml/data/external/crops.csv`) |
| `variety` | Optional variety id | from the same endpoint, only where Richa's data has varieties |
| `growth_stage` | Stage id | from the same endpoint (`growth_stages.csv`) |
| `sowing_date` | Sowing date | `YYYY-MM-DD`, optional. Dates the schedule |

## Weather

| Field | Meaning | Unit |
|---|---|---|
| `temperature_c` | Current air temperature | degrees C |
| `humidity_pct` | Relative humidity | percent |
| `rainfall_mm_forecast` | Forecast rainfall for the next 5 days | mm |
| `source` | `live`, `cached` or `seasonal_average` | |

Current provider is **Open-Meteo** (no API key required) — see `ml/src/weather/`. An earlier
PRD draft specified OpenWeatherMap; that was superseded (see commit `9f25bf5`).

## Recommendation

**Revised shape** (see the engine-formula note under External reference tables for why): the
original `nutrient_balance.{crop_demand, soil_supply, deficit, use_efficiency}_kg_ha` shape is
replaced by `standard_dose, adjustment, credit, total` — the demand/supply/efficiency split
isn't computable from any source we have; standard-dose-plus-adjustment is.

| Field | Meaning | Unit |
|---|---|---|
| `quantity_kg_per_acre` | Fertilizer product quantity | kg/acre |
| `nutrient_balance.*.standard_dose_kg_ha` | From crop_requirements.csv (P as P2O5, K as K2O) | kg/ha |
| `nutrient_balance.*.adjustment_kg_ha` | From soil_test_adjustments.csv, by the field's soil-test rating | kg/ha (signed) |
| `nutrient_balance.*.credit_kg_ha` | Credited from recent applications within agronomy_rules.yaml's credit_window_days | kg/ha |
| `nutrient_balance.*.fertilizer_needed_kg_ha` | `standard_dose + adjustment - credit` | kg/ha |
| `risk.level` | Over- and under-application risk | `low`, `medium`, `high` |
| `cost.*_inr_per_acre` | Plan cost, previous cost, saving | INR per acre |
| `model_version` | `<model>-<semver>+rules-<hash8>` | string |

## External reference tables (`ml/data/external/`, contract C5)

Crop, region and fertilizer reference data live here, not in application code (NFR5). Richa
owns these files; Saloni's NPK calculator and Josh's reference proxy read them. Column schemas
below are locked as of R1/R3; values are filled in incrementally (v0 for wheat/rice landed in
R3, full coverage after). Cells marked `TODO(data)` mean a value could not be verified against
an authoritative source and was deliberately left blank rather than invented.

**Engine formula (revised — see below):** the NPK calculator computes, per nutrient,
`fertilizer needed = standard dose + soil-test adjustment - credit from recent applications`.
`standard dose` comes from `crop_requirements.csv`, `soil-test adjustment` from
`soil_test_adjustments.csv`, `credit` uses `agronomy_rules.yaml`'s `credit_window_days`.

**Why this isn't the demand/supply/efficiency formula from R3:** R3 originally specified
`fertilizer needed = (crop demand - soil supply) / use efficiency - credit`, fed by
`crop_requirements.csv` (demand) and `nutrient_efficiency.csv` (supply + efficiency). That
formula assumed `crop_requirements.csv` held the crop's *gross nutrient uptake* — but the only
sourced numbers available (PAU's flat rates) are already **fertilizer-dose recommendations for
medium-fertility soil**, not gross uptake ("add the following amounts of *fertilizers* ... on
*medium fertile soils*" — PAU POP Rabi 2025-26 p.9). Running an already-net dose through
`(demand - supply) / efficiency` double-counts the soil's contribution and inflates the
recommendation — the opposite of the product's goal. This is also *why*
`nutrient_efficiency.csv`'s `soil_supply_factor`/`fertilizer_use_efficiency` pair couldn't be
sourced: STCR's published coefficients (e.g. wheat `FN = 5.65T - 1.34SN`) are for exactly this
kind of already-net equation, with soil supply and efficiency pre-combined into single
regression coefficients — there was never a clean separable pair to find. `nutrient_efficiency.csv`
is retired; `soil_test_adjustments.csv` replaces it. R1's `crop_nutrient_norms.csv` (renamed to
`crop_requirements.csv` in R3) and `agronomy_rules.yaml`'s `soil_rating_multipliers` block
(removed in R3, doesn't fit either formula) stay retired under this design too.

### crops.csv

| Column | Meaning | Unit / allowed values |
|---|---|---|
| `crop_id` | Stable snake_case identifier, used as `crop_type` across the API/DB/UI | e.g. `wheat`, `rice`, `maize`, `cotton`, `sugarcane`, `chickpea` |
| `name_en` | English display name | string |
| `name_hi` | Hindi display name | string (Devanagari) |
| `dataset_label` | The label this crop maps to in the chosen training dataset(s) | string, filled in R2 once datasets are chosen |
| `season` | Cropping season | `rabi` / `kharif` / `annual` |
| `source` | Citation for this crop's inclusion/season | free text |

### growth_stages.csv

| Column | Meaning | Unit / allowed values |
|---|---|---|
| `crop_id` | Foreign key into crops.csv | snake_case id |
| `stage_id` | Stable snake_case identifier for the stage | e.g. `sowing`, `crown_root_initiation` |
| `name_en` / `name_hi` | Display names | string |
| `order` | 1-indexed sequence of the stage within the crop's lifecycle | integer |
| `das_start` / `das_end` | Days after sowing marking the start/end of the stage | integer days, or `TODO(data)` |
| `source` | Citation, including page number where available | free text |

**Rice is transplanted, not direct-sown.** Its `das_start`/`das_end` values for stages from
`first_n_split` onward are **Days After Transplanting (DAT)** per PAU convention, not days
after nursery sowing — the two diverge because nursery duration (25–45+ days) varies by
season and variety. This is flagged in each affected row's `source` cell. Anything consuming
these rice stage windows (e.g. `rain_hold` logic, split-schedule timing) must treat them as
DAT, not DAS, for rice specifically.

### crop_varieties.csv

New. Header-only unless a crop's chosen dataset actually distinguishes varieties.

| Column | Meaning | Unit |
|---|---|---|
| `crop_id` | Foreign key into crops.csv | snake_case id |
| `variety_id` | Stable snake_case identifier | e.g. `pr_132` |
| `name_en` / `name_hi` | Display names | string |
| `source` | Citation | free text |

**As of R3:** one row (`rice`/`pr_132`) — the only case in hand where PAU publishes a real,
different fertilizer dose by variety. `crop_requirements.csv` rows for every other crop use
`variety_id = generic`, a fixed fallback id that is *not* itself listed here (it isn't a real
named variety — see `test_requirement_varieties_are_generic_or_declared`).

### crop_requirements.csv

(Replaces R1's `crop_nutrient_norms.csv`. Holds the **standard dose** — PAU's flat,
medium-fertility-soil fertilizer recommendation — not gross crop nutrient demand; see the
engine-formula note above for why that distinction matters.)

| Column | Meaning | Unit |
|---|---|---|
| `crop_id` | Foreign key into crops.csv | snake_case id |
| `variety_id` | Foreign key into crop_varieties.csv, or the fixed fallback `generic` | snake_case id |
| `irrigation` | Irrigation condition the requirement applies to | `irrigated` / `rainfed` |
| `n_kg_ha`, `p2o5_kg_ha`, `k2o_kg_ha` | Standard fertilizer dose | kg/ha (source tables are in kg/acre; converted at 1 acre = 0.4047 ha, i.e. x2.4711) |
| `source` | Citation, including page number | free text |
| `notes` | Caveats (soil-test-conditional additions, variety exceptions, alternative STCR equations, etc.) | free text |

Region is not a column — every row here is Punjab-specific by construction (PAU POP is a
Punjab-only source), so it's stated in `source`/`notes` prose instead of a dedicated field.
Engine lookup order: exact `(crop_id, variety_id)` match, then `(crop_id, "generic")`.

**v0 as of R3: wheat and rice** (real, PAU-sourced). Remaining crops land in a follow-up pass.

### soil_test_adjustments.csv

New — replaces the retired `nutrient_efficiency.csv`. Adjusts the standard dose based on the
field's own soil-test rating for that nutrient, using PAU's published soil-test-conditional
rules where they exist.

| Column | Meaning | Unit |
|---|---|---|
| `crop_id`, `variety_id` | Foreign keys into crop_requirements.csv | snake_case id |
| `nutrient` | `n` / `p` / `k` | string |
| `soil_rating` | The soil_test_ratings.csv band this adjustment applies at | `low` / `medium` / `high`, or `TODO(data)` |
| `adjustment_kg_ha` | Amount to add to (positive) or subtract from (negative) the standard dose | kg/ha, or `TODO(data)` |
| `source` | Citation, or an explicit statement that no PAU adjustment table was found — never left blank | free text |
| `notes` | Caveats, including STCR alternatives where a full replacement equation exists instead | free text |

**A missing `(crop_id, variety_id, nutrient, soil_rating)` row means no adjustment (0) — this
is a deliberate, safe default**, unlike the retired `nutrient_efficiency.csv`, where a missing
`soil_supply_factor` could not safely default to anything (a 0 there would have overstated the
deficit and recommended *more* fertilizer, the wrong direction) and had to block the
calculation instead. Adjustments here can be negative by design (e.g. rice: PAU says apply
P2O5/K2O "only when the soil test shows deficiency" — the standard dose already assumes
deficiency, so the adjustment for a *sufficient* soil test is `-` the full standard dose,
skipping it).

**Known gap, flagged rather than guessed:** wheat and rice N (and wheat P2O5) have no
published PAU soil-test adjustment table — only `TODO(data)` rows, with the STCR equation
noted as a full alternative computation path (see `crop_requirements.csv`). Wheat K also has a
`very_low` tier PAU publishes that `soil_test_ratings.csv`'s low/medium/high scale doesn't
capture — flagged in that row's notes rather than silently collapsed into `low`.

### split_schedule.csv

| Column | Meaning | Unit |
|---|---|---|
| `crop_id`, `stage_id` | Foreign keys into crops.csv / growth_stages.csv | snake_case id |
| `n_fraction`, `p_fraction`, `k_fraction` | Share of that nutrient's total dose applied at this stage | 0–1, each nutrient's fractions sum to 1 across a crop's stages |

**v0 as of R3: wheat and rice.** Note rice's stage timing is in Days After Transplanting
(DAT), not DAS — see the growth_stages.csv note above.

### fertilizer_products.csv

| Column | Meaning | Unit |
|---|---|---|
| `product_id` | Stable snake_case identifier | e.g. `urea`, `dap`, `npk_10_26_26` |
| `name` | Display name | string |
| `n_pct`, `p2o5_pct`, `k2o_pct` | Nutrient content by weight (guaranteed grade, per FCO 1985 nomenclature) | % (0–100) |
| `price_inr_per_kg` | Retail price | INR/kg, or `TODO(data)` if no defensible dated price was found |
| `price_date` | Date the price was current as of | ISO date, or `TODO(data)` if not confirmed |
| `source` | Citation (IFFCO price list, Department of Fertilizers notification, state MRP, etc.) | free text |

**As of R3:** all 9 grades appearing in the chosen training dataset are populated with real
N/P2O5/K2O percentages (FCO nomenclature is definitional, not looked up per-product). Prices
are real and dated for urea, DAP, NP 28-28-0 and NPK 10-26-26 (all from IFFCO's published
price list); MOP, SSP, and the remaining NPK grades are `price_inr_per_kg: TODO(data)` because
they aren't under a statutory uniform MRP and no single defensible current figure was found —
never guessed.

### soil_test_ratings.csv

| Column | Meaning | Unit |
|---|---|---|
| `parameter` | Soil parameter name | `organic_carbon`, `n`, `p`, `k`, `ph` |
| `unit` | Unit that parameter is measured in | e.g. `%`, `kg/ha`, `pH units` |
| `low_below` / `high_above` | Cutoffs separating low / medium / high ratings | same unit as `unit` |
| `source` | Citation | free text |

**Full coverage as of R3** (organic_carbon, n, p, k, ph) — all from ICAR-IISS Bhopal's
national soil-test interpretation ranges, as used on Soil Health Cards. `p`'s cutoffs are the
Olsen-P method figures, applicable to Punjab's predominantly alkaline soils.

### agronomy_rules.yaml

Rule-layer parameters for the NPK calculator / risk engine: nutrient credit window (days),
rain-hold thresholds (mm / days), over- and under-application risk ratios, and the sanity-test
formula tolerance (%). Every key carries an inline comment with either a source citation or
the words "team assumption". R1's `soil_rating_multipliers` block was **removed in R3** — it
doesn't fit either the retired demand/supply/efficiency formula or the current
dose/adjustment/credit one. All keys remain `team assumption` placeholders; validating them
against real guidance is follow-up work.

### seasonal_weather.csv

Fallback weather when a live/cached call isn't available (`weather.source = seasonal_average`).

| Column | Meaning | Unit |
|---|---|---|
| `region_key` | Region identifier | snake_case, e.g. `punjab_ludhiana` |
| `month` | Calendar month | 1–12 |
| `temperature_c`, `humidity_pct`, `rainfall_mm_5day` | Seasonal-average weather | °C, %, mm |
| `source` | Citation | free text |

**One example row as of R3** (`punjab_ludhiana`, January) — climate normals from a public
aggregator, not IMD directly; `rainfall_mm_5day` is a derived approximation (monthly total
scaled to a 5-day window), noted as such in the row's source cell. Remaining 11 months are a
follow-up pass.

### explanation_templates.yaml

`template_id -> {en, hi}` sentence with `{placeholders}`, keyed to Saloni's `rule_trace`
`rule_id`s (contract C6). Full coverage (every rule_id, risk reason, soil/yield impact
statement) is R9's job — one example exists as of R3, matching the
`soil_test_adjustments.csv` wheat-K-low rule, to prove the shape out.

## Reference tables (`ml/data/external/`, schemas in the prompt packs, contract C5)

`crops.csv`, `crop_varieties.csv`, `growth_stages.csv`, `crop_requirements.csv`, `soil_test_adjustments.csv`, `split_schedule.csv`, `fertilizer_products.csv`, `soil_test_ratings.csv`, `agronomy_rules.yaml`, `explanation_templates.yaml`, `seasonal_weather.csv`. Every value has a `source`. (`nutrient_efficiency.csv` from the original R3 schema is retired — see the engine-formula note above.)
