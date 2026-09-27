"""Shared feature module (contract C4). Training (build_dataset.py) and serving (Saloni's
/recommend handler) both call build_features() on the output of request_to_record() /
load_training_frame(), so the two code paths can never drift into different columns.

FEATURE_COLUMNS is deliberately narrow. The raw training dataset's Nitrogen/Potassium/
Phosphorous columns have no stated unit and no defensible mapping to the API's real n/p/k
(kg/ha, Soil Health Card basis) -- see the R4 unit-reconciliation note in
docs/data-dictionary.md -- and the training dataset has no growth-stage or pH/organic_carbon
data at all. Including any of those would make "serving can never produce different columns
than training" false by construction, not just risky. temperature_c/humidity_pct/moisture_pct
were assessed in R4 as a plausible (if unconfirmed) direct match and are the only numeric
features carried over.

generate_synthetic_data.py's supplement generates its own Nitrogen/Potassium/Phosphorous as
confirmed real kg/ha (Soil Health Card basis) -- unlike the real Kaggle rows, whose units are
still unconfirmed. That does NOT make it safe to add n/p/k to FEATURE_COLUMNS yet: the
combined training table (clean.csv/train.csv) has both data_source values in the same
columns, so a naive add would silently train on a column meaning "confirmed kg/ha" for
some rows and "unconfirmed, possibly a different unit" for others -- the same "false by
construction" problem this docstring already warns about, just introduced from the other
direction. Adding real n/p/k features is only safe once the real rows' unit is independently
reconciled too (R4's original open item), or once training is restricted to data_source ==
"synthetic" rows specifically for that purpose.
"""

from pathlib import Path

import pandas as pd

from src.data_pipeline.soil_data_loader import (
    EXTERNAL_DIR,
    ReferenceTables,
    load_reference_tables,
    validate_soil,
)

PROCESSED_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"

CLASSIFIER_TARGET = "fertilizer_product_id"

FEATURE_COLUMNS = [
    "crop_id",
    "variety_id",
    "temperature_c",
    "humidity_pct",
    "moisture_pct",
]


class UnknownCropError(Exception):
    """request_to_record was given a crop_id not present in crops.csv."""


def _vocab(tables: ReferenceTables) -> tuple[list[str], list[str]]:
    """Fixed, ordered vocabularies for one-hot encoding -- independent of what's actually
    present in any one batch, so a batch of one crop still produces every crop's column."""
    crop_ids = sorted(row["crop_id"] for row in tables.crops)
    variety_ids = sorted({row["variety_id"] for row in tables.crop_varieties} | {"generic"})
    return crop_ids, variety_ids


def _stage_ordinal(tables: ReferenceTables, crop_id: str, stage_id: str | None) -> int | None:
    if stage_id is None:
        return None
    for row in tables.growth_stages:
        if row["crop_id"] == crop_id and row["stage_id"] == stage_id:
            return int(row["order"])
    return None


def season_length_days(tables: ReferenceTables, crop_id: str) -> int | None:
    """Sourced days-after-sowing length of crop_id's full growing season, read from
    growth_stages.csv's own maturity/harvest row -- NOT the same thing as
    agronomy_rules.yaml's credit_window_days (how long a past application is still credited
    against nutrient need). A crop's real season is often much longer than the 60-day
    credit window (wheat: 148-158 days; barley: 137-146 days) -- conflating the two would
    silently drop a genuinely same-season basal application from a risk assessment made
    later in the season. Returns None (not credit_window_days, not an invented number) when
    growth_stages.csv has no maturity/harvest stage for this crop yet -- most crops don't:
    only wheat and barley have one as of this pass. Callers must fall back explicitly and
    visibly, never treat None as "0 days" or silently substitute credit_window_days."""
    best_end = None
    for row in tables.growth_stages:
        if row["crop_id"] != crop_id:
            continue
        if "maturity" not in row["stage_id"] and "harvest" not in row["stage_id"]:
            continue
        das_end = row["das_end"]
        if str(das_end).startswith("TODO"):
            continue
        best_end = max(best_end or 0, int(das_end))
    return best_end


def soil_rating(tables: ReferenceTables, parameter: str, value: float) -> str:
    for row in tables.soil_test_ratings:
        if row["parameter"] != parameter:
            continue
        very_low_below = row["very_low_below"]
        low_below = float(row["low_below"])
        high_above = float(row["high_above"])
        if very_low_below and not str(very_low_below).startswith("TODO") and value < float(very_low_below):
            return "very_low"
        if value < low_below:
            return "low"
        if value > high_above:
            return "high"
        return "medium"
    return "unknown"


