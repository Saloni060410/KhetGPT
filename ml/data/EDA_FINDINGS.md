# EDA findings -- fertilizer_prediction clean.csv (R5)

Full analysis: `notebooks/EDA.ipynb`. Run on `ml/data/processed/clean.csv` (50 rows, produced
by `src/data_pipeline/clean.py` from the 99-row raw dataset; 49 rows dropped as out-of-vocab
crop labels, see `ml/data/README.md`).

## Shape, quality

50 rows x 10 columns. **Zero missing values** anywhere (enforced by `clean.py`'s schema).
Zero exact duplicate rows. 5 crops represented (chickpea has 0 rows -- the `Pulses` label
gap, not an EDA finding but relevant context), 7 fertilizer products.

## Collinearity

`temperature_c` and `humidity_pct` are **r=0.98** -- near-total collinearity, effectively one
feature carried twice. `nitrogen_raw` is meaningfully anti-correlated with `phosphorous_raw`
(r=-0.71) and `potassium_raw` (r=-0.52), consistent with a fixed-nutrient-budget-style
generation pattern rather than independently measured field samples.

## Target relationships -- no trivial leakage

Fertilizer product is **not** determined by crop alone (4-6 distinct products per crop) or by
(crop, soil_type) alone (3-6 distinct products per group) -- N/P/K genuinely carries
discriminating signal; the classifier can't just memorize a crop-to-fertilizer lookup table.

## Group structure

`soil_type` is **100% redundant with `crop_id`** for 3 of 5 crops (wheat=Loamy always,
maize=Sandy always, rice=Clayey always). Not target leakage, but a feature-importance read on
`soil_type` may really be echoing `crop_id` for most of the data.

## Duplicates that would straddle a train/test split

3 near-duplicate pairs (climate features within +-1, same crop+soil_type). Two (`rice`/`Clayey`)
have *different* labels -- reassuring, rules out climate-only leakage. One (`sugarcane`/`Loamy`)
shares the **same** label (`np_20_20_0`) -- a real, if small, leakage risk: if a naive random
split separates that pair, the test score on it is inflated by near-memorization.

## What this data can and cannot support

**Label balance:** majority class (`urea`) = 11/50 = **22% majority-baseline accuracy**. Rarest
class (`npk_10_26_26`) has only **2 total rows**.

**Is accuracy above baseline plausible?** Likely yes in principle (real signal confirmed above),
but *precisely reporting* one is not reliable at this size: a 70/15/15 split leaves ~7-8 test
rows, and a proportion from 7-8 samples has a binomial 95% CI of roughly **+-35 points**. Any
single-split accuracy number is noise until bootstrapped CIs or CV are applied.

**Recommendation for Saloni:**

1. **Model family** -- favor low-variance, strongly regularized models (regularized multinomial
   logistic regression, or a shallow/heavily-constrained tree: few estimators, max_depth 2-3,
   strong L2) over a many-tree XGBoost, which will overfit ~35 training rows badly. Always
   compare against majority-class and stratified-random baselines.
2. **CV scheme** -- don't trust a single frozen split as primary evidence at n=50. Use
   stratified k-fold (k=5) or leave-one-out, report mean +- std across folds. Keep the frozen
   test split (`test_ids.json`) for reproducibility, but treat its number as a rough check, not
   the headline metric.
3. **Rare classes** -- `npk_10_26_26` (2 rows) should be merged into a compositionally similar
   NPK-complex group or excluded from the classifier target entirely, letting the rule-based
   `reference_doses.csv`/`soil_adjustments.csv` layer pick a nutrient-matched product instead of
   asking the classifier to learn an unlearnable 2-example class. `npk_17_17_17` (5 rows) is
   thin too -- watch it in per-class metrics, not necessarily merge yet.
