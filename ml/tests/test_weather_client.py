import shutil

import httpx
import pandas as pd
import pytest

from src.weather.weather_client import (
    ARCHIVE_URL,
    CACHE_DIR,
    FORECAST_URL,
    WeatherError,
    build_seasonal_fallback,
    get_forecast,
    get_historical_climate,
)

FORECAST_RESPONSE = {
    "current": {"temperature_2m": 26.4, "relative_humidity_2m": 58},
    "daily": {"precipitation_sum": [0.0, 1.2, None, 3.4, 0.0]},
}

ARCHIVE_RESPONSE = {
    "daily": {
        "time": ["2025-01-01", "2025-01-02"],
        "temperature_2m_mean": [13.1, 12.8],
        "precipitation_sum": [0.0, None],
    },
    "hourly": {
        "time": [f"2025-01-01T{h:02d}:00" for h in range(24)] + [f"2025-01-02T{h:02d}:00" for h in range(24)],
        "relative_humidity_2m": [60] * 24 + [70] * 24,
    },
}


def _mock_client(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


@pytest.fixture(autouse=True)
def clean_cache():
    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)
    yield
    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)


def test_get_forecast_returns_the_c1_weather_block_shape():
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url).startswith(FORECAST_URL)
        return httpx.Response(200, json=FORECAST_RESPONSE)

    result = get_forecast(30.9, 75.85, days=5, client=_mock_client(handler))
    assert result == {
        "temperature_c": 26.4,
        "humidity_pct": 58,
        "rainfall_mm_forecast": pytest.approx(4.6),  # 0.0+1.2+0(null)+3.4+0.0
    }


def test_get_forecast_treats_null_rain_as_zero():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=FORECAST_RESPONSE)

    result = get_forecast(30.9, 75.85, client=_mock_client(handler))
    assert result["rainfall_mm_forecast"] == pytest.approx(4.6)


def test_get_forecast_raises_weather_error_on_http_failure():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error": "down"})

    with pytest.raises(WeatherError):
        get_forecast(30.9, 75.85, client=_mock_client(handler))


def test_get_forecast_retries_once_then_succeeds():
    attempts = []

    def handler(request: httpx.Request) -> httpx.Response:
        attempts.append(1)
        if len(attempts) == 1:
            raise httpx.ConnectTimeout("simulated timeout", request=request)
        return httpx.Response(200, json=FORECAST_RESPONSE)

    result = get_forecast(30.9, 75.85, client=_mock_client(handler))
    assert len(attempts) == 2
    assert result["temperature_c"] == 26.4


def test_get_forecast_uses_the_file_cache_on_second_call():
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(1)
        return httpx.Response(200, json=FORECAST_RESPONSE)

    get_forecast(30.9, 75.85, client=_mock_client(handler))
    get_forecast(30.9, 75.85, client=_mock_client(handler))
    assert len(calls) == 1  # second call served from ml/data/raw/weather_cache/


def test_get_historical_climate_returns_a_dataframe_with_daily_mean_humidity():
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url).startswith(ARCHIVE_URL)
        return httpx.Response(200, json=ARCHIVE_RESPONSE)

    df = get_historical_climate(30.9, 75.85, "2025-01-01", "2025-01-02", client=_mock_client(handler))
    assert isinstance(df, pd.DataFrame)
    assert list(df.columns) == ["temperature_c", "humidity_pct", "rainfall_mm"]
    assert len(df) == 2
    assert df.iloc[0]["humidity_pct"] == 60  # hourly 60 all day -> daily mean 60
    assert df.iloc[1]["rainfall_mm"] == 0  # null treated as 0


def test_build_seasonal_fallback_writes_csv_with_expected_columns(tmp_path, monkeypatch):
    import src.weather.weather_client as wc

    monkeypatch.setattr(wc, "EXTERNAL_DIR", tmp_path)

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=ARCHIVE_RESPONSE)

    out_path = build_seasonal_fallback(
        [{"region_key": "punjab_ludhiana", "lat": 30.9, "lon": 75.85}],
        years=[2024, 2025],
        client=_mock_client(handler),
    )
    df = pd.read_csv(out_path)
    assert list(df.columns) == ["region_key", "month", "temperature_c", "humidity_pct", "rainfall_mm_5day", "source"]
    assert (df["region_key"] == "punjab_ludhiana").all()
    assert "average" in df.iloc[0]["source"].lower()
    assert "forecast" not in df.iloc[0]["source"].lower() or "not a forecast" in df.iloc[0]["source"].lower()
