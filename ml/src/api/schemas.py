"""Request/response schemas for the ML service. Must match docs/api-contract.md exactly."""

from datetime import date
from typing import Literal

from pydantic import BaseModel


class Soil(BaseModel):
    n: float
    p: float
    k: float
    ph: float
    organic_carbon: float
    moisture: float


class Weather(BaseModel):
    temperature_c: float
    humidity_pct: float
    rainfall_mm_forecast: float


class FertilizerUsage(BaseModel):
    type: str
    quantity_kg_per_acre: float
    applied_on: date


class PredictRequest(BaseModel):
    field_id: str
    crop_type: str
    growth_stage: str
    soil: Soil
    weather: Weather
    previous_fertilizer_usage: list[FertilizerUsage] = []


class ScheduleItem(BaseModel):
    stage: str
    quantity_kg_per_acre: float
    apply_by: date


class Recommendation(BaseModel):
    fertilizer_type: str
    quantity_kg_per_acre: float
    schedule: list[ScheduleItem]


class Risk(BaseModel):
    level: Literal["low", "medium", "high"]
    reason: str


class Explanation(BaseModel):
    top_factors: list[str]


class PredictResponse(BaseModel):
    recommendation: Recommendation
    risk: Risk
    explanation: Explanation
    model_version: str


class HealthResponse(BaseModel):
    status: str
    model_version: str
