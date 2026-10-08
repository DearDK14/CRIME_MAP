import logging
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.crime_incident import CrimeIncident
from app.models.hotspot import Hotspot
from app.core.audit import log_audit_event
from app.services.gis_service import haversine_distance_meters

logger = logging.getLogger(__name__)

class AlertService:
    @staticmethod
    def evaluate_new_incident_alerts(db: Session, incident: CrimeIncident) -> List[Alert]:
        """
        Evaluates triggers when a new crime incident is reported:
        - Critical severity triggers CRITICAL alert
        - Nearby repeat incident clustering triggers HIGH alert
        """
        generated_alerts = []

        # 1. High/Critical severity check
        if incident.severity in ["Critical", "High"]:
            c_name = incident.crime_type.name if incident.crime_type else "Incident"
            alert = Alert(
                alert_type="HIGH_SEVERITY_INCIDENT",
                title=f"High Severity Crime Reported: {c_name}",
                description=(
                    f"Case {incident.case_number}: {c_name} with severity '{incident.severity}' "
                    f"logged at {incident.address or 'Puducherry'}. Human decision-support review required."
                ),
                severity="CRITICAL" if incident.severity == "Critical" else "HIGH",
                latitude=incident.latitude,
                longitude=incident.longitude,
                location_name=incident.address or "Puducherry Jurisdiction",
                status="ACTIVE",
                created_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            generated_alerts.append(alert)

        # 2. Repeat incident check within 200m in past 14 days
        two_weeks_ago = incident.incident_date - timedelta(days=14) if incident.incident_date else datetime.now().date() - timedelta(days=14)
        recent_nearby = db.query(CrimeIncident).filter(
            CrimeIncident.id != incident.id,
            CrimeIncident.incident_date >= two_weeks_ago
        ).all()

        nearby_count = 0
        for other in recent_nearby:
            dist = haversine_distance_meters(incident.latitude, incident.longitude, other.latitude, other.longitude)
            if dist <= 200.0:
                nearby_count += 1

        if nearby_count >= 2:
            alert = Alert(
                alert_type="REPEAT_CRIME_PATTERN",
                title="Spatial Recurrence Pattern Detected",
                description=(
                    f"{nearby_count + 1} incidents recorded within 200m radius of "
                    f"{incident.address or 'this sector'} over the last 14 days. Potential localized pattern."
                ),
                severity="HIGH",
                latitude=incident.latitude,
                longitude=incident.longitude,
                location_name=incident.address or "Sector Pattern",
                status="ACTIVE",
                created_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            generated_alerts.append(alert)

        db.commit()
        for a in generated_alerts:
            db.refresh(a)
        return generated_alerts

    @staticmethod
    def evaluate_hotspot_alerts(db: Session, hotspots: List[Hotspot]) -> List[Alert]:
        """
        Generates alerts for hotspots that exceed critical risk threshold.
        """
        alerts = []
        for hs in hotspots:
            if hs.risk_score >= 70.0:
                alert = Alert(
                    alert_type="HOTSPOT_THRESHOLD_EXCEEDED",
                    title=f"Elevated Risk Hotspot: {hs.cluster_label}",
                    description=(
                        f"Spatial cluster identified with {hs.incident_count} incidents and "
                        f"calculated risk score {hs.risk_score}/100 ({hs.risk_category}). "
                        f"Primary activity: {hs.primary_crime_type}. Decision-support advisory."
                    ),
                    severity="CRITICAL" if hs.risk_score >= 80.0 else "HIGH",
                    latitude=hs.center_lat,
                    longitude=hs.center_lon,
                    location_name=f"Sector near {hs.primary_crime_type} Cluster",
                    status="ACTIVE",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(alert)
                alerts.append(alert)

        db.commit()
        for a in alerts:
            db.refresh(a)
        return alerts

    @staticmethod
    def acknowledge_alert(
        db: Session,
        alert_id: int,
        user_id: int,
        status: str = "ACKNOWLEDGED",
        ip_address: Optional[str] = None
    ) -> Optional[Alert]:
        """Acknowledge or resolve an active alert with audit logging."""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None

        alert.status = status
        alert.acknowledged_by_id = user_id
        alert.acknowledged_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)

        # Audit log entry
        log_audit_event(
            db=db,
            action=f"ALERT_{status}",
            entity_type="Alert",
            user_id=user_id,
            entity_id=str(alert.id),
            ip_address=ip_address,
            details={"title": alert.title, "new_status": status, "severity": alert.severity}
        )
        return alert
