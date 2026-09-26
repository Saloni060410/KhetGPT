from fastapi import APIRouter, HTTPException

from src.api.schemas import RecommendRequest, RecommendResponse

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest) -> RecommendResponse:
    raise HTTPException(status_code=501, detail="Recommendation engine not built yet")
