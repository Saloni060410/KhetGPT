from fastapi import APIRouter, HTTPException

from src.api.config import SettingsDep
from src.api.deps import EngineDep
from src.api.mock import build_mock_risk_score
from src.api.schemas import RiskScoreRequest, RiskScoreResponse
from src.data_pipeline.feature_engineering import UnknownCropError
from src.engine.npk_calculator import ReferenceDataIncomplete, UnknownStageError
from src.engine.recommendation_engine import EngineUnavailable
from src.engine.recommendation_engine import score_planned_risk as run_score_planned

router = APIRouter()


@router.post("/risk-score", response_model=RiskScoreResponse)
def risk_score(request: RiskScoreRequest, settings: SettingsDep, engine: EngineDep) -> RiskScoreResponse:
    if settings.predict_mode == "mock":
        return build_mock_risk_score(request)
    try:
        return run_score_planned(request, engine)
    except (UnknownCropError, UnknownStageError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except (ReferenceDataIncomplete, EngineUnavailable) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
