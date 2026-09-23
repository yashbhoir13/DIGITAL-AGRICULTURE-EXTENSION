from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    email: str


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: str = "farmer"


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    full_name: Optional[str] = None


class RegionOut(BaseModel):
    id: int
    name: str
    state: str
    climate_zone: str
    avg_rainfall_mm: float
    avg_temp_c: float
    notes: Optional[str] = None
    is_demo: bool

    class Config:
        from_attributes = True


class RegionCreate(BaseModel):
    name: str
    state: str
    climate_zone: str
    avg_rainfall_mm: float
    avg_temp_c: float
    notes: Optional[str] = None


class SoilIn(BaseModel):
    soil_type: str
    ph: float
    organic_matter_pct: float
    nitrogen: str = "medium"
    phosphorus: str = "medium"
    potassium: str = "medium"
    moisture: str = "moderate"


class FarmCreate(BaseModel):
    region_id: int
    name: str
    location: str
    land_area_ha: float = Field(gt=0)
    water_availability: str
    season: str
    climate_notes: Optional[str] = None
    crop_preferences: Optional[str] = None
    expected_quantity_kg: Optional[float] = None
    soil: SoilIn


class FarmOut(BaseModel):
    id: int
    user_id: int
    region_id: int
    name: str
    location: str
    land_area_ha: float
    water_availability: str
    season: str
    climate_notes: Optional[str] = None
    crop_preferences: Optional[str] = None
    expected_quantity_kg: Optional[float] = None
    soil: Optional[SoilIn] = None

    class Config:
        from_attributes = True


class CropCreate(BaseModel):
    name: str
    category: str
    cultivation_days: int
    suitable_soil: str
    water_requirement: str
    suitable_season: str
    min_temp_c: float
    max_temp_c: float
    expected_yield_kg_per_ha: float
    storage_requirement: str
    perishability: str
    notes: Optional[str] = None


class CropOut(CropCreate):
    id: int
    is_demo: bool

    class Config:
        from_attributes = True


class MarketCreate(BaseModel):
    region_id: int
    name: str
    location: str
    capacity_kg: float
    current_demand_kg: float
    current_price_inr: float
    transport_feasibility: str
    storage_available: bool = True
    storage_capacity_kg: float = 0
    notes: Optional[str] = None


class MarketOut(MarketCreate):
    id: int
    is_demo: bool

    class Config:
        from_attributes = True


class SeriesPoint(BaseModel):
    period_date: date
    value: float
    kind: str = "historical"


class ForecastResponse(BaseModel):
    crop_id: int
    crop_name: str
    region_id: Optional[int] = None
    market_id: Optional[int] = None
    model_name: str
    horizon_months: int
    historical: list[SeriesPoint]
    forecast: list[SeriesPoint]
    metrics: dict
    disclaimer: str = "Machine learning predictive model analysis."


class ProductionRequest(BaseModel):
    farm_id: Optional[int] = None
    crop_id: int
    land_area_ha: Optional[float] = None
    region_id: Optional[int] = None


class ProductionResponse(BaseModel):
    crop_id: int
    crop_name: str
    land_area_ha: float
    yield_kg_per_ha: float
    expected_production_kg: float
    method: str
    notes: str


class RecommendRequest(BaseModel):
    farm_id: int


class CropRecommendationItem(BaseModel):
    crop_id: int
    crop_name: str
    rank: int
    suitability: str
    agri_score: float
    market_score: float
    combined_score: float
    reasons: list[str]


class SupplyDemandRequest(BaseModel):
    crop_id: int
    region_id: int
    farm_id: Optional[int] = None
    expected_supply_kg: Optional[float] = None
    market_id: Optional[int] = None


class SupplyDemandResponse(BaseModel):
    crop_id: int
    crop_name: str
    region_id: int
    expected_supply_kg: float
    predicted_demand_kg: float
    gap_kg: float
    status: str
    risk_level: str
    explanation: str


class ScheduleRequest(BaseModel):
    farm_id: int
    crop_id: int


class ScheduleMilestone(BaseModel):
    milestone: str
    milestone_date: date
    detail: str


class ScheduleResponse(BaseModel):
    crop_name: str
    recommended_start: date
    expected_harvest: date
    demand_peak_month: int
    demand_peak_label: str
    notes: str
    milestones: list[ScheduleMilestone]


class RiskResponse(BaseModel):
    crop_id: int
    crop_name: str
    region_id: int
    risk_score: float
    risk_level: str
    reasons: list[str]


class AllocationRequest(BaseModel):
    farm_id: int
    crop_id: int
    quantity_kg: Optional[float] = None


class AllocationItem(BaseModel):
    market_id: int
    market_name: str
    rank: int
    label: str
    score: float
    allocated_kg: float
    distance_km: Optional[float] = None
    reasons: list[str]


class WhatIfRequest(BaseModel):
    farm_id: int
    crop_id: int
    market_id: Optional[int] = None
    land_area_ha: Optional[float] = None
    cultivation_quantity_kg: Optional[float] = None
    demand_override_kg: Optional[float] = None
    price_override: Optional[float] = None
    name: str = "Scenario"


class WhatIfResponse(BaseModel):
    before: dict
    after: dict
    interpretation: str


class VisionDetection(BaseModel):
    label: str
    confidence: float
    bbox: list[float]


class VisionResponse(BaseModel):
    engine: str
    count: int
    detections: list[VisionDetection]
    annotated_image_base64: Optional[str] = None
    notes: str


class DashboardOut(BaseModel):
    total_crops: int
    predicted_demand_kg: float
    expected_production_kg: float
    supply_demand_gap_kg: float
    average_price: float
    surplus_risk: str
    recommended_crop: Optional[str] = None
    recommended_market: Optional[str] = None
    demand_trend: list[dict]
    price_trend: list[dict]
    supply_vs_demand: list[dict]
    crop_recommendations: list[dict]
    risk_distribution: list[dict]
    disclaimer: str
