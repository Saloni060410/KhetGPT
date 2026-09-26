# ML data

Raw and processed datasets are gitignored (large / licensed). Fetch them locally as below.
`data/external/` holds small reference tables (ICAR nutrient norms) and is committed.

| Dataset | Source | Goes in |
|---|---|---|
| Fertilizer Prediction (N-P-K, moisture, temperature, humidity, crop → fertilizer) | Kaggle "Fertilizer Prediction" | `raw/` |
| Soil Health Card district data | data.gov.in, Soil Health Card scheme | `raw/` |
| Crop nutrient requirement norms per stage | ICAR / state agriculture department tables | `external/` |
| (Stretch) Satellite soil reference | SoilGrids / Bhuvan | `raw/` |

Cleaned, feature-engineered output of `src/data_pipeline/` is written to `processed/`.

TODO(data): Richa to add exact download links and file names once the target crops and
region are confirmed (PRD §11).
