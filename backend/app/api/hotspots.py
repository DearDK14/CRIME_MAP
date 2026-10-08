from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles, get_client_ip
from app.models.user import User
from app.models.crime_incident import CrimeIncident
from app.models.hotspot import Hotspot
from app.schemas.hotspot import HotspotResponse, HotspotDetectRequest
from app.services.ml_service import MLService
from app.services.alert_service import AlertService
from app.core.audit import log_audit_event

router = APIRouter(prefix="/hotspots", tags=["Hotspots & Spatial Clustering"])

@router.get("", response_model=List[HotspotResponse])
def get_active_hotspots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve currently active detected crime hotspots and their risk scores.
    """
    return db.query(Hotspot).filter(Hotspot.is_active == True).order_by(Hotspot.risk_score.desc()).all()

@router.post("/detect", response_model=List[HotspotResponse])
def detect_hotspots(
    payload: Optional[HotspotDetectRequest] = None,
    request: Request = None,
    current_user: User = Depends(require_roles(["admin", "analyst"])),
    db: Session = Depends(get_db)
):
    """
    Executes DBSCAN spatial clustering pipeline across incidents to identify
    high-density geographic clusters and compute multi-factor explainable risk scores.
    
    CRITICAL NOTICE: Outputs are strictly decision-support 'Hotspot/Risk Assessments'
    and do not represent deterministic guarantees of future crime.
    """
    eps = payload.eps_meters if payload else 350.0
    min_samples = payload.min_samples if payload else 4

    query = db.query(CrimeIncident)
    if payload and payload.start_date:
        query = query.filter(CrimeIncident.incident_date >= payload.start_date)
    if payload and payload.end_date:
        query = query.filter(CrimeIncident.incident_date <= payload.end_date)
    if payload and payload.crime_type_id:
        query = query.filter(CrimeIncident.crime_type_id == payload.crime_type_id)
    if payload and payload.police_station_id:
        query = query.filter(CrimeIncident.police_station_id == payload.police_station_id)

    incidents = query.all()

    hotspots = MLService.detect_hotspots(
        db=db,
        incidents=incidents,
        eps_meters=eps,
        min_samples=min_samples
    )

    # Evaluate any threshold-exceeded alerts
    AlertService.evaluate_hotspot_alerts(db, hotspots)

    # Audit log
    log_audit_event(
        db=db,
        action="DETECT_HOTSPOTS",
        entity_type="Hotspot",
        user_id=current_user.id,
        entity_id=None,
        ip_address=get_client_ip(request) if request else "127.0.0.1",
        details={
            "clusters_detected": len(hotspots),
            "eps_meters": eps,
            "min_samples": min_samples
        }
    )

    return hotspots
