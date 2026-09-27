"""Build ml/data/processed/train.csv from clean.csv: a seeded, stratified, de-duplicated
train/val/test split with the test row ids frozen so they're never silently regenerated.

No group column exists in this dataset (no field/sample id in the raw Kaggle data), so the
"group-aware if a group exists" requirement doesn't apply here -- noted explicitly rather than
inventing a synthetic group. R5's EDA did flag one same-label near-duplicate pair
(sugarcane/Loamy) that a naive random split could separate across train/test; that risk is
documented, not silently fixed, since fixing it would mean either dropping a real row or
inventing a grouping heuristic not in scope here.

Every row -- real or synthetic -- goes through the same stratified split. The separate
"raw Kaggle file" this project originally expected has never materialized and, per an explicit
product decision, isn't being waited on any longer: fertilizer_prediction_synthetic.csv IS this
project's raw training data now, not a train-only supplement bolted onto an assumed real file.
Confining data_source != "real" rows to train unconditionally (the previous behaviour) made
val/test empty by construction whenever the real file was absent, which defeated the point of
having a val/test split at all. data_source is still carried through as a column for anything
downstream that cares (e.g. clean.py's real-row N/P/K NaN policy), it just no longer gates
which split a row can land in.
"""

import argparse
import hashlib
import json
from pathlib import Path

import pandas as pd
import yaml

from src.data_pipeline.clean import run as run_clean
from src.data_pipeline.feature_engineering import CLASSIFIER_TARGET, FEATURE_COLUMNS, build_features

ML_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = ML_ROOT / "data" / "processed"
EXTERNAL_DIR = ML_ROOT / "data" / "external"
DEFAULT_CONFIG_PATH = ML_ROOT / "configs" / "data.yaml"

# Loaded once at import time so every existing caller of run() with no arguments (including
# the test suite, which imports these three names directly) keeps working unchanged --
# configs/data.yaml is the single source of truth for these values now, this just mirrors it
# into module constants rather than duplicating the numbers.
_DEFAULT_CONFIG = yaml.safe_load(DEFAULT_CONFIG_PATH.read_text(encoding="utf-8"))
SEED = _DEFAULT_CONFIG["seed"]
SPLIT_RATIOS = _DEFAULT_CONFIG["split_ratios"]
MIN_ROWS_TO_SPLIT_ACROSS_ALL_THREE = _DEFAULT_CONFIG["min_rows_to_split_across_all_three"]


def _stratified_split(df: pd.DataFrame, target_col: str, seed: int, ratios: dict[str, float]) -> pd.Series:
    """Per-class shuffle-and-slice split at the given proportions (must sum to ~1, in the
    order they should be filled -- earlier names get priority on rounding). A class with
    fewer than MIN_ROWS_TO_SPLIT_ACROSS_ALL_THREE total rows goes entirely to the first
    (largest) split, rather than being silently dropped or duplicated to force a fit -- see
    R5's finding that npk_10_26_26 has only 2 total rows and can't be meaningfully split, let
    alone learned. This threshold is fixed at 3 (not len(ratios)) deliberately: this function
    is called twice per build -- once with 3 split names on a fresh build, once with only 2
    (train/val) when re-deriving from a frozen test set -- and the same class must be treated
    identically either way, not differently depending on which call happens to run."""
    names = list(ratios)
    split = pd.Series(index=df.index, dtype=object)

    for _, group in df.groupby(target_col):
        shuffled = group.sample(frac=1, random_state=seed)
        n = len(shuffled)
        if n < MIN_ROWS_TO_SPLIT_ACROSS_ALL_THREE:
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


