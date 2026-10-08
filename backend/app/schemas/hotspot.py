from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class HotspotDetectRequest(BaseModel):
    eps_meters: Optional[float] = Field(default=350.0, ge=50.0, le=5000.0)
    min_samples: Optional[int] = Field(default=4, ge=2, le=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    crime_type_id: Optional[int] = None
    police_station_id: Optional[int] = None

class HotspotResponse(BaseModel):
    id: int
    cluster_label: str
    center_lat: float
    center_lon: float
    radius_meters: float
    incident_count: int
    risk_score: float
    risk_category: str  # Low, Moderate, High, Very High
    primary_crime_type: Optional[str] = None
    severity_breakdown: Optional[Dict[str, int]] = None
    temporal_concentration: Optional[Dict[str, Any]] = None
    detection_method: str
    geometry_geojson: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
