from fastapi import APIRouter

from src.api.config import SettingsDep
from src.api.mock import MOCK_MODEL_VERSION
from src.api.schemas import HealthResponse
from src.models.predict import MODEL_VERSION

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health(settings: SettingsDep) -> HealthResponse:
    if settings.predict_mode == "mock":
        return HealthResponse(
            status="ok",
            model_version=MOCK_MODEL_VERSION,
            detail="PREDICT_MODE=mock: responses are sample output, not real recommendations",
        )
    return HealthResponse(status="ok", model_version=MODEL_VERSION)
