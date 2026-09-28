"""Generate a synthetic classifier-training dataset (Saloni's DATA_REQUIREMENTS.md part A),
sized to supplement -- never replace -- the real 99-row Kaggle file at fertilizer_prediction.csv.

Written to data/raw/fertilizer_prediction_synthetic.csv, in the SAME 9-column raw schema as
the real file (Temparature, Humidity, Moisture, Soil Type, Crop Type, Nitrogen, Potassium,
Phosphorous, Fertilizer Name) so clean.py's existing harmonise()/map_labels() work on it
unchanged. clean.py tags every row with its data_source ("real" or "synthetic") before
concatenating the two files -- that tag survives into clean.csv and train.csv so nothing
downstream can mistake a synthetic row for a real observation.

Every value is grounded in an already-sourced table in this repo, not invented:
- temperature_c / humidity_pct: sampled around seasonal_weather.csv's real Punjab monthly
  averages (Open-Meteo archive, 2022-2024) for each crop's real PAU-sourced growing-season
  months, with modest jitter (day-to-day weather varies around a monthly average).
- moisture_pct: no per-month real source exists for soil moisture (only temperature/humidity
  are in seasonal_weather.csv) -- generated in a documented, reasonable band (higher for
  kharif/rain-fed months, lower for rabi/irrigated months), explicitly NOT claimed as
  sourced the way temperature/humidity are.
- n/p/k (kg/ha): sampled across the full very_low-to-high spectrum defined by
  soil_test_ratings.csv's real ICAR-IISS cutoffs, so the classifier sees realistic soil
  fertility variation, not three fixed numbers.
- Fertilizer Name (the label): NEVER assigned independently of the row's own soil values.
  For each row, this script recomputes the crop's actual nutrient need the same way the
  real engine will -- reference_doses.csv's standard dose + soil_adjustments.csv's
  soil-test adjustment for that row's own generated N/P/K soil_rating -- then picks
  whichever of the 9 real fertilizer_products.csv grades has the closest N:P2O5:K2O ratio
  to that need (cosine similarity). This is the same rule the project already applies to
  real data: a label is either an observed real value or a value implied by an
  independently sourced agronomic rule -- never an arbitrary assignment.

Crop scope (7 crops, matching crops.csv): wheat, rice, maize, cotton, sugarcane, chickpea,
barley. Millets was considered and excluded -- see crops.csv's barley row and
ml/data/README.md for why ("Millets" spans at least two agronomically distinct PAU-listed
species, the same generic-label problem that already excluded "Pulses" -> chickpea).
"""

import csv
from pathlib import Path

import numpy as np
import pandas as pd

from src.data_pipeline.soil_data_loader import EXTERNAL_DIR, load_reference_tables

RAW_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"
OUTPUT_PATH = RAW_DIR / "fertilizer_prediction_synthetic.csv"

ROWS_PER_CROP = 400  # 7 crops -> 2800 rows total
SEED = 42

# Real PAU-sourced sowing-to-harvest month windows (1=Jan..12=Dec), used only to pick which
# seasonal_weather.csv row a synthetic row's weather is centred on -- not the dose itself.
_CROP_SEASON_MONTHS = {
    "wheat": [11, 12, 1, 2, 3, 4],       # PAU POP Rabi 2025-26 p.1: sown late Oct-early Nov, matures ~148-158 DAS
    "rice": [6, 7, 8, 9, 10],             # PAU POP Kharif 2026 p.4-5: nursery 20 May-20 Jun, transplant, harvest ~Oct
    "maize": [6, 7, 8, 9],                # PAU POP Kharif 2026 p.29: sown last week May-end Jun, matures ~90-99 days
    "cotton": [4, 5, 6, 7, 8, 9, 10],     # PAU POP Kharif 2026 p.45-46: sown 1 Apr-15 May, picked through autumn
    "sugarcane": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2],  # PAU POP Kharif 2026 p.77-84: spring-planted, ~12-month annual crop
    "chickpea": [10, 11, 12, 1, 2, 3],    # PAU POP Rabi 2025-26 p.34/36: rabi pulse, sowing/harvest window matches wheat's rabi season
    "barley": [11, 12, 1, 2, 3],          # PAU POP Rabi 2025-26 p.31-32: sown Oct15-Nov15, matures 137-146 days later
}

