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
SYNTHETIC_RAW_PATH = ML_ROOT / "data" / "raw" / "fertilizer_prediction_synthetic.csv"
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


def reconcile_npk_units(df: pd.DataFrame) -> pd.DataFrame:
    """Rename nitrogen_raw/potassium_raw/phosphorous_raw -> n/p/k (matching
    feature_engineering.request_to_record()'s serving-time field names) and blank them
    (NaN) for real rows specifically.

    The real Kaggle file's N/P/K unit was already flagged unstated by the source (R4). This
    goes further: N and P have nearly identical numeric ranges here (Nitrogen 4-42,
    Phosphorous 0-42), but real Soil Health Card kg/ha values for N and P differ by roughly
    an order of magnitude (soil_test_ratings.csv's own cutoffs: N ~280-560, P ~10-25) --
    empirical evidence these are NOT kg/ha, not just an unstated unit that might happen to
    be. There is no hidden correct unit to recover here, so real rows' n/p/k are set to NaN
    (never passed through as an unverified, likely-wrong-scale number) rather than
    "reconciled". Synthetic rows keep their real, confirmed kg/ha values (Soil Health Card
    basis, same as request_to_record()'s live serving-time values) untouched. Whoever trains
    the classifier on n/p/k needs an algorithm that tolerates missing values for this reason
    (XGBoost, already this project's stated model) -- see feature_engineering.py's docstring."""
    out = df.rename(columns={"nitrogen_raw": "n", "potassium_raw": "k", "phosphorous_raw": "p"})
    out.loc[out["data_source"] == "real", ["n", "p", "k"]] = float("nan")
    return out


_UNIQUE_SUBSET = ["temperature_c", "humidity_pct", "moisture_pct", "soil_type", "crop_id", "product_id"]


def _schema(check_unique: bool) -> pa.DataFrameSchema:
    """check_unique=False for the synthetic-inclusive validation pass: at 4900 synthetic rows
    with coarse int-rounded weather columns, exact matches on this narrow 6-column subset
    (which excludes nitrogen_raw/potassium_raw/phosphorous_raw) are expected by construction,
    not a sign of a suspicious duplicate the way they would be in the real 99-row set. The
    real-only uniqueness property is still checked separately in run()."""
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
        unique=_UNIQUE_SUBSET if check_unique else None,
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
        "row_count_by_data_source": clean_df["data_source"].value_counts().to_dict(),
        "real_class_balance_crop_id": clean_df.loc[clean_df["data_source"] == "real", "crop_id"]
        .value_counts().to_dict(),
    }


def _count_by(rows: list[dict], key: str) -> dict:
    counts: dict[str, int] = {}
    for row in rows:
        counts[row[key]] = counts.get(row[key], 0) + 1
    return counts


def _load_raw() -> pd.DataFrame:
    """Real Kaggle rows plus the synthetic supplement (generate_synthetic_data.py), if it
    exists, concatenated with an explicit data_source tag so no downstream consumer of
    clean.csv/train.csv can mistake a synthetic row for a real observation. The synthetic
    file is optional -- clean.py must keep working (real rows only) for anyone who hasn't
    run the generator."""
    real = pd.read_csv(RAW_PATH)
    real["data_source"] = "real"

    if SYNTHETIC_RAW_PATH.exists():
        synthetic = pd.read_csv(SYNTHETIC_RAW_PATH)
        synthetic["data_source"] = "synthetic"
        return pd.concat([real, synthetic], ignore_index=True)
    return real


def run() -> dict:
    verify_all()  # fail loudly before touching a file that drifted from the manifest

    raw = _load_raw()
    raw_rows = len(raw)

    df = harmonise(raw)
    df, dropped = map_labels(df)

    has_synthetic = (df["data_source"] == "synthetic").any()
    schema = _schema(check_unique=not has_synthetic)
    try:
        df = schema.validate(df, lazy=True)
    except pa.errors.SchemaErrors as exc:
        raise CleaningError(f"Schema validation failed:\n{exc.failure_cases}") from exc

    if has_synthetic:
        real_subset = df[df["data_source"] == "real"]
        if real_subset.duplicated(subset=_UNIQUE_SUBSET).any():
            raise CleaningError("Real rows are no longer unique on temperature/humidity/moisture/soil/crop/product")

    if df.duplicated().any():
        raise CleaningError(f"{df.duplicated().sum()} exact duplicate row(s) found after cleaning")

    df = reconcile_npk_units(df)  # rename to n/p/k; blank (NaN) for real rows -- see docstring

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
