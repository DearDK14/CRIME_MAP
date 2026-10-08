from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles, get_client_ip
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertAcknowledgeRequest
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    status_filter: Optional[str] = Query(None, alias="status", description="ACTIVE, ACKNOWLEDGED, RESOLVED"),
    severity: Optional[str] = Query(None, description="INFO, WARNING, HIGH, CRITICAL"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List intelligence alerts with optional status and severity filtering.
    """
    query = db.query(Alert)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    if severity:
        query = query.filter(Alert.severity == severity)

    return query.order_by(Alert.created_at.desc()).limit(100).all()

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    payload: Optional[AlertAcknowledgeRequest] = None,
    request: Request = None,
    current_user: User = Depends(require_roles(["admin", "police_officer"])),
    db: Session = Depends(get_db)
):
    """
    Acknowledge or mark an alert as resolved.
    Logs action to audit trail.
    """
    new_status = payload.status if payload else "ACKNOWLEDGED"
    alert = AlertService.acknowledge_alert(
        db=db,
        alert_id=alert_id,
        user_id=current_user.id,
        status=new_status,
        ip_address=get_client_ip(request) if request else "127.0.0.1"
    )

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    return alert
