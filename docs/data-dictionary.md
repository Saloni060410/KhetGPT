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

| Field | Meaning | Unit |
|---|---|---|
| `quantity_kg_per_acre` | Fertilizer product quantity | kg/acre |
| `nutrient_balance.*_kg_ha` | Crop demand, soil supply, deficit, credit, fertilizer needed (P as P2O5, K as K2O) | kg/ha |
| `use_efficiency` | Share of applied nutrient the crop recovers | 0 to 1 |
| `risk.level` | Over- and under-application risk | `low`, `medium`, `high` |
| `cost.*_inr_per_acre` | Plan cost, previous cost, saving | INR per acre |
| `model_version` | `<model>-<semver>+rules-<hash8>` | string |

## External reference tables (`ml/data/external/`, contract C5)

Crop, region and fertilizer reference data live here, not in application code (NFR5). Richa
owns these files; Saloni's NPK calculator and Josh's reference proxy read them. Column schemas
below are locked as of R1/R3; values are filled in incrementally (v0 for wheat/rice landed in
R3, full coverage after). Cells marked `TODO(data)` mean a value could not be verified against
an authoritative source and was deliberately left blank rather than invented.

**Engine formula (R3):** the NPK calculator computes, per nutrient, `fertilizer needed =
(crop demand - soil supply) / use efficiency - credit from recent applications`. `crop demand`
comes from `crop_requirements.csv`, `soil supply` and `use efficiency` from
`nutrient_efficiency.csv`; `credit` uses `agronomy_rules.yaml`'s `credit_window_days`. This
superseded R1's `crop_nutrient_norms.csv` (renamed/restructured to `crop_requirements.csv`)
and its `soil_rating_multipliers` block (removed — doesn't fit this formula).

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

### crop_requirements.csv

(Replaces R1's `crop_nutrient_norms.csv` — renamed and restructured for the R3 engine formula.)

| Column | Meaning | Unit |
|---|---|---|
| `crop_id` | Foreign key into crops.csv | snake_case id |
| `variety` | Variety/cultivar the row applies to, or a generic label if the source doesn't split by variety | string |
| `irrigation` | Irrigation condition the requirement applies to | `irrigated` / `rainfed` |
| `n_kg_ha`, `p2o5_kg_ha`, `k2o_kg_ha` | Seasonal crop nutrient demand (the engine's "crop demand") | kg/ha (source tables are in kg/acre; converted at 1 acre = 0.4047 ha, i.e. x2.4711) |
| `region` | State/region the requirement applies to | e.g. `Punjab` |
| `source` | Citation, including page number | free text |
| `notes` | Caveats (soil-test-conditional additions, variety exceptions, alternative STCR equations, etc.) | free text |

**v0 as of R3: wheat and rice** (real, PAU-sourced). Remaining crops land in a follow-up pass.

### nutrient_efficiency.csv

New in R3, feeds the engine's `soil supply` and `use efficiency` terms directly.

| Column | Meaning | Unit |
|---|---|---|
| `nutrient` | `n` / `p` / `k` | string |
| `soil_supply_factor` | Share of a soil-test kg/ha value that's actually crop-available (the STCR "Cs" coefficient) | 0–1, or `TODO(data)` |
| `fertilizer_use_efficiency` | Share of applied nutrient the crop recovers (STCR "Cf" / recovery efficiency) | 0–1, or `TODO(data)` |
| `source` | Citation, or an explicit "no defensible source found" statement — never left blank | free text |
| `notes` | Caveats (national-average vs. region-specific, decomposition limitations, etc.) | free text |

**Known gap, flagged rather than guessed:** ICAR-IISS's national STCR compilation ("Four
Decades of STCR Research") publishes only combined regression coefficients per crop/variety
targeted-yield equation (e.g. wheat: `FN = 5.65T - 1.34SN`), not a separable
`soil_supply_factor`/`fertilizer_use_efficiency` pair — decomposing them would require an
unpublished nutrient-requirement constant, so `soil_supply_factor` is `TODO(data)` for all
three nutrients as of R3. `fertilizer_use_efficiency` for N uses a real but *national-average,
rice-only* recovery-efficiency figure (42.6%) as an interim stand-in; P and K are `TODO(data)`.

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
doesn't fit the `(crop demand - soil supply) / use efficiency - credit` formula, which uses
`nutrient_efficiency.csv`'s `soil_supply_factor` instead. All keys remain `team assumption`
placeholders as of R3; validating them against real guidance is follow-up work.

## Reference tables (`ml/data/external/`, schemas in the prompt packs, contract C5)

`crops.csv`, `crop_varieties.csv`, `growth_stages.csv`, `crop_requirements.csv`, `split_schedule.csv`, `nutrient_efficiency.csv`, `fertilizer_products.csv`, `soil_test_ratings.csv`, `agronomy_rules.yaml`, `explanation_templates.yaml`, `seasonal_weather.csv`. Every value has a `source`.
