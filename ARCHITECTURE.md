# CRIMEMAP System Architecture & Technical Specification

> **Puducherry Police Hackathon 2026 — Problem Statement 2**  
> *Geospatial Crime Intelligence, Analytics & Decision-Support System*

---

## 1. High-Level Architectural Overview

CRIMEMAP is built on a 4-tier modular, event-driven, micro-service-ready architecture designed for operational resilience, sub-second spatial queries, and military/police grade security.

```mermaid
flowchart TD
    subgraph ClientLayer["Tier 1: Web Client (React 19 SPA)"]
        UI_Map["Map C4I Interface\n(Leaflet + GeoJSON)"]
        UI_Dash["Analytics Center\n(Recharts & KPI Cards)"]
        UI_Auth["Role Gates\n(Admin/Officer/Analyst)"]
    end

    subgraph GatewayLayer["Tier 2: Ingress & Reverse Proxy"]
        Nginx["Nginx Web Server\n(Port 80/3000)\nGzip & SPA Routing"]
    end

    subgraph AppLayer["Tier 3: FastAPI Backend Application Engine"]
        APIRouter["FastAPI REST Router\n(OpenAPI 3.1 & Pydantic v2)"]
        AuthMiddleware["JWT Bearer Authentication\n& RBAC Enforcement"]
        
        subgraph EngineSubsystem["Core Application Engines"]
            GIS["GIS Engine\n(GeoPandas, Shapely, GeoJSON)"]
            ML["ML Risk Engine\n(Haversine DBSCAN, Risk Scoring)"]
            Alerts["Tactical Alert Engine\n(Threshold & Hotspot Surveillance)"]
            Reports["ReportLab Engine\n(Automated PDF Intelligence Briefings)"]
            Import["Data Ingestion\n(Streaming CSV & Geocoding Validator)"]
        end
    end

    subgraph DataLayer["Tier 4: Spatial & Relational Persistence"]
        PostGIS["PostgreSQL 16 + PostGIS 3.4\n(WGS84 EPSG:4326 + GiST Indexes)"]
        SQLiteFallback["In-Memory / SQLite Engine\n(Automated Offline & Test Fallback)"]
    end

    UI_Map -->|Axios REST| Nginx
    UI_Dash -->|Axios REST| Nginx
    UI_Auth -->|Axios REST| Nginx

    Nginx -->|Proxy Pass /api| APIRouter
    APIRouter --> AuthMiddleware
    AuthMiddleware --> GIS
    AuthMiddleware --> ML
    AuthMiddleware --> Alerts
    AuthMiddleware --> Reports
    AuthMiddleware --> Import

    GIS --> PostGIS
    ML --> PostGIS
    Alerts --> PostGIS
    Reports --> PostGIS
    Import --> PostGIS

    GIS -.-> SQLiteFallback
    ML -.-> SQLiteFallback
```

---

## 2. Database Schema & Entity-Relationship Architecture

