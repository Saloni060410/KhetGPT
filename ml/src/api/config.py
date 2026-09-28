"""Service settings. Values come from the environment or ml/.env."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Depends
from pydantic_settings import BaseSettings, SettingsConfigDict

ML_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ML_ROOT / ".env", extra="ignore")

    # "mock" returns sample output built from the contract fixtures. "real" runs the engine.
    predict_mode: Literal["mock", "real"] = "mock"
    model_artifact_dir: Path = Path("models_artifacts")
    data_external_dir: Path = Path("data/external")

    @property
    def external_path(self) -> Path:
        return self.data_external_dir if self.data_external_dir.is_absolute() else ML_ROOT / self.data_external_dir

    @property
    def artifact_path(self) -> Path:
        return self.model_artifact_dir if self.model_artifact_dir.is_absolute() else ML_ROOT / self.model_artifact_dir


@lru_cache
def get_settings() -> Settings:
    return Settings()


SettingsDep = Annotated[Settings, Depends(get_settings)]
