"""Structured JSON request logging (S7).

Deliberately narrow: field_id, crop_type, model_version and latency_ms only -- never the soil
or weather payload. That data isn't needed to debug a slow or wrong response (the fixture and
the request schema already pin down what a given field_id/crop_type combination should look
like), and a log aggregator has no business retaining a farmer's soil-test numbers.
"""

from __future__ import annotations

import json
import logging
import time
from collections.abc import Iterator
from contextlib import contextmanager

logger = logging.getLogger("khetgpt.ml.requests")


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {"event": record.getMessage()}
        payload.update(getattr(record, "fields", {}))
        return json.dumps(payload, default=str)


def configure_request_logging() -> None:
    """Idempotent -- main.py's eager import-time setup (see its app.state.engine comment)
    means this can run more than once in a test session; a second call must not double up
    handlers and log every request twice."""
    if logger.handlers:
        return
    handler = logging.StreamHandler()
    handler.setFormatter(_JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False  # don't also go through pytest's/uvicorn's root handler


@contextmanager
def log_request(*, endpoint: str, field_id: str | None, crop_type: str) -> Iterator[dict]:
    """Times the wrapped block. The caller sets fields["model_version"] once the response is
    built (it isn't known any earlier). Logs on the way out even if the block raised, so a
    failed request still gets a latency and a crop_type -- just no model_version."""
    start = time.perf_counter()
    fields: dict[str, object] = {
        "endpoint": endpoint,
        "field_id": field_id,
        "crop_type": crop_type,
        "model_version": None,
    }
    try:
        yield fields
    finally:
        fields["latency_ms"] = round((time.perf_counter() - start) * 1000, 1)
        logger.info("request", extra={"fields": fields})