The persistence model is managed via SQLAlchemy 2.0 with Alembic versioning. Spatial entities use `GEOGRAPHY(POINT, 4326)` with 2D GiST spatial indexes.

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : triggers
    USERS {
        int id PK
        string username UK
        string email UK
        string hashed_password
        string role "admin | police_officer | analyst"
        string badge_number
        int police_station_id FK
        boolean is_active
        datetime created_at
    }

    POLICE_STATIONS ||--o{ USERS : assigns
    POLICE_STATIONS ||--o{ CRIME_INCIDENTS : responds_to
    POLICE_STATIONS ||--o{ PREDICTIONS : monitors
    POLICE_STATIONS {
        int id PK
        string station_name
        string station_code UK
        string jurisdiction_area
        geography location "POINT(lon, lat) EPSG:4326"
        string contact_number
        int officer_count
    }

    CRIME_TYPES ||--o{ CRIME_INCIDENTS : categorizes
    CRIME_TYPES {
        int id PK
        string name UK
        string category "Violent | Property | Cyber | Narcotics | Public Order | Traffic"
        string default_severity "High | Medium | Low"
        int weight "1 - 10"
    }

    CRIME_INCIDENTS ||--o{ ALERTS : triggers
    CRIME_INCIDENTS {
        int id PK
        string case_id UK
        int crime_type_id FK
        datetime incident_date
        string severity "High | Medium | Low"
        geography location "POINT(lon, lat) EPSG:4326"
        string address
        int police_station_id FK
        string status "Open | Under Investigation | Closed"
        string description
        datetime created_at
        datetime updated_at
    }

    HOTSPOTS {
        int id PK
        string cluster_label
        geography centroid "POINT(lon, lat)"
        float radius_meters
        int incident_count
        float risk_score "0.0 - 100.0"
        string risk_level "High | Medium | Low"
        json polygon_geojson
        boolean is_active
        datetime detected_at
    }

    PREDICTIONS {
        int id PK
        int police_station_id FK
        string zone_name
        float risk_score "0.0 - 100.0"
        string risk_level "High | Medium | Low"
        float predicted_incidents
        float confidence_interval
        string dominant_crime_type
        json feature_weights
        datetime forecast_date
    }

    ALERTS {
        int id PK
        string title
        string alert_type "HOTSPOT | SEVERITY_SPIKE | FREQUENCY"
        string priority "HIGH | MEDIUM | LOW"
        int police_station_id FK
        string status "ACTIVE | ACKNOWLEDGED | RESOLVED"
        string acknowledged_by
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action "LOGIN | CREATE | UPDATE | DELETE"
        string resource_type
        string resource_id
        string ip_address
        json details
        datetime timestamp
    }
```

---

## 3. Spatial GIS Engine

### Coordinate Reference System (CRS)
CRIMEMAP strictly uses **WGS84 (EPSG:4326)** for longitude and latitude coordinates:
- Axis order: `(Longitude, Latitude)` in GeoJSON RFC 7946 compliance.
- Coordinates for Puducherry bounding envelope: `[79.76° E - 79.86° E, 11.88° N - 11.98° N]`.

### PostGIS Query Implementation
1. **Radius Search (`ST_DWithin`)**:
   ```sql
   SELECT id, case_id, ST_AsGeoJSON(location) 
   FROM crime_incidents 
   WHERE ST_DWithin(
       location, 
       ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
       :radius_meters
   );
   ```
2. **Bounding Box Envelope (`ST_MakeEnvelope`)**:
   ```sql
   SELECT id, case_id, ST_AsGeoJSON(location) 
   FROM crime_incidents 
   WHERE location && ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326);
   ```
3. **Nearest Police Station (`ST_Distance`)**:
   ```sql
   SELECT id, station_name, ST_Distance(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) AS distance_meters
   FROM police_stations 
   ORDER BY location <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography 
   LIMIT 1;
   ```

---

## 4. Machine Learning & Predictive Risk Pipeline

The ML pipeline operates asynchronously and on-demand without external heavy dependencies.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Frontend (Analyst Studio)
    participant API as FastAPI Backend (/api/hotspots/detect)
    participant ML as Vectorized DBSCAN Engine
    participant DB as PostgreSQL / PostGIS
    participant Alert as Alert Daemon

    Client->>API: POST /api/hotspots/detect (eps=600m, min_samples=5)
    API->>DB: Query historical incidents within lookback window
    DB-->>API: Coordinates (lat, lon), severity, timestamps
    API->>ML: Vectorized Haversine Pairwise Distances (radians)
    ML->>ML: DBSCAN Clustering (Core, Border, Noise points)
    ML->>ML: Calculate Centroid, Minimum Bounding Circle, Convex Hull
    ML->>ML: Compute 5-Factor Explainable Risk Score (0 - 100)
    ML-->>API: Active Clusters & Risk Scores
    API->>DB: Persist Hotspot Records & Convex Hull GeoJSON
    API->>Alert: Evaluate Hotspot Severity Thresholds (Score >= 70)
    Alert->>DB: Create Tactical Alert (HIGH Priority)
    API-->>Client: Return Detected Clusters & GeoJSON Features
```

---

## 5. Security & Governance

1. **Authentication**: Stateless HMAC-SHA256 JWT tokens with 24-hour expiration window.
2. **Password Security**: Bcrypt with salted rounds ($2b$ format).
3. **Role-Based Access Control (RBAC)**:
   - `Admin`: Unrestricted system oversight, audit inspection, role promotion.
   - `Police Officer`: Operational field logging, case status transition, station PDF downloads.
   - `Analyst`: Advanced spatial exploration, ML hyperparameter tuning, GeoJSON data export.
4. **Audit Trail**: Non-repudiable database log documenting every authentication event, incident mutation, and system configuration change.
