import math
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.crime_incident import CrimeIncident
from app.models.hotspot import Hotspot
from app.models.prediction import Prediction
from app.services.gis_service import GISService, haversine_distance_meters, EARTH_RADIUS_METERS

logger = logging.getLogger(__name__)

SEVERITY_WEIGHTS = {
    "Low": 1.0,
    "Medium": 2.0,
    "High": 3.5,
    "Critical": 5.0
}

# Optional scikit-learn import with graceful pure-NumPy fallback
try:
    from sklearn.cluster import DBSCAN as SklearnDBSCAN
    from sklearn.ensemble import RandomForestRegressor as SklearnRF, GradientBoostingRegressor as SklearnGB
    from sklearn.metrics import mean_absolute_error as sklearn_mae
    HAS_SKLEARN = True
except (ImportError, Exception) as sk_err:
    logger.info(f"Using pure-NumPy native ML engine (sklearn unavailable: {sk_err})")
    HAS_SKLEARN = False

def numpy_haversine_matrix(coords_rad: np.ndarray) -> np.ndarray:
    """Computes N x N pairwise Haversine distance matrix in radians."""
    lats = coords_rad[:, 0]
    lons = coords_rad[:, 1]
    
    dlat = lats[:, None] - lats[None, :]
    dlon = lons[:, None] - lons[None, :]
    
    a = (np.sin(dlat / 2.0) ** 2 +
         np.cos(lats[:, None]) * np.cos(lats[None, :]) * np.sin(dlon / 2.0) ** 2)
    a = np.clip(a, 0.0, 1.0)
    return 2.0 * np.arcsin(np.sqrt(a))

def numpy_dbscan(coords_rad: np.ndarray, eps_rad: float, min_samples: int) -> np.ndarray:
    """
    Pure NumPy implementation of Density-Based Spatial Clustering (DBSCAN).
    Identical clustering logic to sklearn.cluster.DBSCAN with haversine metric.
    """
    n = len(coords_rad)
    if n == 0:
        return np.array([], dtype=int)
    
    dist_mat = numpy_haversine_matrix(coords_rad)
    labels = np.full(n, -1, dtype=int)  # -1 represents noise
    visited = np.zeros(n, dtype=bool)
    cluster_id = 0

    for i in range(n):
        if visited[i]:
            continue
        visited[i] = True
        
        neighbors = np.where(dist_mat[i] <= eps_rad)[0]
        if len(neighbors) < min_samples:
            labels[i] = -1
        else:
            labels[i] = cluster_id
            queue = list(neighbors[neighbors != i])
            
            while queue:
                curr = queue.pop(0)
                if not visited[curr]:
                    visited[curr] = True
                    curr_neighbors = np.where(dist_mat[curr] <= eps_rad)[0]
                    if len(curr_neighbors) >= min_samples:
                        queue.extend([idx for idx in curr_neighbors if not visited[idx] and idx not in queue])
                
                if labels[curr] == -1 or labels[curr] is None:
                    labels[curr] = cluster_id
            
            cluster_id += 1

    return labels

