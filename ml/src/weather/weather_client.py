"""Open-Meteo weather client (no API key). Mirrors backend/src/services/weatherService.js's
get_forecast() exactly (same endpoint, params, and null-rain-as-0 summing) so the ML side and
the backend never disagree on a live weather value for the same coordinates.
"""

import json
import time
from datetime import date
from hashlib import sha256
from pathlib import Path

import httpx
import pandas as pd

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

CACHE_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / "weather_cache"
EXTERNAL_DIR = Path(__file__).resolve().parents[2] / "data" / "external"

TIMEOUT_SECONDS = 5.0
MAX_RETRIES = 1  # i.e. one retry after the first attempt fails -- two attempts total


class WeatherError(Exception):
    """A weather API call failed (network, timeout, or an unexpected response shape)."""


def _cache_path(url: str, params: dict) -> Path:
    key = sha256(json.dumps({"url": url, "params": params}, sort_keys=True).encode()).hexdigest()
    return CACHE_DIR / f"{key}.json"


def _get(url: str, params: dict, client: httpx.Client | None = None) -> dict:
    """GET with a file cache, a 5s timeout and one retry. Raises WeatherError, never lets an
    httpx exception escape uncaught."""
    cache_path = _cache_path(url, params)
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    owns_client = client is None
    client = client or httpx.Client(timeout=TIMEOUT_SECONDS)
    try:
        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                break
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                if attempt < MAX_RETRIES:
                    time.sleep(0.5)
        else:
            raise WeatherError(f"GET {url} failed after {MAX_RETRIES + 1} attempt(s): {last_error}") from last_error
    finally:
        if owns_client:
            client.close()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(data), encoding="utf-8")
    return data


def get_forecast(lat: float, lon: float, days: int = 5, client: httpx.Client | None = None) -> dict:
    """{temperature_c, humidity_pct, rainfall_mm_forecast} -- same keys and meaning as the
    weather block in contract C1. Mirrors weatherService.js's getWeather() exactly: same
    endpoint/params, rainfall is the sum of daily precipitation_sum with null treated as 0."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m",
        "daily": "precipitation_sum",
        "forecast_days": days,
        "timezone": "auto",
    }
    try:
        data = _get(FORECAST_URL, params, client=client)
        return {
            "temperature_c": data["current"]["temperature_2m"],
            "humidity_pct": data["current"]["relative_humidity_2m"],
            "rainfall_mm_forecast": sum(mm or 0 for mm in data["daily"]["precipitation_sum"]),
        }
    except (KeyError, TypeError) as exc:
        raise WeatherError(f"unexpected forecast response shape: {exc}") from exc


def get_historical_climate(lat: float, lon: float, start: str | date, end: str | date,
                            client: httpx.Client | None = None) -> pd.DataFrame:
    """DataFrame indexed by date with daily mean temperature_c, humidity_pct and
    rainfall_mm (mm/day). The archive API has no daily humidity aggregate (verified against
    the live API -- only hourly relative_humidity_2m exists), so hourly values are fetched
    and resampled to a daily mean here."""
    start = start.isoformat() if isinstance(start, date) else start
    end = end.isoformat() if isinstance(end, date) else end

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start,
        "end_date": end,
        "daily": "temperature_2m_mean,precipitation_sum",
        "hourly": "relative_humidity_2m",
        "timezone": "auto",
    }
    try:
        data = _get(ARCHIVE_URL, params, client=client)
        daily = pd.DataFrame(
            {
                "date": pd.to_datetime(data["daily"]["time"]).date,
                "temperature_c": data["daily"]["temperature_2m_mean"],
                "rainfall_mm": [mm or 0 for mm in data["daily"]["precipitation_sum"]],
            }
        )
        hourly = pd.DataFrame(
            {
                "date": pd.to_datetime(data["hourly"]["time"]).date,
                "humidity_pct": data["hourly"]["relative_humidity_2m"],
            }
        )
        daily_humidity = hourly.groupby("date", as_index=False)["humidity_pct"].mean()
        result = daily.merge(daily_humidity, on="date", how="left")
        return result.set_index("date")[["temperature_c", "humidity_pct", "rainfall_mm"]]
    except (KeyError, TypeError) as exc:
        raise WeatherError(f"unexpected archive response shape: {exc}") from exc


def build_seasonal_fallback(points: list[dict], years: list[int], client: httpx.Client | None = None) -> Path:
    """Writes ml/data/external/seasonal_weather.csv: one row per (region_key, month),
    averaged over `years` of archive data for each point in `points`
    ([{region_key, lat, lon}, ...]). Used as weather.source == "seasonal_average" when live
    and cached weather both fail -- clearly labelled an average, not a forecast."""
    rows = []
    for point in points:
        region_key, lat, lon = point["region_key"], point["lat"], point["lon"]
        yearly_frames = []
        for year in years:
            climate = get_historical_climate(lat, lon, date(year, 1, 1), date(year, 12, 31), client=client)
            climate = climate.reset_index()
            climate["month"] = pd.to_datetime(climate["date"]).dt.month
            yearly_frames.append(climate)

        combined = pd.concat(yearly_frames, ignore_index=True)
        monthly = combined.groupby("month").agg(
            temperature_c=("temperature_c", "mean"),
            humidity_pct=("humidity_pct", "mean"),
            rainfall_mm_per_day=("rainfall_mm", "mean"),
        )

        for month, row in monthly.iterrows():
            rows.append(
                {
                    "region_key": region_key,
                    "month": int(month),
                    "temperature_c": round(row["temperature_c"], 1),
                    "humidity_pct": round(row["humidity_pct"], 1),
                    "rainfall_mm_5day": round(row["rainfall_mm_per_day"] * 5, 1),
                    "source": (
                        f"Open-Meteo archive API, {min(years)}-{max(years)} average for "
                        f"({lat},{lon}) -- this is a multi-year AVERAGE, not a forecast."
                    ),
                }
            )

    out_df = pd.DataFrame(rows).sort_values(["region_key", "month"])
    out_path = EXTERNAL_DIR / "seasonal_weather.csv"
    out_df.to_csv(out_path, index=False)
    return out_path
