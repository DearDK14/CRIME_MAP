# CRIMEMAP REST API Reference Manual

> **Base URL**: `http://localhost:8000/api` (Local) / `/api` (Docker Reverse Proxy)  
> **Interactive Swagger Documentation**: `http://localhost:8000/docs`  
> **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 1. Authentication & Identity (`/auth`)

### `POST /auth/login`
Authenticates a user and issues a signed JSON Web Token (JWT).
- **Request Body**:
  ```json
  {
    "username": "officer_sharma",
    "password": "Officer@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "user": {
      "id": 2,
      "username": "officer_sharma",
      "email": "officer@police.py.gov.in",
      "role": "police_officer",
      "badge_number": "PY-POL-4402",
      "police_station_id": 1
    }
  }
  ```

### `POST /auth/register`
Registers a new officer or analyst account.
- **Request Body**:
  ```json
  {
    "username": "officer_kumar",
    "email": "kumar@police.py.gov.in",
    "password": "SecurePassword@123",
    "role": "police_officer",
    "badge_number": "PY-POL-5510",
    "police_station_id": 2
  }
  ```
- **Response (201 Created)**

### `GET /auth/me`
Returns current authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**

---

## 2. Crime Incidents (`/incidents`)

### `GET /incidents`
Lists paginated incidents with multi-dimensional filtering.
- **Query Parameters**:
  - `page` (default 1), `limit` (default 20, max 100)
  - `crime_type_id`: int
  - `police_station_id`: int
  - `severity`: `High` | `Medium` | `Low`
  - `status`: `Open` | `Under Investigation` | `Closed`
  - `start_date`: ISO string (`YYYY-MM-DD`)
  - `end_date`: ISO string (`YYYY-MM-DD`)
  - `search`: string (matches case_id, address, description)

### `GET /incidents/{id}`
Returns incident details with linked police station and crime type.

### `POST /incidents`
Creates a new crime incident. (Restricted to `admin` and `police_officer`).
- **Request Body**:
  ```json
  {
    "case_id": "FIR-2026-LAW-0091",
    "crime_type_id": 2,
    "incident_date": "2026-03-30T21:15:00",
    "severity": "High",
    "latitude": 11.9612,
    "longitude": 79.8241,
    "address": "East Coast Road, Lawspet, Puducherry",
    "police_station_id": 4,
    "status": "Open",
    "description": "Chain snatching incident reported near supermarket."
  }
  ```

### `PUT /incidents/{id}`
Updates case details or investigation status.

### `DELETE /incidents/{id}`
Deletes an incident record. (Restricted to `admin`).

---

## 3. Police Stations (`/stations`)

### `GET /stations`
Returns all 10 territorial police stations with geographic coordinates and metadata.
- **Response Sample**:
  ```json
  [
    {
      "id": 1,
      "station_name": "Grand Bazaar Police Station",
      "station_code": "PY-GB-01",
      "jurisdiction_area": "Grand Bazaar & Commercial Boulevard",
      "latitude": 11.9338,
      "longitude": 79.8297,
      "contact_number": "0413-2334411",
      "officer_count": 45
    }
  ]
  ```

---

## 4. GIS & Spatial Query Services (`/map`)

### `GET /map/geojson`
Returns RFC 7946 GeoJSON FeatureCollection of all filtered crime points for web mapping.
- **Response (200 OK)**:
  ```json
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [79.8297, 11.9338]
        },
        "properties": {
          "id": 101,
          "case_id": "FIR-2026-GB-0101",
          "crime_type": "Robbery",
          "severity": "High",
          "incident_date": "2026-03-25T20:30:00",
          "police_station": "Grand Bazaar Police Station",
          "status": "Under Investigation"
        }
      }
    ]
  }
  ```

### `GET /map/heatmap`
Returns weighted coordinates `[latitude, longitude, intensity_weight]` optimized for Leaflet heatmaps.

### `GET /map/spatial-query`
Executes radius or bounding box spatial search.
- **Parameters**:
  - `lat`, `lon`, `radius_km` (e.g. `lat=11.9338&lon=79.8297&radius_km=2.0`)
  - Or `min_lat`, `min_lon`, `max_lat`, `max_lon` for bounding box envelope.

### `GET /map/nearby-stations`
Returns the nearest police station to any point coordinates with calculated distance in meters.
- **Parameters**: `lat=11.9350&lon=79.8310`

---

## 5. Analytics & Statistical Feeds (`/analytics`)

- `GET /analytics/summary`: Aggregate counts (total, today, week, month, high severity, active hotspots).
- `GET /analytics/by-type`: Crime type distribution breakdown.
- `GET /analytics/by-date`: Chronological trend for timeseries charts.
- `GET /analytics/by-hour`: 24-hour diurnal crime curve.
- `GET /analytics/by-weekday`: Monday–Sunday crime distribution.
- `GET /analytics/by-station`: Police station case breakdown.

---

## 6. Machine Learning & Hotspots (`/hotspots` & `/prediction`)

### `GET /hotspots`
Returns all active DBSCAN clusters with centroids, radius, incident count, risk scores, and GeoJSON polygons.

### `POST /hotspots/detect`
Triggers vectorized Haversine DBSCAN clustering.
- **Parameters**:
  ```json
  {
    "eps_meters": 600,
    "min_samples": 5,
    "days_lookback": 90
  }
  ```
- **Response**:
  ```json
  {
    "message": "DBSCAN spatial clustering completed successfully.",
    "detected_clusters": 10,
    "noise_points": 42,
    "active_hotspots_count": 10
  }
  ```

### `GET /prediction/results`
Returns sector-level predictive risk assessments with baseline MAE vs Model MAE.

### `POST /prediction/run`
Triggers short-term grid zone risk forecast.

---

## 7. Tactical Alerts & Audit (`/alerts` & `/audit-logs`)

- `GET /alerts`: Active surveillance alerts.
- `POST /alerts/{id}/acknowledge`: Mark an alert acknowledged by an officer.
- `GET /audit-logs`: (Admin only) Non-repudiable audit logs of all system operations.

---

## 8. PDF Reports & CSV Ingestion (`/reports` & `/import`)

- `GET /reports/summary`: Text summary of station intelligence report.
- `GET /reports/pdf`: Generates and streams official ReportLab PDF intelligence bulletin.
- `POST /import/csv?commit=false`: Validates uploaded CSV and returns preview & error diagnostics.
- `POST /import/csv?commit=true`: Commits valid CSV records into the spatial database.
