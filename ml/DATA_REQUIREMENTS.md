# Data requirements for Richa — classifier training data + open reference-table gaps

Two parts: (A) a synthetic dataset to replace the raw Kaggle file we can't fetch, sized and
shaped to what `feature_engineering.py` and `train.py` actually consume today. (B) every other
data gap already flagged in `ml/PROGRESS.md`, consolidated here so this is one complete list.

Whatever gets built, label it as synthetic everywhere it's used (`ml/data/README.md`,
`dataset_manifest.json`) — project rule, not optional.

## A. Synthetic classifier training dataset

### File
`ml/data/raw/fertilizer_prediction.csv` — gitignored, same path the pipeline already expects
(`ingest.py`, `clean.py`, `dataset_manifest.json`). Recommended over inventing a new path: it's
a drop-in replacement, no code changes needed anywhere.

### Required columns (exact names, case-sensitive — `clean.py`'s `RAW_COLUMN_RENAME` expects these)

| Column | Type | Unit / allowed values |
|---|---|---|
| `Temparature` | number | °C |
| `Humidity` | number | % |
| `Moisture` | number | % |
| `Soil Type` | text | free text, not currently used as a feature — any value is fine |
| `Crop Type` | text | **must be one of the exact strings below** |
| `Nitrogen` | number | see "optional upgrade" below |
| `Potassium` | number | see "optional upgrade" below |
| `Phosphorous` | number | see "optional upgrade" below |
| `Fertilizer Name` | text | **must be one of the exact strings below** |

### `Crop Type` — only these 5 strings map to a known crop right now

| Write this exact string | Maps to |
|---|---|
| `Wheat` | wheat |
| `Paddy` | rice |
| `Maize` | maize |
| `Cotton` | cotton |
| `Sugarcane` | sugarcane |

**Chickpea is currently unusable for this file.** `crops.csv`'s `dataset_label` for chickpea is
still `TODO(data)`, so any chickpea-labeled row gets silently dropped by `clean.py` today.
Either fill in a real `dataset_label` for chickpea in `crops.csv` first, or leave chickpea out
of the synthetic set for now.

Variety is not captured by this raw format at all (no variety column) — `pr_132` (rice) and
`kabuli` (chickpea) rows aren't distinguishable here, only in `crop_varieties.csv` itself.

### `Fertilizer Name` — only these strings map to a known product

| Write this exact string | Maps to | Priced today? |
|---|---|---|
| `Urea` | urea | yes |
| `DAP` | dap | yes |
| `28-28` | np_28_28_0 | yes |
| `10-26-26` | npk_10_26_26 | yes |
| `MOP` | mop | **no — price TODO** |
| `SSP` | ssp | **no — price TODO** |
| `14-35-14` | npk_14_35_14 | **no — price TODO** |
| `17-17-17` | npk_17_17_17 | **no — price TODO** |
| `20-20` | np_20_20_0 | **no — price TODO** |

Any other string is dropped, logged, not guessed. Since only 4 products are priced right now,
weight the synthetic classes toward those 4 if you want the classifier's output to actually be
usable end-to-end (an unpriced product picked by the classifier still blocks the schedule —
see part B).

### Row count and class balance
- Current real data has 99 rows, 7 classes, smallest class 2 rows — too small to trust (my own
  CV run: XGBoost doesn't beat baseline). Target meaningfully more: **at least 40–50 rows per
  class**, ideally more, across the 4 priced classes at minimum (300–400+ rows total if you
  cover all 9). More than that only helps.
- Cover all 5 usable crops, not just wheat/rice — `to_products()` and the classifier both need
  every crop we support to have real training signal, not just the two PAU has doses for so far.
- Vary `Temparature`/`Humidity`/`Moisture` realistically per crop and season (rabi vs kharif
  ranges), not the same three numbers repeated — a classifier trained on near-constant inputs
  per class learns nothing.

### Train/val/test split
Already handled by `build_dataset.py` (yours) once the raw file exists — seed 42, stratified
70/15/15, frozen test ids. Nothing for you to do here except make sure no class has fewer than
3 rows (below that, `build_dataset.py` already puts the whole class in train only, by design).

### Optional upgrade, not required to unblock S3
`Nitrogen`/`Potassium`/`Phosphorous` are currently **not used as classifier features** —
`feature_engineering.py`'s own comment says why: their unit is unconfirmed in the real dataset
("unspecified by source... not confirmed kg/ha"). If you build this synthetically, you control
the units: if you generate them as real kg/ha (Soil Health Card basis, same as the `n`/`p`/`k`
fields everywhere else in this project), that removes the reason they're excluded, and adding
them to `FEATURE_COLUMNS` becomes a real option (your call — that's your file). If you do this,
also update `dataset_manifest.json`'s `units` block to say so, not "unspecified."

### Naming fix while you're in there
`feature_engineering.py`'s `CLASSIFIER_TARGET = "fertilizer_product_id"`, but the actual column
after cleaning is `product_id`. Doesn't break anything (the code uses the real name), just
worth fixing for consistency.

## B. Everything else already flagged (from `ml/PROGRESS.md`) — recap so nothing's missed

- **MOP has no price** (`fertilizer_products.csv`: `price_inr_per_kg`, `price_date`,
  `bag_size_kg` all `TODO(data)`). Your own note already calls this urgent. Blocks any
  `/recommend` where potash is needed (wheat with low soil K, rice's base K2O dose) — the
  engine correctly refuses rather than guess, but that means it can't be demoed for those cases
  until this is real.
- **`seasonal_weather.csv`** has only 2 of 12 months, no lat/lng columns. Blocks the
  seasonal-weather fallback for anything beyond mock mode.
- **`stcr_equations.csv`**: wheat's N and P equations have no `target_yield_default_q_ha`, so
  STCR never actually fires — every wheat request falls back to the flat reference dose.
- **`reference_doses.csv`**: no rows at all for maize, cotton or sugarcane. Every recommendation
  for those 3 crops currently raises `ReferenceDataIncomplete` for every nutrient.
- **`growth_stages.csv`**: most `das_start`/`das_end` cells for maize, cotton and sugarcane are
  `TODO(data)` too, so even once doses exist for them, most of their schedule dates will come
  back null.
- **`agronomy_rules.yaml`**: no dedicated "season window" key for cost history comparison
  (`compare_to_history` currently reuses `credit_window_days`, 60 days, as an interim proxy —
  a real season is 100–150+ days, so this likely undercounts early-season applications). Add a
  key like `season_window_days` when you get a chance.
