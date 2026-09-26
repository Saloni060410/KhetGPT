from fastapi import APIRouter, HTTPException

from src.api.config import SettingsDep
from src.api.mock import build_mock_recommendation
from src.api.schemas import RecommendRequest, RecommendResponse

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest, settings: SettingsDep) -> RecommendResponse:
    if settings.predict_mode == "mock":
        return build_mock_recommendation(request)
    raise HTTPException(status_code=501, detail="Recommendation engine not built yet")
