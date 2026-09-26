from fastapi import APIRouter, HTTPException

from src.api.config import SettingsDep
from src.api.mock import build_mock_risk_score
from src.api.schemas import RiskScoreRequest, RiskScoreResponse

router = APIRouter()


@router.post("/risk-score", response_model=RiskScoreResponse)
def risk_score(request: RiskScoreRequest, settings: SettingsDep) -> RiskScoreResponse:
    if settings.predict_mode == "mock":
        return build_mock_risk_score(request)
    raise HTTPException(status_code=501, detail="Risk analyzer not built yet")