def run(config: dict | None = None, verbose: bool = False) -> dict:
    """Runs the full data pipeline: ingest (via run_clean's own verify_all() call) -> clean ->
    features (build_features() exercised over the whole pool, so a schema break is caught here,
    not first at train time) -> split. `config` defaults to configs/data.yaml's values (the
    same ones already mirrored into this module's SEED/SPLIT_RATIOS/
    MIN_ROWS_TO_SPLIT_ACROSS_ALL_THREE constants at import time) -- pass one explicitly only to
    override them (e.g. a different seed for an experiment)."""
    config = config or _DEFAULT_CONFIG
    seed = config["seed"]
    split_ratios = config["split_ratios"]

    def _stage(name: str) -> None:
        if verbose:
            print(f"[{name}]")

    _stage("1/4 ingest + 2/4 clean")
    run_clean()  # regenerate clean.csv fresh so train.csv is never built from a stale file; calls ingest.verify_all() itself
    clean = pd.read_csv(PROCESSED_DIR / "clean.csv")
    clean = clean.rename(columns={"product_id": CLASSIFIER_TARGET})

    if clean.duplicated().any():
        raise ValueError(f"{clean.duplicated().sum()} duplicate row(s) in clean.csv -- fix before building train.csv")

    if "data_source" not in clean.columns:
        raise ValueError("clean.csv has no data_source column -- clean.py must tag every row real/synthetic")

    _stage("3/4 features")
    # Exercises the real feature-building path (the same one train.py/recommendation_engine.py
    # use) over every row now, not just at train time -- an unknown crop_id/variety_id or a
    # FEATURE_COLUMNS/clean.csv drift raises here, loudly, as part of the reproducible build,
    # rather than silently surfacing later inside a training run.
    build_features(clean[FEATURE_COLUMNS].to_dict(orient="records"))

    _stage("4/4 split")
    # The whole pool (real + synthetic) is split together -- see the module docstring for why
    # data_source no longer gates this. test_ids.json's frozen ids are just row indices into
    # this pool; nothing about the freeze mechanism itself needed to change.
    test_ids_path = EXTERNAL_DIR / "test_ids.json"
    if test_ids_path.exists():
        frozen_test_ids = set(json.loads(test_ids_path.read_text(encoding="utf-8"))["test_row_ids"])
        clean["split"] = ["test" if i in frozen_test_ids else None for i in clean.index]

        # Split the non-test remainder into train/val only, at the *same relative*
        # proportions the original 70/15/15 implied (70/85 : 15/85), not a fresh 70/15/15 --
        # otherwise train/val sizes drift on every rerun even though test stays frozen.
        remainder = clean[clean["split"].isna()]
        remainder_ratios = {
            "train": split_ratios["train"] / (split_ratios["train"] + split_ratios["val"]),
            "val": split_ratios["val"] / (split_ratios["train"] + split_ratios["val"]),
        }
        clean.loc[remainder.index, "split"] = _stratified_split(remainder, CLASSIFIER_TARGET, seed, remainder_ratios)
    else:
        clean["split"] = _stratified_split(clean, CLASSIFIER_TARGET, seed, split_ratios)
        test_ids_path.write_text(
            json.dumps({"test_row_ids": sorted(clean.index[clean["split"] == "test"].tolist())}, indent=2),
            encoding="utf-8",
        )

    clean = clean.sort_index()

    # de-duplicated across splits by construction: each row index is assigned to exactly one
    # split value, so the same row can never appear twice.
    clean.to_csv(PROCESSED_DIR / "train.csv", index=False)

    split_sizes = clean["split"].value_counts().to_dict()
    content_hash = _content_hash(clean)
    dataset_version = f"{config['version']}+{content_hash[:8]}"
    manifest_entry = {
        "description": "Built train/val/test table for the fertilizer-type classifier",
        "path": "data/processed/train.csv",
        "committed": False,
        "dataset_version": dataset_version,
        "pipeline_version": config["version"],
        "seed": seed,
        "split_ratios": split_ratios,
        "split_sizes": split_sizes,
        "content_hash": content_hash,
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

    if verbose:
        print(f"dataset_version: {dataset_version}")

    return manifest_entry


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG_PATH)
    args = parser.parse_args()

    config = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    entry = run(config=config, verbose=True)
    print(json.dumps(entry, indent=2))


if __name__ == "__main__":
    main()
