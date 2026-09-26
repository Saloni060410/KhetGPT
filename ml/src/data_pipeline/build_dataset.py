"""Build ml/data/processed/train.csv from clean.csv: a seeded, stratified, de-duplicated
train/val/test split with the test row ids frozen so they're never silently regenerated.

No group column exists in this dataset (no field/sample id in the raw Kaggle data), so the
"group-aware if a group exists" requirement doesn't apply here -- noted explicitly rather than
inventing a synthetic group. R5's EDA did flag one same-label near-duplicate pair
(sugarcane/Loamy) that a naive random split could separate across train/test; that risk is
documented, not silently fixed, since fixing it would mean either dropping a real row or
inventing a grouping heuristic not in scope here.
"""

import hashlib
import json
from pathlib import Path

import pandas as pd

from src.data_pipeline.clean import run as run_clean
from src.data_pipeline.feature_engineering import CLASSIFIER_TARGET, FEATURE_COLUMNS

PROCESSED_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"
EXTERNAL_DIR = Path(__file__).resolve().parents[2] / "data" / "external"

SEED = 42
SPLIT_RATIOS = {"train": 0.70, "val": 0.15, "test": 0.15}
MIN_ROWS_TO_SPLIT_ACROSS_ALL_THREE = 3  # a class with fewer rows can't appear in all 3 splits


def _stratified_split(df: pd.DataFrame, target_col: str, seed: int, ratios: dict[str, float]) -> pd.Series:
    """Per-class shuffle-and-slice split at the given proportions (must sum to ~1, in the
    order they should be filled -- earlier names get priority on rounding). A class with
    fewer rows than there are split names goes entirely to the first (largest) split, rather
    than being silently dropped or duplicated to force a fit -- see R5's finding that
    npk_10_26_26 has only 2 total rows and can't be meaningfully split, let alone learned."""
    names = list(ratios)
    split = pd.Series(index=df.index, dtype=object)

    for _, group in df.groupby(target_col):
        shuffled = group.sample(frac=1, random_state=seed)
        n = len(shuffled)
        if n < len(names):
            split.loc[shuffled.index] = names[0]
            continue

        counts = {name: max(round(n * frac), 1) for name, frac in ratios.items()}
        # rounding can overshoot n by 1 across `len(names)` groups -- trim from the largest
        # bucket until it matches exactly, rather than silently letting counts not sum to n.
        while sum(counts.values()) > n:
            biggest = max(counts, key=counts.get)
            counts[biggest] -= 1
        while sum(counts.values()) < n:
            biggest = max(counts, key=counts.get)
            counts[biggest] += 1

        labels = []
        for name in names:
            labels.extend([name] * counts[name])
        split.loc[shuffled.index] = labels

    return split


def _content_hash(df: pd.DataFrame) -> str:
    return hashlib.sha256(pd.util.hash_pandas_object(df, index=False).values.tobytes()).hexdigest()[:16]


def _feature_schema_hash() -> str:
    return hashlib.sha256(
        json.dumps({"FEATURE_COLUMNS": FEATURE_COLUMNS, "CLASSIFIER_TARGET": CLASSIFIER_TARGET}, sort_keys=True).encode()
    ).hexdigest()[:16]


def run() -> dict:
    run_clean()  # regenerate clean.csv fresh so train.csv is never built from a stale file
    clean = pd.read_csv(PROCESSED_DIR / "clean.csv")
    clean = clean.rename(columns={"product_id": CLASSIFIER_TARGET})

    if clean.duplicated().any():
        raise ValueError(f"{clean.duplicated().sum()} duplicate row(s) in clean.csv -- fix before building train.csv")

    test_ids_path = EXTERNAL_DIR / "test_ids.json"
    if test_ids_path.exists():
        frozen_test_ids = set(json.loads(test_ids_path.read_text(encoding="utf-8"))["test_row_ids"])
        clean["split"] = ["test" if i in frozen_test_ids else None for i in clean.index]

        # Split the non-test remainder into train/val only, at the *same relative*
        # proportions the original 70/15/15 implied (70/85 : 15/85), not a fresh 70/15/15 --
        # otherwise train/val sizes drift on every rerun even though test stays frozen.
        remainder = clean[clean["split"].isna()]
        remainder_ratios = {
            "train": SPLIT_RATIOS["train"] / (SPLIT_RATIOS["train"] + SPLIT_RATIOS["val"]),
            "val": SPLIT_RATIOS["val"] / (SPLIT_RATIOS["train"] + SPLIT_RATIOS["val"]),
        }
        clean.loc[remainder.index, "split"] = _stratified_split(remainder, CLASSIFIER_TARGET, SEED, remainder_ratios)
    else:
        clean["split"] = _stratified_split(clean, CLASSIFIER_TARGET, SEED, SPLIT_RATIOS)
        test_ids_path.write_text(
            json.dumps({"test_row_ids": sorted(clean.index[clean["split"] == "test"].tolist())}, indent=2),
            encoding="utf-8",
        )

    # de-duplicated across splits by construction: each row index is assigned to exactly one
    # split value, so the same row can never appear twice.
    clean.to_csv(PROCESSED_DIR / "train.csv", index=False)

    split_sizes = clean["split"].value_counts().to_dict()
    manifest_entry = {
        "description": "Built train/val/test table for the fertilizer-type classifier",
        "path": "data/processed/train.csv",
        "committed": False,
        "seed": SEED,
        "split_ratios": SPLIT_RATIOS,
        "split_sizes": split_sizes,
        "content_hash": _content_hash(clean),
        "feature_schema_hash": _feature_schema_hash(),
        "feature_columns": FEATURE_COLUMNS,
        "classifier_target": CLASSIFIER_TARGET,
    }

    # Kept as a separate top-level key, NOT appended to manifest["datasets"] -- that array is
    # ingest.py's contract (every entry must be sha256/row/column-verifiable against a static
    # file). train.csv is a derived, rebuildable artifact with different metadata entirely;
    # mixing the two shapes broke verify_all() the first time this was tried.
    manifest_path = EXTERNAL_DIR / "dataset_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["train_dataset_version"] = manifest_entry
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    return manifest_entry


if __name__ == "__main__":
    entry = run()
    print(json.dumps(entry, indent=2))
