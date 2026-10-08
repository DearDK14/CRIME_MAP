# CRIMEMAP GIS & Spatial Intelligence Methodology

> **Puducherry Police Hackathon 2026 — Problem Statement 2**  
> *Geospatial Crime Intelligence, Spatial Queries & Cartographic Architecture*

---

## 1. Fundamentals of Geospatial Representation

### 1.1 The Coordinate Reference System: WGS84 (EPSG:4326)
CRIMEMAP standardizes all geographic data on the **World Geodetic System 1984 (EPSG:4326)**:
- Standard ellipsoid model used by GPS and web mapping frameworks.
- Coordinate format: Latitude ($\phi \in [-90, +90]$), Longitude ($\lambda \in [-180, +180]$).
- Important standard: In GeoJSON (RFC 7946), coordinates are strictly ordered as `[longitude, latitude]`.

### 1.2 Spatial Data Types
- **Point**: A single 0-dimensional coordinate pair representing an incident location or police station.  
  *Format*: `POINT(79.8297 11.9338)`
- **Polygon / MultiPolygon**: A 2-dimensional enclosed boundary representing a police station jurisdiction or a detected crime hotspot envelope.  
  *Format*: `POLYGON(((79.82 11.93, 79.83 11.93, 79.83 11.94, 79.82 11.94, 79.82 11.93)))`

---

## 2. PostGIS Spatial Database Architecture

### 2.1 GEOGRAPHY vs GEOMETRY
CRIMEMAP uses `GEOGRAPHY(POINT, 4326)` rather than flat planar geometry:
- **Automatic Spherical Calculations**: Distance calculations are executed along the curved surface of the Earth directly in **meters**, without requiring manual projection conversions (e.g. UTM).
- **Global Precision**: Eliminates edge distortion near the equator and coastlines.

### 2.2 Spatial Indexing with GiST (Generalized Search Tree)
Standard B-Tree indexes cannot index two-dimensional geographic space. PostGIS uses **GiST (Generalized Search Tree) R-Tree indexes**:
- Bounding boxes are organized hierarchically.
- Spatial search time complexity is reduced from $O(N)$ linear table scans to $O(\log N)$ tree traversals.

```sql
CREATE INDEX idx_crime_incidents_location_gist 
ON crime_incidents USING GIST (location);
```

---

## 3. Core Spatial Operations

### 3.1 Radius Buffer Query (`ST_DWithin`)
Used by officers to query all criminal incidents within a defined distance (e.g., $2 \text{ km}$) of a crime scene or VIP checkpoint:

```sql
SELECT id, case_id, incident_date, ST_AsGeoJSON(location)
FROM crime_incidents
WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(:target_lon, :target_lat), 4326)::geography,
    :radius_in_meters
);
```

### 3.2 Bounding Box Spatial Filtering (`ST_MakeEnvelope` & `&&`)
When the interactive Leaflet map pans or zooms, the client transmits viewport corners `[min_lon, min_lat, max_lon, max_lat]`. The backend queries only the visible envelope:

```sql
SELECT id, case_id, ST_AsGeoJSON(location)
FROM crime_incidents
WHERE location && ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326);
```

### 3.3 Nearest Neighbor Police Station Search (`<->` & `ST_Distance`)
Finds the closest police station to any point coordinates to optimize emergency dispatch:

```sql
SELECT id, station_name, ST_Distance(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) AS distance_meters
FROM police_stations
ORDER BY location <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
LIMIT 1;
```

---

## 4. RFC 7946 GeoJSON Standard Output

All spatial APIs deliver standards-compliant GeoJSON FeatureCollections:

```json
{
  "type": "FeatureCollection",
  "crs": {
    "type": "name",
    "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [79.8297, 11.9338]
      },
      "properties": {
        "id": 1,
        "case_id": "FIR-2026-GB-0001",
        "crime_type": "Theft",
        "severity": "Medium",
        "incident_date": "2026-03-28T14:30:00",
        "police_station": "Grand Bazaar Police Station",
        "status": "Under Investigation"
      }
    }
  ]
}
```

---

## 5. Dual-Engine Spatial Architecture

To ensure CRIMEMAP runs seamlessly across both high-throughput PostgreSQL production environments and zero-configuration offline demonstration laptops:

1. **Production Engine (PostGIS)**: Native C-optimized spatial queries using PostGIS functions.
2. **Offline Fallback Engine (Shapely + Haversine)**: Automatically handles spatial radius queries, bounding boxes, and convex hulls in pure Python if running against an embedded SQLite database.