# Kharif (rain-fed monsoon) months get a higher, wetter moisture band; rabi (irrigated,
# post-monsoon/winter) months get a lower band. No per-month real moisture source exists in
# this repo (unlike temperature/humidity) -- this band is a documented team assumption, not
# claimed as independently sourced.
_KHARIF_MONTHS = {6, 7, 8, 9, 10}
_MOISTURE_BAND_KHARIF = (35, 55)
_MOISTURE_BAND_RABI = (22, 45)

_SOIL_TYPES = ["Loamy", "Sandy", "Clayey", "Black", "Red"]
# PAU POP repeatedly describes Punjab crop soils as "sandy loam to clay loam" -- Loamy/Sandy/
# Clayey dominate; Black/Red are real Indian soil categories but not typical of Punjab,
# included at low weight only for the schema's full category coverage, not claimed as typical.
_SOIL_TYPE_WEIGHTS = [0.45, 0.25, 0.20, 0.05, 0.05]

_NUTRIENT_COLUMN = {"n": "n_kg_ha", "p": "p2o5_kg_ha", "k": "k2o_kg_ha"}


def _soil_test_bands() -> dict[str, dict]:
    """very_low/low/medium/high numeric bands per nutrient, from soil_test_ratings.csv."""
    rows = {r["parameter"]: r for r in _read_csv(EXTERNAL_DIR / "soil_test_ratings.csv")}
    bands = {}
    for nutrient, param in (("n", "n"), ("p", "p"), ("k", "k")):
        row = rows[param]
        low = float(row["low_below"])
        high = float(row["high_above"])
        bands[nutrient] = {"low": (max(0, low * 0.3), low), "medium": (low, high), "high": (high, high * 1.5)}
    return bands


def _read_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _rating(value: float, bands: dict) -> str:
    if value < bands["low"][1]:
        return "low"
    if value <= bands["medium"][1]:
        return "medium"
    return "high"


def _dose_for(crop_id: str, nutrient: str, soil_rating: str, tables) -> float:
    """standard dose (reference_doses.csv, generic/irrigated/Punjab) + soil_adjustments.csv
    adjustment for this nutrient's rating, defaulting to 0 if no adjustment row exists --
    the same lookup rule already used by evaluation/metrics.py's formula_conformity()."""
    column = _NUTRIENT_COLUMN[nutrient]
    standard = 0.0
    for row in tables.reference_doses:
        if row["crop_id"] == crop_id and row["variety_id"] == "generic" and row["irrigation"] == "irrigated":
            value = row[column]
            standard = float(value) if not str(value).startswith("TODO") else 0.0
            break

    adjustment = 0.0
    for row in tables.soil_adjustments:
        if row["crop_id"] == crop_id and row["nutrient"] == nutrient and row["soil_rating"] == soil_rating:
            value = row["adjustment_kg_ha"]
            adjustment = float(value) if not str(value).startswith("TODO") else 0.0
            break

    return max(0.0, standard + adjustment)


_PRICED_BONUS = 0.15
# DATA_REQUIREMENTS.md: "since only 4 products are priced right now, weight the synthetic
# classes toward those 4 if you want the classifier's output to actually be usable
# end-to-end (an unpriced product picked by the classifier still blocks the schedule)."
# Applied as a flat bonus to a priced product's cosine score before ranking/sampling --
# enough to win close calls against an equally-plausible unpriced grade, not enough to
# override a genuinely much better-matching unpriced one (never forces an agronomically
# wrong product just because it happens to be priced). "Priced" is read from
# fertilizer_products.csv itself (price_inr_per_kg not TODO(data)), not a hardcoded id
# list, so this automatically includes whatever gets priced later (e.g. if MOP's
# long-standing TODO gets resolved).


def _is_priced(product: dict) -> bool:
    return not str(product["price_inr_per_kg"]).startswith("TODO")


def _matching_products(need: dict[str, float], products: list[dict]) -> list[tuple[dict, float]]:
    """Cosine similarity between the row's real computed need (N, P2O5, K2O) and each real
    product's guaranteed grade, with _PRICED_BONUS applied to priced products. Returns every
    (product, score) pair, sorted best first."""
    need_vec = np.array([need["n"], need["p"], need["k"]], dtype=float)
    if need_vec.sum() == 0:
        need_vec = np.array([1.0, 0.0, 0.0])  # no computable need (e.g. missing dose row) -> default to N-only

    scored = []
    for product in products:
        grade_vec = np.array([float(product["n_pct"]), float(product["p2o5_pct"]), float(product["k2o_pct"])])
        if grade_vec.sum() == 0:
            continue
        score = float(np.dot(need_vec, grade_vec) / (np.linalg.norm(need_vec) * np.linalg.norm(grade_vec)))
        if _is_priced(product):
            score += _PRICED_BONUS
        scored.append((product, score))
    return sorted(scored, key=lambda pair: pair[1], reverse=True)


