"""Request/response schemas for the ML service. Must match docs/api-contract.md exactly."""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class Soil(BaseModel):
    """The soil schema is fixed by the problem statement. Do not add or rename fields."""

    n: float = Field(ge=0)
    p: float = Field(ge=0)
    k: float = Field(ge=0)
    ph: float = Field(ge=0, le=14)
    organic_carbon: float = Field(ge=0, le=100)
    moisture: float = Field(ge=0, le=100)


class Weather(BaseModel):
    temperature_c: float
    humidity_pct: float = Field(ge=0, le=100)
    rainfall_mm_forecast: float = Field(ge=0)
    source: Literal["live", "cached", "seasonal_average"] = "live"


class FertilizerUsage(BaseModel):
    type: str
    quantity_kg_per_acre: float = Field(ge=0)
    applied_on: date


class PlannedApplication(BaseModel):
    fertilizer_type: str
    quantity_kg_per_acre: float = Field(ge=0)


class RecommendRequest(BaseModel):
    field_id: str
    crop_type: str
    variety: str | None = None
    irrigation: Literal["irrigated", "rainfed"] | None = None
    growth_stage: str
    sowing_date: date | None = None
    soil: Soil
    weather: Weather
    previous_fertilizer_usage: list[FertilizerUsage] = []


class RiskScoreRequest(BaseModel):
    crop_type: str
    variety: str | None = None
    irrigation: Literal["irrigated", "rainfed"] | None = None
    growth_stage: str
    sowing_date: date | None = None
    soil: Soil
    weather: Weather
    previous_fertilizer_usage: list[FertilizerUsage] = []
    planned_application: list[PlannedApplication]


class ScheduleItem(BaseModel):
    stage: str
    fertilizer_type: str
    quantity_kg_per_acre: float
    apply_by: date | None = None
    timing_note: str | None = None


class Recommendation(BaseModel):
    fertilizer_type: str
    quantity_kg_per_acre: float
    schedule: list[ScheduleItem]


class Risk(BaseModel):
    level: Literal["low", "medium", "high"]
    reason: str
    soil_health_impact: str
    yield_impact: str
    over_application_pct: float | None = None


class NutrientPlan(BaseModel):
    method: Literal["reference_dose", "stcr"]
    soil_rating: Literal["very_low", "low", "medium", "high"] | None = None
    standard_dose_kg_ha: float
    soil_adjustment_kg_ha: float
    prior_credit_kg_ha: float
    fertilizer_needed_kg_ha: float


class NutrientBalance(BaseModel):
    n: NutrientPlan
    p: NutrientPlan
    k: NutrientPlan


class Explanation(BaseModel):
    top_factors: list[str]
    nutrient_balance: NutrientBalance
    formula: str
    data_notes: list[str] = []


class CostLine(BaseModel):
    fertilizer_type: str
    quantity_kg_per_acre: float
    cost_inr_per_acre: float


class Cost(BaseModel):
    estimated_cost_inr_per_acre: float
    previous_cost_inr_per_acre: float | None = None
    saving_inr_per_acre: float | None = None
    prices_as_of: date | None = None
    breakdown: list[CostLine] = []


class Impact(BaseModel):
    over_application_reduction_pct: float | None = None


class RecommendResponse(BaseModel):
    recommendation: Recommendation
    risk: Risk
    explanation: Explanation
    cost: Cost
    impact: Impact
    model_version: str


class AppliedVsRecommended(BaseModel):
    applied_kg_ha: float
    recommended_kg_ha: float
    ratio: float


class AppliedBalance(BaseModel):
    n: AppliedVsRecommended
    p: AppliedVsRecommended
    k: AppliedVsRecommended


class RiskScoreResponse(BaseModel):
    risk: Risk
    nutrient_balance: AppliedBalance
    model_version: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    model_version: str
    detail: str | None = None


class ReferenceVariety(BaseModel):
    id: str
    name_en: str
    name_hi: str | None = None


class ReferenceStage(BaseModel):
    id: str
    name_en: str
    name_hi: str | None = None
    order: int


class ReferenceCrop(BaseModel):
    id: str
    name_en: str
    name_hi: str | None = None
    varieties: list[ReferenceVariety] = []
    stages: list[ReferenceStage] = []


class SoilRating(BaseModel):
    parameter: str
    unit: str
    very_low_below: float | None = None
    low_below: float
    high_above: float


class FertilizerProduct(BaseModel):
    id: str
    name: str
    n_pct: float
    p2o5_pct: float
    k2o_pct: float
    price_inr_per_kg: float
    price_date: date | None = None
    bag_size_kg: float | None = None


class SeasonalWeather(BaseModel):
    temperature_c: float
    humidity_pct: float
    rainfall_mm_forecast: float
    source: Literal["seasonal_average"] = "seasonal_average"
