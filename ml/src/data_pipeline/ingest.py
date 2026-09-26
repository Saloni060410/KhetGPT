"""Verify raw/external dataset files against ml/data/external/dataset_manifest.json.

Run as a script (python -m src.data_pipeline.ingest) or import verify_all() /
verify_dataset(). Fails loudly -- raises, does not warn-and-continue -- if a file
is missing or its sha256/row count/columns drift from what the manifest recorded
at retrieval time.
"""

import csv
import hashlib
import json
from pathlib import Path

ML_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = ML_ROOT / "data" / "external" / "dataset_manifest.json"


class IngestError(Exception):
    """A dataset file is missing or no longer matches its manifest entry."""


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _row_count_and_columns(path: Path) -> tuple[int, list[str]]:
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows:
        return 0, []
    return len(rows) - 1, rows[0]


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def verify_dataset(entry: dict) -> None:
    path = ML_ROOT / entry["path"]
    if not path.exists():
        raise IngestError(
            f"{entry['id']}: expected file not found at {path}. "
            f"Fetch it per ml/data/README.md (source: {entry['url']})."
        )

    actual_sha256 = _sha256(path)
    if actual_sha256 != entry["sha256"]:
        raise IngestError(
            f"{entry['id']}: sha256 mismatch for {path}. "
            f"Expected {entry['sha256']}, got {actual_sha256}. "
            "The file has changed since it was manifested -- re-verify the source "
            "and update dataset_manifest.json deliberately, don't silently proceed."
        )

    actual_rows, actual_columns = _row_count_and_columns(path)
    if actual_rows != entry["rows"]:
        raise IngestError(
            f"{entry['id']}: row count mismatch for {path}. "
            f"Expected {entry['rows']}, got {actual_rows}."
        )
    if actual_columns != entry["columns"]:
        raise IngestError(
            f"{entry['id']}: column mismatch for {path}.\n"
            f"Expected {entry['columns']}\n"
            f"Got      {actual_columns}"
        )


def verify_all() -> list[str]:
    """Verify every dataset in the manifest. Returns the list of verified ids."""
    manifest = load_manifest()
    verified = []
    for entry in manifest["datasets"]:
        verify_dataset(entry)
        verified.append(entry["id"])
    return verified


if __name__ == "__main__":
    verified = verify_all()
    for dataset_id in verified:
        print(f"OK: {dataset_id}")
    print(f"{len(verified)} dataset(s) verified against {MANIFEST_PATH}")