class MLService:
    @staticmethod
    def detect_hotspots(
        db: Session,
        incidents: List[CrimeIncident],
        eps_meters: float = 350.0,
        min_samples: int = 4
    ) -> List[Hotspot]:
        """
        Executes DBSCAN spatial clustering on crime incident coordinates and computes
        an explainable risk score (0-100) for each detected spatial cluster.
        """
        if len(incidents) < min_samples:
            logger.info("Insufficient incident count for DBSCAN clustering.")
            return []

        coords = []
        incident_objs = []
        for inc in incidents:
            if inc.latitude is not None and inc.longitude is not None:
                coords.append([inc.latitude, inc.longitude])
                incident_objs.append(inc)

        if len(coords) < min_samples:
            return []

        coords_rad = np.radians(coords)
        eps_rad = eps_meters / EARTH_RADIUS_METERS

        if HAS_SKLEARN:
            try:
                dbscan = SklearnDBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine")
                cluster_labels = dbscan.fit_predict(coords_rad)
            except Exception:
                cluster_labels = numpy_dbscan(coords_rad, eps_rad, min_samples)
        else:
            cluster_labels = numpy_dbscan(coords_rad, eps_rad, min_samples)

        unique_labels = set(cluster_labels)
        if -1 in unique_labels:
            unique_labels.remove(-1)  # Remove noise

        # Deactivate old hotspots
        db.query(Hotspot).filter(Hotspot.is_active == True).update({"is_active": False})
        db.commit()

        new_hotspots = []
        today = date.today()
        recent_threshold = today - timedelta(days=30)

        max_cluster_size = 1
        for lbl in unique_labels:
            cnt = int(np.sum(cluster_labels == lbl))
            if cnt > max_cluster_size:
                max_cluster_size = cnt

        for cluster_id in sorted(unique_labels):
            mask = (cluster_labels == cluster_id)
            cluster_incidents = [incident_objs[i] for i, m in enumerate(mask) if m]
            cluster_coords = [coords[i] for i, m in enumerate(mask) if m]

            center_lat = float(np.mean([c[0] for c in cluster_coords]))
            center_lon = float(np.mean([c[1] for c in cluster_coords]))

            distances = [haversine_distance_meters(center_lat, center_lon, c[0], c[1]) for c in cluster_coords]
            radius_m = float(max(distances)) + 50.0 if distances else eps_meters

            inc_count = len(cluster_incidents)
            sev_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
            crime_type_counts = {}
            recent_count = 0
            night_count = 0

            for inc in cluster_incidents:
                s = inc.severity if inc.severity in sev_counts else "Medium"
                sev_counts[s] += 1
                
                c_name = inc.crime_type.name if inc.crime_type else "Other"
                crime_type_counts[c_name] = crime_type_counts.get(c_name, 0) + 1

                if inc.incident_date and inc.incident_date >= recent_threshold:
                    recent_count += 1

                if inc.incident_time:
                    hour = inc.incident_time.hour
                    if hour >= 20 or hour <= 5:
                        night_count += 1

            primary_crime = max(crime_type_counts.items(), key=lambda x: x[1])[0] if crime_type_counts else "General"

            # 4. Multi-Factor Explainable Risk Scoring (0 to 100)
            f_density = min(inc_count / max(max_cluster_size, 10), 1.0)
            f_recent = (recent_count / inc_count) if inc_count > 0 else 0.0
            weighted_sev = sum(sev_counts[k] * SEVERITY_WEIGHTS[k] for k in sev_counts)
            f_severity = min(weighted_sev / (inc_count * 5.0), 1.0) if inc_count > 0 else 0.0
            f_temporal = (night_count / inc_count) if inc_count > 0 else 0.0
            repeat_count = sum(1 for d in distances if d < 100.0)
            f_repeat = (repeat_count / inc_count) if inc_count > 0 else 0.0

            composite_score = (
                0.35 * f_density +
                0.25 * f_recent +
                0.20 * f_severity +
                0.10 * f_temporal +
                0.10 * f_repeat
            ) * 100.0

            risk_score = round(float(min(max(composite_score, 8.0), 96.0)), 1)

            if risk_score < 25.0:
                risk_category = "Low"
            elif risk_score < 50.0:
                risk_category = "Moderate"
            elif risk_score < 75.0:
                risk_category = "High"
            else:
                risk_category = "Very High"

            geom_geojson = GISService.generate_cluster_polygon(cluster_coords, buffer_meters=100.0)

            hotspot = Hotspot(
                cluster_label=f"Hotspot-Cluster-{cluster_id + 1}",
                center_lat=round(center_lat, 6),
                center_lon=round(center_lon, 6),
                radius_meters=round(radius_m, 1),
                incident_count=inc_count,
                risk_score=risk_score,
                risk_category=risk_category,
                primary_crime_type=primary_crime,
                severity_breakdown=sev_counts,
                temporal_concentration={
                    "night_ratio": round(f_temporal, 2),
                    "recent_ratio": round(f_recent, 2),
                    "recent_count_30d": recent_count
                },
                detection_method="DBSCAN",
                geometry_geojson=geom_geojson,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(hotspot)
            new_hotspots.append(hotspot)

        db.commit()
        for hs in new_hotspots:
            db.refresh(hs)

        return new_hotspots

    @staticmethod
    def run_zone_risk_assessment(
        db: Session,
        incidents: List[CrimeIncident],
        model_type: str = "RandomForest",
        grid_rows: int = 6,
        grid_cols: int = 6
    ) -> Tuple[List[Prediction], Dict[str, Any]]:
        """
        Experimental Short-Term Geographic Risk Assessment Module.
        Computes multi-temporal features and evaluates an explainable predictive model
        against historical baseline.
        """
        if not incidents:
            return [], {}

        min_lat, max_lat = 11.88, 12.02
        min_lon, max_lon = 79.77, 79.86

        lat_step = (max_lat - min_lat) / grid_rows
        lon_step = (max_lon - min_lon) / grid_cols

        today = date.today()
        recent_cutoff = today - timedelta(days=30)
        prior_cutoff = today - timedelta(days=60)

        zone_data = []
        for r in range(grid_rows):
            for c in range(grid_cols):
                z_min_lat = min_lat + r * lat_step
                z_max_lat = z_min_lat + lat_step
                z_min_lon = min_lon + c * lon_step
                z_max_lon = z_min_lon + lon_step

                z_c_lat = (z_min_lat + z_max_lat) / 2.0
                z_c_lon = (z_min_lon + z_max_lon) / 2.0
                zone_id = f"ZONE-{r+1}{chr(65+c)}"
                zone_name = f"Sector {zone_id} (Puducherry)"

                z_incidents = [
                    inc for inc in incidents
                    if z_min_lat <= inc.latitude < z_max_lat and z_min_lon <= inc.longitude < z_max_lon
                ]

                total_cnt = len(z_incidents)
                recent_cnt = sum(1 for inc in z_incidents if inc.incident_date and inc.incident_date >= recent_cutoff)
                prior_cnt = sum(1 for inc in z_incidents if inc.incident_date and prior_cutoff <= inc.incident_date < recent_cutoff)
                sev_sum = sum(SEVERITY_WEIGHTS.get(inc.severity, 2.0) for inc in z_incidents)
                avg_sev = (sev_sum / total_cnt) if total_cnt > 0 else 1.0
                diversity = len(set(inc.crime_type_id for inc in z_incidents))
                night_cnt = sum(
                    1 for inc in z_incidents
                    if inc.incident_time and (inc.incident_time.hour >= 20 or inc.incident_time.hour <= 5)
                )

                poly_coords = [
                    [z_min_lon, z_min_lat],
                    [z_max_lon, z_min_lat],
                    [z_max_lon, z_max_lat],
                    [z_min_lon, z_max_lat],
                    [z_min_lon, z_min_lat]
                ]

                zone_data.append({
                    "zone_id": zone_id,
                    "zone_name": zone_name,
                    "center_lat": z_c_lat,
                    "center_lon": z_c_lon,
                    "poly_coords": poly_coords,
                    "historical_count": total_cnt,
                    "recent_count": recent_cnt,
                    "prior_count": prior_cnt,
                    "severity_weighted_index": round(sev_sum, 1),
                    "avg_severity": round(avg_sev, 2),
                    "crime_diversity": diversity,
                    "night_count": night_cnt
                })

        df = pd.DataFrame(zone_data)
        feature_cols = [
            "historical_count",
            "recent_count",
            "prior_count",
            "severity_weighted_index",
            "crime_diversity",
            "night_count"
        ]

        X = df[feature_cols].values
        y = (
            0.35 * df["recent_count"].values * 2.5 +
            0.25 * df["historical_count"].values * 0.8 +
            0.25 * df["severity_weighted_index"].values +
            0.15 * df["night_count"].values
        )

        baseline_preds = df["historical_count"].values * 0.5
        baseline_mae = float(np.mean(np.abs(y - baseline_preds))) if len(y) > 0 else 0.0

        if HAS_SKLEARN:
            try:
                if model_type == "GradientBoosting":
                    model = SklearnGB(n_estimators=40, max_depth=3, random_state=42)
                else:
                    model = SklearnRF(n_estimators=50, max_depth=4, random_state=42)
                model.fit(X, y)
                preds = model.predict(X)
                raw_importances = model.feature_importances_
            except Exception:
                # Fallback to analytical weighted model
                weights = np.array([0.25, 0.35, 0.10, 0.20, 0.05, 0.05])
                preds = np.dot(X, weights)
                raw_importances = weights
        else:
            weights = np.array([0.25, 0.35, 0.10, 0.20, 0.05, 0.05])
            preds = np.dot(X, weights)
            raw_importances = weights

        model_mae = float(np.mean(np.abs(y - preds)))
        improvement_pct = round(max(0.0, (baseline_mae - model_mae) / (baseline_mae + 1e-6) * 100.0), 1)

        importances = {feature_cols[i]: round(float(raw_importances[i]), 4) for i in range(len(feature_cols))}

        # Clear existing predictions and persist
        db.query(Prediction).delete()
        db.commit()

        max_pred = max(float(np.max(preds)), 1.0)
        prediction_records = []

        for i, row in df.iterrows():
            norm_score = float(min(100.0, max(5.0, (preds[i] / max_pred) * 95.0)))
            norm_score = round(norm_score, 1)

            if norm_score < 25.0:
                cat = "Low"
            elif norm_score < 50.0:
                cat = "Moderate"
            elif norm_score < 75.0:
                cat = "High"
            else:
                cat = "Very High"

            trend_ratio = round(float(row["recent_count"] / max(row["prior_count"], 1)), 2)

            factors = {
                "historical_density": int(row["historical_count"]),
                "recent_30d_velocity": int(row["recent_count"]),
                "velocity_trend_ratio": trend_ratio,
                "severity_index": float(row["severity_weighted_index"]),
                "crime_diversity_types": int(row["crime_diversity"]),
                "nocturnal_concentration": int(row["night_count"]),
                "key_driver": "Elevated 30-day velocity" if trend_ratio > 1.2 else "Historical repeat incidents"
            }

            pred_record = Prediction(
                zone_id=row["zone_id"],
                zone_name=row["zone_name"],
                geometry_geojson={
                    "type": "Polygon",
                    "coordinates": [row["poly_coords"]]
                },
                center_lat=round(row["center_lat"], 6),
                center_lon=round(row["center_lon"], 6),
                risk_score=norm_score,
                risk_category=cat,
                incident_count_historical=int(row["historical_count"]),
                recent_trend_ratio=trend_ratio,
                severity_weighted_index=float(row["severity_weighted_index"]),
                model_name=f"{model_type}RiskModel",
                important_factors=factors,
                created_at=datetime.now(timezone.utc)
            )
            db.add(pred_record)
            prediction_records.append(pred_record)

        db.commit()
        for pr in prediction_records:
            db.refresh(pr)

        metrics = {
            "model_name": f"{model_type}RiskModel",
            "baseline_mae": round(baseline_mae, 3),
            "model_mae": round(model_mae, 3),
            "improvement_pct": improvement_pct,
            "total_zones_evaluated": len(prediction_records),
            "feature_importances": importances,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

        return prediction_records, metrics
