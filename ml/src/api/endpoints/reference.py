from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from src.api import reference_data
from src.api.config import SettingsDep
from src.api.mock import mock_items, mock_json
from src.api.schemas import FertilizerProduct, ReferenceCrop, SeasonalWeather, SoilRating

router = APIRouter(prefix="/reference")


def _unavailable(error: reference_data.ReferenceUnavailable) -> HTTPException:
    return HTTPException(status_code=503, detail=str(error))


@router.get("/crops", response_model=list[ReferenceCrop])
def crops(settings: SettingsDep) -> list[ReferenceCrop]:
    if settings.predict_mode == "mock":
        return [ReferenceCrop.model_validate(item) for item in mock_items("crops.json")]
    try:
        return reference_data.load_crops(settings.external_path)
    except reference_data.ReferenceUnavailable as error:
        raise _unavailable(error) from error


@router.get("/soil-ratings", response_model=list[SoilRating])
def soil_ratings(settings: SettingsDep) -> list[SoilRating]:
    if settings.predict_mode == "mock":
        return [SoilRating.model_validate(item) for item in mock_items("soil_ratings.json")]
    try:
        return reference_data.load_soil_ratings(settings.external_path)
    except reference_data.ReferenceUnavailable as error:
        raise _unavailable(error) from error


@router.get("/fertilizers", response_model=list[FertilizerProduct])
def fertilizers(settings: SettingsDep) -> list[FertilizerProduct]:
    if settings.predict_mode == "mock":
        return [FertilizerProduct.model_validate(item) for item in mock_items("fertilizers.json")]
    try:
        return reference_data.load_fertilizers(settings.external_path)
    except reference_data.ReferenceUnavailable as error:
        raise _unavailable(error) from error


@router.get("/seasonal-weather", response_model=SeasonalWeather)
def seasonal_weather(
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    month: Annotated[int, Query(ge=1, le=12)],
    settings: SettingsDep,
) -> SeasonalWeather:
    if settings.predict_mode == "mock":
        temperature, humidity, rainfall = mock_json("seasonal_weather.json")["months"][str(month)]
        return SeasonalWeather(temperature_c=temperature, humidity_pct=humidity, rainfall_mm_forecast=rainfall)
    try:
        return reference_data.load_seasonal_weather(settings.external_path, lat, lng, month)
    except reference_data.ReferenceUnavailable as error:
        raise _unavailable(error) from error
