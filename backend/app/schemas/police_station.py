from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PoliceStationBase(BaseModel):
    name: str = Field(..., max_length=100)
    station_code: str = Field(..., max_length=20)
    jurisdiction_area: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    contact_number: Optional[str] = None
    officer_in_charge: Optional[str] = None

class PoliceStationCreate(PoliceStationBase):
    pass

class PoliceStationUpdate(BaseModel):
    name: Optional[str] = None
    station_code: Optional[str] = None
    jurisdiction_area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_number: Optional[str] = None
    officer_in_charge: Optional[str] = None

class PoliceStationResponse(PoliceStationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
