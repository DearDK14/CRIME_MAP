from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class GeoJSONGeometry(BaseModel):
    type: str  # Point, Polygon, MultiPolygon
    coordinates: Any

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class SpatialRadiusQuery(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    radius_meters: float = Field(default=1000.0, ge=10.0, le=50000.0)

class BoundingBoxQuery(BaseModel):
    min_lat: float = Field(..., ge=-90.0, le=90.0)
    min_lon: float = Field(..., ge=-180.0, le=180.0)
    max_lat: float = Field(..., ge=-90.0, le=90.0)
    max_lon: float = Field(..., ge=-180.0, le=180.0)

class HeatmapPoint(BaseModel):
    lat: float
    lon: float
    weight: float

class NearbyStationResponse(BaseModel):
    station_id: int
    station_name: str
    station_code: str
    distance_meters: float
    latitude: float
    longitude: float
    contact_number: Optional[str] = None
    officer_in_charge: Optional[str] = None
