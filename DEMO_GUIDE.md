# CRIMEMAP — Hackathon Judge Demonstration & Live Pitch Guide

> **Puducherry Police Hackathon 2026 — Problem Statement 2**  
> *Geospatial Crime Intelligence, Analytics & Decision-Support System*  
> **Pitch Duration**: 5 – 7 Minutes  
> **Theme**: MAP → ANALYSE → PREDICT → PREVENT

---

## 🎯 Demonstration Quick Reference

### Demo URL & Ports
- **Frontend Command Center**: `http://localhost:3000` (or `http://localhost:5173`)
- **FastAPI OpenAPI Swagger**: `http://localhost:8000/docs`

### Pre-Seeded Demonstration Accounts (One-Click Login Buttons on Login Screen)
1. **Admin**: `admin` / `Admin@123`
2. **Police Officer**: `officer_sharma` / `Officer@123`
3. **Crime Analyst**: `analyst_priya` / `Analyst@123`

---

## ⏱️ Live Demonstration Script (Step-by-Step)

### Phase 1: Problem Statement & C4I Overview (0:00 - 1:00)
1. **Open the Login Screen**:
   - Point out the clean police-grade command interface.
   - Click the **"One-Click Demo: Police Officer"** badge to populate credentials and click **Sign In**.
2. **Navigate to "Crime Map" (/map)**:
   - **Explain**: "This is the core C4I GIS operational map of Puducherry. It renders over 500 geocoded synthetic incidents across all 10 territorial police stations using WGS84 EPSG:4326 coordinates."
   - Click any incident marker: Show the rich popup with Case ID, Crime Type, Time, Severity, Station, and Case Status.
   - Toggle the **Heatmap Layer**: Demonstrate how incident density concentrates along commercial corridors like Grand Bazaar and Lawspet.
   - Click **"Buffer Search Tool"**: Select a coordinate on the map and set a $2.0 \text{ km}$ radius to demonstrate instant spatial queries.
   - Toggle **Police Stations**: Display the 10 station headquarters across Puducherry with jurisdiction coverage.

---

### Phase 2: Analytics & Intelligence Trends (1:00 - 2:30)
1. **Navigate to "Analytics" (/dashboard)**:
   - Point out the 6 real-time KPI cards: Total Incidents (520), Today, This Week, This Month, High Severity count, and Active Hotspots.
   - Walk through the interactive Recharts charts:
     - **Crime Incidents Over Time**: Shows daily longitudinal patterns.
     - **Crime Category Breakdown**: Property, Violent, Public Order, Cyber.
     - **Severity Distribution**: Color-coded High / Medium / Low.
     - **24-Hour Diurnal Curve**: Highlights peak night-time vulnerability between 20:00 and 02:00.
     - **Station Caseload Comparison**: Compares Grand Bazaar vs Lawspet vs Villianur.
   - Demonstrate the dynamic **Filter Panel**: Select a specific station (e.g. *Grand Bazaar Police Station*) or crime category and watch all charts update immediately via real FastAPI analytics endpoints.

---

### Phase 3: Machine Learning & Explainable Hotspots (2:30 - 4:00)
1. **Navigate to "Hotspots & ML" (/hotspots)**:
   - Explain the core principle: **Vectorized Haversine DBSCAN Spatial Clustering**.
   - Show the detected active hotspots with their centroids, bounding radius, and risk scores.
   - Highlight the **5-Factor Explainable Risk Score (0–100)**:
     - Historical Density (25%)
     - Recent Frequency (25%)
     - Crime Severity (25%)
     - Temporal Concentration (15%)
     - Repeated Proximity (10%)
   - Point to the **Ethical Transparency Notice**: Emphasize that all outputs are labeled *"Risk/Hotspot Assessment"* to support human command decisions without claiming certainty.
2. **Switch to Analyst Studio (/analyst)**:
   - Demonstrate the DBSCAN parameter sliders: Adjust $\epsilon$ from $600\text{m}$ to $800\text{m}$ and click **"Run DBSCAN Pipeline"**. Show real-time cluster re-detection!
   - Demonstrate the **Grid Zone Risk Forecast**: Click **"Run Risk Pipeline"** and show the sector evaluations with Baseline MAE ($9.02$) vs Model MAE ($0.69$).

---

### Phase 4: Operational Dispatch & Decision-Support (4:00 - 5:30)
1. **Navigate to "Alerts" (/alerts)**:
   - Show the tactical alert feed generated when high-risk hotspots or frequency thresholds are breached.
   - Click **"Acknowledge Alert"**: Enter an officer dispatch note (*"Patrol car Bravo-2 dispatched to Grand Bazaar Sector"*). The alert status updates immediately.
2. **Navigate to "Reports" (/reports)**:
   - Select *Grand Bazaar Police Station* and click **"Generate PDF Report"**.
   - Open or download the generated PDF: Show the official Puducherry Police banner, station statistics, high-severity cases, and command signature block.
3. **Navigate to "Data Import" (/import)**:
   - Demonstrate the CSV drag-and-drop ingestion interface. Show client-side validation and formula injection defense.

---

### Phase 5: Administration & Governance (5:30 - 6:30)
1. **Switch to Admin persona** (or navigate to `/admin`):
   - Show User Role Management: Admins can update officer and analyst roles.
   - Review the **Tamper-Evident Audit Log**: Every login, case creation, status transition, and alert acknowledgement is stamped with timestamp, user ID, and IP address.
2. **Showcase Automated Testing & Code Quality**:
   - Point out the 21 automated backend Pytest tests covering GIS, ML, Auth, and CRUD.
   - Point to Docker Compose for 1-command deployment.

---

## 🏆 Summary Checklist for Judges

| Evaluation Criterion | How CRIMEMAP Addresses It | Status |
| :--- | :--- | :---: |
| **Interactive Map as Core Feature** | Fullscreen Leaflet map, vector markers, heatmaps, polygon clusters, radius tool | **PASS** |
| **GIS Capabilities** | PostGIS `ST_DWithin`, bounding box, GeoJSON RFC 7946, EPSG:4326 | **PASS** |
| **Analytical Dashboard** | 6 KPI cards, 5 Recharts visualizations, diurnal curves, dynamic filters | **PASS** |
| **Machine Learning & Hotspots** | Vectorized Haversine DBSCAN, 5-factor transparent risk formula (0-100) | **PASS** |
| **Ethical AI & Decision Support** | Labeled "Risk/Hotspot Assessment", decision-support only, synthetic data | **PASS** |
| **Role-Based Workbenches** | Distinct workflows for Admin, Police Officer, and Crime Analyst | **PASS** |
| **Operational Workflow** | Alert acknowledgement, FIR management, and ReportLab PDF briefings | **PASS** |
| **Cybersecurity Standards** | JWT, Bcrypt, RBAC, SQLi parameterization, CSV sanitization, audit logging | **PASS** |
| **Production Architecture** | Docker Compose, PostgreSQL 16 + PostGIS 3.4, FastAPI, React 19 SPA | **PASS** |
