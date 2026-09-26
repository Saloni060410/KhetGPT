# ML data

`raw/` and `processed/` are gitignored (large or licensed). `external/` holds small reference
tables and datasets that are safe/small enough to commit, and *is* committed. Richa owns
everything here.

Every dataset actually in use is tracked in [`data/external/dataset_manifest.json`](external/dataset_manifest.json)
(sha256, row count, columns) -- that file, not this README, is the source of truth `ingest.py`
checks against (run `python -m src.data_pipeline.ingest` to verify what's already there). This
README explains *what* each one is and *why* it was chosen.

## Datasets in use

### fertilizer_prediction (`data/raw/fertilizer_prediction.csv`, gitignored)

- **Source:** [Kaggle "Fertilizer Prediction"](https://www.kaggle.com/datasets/gdabhishek/fertilizer-prediction) (uploaded by gdabhishek, 2019)
- **Licence:** **Unknown** -- not stated by the uploader on the Kaggle page. Flagging this
  honestly rather than assuming CC0; if this becomes a blocker later, treat it as a licence
  risk to revisit.
- **Retrieved:** 2026-09-26
- **How it was retrieved:** The Kaggle download button requires a logged-in account, which
  wasn't available in this environment. Instead, all 99 rows were read from Kaggle's own
  public dataset-preview API (`GetDataViewExternal`, called by the page itself to render its
  data preview), in two pages of 50 + 49 rows, and cross-checked against the file's own
  `totalRows: 99` metadata (from `GetDatabundleExternal`) before being saved verbatim as CSV.
  No values were transcribed by hand or guessed.
- **sha256:** `2a32ca081dbc616ee17ff4c273345c0e520e3deae59502fb1057ff3704f5a0d8`
- **Rows:** 99 (verified, 0 exact duplicates)
- **Columns:** `Temparature, Humidity, Moisture, Soil Type, Crop Type, Nitrogen, Potassium, Phosphorous, Fertilizer Name`
- **Units:** Temperature in °C, Humidity/Moisture in %. N/P/K units are **not stated by the
  source** -- treat as relative/index values, not confirmed kg/ha, until reconciled in R4's
  unit-reconciliation step.
- **Crops covered:** Maize, Sugarcane, Cotton, Tobacco, Paddy, Barley, Wheat, Millets, Oil
  seeds, Pulses, Ground Nuts (generic labels, not variety-specific; "Pulses" doesn't
  distinguish chickpea from other pulses).
- **Used for:** Seed training data for the fertilizer-*type* classifier (contract C4's
  `CLASSIFIER_TARGET`). Small (99 rows) and missing pH/organic-carbon/growth-stage features --
  documented as a real limitation, not hidden. Quantity and schedule come from the
  PAU-sourced `reference_doses.csv` / `split_schedule.csv`, not from this dataset.

### isric_sotwis_igp_soil_profiles (`data/external/isric_sotwis_igp_soil_profiles.csv`, committed)

- **Source:** [ISRIC SOTWIS Indo-Gangetic Plains](https://data.isric.org/geonetwork/srv/api/records/6eba341b-79d7-4b40-bc19-14a9066f1386) (direct file: `https://files.isric.org/public/sotwis/SOTWIS_IGP-IN.zip`)
- **Licence:** CC BY 3.0
- **Retrieved:** 2026-09-26
- **How it was retrieved:** Direct download (no login, no paywall). The archive contains a
  full GIS package (shapefiles, Access/SQLite DBs, KMZ); only the tabular attribute table
  (`GIS/SOTWIS/SOTWIS_0-20cm_parametersestimates/IGP-IN_SOTWISv1_t1s1d1.dbf`) was extracted
  with `dbfread` and exported to CSV with renamed, self-explanatory columns. Geometry was
  discarded -- we only need the soil-property values, not the map shapes.
- **sha256:** `7b14c66d072fb1ad190b1cb90e61bf60750bd01b83f83102f8383a6017574519`
- **Rows:** 497 (one per SOTER map unit, 0-20cm depth layer)
- **Columns:** see `dataset_manifest.json` -- includes `ph_h2o`, `total_carbon_pct`,
  `total_nitrogen_pct`, `ec_ds_m`, `bulk_density_g_cm3`, `sand_pct/silt_pct/clay_pct`, and more.
- **Coverage:** The whole Indo-Gangetic Plains (1:1,000,000 scale) -- **includes Punjab but is
  not filtered to it specifically**; no spatial join to Punjab's boundary was done.
- **Real or synthetic:** Real SOTER survey soil profiles (ISRIC, scientific reference body).
- **Used for:** Complementary reference only -- cross-checking realistic soil-parameter ranges
  (pH, organic carbon, N%, EC) for the region. Polygon/map-unit level, **not per-field data**,
  and **not used as classifier training rows**.

## Evaluated but not ingested

### FUBC 2017-18 (IFA/FAO Fertilizer Use by Crop)

- **Source:** [Dryad, doi:10.5061/dryad.2rbnzs7qh](https://datadryad.org/dataset/doi:10.5061/dryad.2rbnzs7qh) -- peer-reviewed in *Nature Scientific Data* ([10.1038/s41597-022-01592-z](https://doi.org/10.1038/s41597-022-01592-z))
- **Licence:** Public domain (CC0) -- fully confirmed
- **Why not ingested:** The raw CSV download is behind an anti-bot challenge (Anubis/BotStopper)
  that couldn't be mechanically passed in this session, and the site's in-browser preview
  truncates before reaching India alphabetically in the country-sorted file. Rather than
  fabricate India's rice/wheat/cotton/sugarcane N/P2O5/K2O values, this was left unfetched.
  **Follow-up:** a teammate should manually download `FUBC_1_to_9_data.csv` or
  `FUBC_9_raw_data.csv` in a normal browser (the anti-bot check passes fine for a human) and
  hand it off for R10 norm cross-checking -- it's real, free, and directly relevant.

## Decision log -- datasets considered and rejected

**Round 1:**
- **Soil Health Card district data (data.gov.in):** mostly scheme-administration stats (cards
  issued), not raw nutrient values; the real nutrient dashboard is on soilhealth.dac.gov.in
  with no bulk export (see below).
- **SoilGrids (global):** API explicitly in beta, no uptime guarantee; deprioritized in favor
  of ISRIC SOTWIS, which is the more stable, India-region-specific product from the same body.

**Round 2 (broader dataset search):**
- **Crop and Fertilizer Dataset for Western Maharashtra (Kaggle):** fertilizer-*name* label
  only (no quantity), a `Link` column pointing to reference articles per row suggests
  templated/repeated rows rather than independent field observations, and wrong region.
- **crops-npk-data-set (Kaggle, javakhan):** no fertilizer label at all -- it's a
  crop-recommendation dataset (soil → which crop to grow), the opposite of what we need; a
  `Variety` column (Basmati, Durum) reads as fabricated; suspiciously round 20,000-row count.
- **Crop Recommendation Dataset (Kaggle/ICFA, atharvaingle):** same wrong-direction problem as
  above -- predicts crop choice, not fertilizer dose; a secondary source's claim that it has
  "applied fertilizer kg/ha" was a misreading of its soil-nutrient-ratio columns.
- **Soil Health Data (Dataful, Maharashtra *and* Punjab):** real government data, but marked
  "Exclusive" (paywalled) on both the Maharashtra (774k rows) and Punjab (199,881 rows,
  village-level, exact region match) versions. Rejected on licence grounds per our own rule
  even though the Punjab version was otherwise an excellent match.
- **soilhealth.dac.gov.in direct scrape:** `robots.txt` technically allows crawling, but no
  terms-of-use/licence is posted anywhere on the site (checked the Policy page and footer
  directly) -- same "unclear origin" problem as a paywalled source, just from a different
  angle. Not attempted.
- **Zenodo "Fertilizer Recommendation Using Deep Soil Inspection" (15314789) and "From Soil
  Prediction to Fertilizer Prescription" (21761939):** both records are PDF papers only --
  no data file actually attached despite descriptive text implying a dataset.
- **Zenodo "Creating a dataset on fertilizers and fertilization recommendations" (14244316):**
  real, well-documented, CC-BY-4.0 -- but 38 European countries, no India/Punjab.
- **IEEE DataPort "Soil Fertility Data For Fertilizer Recommendation":** paywalled
  (subscription required); origin not stated as real, "pre-processed, no nulls" reads as
  synthetic.
- **GitHub Saurabh022mishra/Fertilizer-Recommendation-System:** despite the repo name, the CSV
  is a static ~40-row per-crop lookup table, not measured samples; no fertilizer name column
  at all; no licence (`license: null`).
- **Mendeley "Pune private-lab soil dataset" (1,988 samples, cited in 2012-era arXiv papers):**
  real lab data, but no live download link could be found anywhere; also missing N and any
  crop/fertilizer label.
- **Mendeley "Soil Sight" remote-sensing dataset:** remote-sensing *estimates*, not
  lab-measured; no crop/fertilizer target; region not confirmed as India.
- **"AgriNet" (Uttar Pradesh, rice, claimed fertilizer target):** referenced in a search
  summary but could not be traced to an actual, accessible dataset page -- treated as
  unverified and not used.
- **Punjab open data portal (punjab.data.gov.in):** only aggregate area/production/yield and
  "fertilizer consumption" stats found; nothing at per-field granularity.
- **ICAR-NBSS&LUP / Bhoomi Geoportal:** soil resource *maps* (1:1M-1:250K), GIS layers with
  access restrictions per their own site; not a tabular per-field dataset. Possible source for
  the stretch-goal satellite/spatial reference (R13), not core data.

**General caution for future rounds:** several "dataset" search hits (Zenodo especially)
turned out to be PDF papers with no attached data despite implying otherwise in their
descriptions -- always confirm an actual downloadable file exists before counting a candidate.

## Reference tables in `external/`

| File | Purpose |
|---|---|
| `crops.csv`, `crop_varieties.csv`, `growth_stages.csv` | Vocabulary used by every service |
| `reference_doses.csv` | Published standard dose per crop, irrigation, variety (`generic` fallback), in kg/ha of N, P2O5, K2O |
| `soil_adjustments.csv` | Signed dose adjustments by soil rating, from published soil-test rules |
| `stcr_equations.csv` | Optional STCR targeted-yield equations: `a` x target yield - `b` x soil test |
| `nutrient_efficiency.csv` | Fertilizer use efficiency per crop and nutrient (`default` fallback), used only for credit |
| `split_schedule.csv` | Share of each nutrient per growth stage |
| `fertilizer_products.csv` | Nutrient content, price, price date, source |
| `soil_test_ratings.csv` | Low and high cut-offs per soil parameter |
| `agronomy_rules.yaml` | Thresholds: rain hold, credit window, risk ratios, tolerance |
| `explanation_templates.yaml` | Plain-language sentences (English and Hindi) |
| `seasonal_weather.csv` | Seasonal-average weather fallback |
| `dataset_manifest.json` | Hashes and row counts for the chosen datasets |

Every value has a `source` column or comment. Missing values are `TODO(data)`, never invented.
