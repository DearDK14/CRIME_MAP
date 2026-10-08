from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles, get_client_ip
from app.models.user import User
from app.services.import_service import CSVImportService

router = APIRouter(prefix="/import", tags=["Data Import"])

@router.post("/csv")
async def import_csv_incidents(
    request: Request,
    file: Optional[UploadFile] = File(None),
    csv_data: Optional[str] = Form(None),
    commit: bool = Query(False, description="Set true to commit valid rows into the database"),
    current_user: User = Depends(require_roles(["admin", "analyst"])),
    db: Session = Depends(get_db)
):
    """
    Ingests and validates CSV crime data.
    - If commit=false: performs pre-validation preview, duplicate detection, and error reporting.
    - If commit=true: inserts all valid sanitized records and generates audit trail.
    """
    content = ""
    if file:
        file_bytes = await file.read()
        try:
            content = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content = file_bytes.decode("latin-1")
    elif csv_data:
        content = csv_data
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a CSV file or csv_data text must be provided."
        )

    if not content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded CSV file is empty.")

    client_ip = get_client_ip(request)
    result = CSVImportService.parse_and_validate_csv(
        db=db,
        csv_content=content,
        commit=commit,
        user_id=current_user.id,
        ip_address=client_ip
    )

    return result
