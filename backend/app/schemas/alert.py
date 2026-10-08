from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    alert_type: str
    title: str
    description: str
    severity: str  # INFO, WARNING, HIGH, CRITICAL
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    status: str    # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by_id: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class AlertAcknowledgeRequest(BaseModel):
    status: Optional[str] = "ACKNOWLEDGED"  # ACKNOWLEDGED or RESOLVED