def _sample_matching_product(need: dict[str, float], products: list[dict], rng, top_k: int = 3) -> dict:
    """A single best-match product would collapse almost every crop onto 2-3 "attractor"
    grades (verified empirically -- an early version of this generator only ever produced
    Urea/20-20/28-28 across all 4900 rows), because cosine similarity rewards a product
    whose ANGLE matches the dominant nutrient even when other real grades are agronomically
    just as defensible. PAU's own tables repeatedly note nutrients "can also be supplied
    from other fertilizers available in the market" (e.g. reference_doses.csv's wheat/rice
    notes) -- real, sourced substitutability, not an invented one. So: take the top_k
    closest-matching real products for this row's actual computed need, and sample among
    them weighted by similarity (softmax) -- every choice is still grounded in the row's
    own soil-driven need, just not forced to the single mathematically-closest grade."""
    scored = _matching_products(need, products)[:top_k]
    scores = np.array([score for _, score in scored])
    weights = np.exp(scores * 8)  # sharpen: still favours the closest match most of the time
    weights /= weights.sum()
    choice_idx = rng.choice(len(scored), p=weights)
    return scored[choice_idx][0]


def generate(seed: int = SEED, rows_per_crop: int = ROWS_PER_CROP) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    tables = load_reference_tables()
    products = tables.fertilizer_products
    seasonal_weather = {int(r["month"]): r for r in tables.seasonal_weather}
    bands = _soil_test_bands()

    crop_dataset_label = {r["crop_id"]: r["dataset_label"] for r in tables.crops if r["crop_id"] in _CROP_SEASON_MONTHS}

    records = []
    for crop_id, months in _CROP_SEASON_MONTHS.items():
        for _ in range(rows_per_crop):
            month = int(rng.choice(months))
            weather_row = seasonal_weather.get(month)
            base_temp = float(weather_row["temperature_c"]) if weather_row else 25.0
            base_humidity = float(weather_row["humidity_pct"]) if weather_row else 50.0

            temperature_c = round(np.clip(rng.normal(base_temp, 2.0), 0, 60))
            humidity_pct = round(np.clip(rng.normal(base_humidity, 5.0), 0, 100))

            moisture_lo, moisture_hi = _MOISTURE_BAND_KHARIF if month in _KHARIF_MONTHS else _MOISTURE_BAND_RABI
            moisture_pct = round(np.clip(rng.uniform(moisture_lo, moisture_hi), 0, 100))

            soil_type = str(rng.choice(_SOIL_TYPES, p=_SOIL_TYPE_WEIGHTS))

            soil_values, soil_ratings = {}, {}
            for nutrient in ("n", "p", "k"):
                nb = bands[nutrient]
                tier = rng.choice(["low", "medium", "high"], p=[0.3, 0.45, 0.25])
                lo, hi = nb[tier]
                value = float(rng.uniform(lo, max(hi, lo + 1)))
                soil_values[nutrient] = max(0, round(value))
                soil_ratings[nutrient] = _rating(value, nb)

            need = {nutrient: _dose_for(crop_id, nutrient, soil_ratings[nutrient], tables) for nutrient in ("n", "p", "k")}
            product = _sample_matching_product(need, products, rng)

            records.append({
                "Temparature": temperature_c,
                "Humidity": humidity_pct,
                "Moisture": moisture_pct,
                "Soil Type": soil_type,
                "Crop Type": crop_dataset_label[crop_id],
                "Nitrogen": soil_values["n"],
                "Potassium": soil_values["k"],
                "Phosphorous": soil_values["p"],
                "Fertilizer Name": product["dataset_label"],
            })

    return pd.DataFrame.from_records(records)


def run() -> Path:
    df = generate()
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    return OUTPUT_PATH


if __name__ == "__main__":
    path = run()
    print(f"Wrote {path}")
