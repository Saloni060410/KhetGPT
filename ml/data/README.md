# ML data

`raw/` and `processed/` are gitignored (large or licensed). `external/` holds small reference tables and is committed. Richa owns everything here.

## Datasets

Richa finds, judges and chooses the datasets. Each chosen dataset gets an entry below with:

- URL, licence and terms, date retrieved
- sha256, row count, columns, units
- crops covered, and whether it has product labels, quantity labels or neither
- whether it is real or synthetic, and what it is used for

Also keep a decision log of candidates that were rejected and why (paid, unlicensed, too small, near-duplicate rows, unclear origin).

TODO(data): Richa fills in the chosen datasets (prompt pack, step R2).

## Reference tables in `external/`

| File | Purpose |
|---|---|
| `crops.csv`, `crop_varieties.csv`, `growth_stages.csv` | Vocabulary used by every service |
| `crop_requirements.csv` | Crop nutrient demand (kg/ha of N, P2O5, K2O) |
| `nutrient_efficiency.csv` | Soil supply factor and fertilizer use efficiency per nutrient |
| `split_schedule.csv` | Share of each nutrient per growth stage |
| `fertilizer_products.csv` | Nutrient content, price, price date, source |
| `soil_test_ratings.csv` | Low and high cut-offs per soil parameter |
| `agronomy_rules.yaml` | Thresholds: rain hold, credit window, risk ratios, tolerance |
| `explanation_templates.yaml` | Plain-language sentences (English and Hindi) |
| `seasonal_weather.csv` | Seasonal-average weather fallback |
| `dataset_manifest.json` | Hashes and row counts for the chosen datasets |

Every value has a `source` column or comment. Missing values are `TODO(data)`, never invented.
