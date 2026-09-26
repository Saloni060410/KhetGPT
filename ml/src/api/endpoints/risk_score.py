from fastapi import APIRouter, HTTPException

from src.api.schemas import RiskScoreRequest, RiskScoreResponse

router = APIRouter()


@router.post("/risk-score", response_model=RiskScoreResponse)
def risk_score(request: RiskScoreRequest) -> RiskScoreResponse:
    raise HTTPException(status_code=501, detail="Risk analyzer not built yet")
