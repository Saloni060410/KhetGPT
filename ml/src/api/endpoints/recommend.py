from fastapi import APIRouter

from src.api.config import SettingsDep
from src.api.deps import EngineDep
from src.api.logging_utils import log_request
from src.api.mock import build_mock_recommendation
from src.api.schemas import (
    RecommendRequest,
    RecommendResponse,
    ServiceUnavailableResponse,
    ValidationErrorResponse,
)
from src.engine.recommendation_engine import recommend as run_recommend

router = APIRouter()


@router.post(
    "/recommend",
    response_model=RecommendResponse,
    responses={422: {"model": ValidationErrorResponse}, 503: {"model": ServiceUnavailableResponse}},
)
def recommend(request: RecommendRequest, settings: SettingsDep, engine: EngineDep) -> RecommendResponse:
    # UnknownCropError/UnknownStageError (422) and ReferenceDataIncomplete/EngineUnavailable
    # (503) are handled globally now (src/api/errors.py, registered in main.py) -- not caught
    # here, so they propagate to that handler.
    with log_request(endpoint="/recommend", field_id=request.field_id, crop_type=request.crop_type) as fields:
        if settings.predict_mode == "mock":
            response = build_mock_recommendation(request)
        else:
            response = run_recommend(request, engine)
        fields["model_version"] = response.model_version
        return response
