from fastapi import APIRouter, HTTPException

from src.api.schemas import PredictRequest, PredictResponse

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    raise HTTPException(status_code=501, detail="Model not trained yet")
