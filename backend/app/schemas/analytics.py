from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SummaryKPI(BaseModel):
    total_incidents: int
    incidents_today: int
    incidents_this_week: int
    incidents_this_month: int
    high_severity_incidents: int
    active_hotspots: int
    highest_crime_category: str
    last_updated: str

class AnalyticsFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    crime_type_id: Optional[int] = None
    severity: Optional[str] = None
    police_station_id: Optional[int] = None
    status: Optional[str] = None

class DataPoint(BaseModel):
    label: str
    value: int
    percentage: Optional[float] = None
    extra: Optional[Dict[str, Any]] = None

class TimeSeriesPoint(BaseModel):
    date: str
    count: int
    high_severity: Optional[int] = 0

class HourlyPoint(BaseModel):
    hour: int
    hour_label: str
    count: int

class WeekdayPoint(BaseModel):
    day: str
    day_index: int
    count: int

class StationMetricPoint(BaseModel):
    station_id: int
    station_name: str
    count: int
    high_severity: int
