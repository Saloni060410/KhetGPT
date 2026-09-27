"""Clean and validate the fertilizer_prediction raw dataset into a modelling-ready table.

Pipeline: load (via ingest.py's already-verified raw file) -> harmonise column names to
snake_case -> map crop/fertilizer labels to our crop_id/product_id vocab, dropping and
logging rows whose label isn't one of our target crops -> validate with a pandera schema
(dtypes, allowed categories, ranges, no duplicates) -> write clean.csv + a validation
report + a sample for Saloni, none of which ever invent a category or silently keep an
out-of-vocab row.
"""

import csv
import json
from pathlib import Path

import pandas as pd
import pandera.pandas as pa

from src.data_pipeline.ingest import ML_ROOT, verify_all

RAW_PATH = ML_ROOT / "data" / "raw" / "fertilizer_prediction.csv"
PROCESSED_DIR = ML_ROOT / "data" / "processed"
EXTERNAL_DIR = ML_ROOT / "data" / "external"

RAW_COLUMN_RENAME = {
    "Temparature": "temperature_c",
    "Humidity": "humidity_pct",
    "Moisture": "moisture_pct",
    "Soil Type": "soil_type",
    "Crop Type": "crop_type_raw",
    "Nitrogen": "nitrogen_raw",
    "Potassium": "potassium_raw",
    "Phosphorous": "phosphorous_raw",
    "Fertilizer Name": "fertilizer_name_raw",
}


class CleaningError(Exception):
    """A validation gate failed -- the run stops rather than persisting bad data."""


def _read_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _crop_label_map() -> dict[str, str]:
    """dataset_label -> crop_id, only for crops with a non-TODO dataset_label."""
    out = {}
    for row in _read_csv(EXTERNAL_DIR / "crops.csv"):
        label = row["dataset_label"]
        if label and not label.startswith("TODO"):
            out[label] = row["crop_id"]
    return out


def _fertilizer_label_map() -> dict[str, str]:
    """dataset_label -> product_id, for every priced-or-not product (labels are definitional,
    unrelated to whether a price has been sourced yet)."""
    return {
        row["dataset_label"]: row["product_id"]
        for row in _read_csv(EXTERNAL_DIR / "fertilizer_products.csv")
    }


def harmonise(raw: pd.DataFrame) -> pd.DataFrame:
    return raw.rename(columns=RAW_COLUMN_RENAME)


def map_labels(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    """Map crop_type_raw -> crop_id and fertilizer_name_raw -> product_id. Rows whose crop
    label isn't in our target vocab are dropped and logged, not silently kept or guessed."""
    crop_map = _crop_label_map()
    fert_map = _fertilizer_label_map()

    dropped: list[dict] = []
    keep_mask = []
    crop_ids = []
    for _, row in df.iterrows():
        crop_id = crop_map.get(row["crop_type_raw"])
        if crop_id is None:
            dropped.append(
                {
                    "reason": "crop_type_raw not in our target crop vocabulary",
                    "crop_type_raw": row["crop_type_raw"],
                }
            )
            keep_mask.append(False)
            crop_ids.append(None)
        else:
            keep_mask.append(True)
            crop_ids.append(crop_id)

    out = df.copy()
    out["crop_id"] = crop_ids
    out = out[keep_mask].copy()
    out["variety_id"] = "generic"  # raw dataset has no variety column -- always the fallback
    out["product_id"] = out["fertilizer_name_raw"].map(fert_map)

    unmapped_fert = out[out["product_id"].isna()]
    if len(unmapped_fert):
        raise CleaningError(
            f"{len(unmapped_fert)} row(s) have a fertilizer_name_raw not in "
            "fertilizer_products.csv's dataset_label column: "
            f"{sorted(unmapped_fert['fertilizer_name_raw'].unique())}"
        )

    out = out.drop(columns=["crop_type_raw", "fertilizer_name_raw"])
    return out, dropped


def _schema() -> pa.DataFrameSchema:
    crop_ids = {row["crop_id"] for row in _read_csv(EXTERNAL_DIR / "crops.csv")}
    product_ids = {row["product_id"] for row in _read_csv(EXTERNAL_DIR / "fertilizer_products.csv")}
    soil_types = {"Sandy", "Loamy", "Black", "Red", "Clayey"}

    return pa.DataFrameSchema(
        {
            "temperature_c": pa.Column(int, checks=pa.Check.in_range(0, 60)),
            "humidity_pct": pa.Column(int, checks=pa.Check.in_range(0, 100)),
            "moisture_pct": pa.Column(int, checks=pa.Check.in_range(0, 100)),
            "soil_type": pa.Column(str, checks=pa.Check.isin(soil_types)),
            "nitrogen_raw": pa.Column(int, checks=pa.Check.ge(0)),
            "potassium_raw": pa.Column(int, checks=pa.Check.ge(0)),
            "phosphorous_raw": pa.Column(int, checks=pa.Check.ge(0)),
            "crop_id": pa.Column(str, checks=pa.Check.isin(crop_ids)),
            "variety_id": pa.Column(str),
            "product_id": pa.Column(str, checks=pa.Check.isin(product_ids)),
        },
        unique=["temperature_c", "humidity_pct", "moisture_pct", "soil_type", "crop_id", "product_id"],
        strict=False,
    )


def build_validation_report(
    raw_rows: int, clean_df: pd.DataFrame, dropped: list[dict]
) -> dict:
    return {
        "raw_row_count": raw_rows,
        "clean_row_count": len(clean_df),
        "dropped_row_count": len(dropped),
        "dropped_reasons": _count_by(dropped, "reason"),
        "dropped_crop_labels": _count_by(dropped, "crop_type_raw"),
        "missingness_per_column": {
            col: int(clean_df[col].isna().sum()) for col in clean_df.columns
        },
        "class_balance_product_id": clean_df["product_id"].value_counts().to_dict(),
        "class_balance_crop_id": clean_df["crop_id"].value_counts().to_dict(),
    }


def _count_by(rows: list[dict], key: str) -> dict:
    counts: dict[str, int] = {}
    for row in rows:
        counts[row[key]] = counts.get(row[key], 0) + 1
    return counts


def run() -> dict:
    verify_all()  # fail loudly before touching a file that drifted from the manifest

    raw = pd.read_csv(RAW_PATH)
    raw_rows = len(raw)

    df = harmonise(raw)
    df, dropped = map_labels(df)

    schema = _schema()
    try:
        df = schema.validate(df, lazy=True)
    except pa.errors.SchemaErrors as exc:
        raise CleaningError(f"Schema validation failed:\n{exc.failure_cases}") from exc

    if df.duplicated().any():
        raise CleaningError(f"{df.duplicated().sum()} exact duplicate row(s) found after cleaning")

    report = build_validation_report(raw_rows, df, dropped)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(PROCESSED_DIR / "clean.csv", index=False)
    (PROCESSED_DIR / "validation_report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )

    sample = df if len(df) <= 200 else df.sample(n=200, random_state=42)
    sample.to_csv(PROCESSED_DIR / "sample_train.csv", index=False)

    return report


if __name__ == "__main__":
    report = run()
    print(json.dumps(report, indent=2))
