from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, Response, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles, get_client_ip
from app.models.user import User
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Intelligence Reports"])

@router.get("/summary")
def get_report_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    police_station_id: Optional[int] = None,
    crime_type_id: Optional[int] = None,
    current_user: User = Depends(require_roles(["admin", "analyst", "police_officer"])),
    db: Session = Depends(get_db)
):
    """
    Returns structured crime intelligence summary data for dashboard rendering or reporting.
    """
    return ReportService.compile_intelligence_summary(
        db=db,
        start_date=start_date,
        end_date=end_date,
        police_station_id=police_station_id,
        crime_type_id=crime_type_id
    )

@router.get("/pdf")
def download_pdf_report(
    request: Request,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    police_station_id: Optional[int] = None,
    crime_type_id: Optional[int] = None,
    current_user: User = Depends(require_roles(["admin", "analyst", "police_officer"])),
    db: Session = Depends(get_db)
):
    """
    Generates and downloads an official CRIMEMAP intelligence report PDF.
    """
    pdf_bytes = ReportService.generate_pdf_report(
        db=db,
        start_date=start_date,
        end_date=end_date,
        police_station_id=police_station_id,
        crime_type_id=crime_type_id,
        user_id=current_user.id,
        ip_address=get_client_ip(request)
    )

    filename = f"CRIMEMAP_Intelligence_Report_{date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
