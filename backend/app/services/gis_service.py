import math
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from shapely.geometry import Point, MultiPoint, Polygon, mapping
from shapely.ops import unary_union
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.models.crime_incident import CrimeIncident
from app.models.police_station import PoliceStation
from app.schemas.gis import GeoJSONFeature, GeoJSONFeatureCollection, GeoJSONGeometry, NearbyStationResponse

logger = logging.getLogger(__name__)

EARTH_RADIUS_METERS = 6371000.0

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes exact Great-Circle Haversine distance in meters between two WGS84 coordinates.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_METERS * c

class GISService:
    @staticmethod
    def incident_to_geojson_feature(incident: CrimeIncident) -> Dict[str, Any]:
        """Convert a CrimeIncident model to an RFC 7946 GeoJSON Feature."""
        crime_name = incident.crime_type.name if incident.crime_type else "Unknown"
        crime_cat = incident.crime_type.category if incident.crime_type else "General"
        station_name = incident.police_station.name if incident.police_station else "Unknown"

        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(incident.longitude), float(incident.latitude)]
            },
            "properties": {
                "id": incident.id,
                "case_number": incident.case_number,
                "crime_type": crime_name,
                "category": crime_cat,
                "severity": incident.severity,
                "status": incident.status,
                "incident_date": incident.incident_date.isoformat() if incident.incident_date else None,
                "incident_time": incident.incident_time.strftime("%H:%M:%S") if incident.incident_time else None,
                "police_station": station_name,
                "address": incident.address or "",
                "weapon_used": incident.weapon_used or "None",
                "victim_count": incident.victim_count
            }
        }

    @staticmethod
    def station_to_geojson_feature(station: PoliceStation) -> Dict[str, Any]:
        """Convert a PoliceStation model to an RFC 7946 GeoJSON Feature."""
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(station.longitude), float(station.latitude)]
            },
            "properties": {
                "id": station.id,
                "name": station.name,
                "station_code": station.station_code,
                "jurisdiction_area": station.jurisdiction_area or "",
                "contact_number": station.contact_number or "",
                "officer_in_charge": station.officer_in_charge or ""
            }
        }

    @staticmethod
    def build_feature_collection(features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Wrap list of features into a standard RFC 7946 FeatureCollection."""
        return {
            "type": "FeatureCollection",
            "features": features
        }

    @staticmethod
    def filter_by_radius(
        incidents: List[CrimeIncident], 
        center_lat: float, 
        center_lon: float, 
        radius_meters: float
    ) -> List[CrimeIncident]:
        """Spatial radius filtering using Haversine metric."""
        results = []
        for inc in incidents:
            dist = haversine_distance_meters(center_lat, center_lon, inc.latitude, inc.longitude)
            if dist <= radius_meters:
                results.append(inc)
        return results

    @staticmethod
    def filter_by_bounding_box(
        incidents: List[CrimeIncident],
        min_lat: float,
        min_lon: float,
        max_lat: float,
        max_lon: float
    ) -> List[CrimeIncident]:
        """Spatial bounding box filtering."""
        return [
            inc for inc in incidents
            if min_lat <= inc.latitude <= max_lat and min_lon <= inc.longitude <= max_lon
        ]

    @staticmethod
    def find_nearest_police_station(
        stations: List[PoliceStation],
        lat: float,
        lon: float
    ) -> Optional[Tuple[PoliceStation, float]]:
        """Find the closest police station and calculate distance in meters."""
        if not stations:
            return None
        closest_station = None
        min_dist = float("inf")
        for st in stations:
            d = haversine_distance_meters(lat, lon, st.latitude, st.longitude)
            if d < min_dist:
                min_dist = d
                closest_station = st
        return (closest_station, min_dist) if closest_station else None

    @staticmethod
    def generate_cluster_polygon(points: List[Tuple[float, float]], buffer_meters: float = 200.0) -> Dict[str, Any]:
        """
        Creates a buffered convex polygon GeoJSON for a cluster of coordinates.
        Uses Shapely for geometric union and convex hull buffering.
        """
        if not points:
            return None
        
        # Approximate 1 meter in degrees (roughly 1 / 111320 degrees latitude)
        deg_buffer = buffer_meters / 111320.0

        if len(points) == 1:
            pt = Point(points[0][1], points[0][0])  # Shapely expects (lon, lat)
            poly = pt.buffer(deg_buffer)
            return mapping(poly)

        shapely_pts = [Point(lon, lat) for lat, lon in points]
        multi_pt = MultiPoint(shapely_pts)
        hull = multi_pt.convex_hull
        
        # Buffer the hull
        buffered_hull = hull.buffer(deg_buffer)
        return mapping(buffered_hull)
