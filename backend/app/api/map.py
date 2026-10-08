from typing import List, Dict, Any, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.crime_incident import CrimeIncident
from app.models.police_station import PoliceStation
from app.schemas.gis import (
    GeoJSONFeatureCollection, HeatmapPoint, NearbyStationResponse
)
from app.services.gis_service import GISService

router = APIRouter(prefix="/map", tags=["Geospatial & Map"])

SEVERITY_HEAT_WEIGHTS = {
    "Low": 0.4,
    "Medium": 0.7,
    "High": 1.2,
    "Critical": 2.0
}

def filter_incidents_query(
    query,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    crime_type_id: Optional[int] = None,
    severity: Optional[str] = None,
    police_station_id: Optional[int] = None,
    status_val: Optional[str] = None
):
    if date_from:
        query = query.filter(CrimeIncident.incident_date >= date_from)
    if date_to:
        query = query.filter(CrimeIncident.incident_date <= date_to)
    if crime_type_id:
        query = query.filter(CrimeIncident.crime_type_id == crime_type_id)
    if severity:
        query = query.filter(CrimeIncident.severity == severity)
    if police_station_id:
        query = query.filter(CrimeIncident.police_station_id == police_station_id)
    if status_val:
        query = query.filter(CrimeIncident.status == status_val)
    return query

@router.get("/incidents")
def get_map_incidents(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    crime_type_id: Optional[int] = None,
    severity: Optional[str] = None,
    police_station_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(2000, le=5000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns lightweight incident array optimized for map rendering and marker clustering.
    """
    query = filter_incidents_query(
        db.query(CrimeIncident),
        date_from=date_from,
        date_to=date_to,
        crime_type_id=crime_type_id,
        severity=severity,
        police_station_id=police_station_id,
        status_val=status
    )
    incidents = query.limit(limit).all()

    return [
        {
            "id": inc.id,
            "case_number": inc.case_number,
            "lat": inc.latitude,
            "lon": inc.longitude,
            "crime_type": inc.crime_type.name if inc.crime_type else "Unknown",
            "category": inc.crime_type.category if inc.crime_type else "General",
            "severity": inc.severity,
            "status": inc.status,
            "date": inc.incident_date.isoformat() if inc.incident_date else "",
            "time": inc.incident_time.strftime("%H:%M") if inc.incident_time else "",
            "police_station": inc.police_station.name if inc.police_station else "Unknown",
            "address": inc.address or "",
            "victim_count": inc.victim_count
        }
        for inc in incidents
    ]

@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap_data(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    crime_type_id: Optional[int] = None,
    severity: Optional[str] = None,
    police_station_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns intensity-weighted coordinates [lat, lon, weight] for Leaflet heatmaps.
    """
    query = filter_incidents_query(
        db.query(CrimeIncident),
        date_from=date_from,
        date_to=date_to,
        crime_type_id=crime_type_id,
        severity=severity,
        police_station_id=police_station_id
    )
    incidents = query.all()

    points = []
    for inc in incidents:
        w = SEVERITY_HEAT_WEIGHTS.get(inc.severity, 0.7)
        points.append({"lat": inc.latitude, "lon": inc.longitude, "weight": w})
    return points

@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_geojson_feature_collection(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    crime_type_id: Optional[int] = None,
    severity: Optional[str] = None,
    police_station_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns RFC 7946 compliant GeoJSON FeatureCollection of incidents.
    """
    query = filter_incidents_query(
        db.query(CrimeIncident),
        date_from=date_from,
        date_to=date_to,
        crime_type_id=crime_type_id,
        severity=severity,
        police_station_id=police_station_id
    )
    incidents = query.all()

    features = [GISService.incident_to_geojson_feature(inc) for inc in incidents]
    return GISService.build_feature_collection(features)

@router.get("/spatial-query")
def spatial_query(
    lat: Optional[float] = Query(None, description="Center latitude for radius query"),
    lon: Optional[float] = Query(None, description="Center longitude for radius query"),
    radius_meters: Optional[float] = Query(1000.0, description="Search radius in meters"),
    min_lat: Optional[float] = Query(None, description="Bounding box min latitude"),
    min_lon: Optional[float] = Query(None, description="Bounding box min longitude"),
    max_lat: Optional[float] = Query(None, description="Bounding box max latitude"),
    max_lon: Optional[float] = Query(None, description="Bounding box max longitude"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Performs radius search or bounding-box spatial query.
    Returns GeoJSON FeatureCollection of matched incidents.
    """
    incidents = db.query(CrimeIncident).all()

    if lat is not None and lon is not None:
        matched = GISService.filter_by_radius(incidents, lat, lon, radius_meters)
    elif min_lat is not None and min_lon is not None and max_lat is not None and max_lon is not None:
        matched = GISService.filter_by_bounding_box(incidents, min_lat, min_lon, max_lat, max_lon)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specify either (lat, lon, radius_meters) OR (min_lat, min_lon, max_lat, max_lon)"
        )

    features = [GISService.incident_to_geojson_feature(inc) for inc in matched]
    return {
        "matched_count": len(matched),
        "geojson": GISService.build_feature_collection(features)
    }

@router.get("/nearby-stations", response_model=NearbyStationResponse)
def get_nearby_station(
    lat: float = Query(..., description="Target latitude"),
    lon: float = Query(..., description="Target longitude"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Finds the nearest police station to given coordinates and computes road/haversine distance.
    """
    stations = db.query(PoliceStation).all()
    if not stations:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No stations registered")

    result = GISService.find_nearest_police_station(stations, lat, lon)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Could not calculate distance")

    station, dist_m = result
    return {
        "station_id": station.id,
        "station_name": station.name,
        "station_code": station.station_code,
        "distance_meters": round(dist_m, 1),
        "latitude": station.latitude,
        "longitude": station.longitude,
        "contact_number": station.contact_number,
        "officer_in_charge": station.officer_in_charge
    }
