from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles, get_client_ip
from app.models.user import User
from app.models.police_station import PoliceStation
from app.schemas.police_station import (
    PoliceStationCreate, PoliceStationUpdate, PoliceStationResponse
)
from app.core.audit import log_audit_event

router = APIRouter(prefix="/stations", tags=["Police Stations"])

@router.get("", response_model=List[PoliceStationResponse])
def list_stations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all registered police stations with geographic coordinates.
    """
    return db.query(PoliceStation).order_by(PoliceStation.name).all()

@router.get("/{station_id}", response_model=PoliceStationResponse)
def get_station(
    station_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve single police station details.
    """
    station = db.query(PoliceStation).filter(PoliceStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Police station not found")
    return station

@router.post("", response_model=PoliceStationResponse, status_code=status.HTTP_201_CREATED)
def create_station(
    station_in: PoliceStationCreate,
    request: Request,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Register a new police station (Admin only).
    """
    if db.query(PoliceStation).filter(PoliceStation.station_code == station_in.station_code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Station code '{station_in.station_code}' already exists"
        )

    station = PoliceStation(
        name=station_in.name,
        station_code=station_in.station_code,
        jurisdiction_area=station_in.jurisdiction_area,
        latitude=station_in.latitude,
        longitude=station_in.longitude,
        contact_number=station_in.contact_number,
        officer_in_charge=station_in.officer_in_charge
    )
    db.add(station)
    db.commit()
    db.refresh(station)

    # Audit log
    log_audit_event(
        db=db,
        action="CREATE_STATION",
        entity_type="PoliceStation",
        user_id=current_user.id,
        entity_id=str(station.id),
        ip_address=get_client_ip(request),
        details={"name": station.name, "station_code": station.station_code}
    )

    return station

@router.put("/{station_id}", response_model=PoliceStationResponse)
def update_station(
    station_id: int,
    station_update: PoliceStationUpdate,
    request: Request,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Update police station information (Admin only).
    """
    station = db.query(PoliceStation).filter(PoliceStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Police station not found")

    update_data = station_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(station, field, val)

    db.commit()
    db.refresh(station)

    # Audit log
    log_audit_event(
        db=db,
        action="UPDATE_STATION",
        entity_type="PoliceStation",
        user_id=current_user.id,
        entity_id=str(station.id),
        ip_address=get_client_ip(request),
        details=update_data
    )

    return station
