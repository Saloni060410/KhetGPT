from fastapi import APIRouter

from src.api.schemas import HealthResponse
from src.models.predict import MODEL_VERSION

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", model_version=MODEL_VERSION)
