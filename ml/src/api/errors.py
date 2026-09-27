"""Global exception handlers (S7).

Converts business-logic exceptions raised deep in the engine into the exact error shapes
docs/api-contract.md commits to (rule 9): `422 { detail: [...] }` for invalid input,
`503 { detail }` when the model or reference data is unavailable. Registered once in main.py
so every endpoint gets this for free -- this is what replaced the try/except that used to be
duplicated in recommend.py and risk_score.py, converting the same two exception pairs to the
same two status codes.

Before this, UnknownCropError/UnknownStageError were turned into `422 { detail: "<string>" }`
by each endpoint's own try/except -- a real drift from the contract, which has always said
`{ detail: [...] }` (matching FastAPI's own pydantic validation-error shape, see
docs/contract-fixtures/error_422.json). Fixed here, not by changing the contract.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.data_pipeline.feature_engineering import UnknownCropError
from src.engine.npk_calculator import ReferenceDataIncomplete, UnknownStageError
from src.engine.recommendation_engine import EngineUnavailable


def _unprocessable(loc: list[str], msg: str, error_type: str) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": [{"loc": loc, "msg": msg, "type": error_type}]})


async def _handle_unknown_crop(request: Request, exc: UnknownCropError) -> JSONResponse:
    # The same exception covers three raise sites (bad crop_type, bad crop_id, bad variety_id --
    # see feature_engineering.py). Each message leads with the field name it's complaining
    # about, so this is a deterministic read of that, not a guess at which field is wrong.
    field = "variety" if "variety_id" in str(exc) else "crop_type"
    return _unprocessable(["body", field], str(exc), "value_error.unknown_id")


async def _handle_unknown_stage(request: Request, exc: UnknownStageError) -> JSONResponse:
    return _unprocessable(["body", "growth_stage"], str(exc), "value_error.unknown_id")


async def _handle_reference_data_incomplete(request: Request, exc: ReferenceDataIncomplete) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})


async def _handle_engine_unavailable(request: Request, exc: EngineUnavailable) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(UnknownCropError, _handle_unknown_crop)
    app.add_exception_handler(UnknownStageError, _handle_unknown_stage)
    app.add_exception_handler(ReferenceDataIncomplete, _handle_reference_data_incomplete)
    app.add_exception_handler(EngineUnavailable, _handle_engine_unavailable)