def request_to_record(req: dict, tables: ReferenceTables | None = None) -> dict:
    """Flatten a /recommend request (contract C1) into one flat record: soil values, weather,
    crop_id, variety_id, growth-stage ordinal, and soil ratings. Raises UnknownCropError for a
    crop_type not in crops.csv -- never silently guesses a crop_id."""
    tables = tables or load_reference_tables()

    crop_id = req["crop_type"]
    known_crops = {row["crop_id"] for row in tables.crops}
    if crop_id not in known_crops:
        raise UnknownCropError(f"crop_type {crop_id!r} is not in crops.csv: {sorted(known_crops)}")

    soil = req["soil"]
    validate_soil(soil)
    weather = req["weather"]

    variety_id = req.get("variety") or "generic"
    stage_id = req.get("growth_stage")

    return {
        "crop_id": crop_id,
        "variety_id": variety_id,
        "irrigation": req.get("irrigation") or "irrigated",
        "growth_stage": stage_id,
        "stage_ordinal": _stage_ordinal(tables, crop_id, stage_id),
        "sowing_date": req.get("sowing_date"),
        "n": soil["n"],
        "p": soil["p"],
        "k": soil["k"],
        "ph": soil["ph"],
        "organic_carbon": soil["organic_carbon"],
        "moisture": soil["moisture"],
        "temperature_c": weather["temperature_c"],
        "humidity_pct": weather["humidity_pct"],
        "moisture_pct": soil["moisture"],
        "rainfall_mm_forecast": weather["rainfall_mm_forecast"],
        "weather_source": weather.get("source"),
        "soil_rating_n": soil_rating(tables, "n", soil["n"]),
        "soil_rating_p": soil_rating(tables, "p", soil["p"]),
        "soil_rating_k": soil_rating(tables, "k", soil["k"]),
        "soil_rating_organic_carbon": soil_rating(tables, "organic_carbon", soil["organic_carbon"]),
        "soil_rating_ph": soil_rating(tables, "ph", soil["ph"]),
        "previous_fertilizer_usage": req.get("previous_fertilizer_usage") or [],
    }


def build_features(records: list[dict], tables: ReferenceTables | None = None) -> pd.DataFrame:
    """Pure, deterministic: records -> a fixed-column feature matrix. Works identically on
    training rows (dicts from load_training_frame) and on request_to_record() output, since
    both expose the same FEATURE_COLUMNS field names. Unknown crop_id/variety_id values raise
    rather than silently producing an all-zero one-hot row."""
    tables = tables or load_reference_tables()
    crop_ids, variety_ids = _vocab(tables)

    rows = []
    for record in records:
        missing = [c for c in FEATURE_COLUMNS if c not in record]
        if missing:
            raise KeyError(f"record is missing feature column(s): {missing}")

        crop_id = record["crop_id"]
        variety_id = record["variety_id"]
        if crop_id not in crop_ids:
            raise UnknownCropError(f"crop_id {crop_id!r} is not in crops.csv: {crop_ids}")
        if variety_id not in variety_ids:
            raise UnknownCropError(f"variety_id {variety_id!r} is not in crop_varieties.csv (+generic): {variety_ids}")

        row = {f"crop_id__{c}": float(c == crop_id) for c in crop_ids}
        row.update({f"variety_id__{v}": float(v == variety_id) for v in variety_ids})
        row["temperature_c"] = float(record["temperature_c"])
        row["humidity_pct"] = float(record["humidity_pct"])
        row["moisture_pct"] = float(record["moisture_pct"])
        rows.append(row)

    df = pd.DataFrame(rows)
    if df.isna().any().any():
        raise ValueError("build_features produced NaN values -- a record was missing data")
    return df


def rule_inputs(req: dict, tables: ReferenceTables | None = None) -> dict:
    """Soil ratings, prior-usage credit inputs and weather flags for Saloni's engine and risk
    analyzer -- not classifier inputs. Prior-usage features are passed through as-is; this
    dataset has no history of its own to train a credit model on."""
    tables = tables or load_reference_tables()
    record = request_to_record(req, tables=tables)

    agronomy = _load_agronomy_rules()
    weather = {
        "temperature_c": record["temperature_c"],
        "humidity_pct": record["humidity_pct"],
        "rainfall_mm_forecast": record["rainfall_mm_forecast"],
    }

    return {
        "soil_ratings": {
            "n": record["soil_rating_n"],
            "p": record["soil_rating_p"],
            "k": record["soil_rating_k"],
            "organic_carbon": record["soil_rating_organic_carbon"],
            "ph": record["soil_rating_ph"],
        },
        "previous_fertilizer_usage": record["previous_fertilizer_usage"],
        **weather_features(weather, agronomy),
        "weather_source": record["weather_source"],
    }


def weather_features(weather: dict, rules: dict) -> dict:
    """Derive a rain_hold flag (and the weather values it was computed from) from a weather
    block and agronomy_rules.yaml's rain_hold_mm -- shared by rule_inputs() here and by
    anything else (e.g. the risk analyzer) that needs the same rain-hold decision, so the
    threshold is applied identically everywhere rather than re-implemented."""
    rainfall = weather.get("rainfall_mm_forecast")
    rain_hold = rainfall is not None and rainfall >= rules["rain_hold_mm"]
    return {"rain_hold": rain_hold, "rainfall_mm_forecast": rainfall}


def _load_agronomy_rules() -> dict:
    import yaml

    with (EXTERNAL_DIR / "agronomy_rules.yaml").open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_training_frame(split: str) -> pd.DataFrame:
    """Read ml/data/processed/train.csv (built by build_dataset.py), filtered to one split
    ('train', 'val' or 'test')."""
    path = PROCESSED_DIR / "train.csv"
    if not path.exists():
        raise FileNotFoundError(f"{path} not found -- run python -m src.data_pipeline.build_dataset first")
    df = pd.read_csv(path)
    if "split" not in df.columns:
        raise ValueError(f"{path} has no 'split' column")
    valid_splits = set(df["split"].unique())
    if split not in valid_splits:
        raise ValueError(f"split {split!r} not found in train.csv; valid splits: {sorted(valid_splits)}")
    return df[df["split"] == split].drop(columns=["split"]).reset_index(drop=True)
