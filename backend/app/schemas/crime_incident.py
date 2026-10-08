from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime
from app.schemas.crime_type import CrimeTypeResponse
from app.schemas.police_station import PoliceStationResponse

class CrimeIncidentBase(BaseModel):
    case_number: str = Field(..., max_length=50)
    crime_type_id: int
    incident_date: date
    incident_time: Optional[time] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    police_station_id: int
    severity: str = Field(default="Medium")  # Low, Medium, High, Critical
    status: str = Field(default="Reported")   # Reported, Under Investigation, Charges Filed, Closed
    description: Optional[str] = None
    address: Optional[str] = None
    weapon_used: Optional[str] = None
    victim_count: int = Field(default=1, ge=0)

class CrimeIncidentCreate(CrimeIncidentBase):
    pass

class CrimeIncidentUpdate(BaseModel):
    crime_type_id: Optional[int] = None
    incident_date: Optional[date] = None
    incident_time: Optional[time] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    police_station_id: Optional[int] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    weapon_used: Optional[str] = None
    victim_count: Optional[int] = None

class CrimeIncidentResponse(CrimeIncidentBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    crime_type: Optional[CrimeTypeResponse] = None
    police_station: Optional[PoliceStationResponse] = None

    model_config = {"from_attributes": True}

class IncidentPagination(BaseModel):
    items: List[CrimeIncidentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
