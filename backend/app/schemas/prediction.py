from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PredictionRunRequest(BaseModel):
    model_type: Optional[str] = Field(default="RandomForest", description="RandomForest or GradientBoosting")
    grid_size_meters: Optional[float] = Field(default=600.0, ge=200.0, le=2000.0)
    lookback_days: Optional[int] = Field(default=90, ge=30, le=365)

class PredictionResponse(BaseModel):
    id: int
    zone_id: str
    zone_name: str
    geometry_geojson: Optional[Dict[str, Any]] = None
    center_lat: float
    center_lon: float
    risk_score: float
    risk_category: str  # Low, Moderate, High, Very High
    incident_count_historical: int
    recent_trend_ratio: float
    severity_weighted_index: float
    model_name: str
    important_factors: Optional[Dict[str, Any]] = None
    created_at: datetime
    disclaimer: str = "Experimental historical risk assessment - decision-support information based on historical patterns and does not determine that a crime will occur."

    model_config = {"from_attributes": True}

class ModelComparisonResponse(BaseModel):
    model_name: str
    baseline_mae: float
    model_mae: float
    improvement_pct: float
    total_zones_evaluated: int
    feature_importances: Dict[str, float]
    generated_at: datetime
