import math
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.api.deps import get_db, get_current_user, require_roles, get_client_ip
from app.models.user import User
from app.models.crime_incident import CrimeIncident
from app.models.crime_type import CrimeType
from app.models.police_station import PoliceStation
from app.schemas.crime_incident import (
    CrimeIncidentCreate, CrimeIncidentUpdate, CrimeIncidentResponse, IncidentPagination
)
from app.services.alert_service import AlertService
from app.core.audit import log_audit_event

router = APIRouter(prefix="/incidents", tags=["Crime Incidents"])

@router.get("", response_model=IncidentPagination)
def list_incidents(
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    crime_type_id: Optional[int] = Query(None, description="Filter by crime type ID"),
    police_station_id: Optional[int] = Query(None, description="Filter by police station ID"),
    severity: Optional[str] = Query(None, description="Filter by severity: Low, Medium, High, Critical"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Free text search in case number, description, address"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    sort_by: str = Query("incident_date", description="Field to sort by"),
    order: str = Query("desc", description="asc or desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List, filter, and paginate crime incidents.
    """
    query = db.query(CrimeIncident)

    if date_from:
        query = query.filter(CrimeIncident.incident_date >= date_from)
    if date_to:
        query = query.filter(CrimeIncident.incident_date <= date_to)
    if crime_type_id:
        query = query.filter(CrimeIncident.crime_type_id == crime_type_id)
    if police_station_id:
        query = query.filter(CrimeIncident.police_station_id == police_station_id)
    if severity:
        query = query.filter(CrimeIncident.severity == severity)
    if status_filter:
        query = query.filter(CrimeIncident.status == status_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                CrimeIncident.case_number.ilike(search_pattern),
                CrimeIncident.description.ilike(search_pattern),
                CrimeIncident.address.ilike(search_pattern),
            )
        )

    # Sorting
    if order == "desc":
        query = query.order_by(desc(getattr(CrimeIncident, sort_by, CrimeIncident.incident_date)))
    else:
        query = query.order_by(getattr(CrimeIncident, sort_by, CrimeIncident.incident_date))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/{incident_id}", response_model=CrimeIncidentResponse)
def get_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve full details for a specific crime incident by ID.
    """
    incident = db.query(CrimeIncident).filter(CrimeIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crime incident not found")
    return incident

@router.post("", response_model=CrimeIncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: CrimeIncidentCreate,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "police_officer"])),
    db: Session = Depends(get_db)
):
    """
    Create a new crime incident record.
    Triggers automatic alert checks and writes to audit log.
    """
    # Check duplicate case number
    if db.query(CrimeIncident).filter(CrimeIncident.case_number == incident_in.case_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incident with case number '{incident_in.case_number}' already exists"
        )

    # Check valid foreign keys
    if not db.query(CrimeType).filter(CrimeType.id == incident_in.crime_type_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid crime_type_id")
    if not db.query(PoliceStation).filter(PoliceStation.id == incident_in.police_station_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid police_station_id")

    incident = CrimeIncident(
        case_number=incident_in.case_number,
        crime_type_id=incident_in.crime_type_id,
        incident_date=incident_in.incident_date,
        incident_time=incident_in.incident_time,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        police_station_id=incident_in.police_station_id,
        severity=incident_in.severity,
        status=incident_in.status,
        description=incident_in.description,
        address=incident_in.address,
        weapon_used=incident_in.weapon_used,
        victim_count=incident_in.victim_count,
        created_by_id=current_user.id
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Check and generate alerts
    AlertService.evaluate_new_incident_alerts(db, incident)

    # Audit log
    log_audit_event(
        db=db,
        action="CREATE_INCIDENT",
        entity_type="CrimeIncident",
        user_id=current_user.id,
        entity_id=str(incident.id),
        ip_address=get_client_ip(request),
        details={"case_number": incident.case_number, "severity": incident.severity}
    )

    return incident

@router.put("/{incident_id}", response_model=CrimeIncidentResponse)
def update_incident(
    incident_id: int,
    incident_update: CrimeIncidentUpdate,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "police_officer"])),
    db: Session = Depends(get_db)
):
    """
    Update crime incident fields (e.g. status transition, description, severity).
    """
    incident = db.query(CrimeIncident).filter(CrimeIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crime incident not found")

    update_data = incident_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(incident, field, val)

    db.commit()
    db.refresh(incident)

    # Audit log
    log_audit_event(
        db=db,
        action="UPDATE_INCIDENT",
        entity_type="CrimeIncident",
        user_id=current_user.id,
        entity_id=str(incident.id),
        ip_address=get_client_ip(request),
        details=update_data
    )

    return incident

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    request: Request,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Delete a crime incident record (Admin only).
    """
    incident = db.query(CrimeIncident).filter(CrimeIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crime incident not found")

    case_no = incident.case_number
    db.delete(incident)
    db.commit()

    # Audit log
    log_audit_event(
        db=db,
        action="DELETE_INCIDENT",
        entity_type="CrimeIncident",
        user_id=current_user.id,
        entity_id=str(incident_id),
        ip_address=get_client_ip(request),
        details={"case_number": case_no}
    )
    return None
