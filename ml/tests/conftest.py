import pytest

from src.api.config import Settings, get_settings
from src.api.main import app


@pytest.fixture(autouse=True)
def mock_settings():
    """Tests run in mock mode against an empty data folder unless a test overrides the settings."""
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, predict_mode="mock")
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def use_settings():
    def apply(**values) -> Settings:
        settings = Settings(_env_file=None, **values)
        app.dependency_overrides[get_settings] = lambda: settings
        return settings

    return apply
