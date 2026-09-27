from fastapi import APIRouter

from src.api.config import SettingsDep
from src.api.deps import EngineDep
from src.api.logging_utils import log_request
from src.api.mock import build_mock_risk_score
from src.api.schemas import (
    RiskScoreRequest,
    RiskScoreResponse,
    ServiceUnavailableResponse,
    ValidationErrorResponse,
)
from src.engine.recommendation_engine import score_planned_risk as run_score_planned

router = APIRouter()


@router.post(
    "/risk-score",
    response_model=RiskScoreResponse,
    responses={422: {"model": ValidationErrorResponse}, 503: {"model": ServiceUnavailableResponse}},
)
def risk_score(request: RiskScoreRequest, settings: SettingsDep, engine: EngineDep) -> RiskScoreResponse:
    # UnknownCropError/UnknownStageError (422) and ReferenceDataIncomplete/EngineUnavailable
    # (503) are handled globally now (src/api/errors.py, registered in main.py) -- not caught
    # here, so they propagate to that handler.
    with log_request(endpoint="/risk-score", field_id=None, crop_type=request.crop_type) as fields:
        if settings.predict_mode == "mock":
            response = build_mock_risk_score(request)
        else:
            response = run_score_planned(request, engine)
        fields["model_version"] = response.model_version
        return response
