from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.crime_type import CrimeType
from app.schemas.crime_type import CrimeTypeResponse

router = APIRouter(prefix="/crime-types", tags=["Crime Types"])

@router.get("", response_model=List[CrimeTypeResponse])
def list_crime_types(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get standardized catalog of crime categories, types, and base severity.
    """
    return db.query(CrimeType).order_by(CrimeType.category, CrimeType.name).all()
