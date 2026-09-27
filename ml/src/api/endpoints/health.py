from fastapi import APIRouter

from src.api.config import SettingsDep
from src.api.deps import EngineDep
from src.api.mock import MOCK_MODEL_VERSION
from src.api.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health(settings: SettingsDep, engine: EngineDep) -> HealthResponse:
    if settings.predict_mode == "mock":
        return HealthResponse(
            status="ok",
            model_version=MOCK_MODEL_VERSION,
            detail="PREDICT_MODE=mock: responses are sample output, not real recommendations",
        )
    return HealthResponse(status=engine.status, model_version=engine.model_version, detail=engine.status_detail)
