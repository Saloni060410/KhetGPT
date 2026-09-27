from fastapi import APIRouter, HTTPException

from src.api.config import SettingsDep
from src.api.deps import EngineDep
from src.api.mock import build_mock_recommendation
from src.api.schemas import RecommendRequest, RecommendResponse
from src.data_pipeline.feature_engineering import UnknownCropError
from src.engine.npk_calculator import ReferenceDataIncomplete, UnknownStageError
from src.engine.recommendation_engine import EngineUnavailable
from src.engine.recommendation_engine import recommend as run_recommend

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest, settings: SettingsDep, engine: EngineDep) -> RecommendResponse:
    if settings.predict_mode == "mock":
        return build_mock_recommendation(request)
    try:
        return run_recommend(request, engine)
    except (UnknownCropError, UnknownStageError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except (ReferenceDataIncomplete, EngineUnavailable) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
