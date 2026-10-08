from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles, get_client_ip
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdateRole
from app.core.audit import log_audit_event

router = APIRouter(prefix="/users", tags=["User Administration"])

@router.get("", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    """
    List all system users and their assigned roles (Admin only).
    """
    return db.query(User).order_by(User.id).all()

@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_in: UserUpdateRole,
    request: Request,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Update user role between admin, police_officer, and analyst (Admin only).
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if role_in.role not in ["admin", "police_officer", "analyst"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified")

    old_role = target_user.role
    target_user.role = role_in.role
    db.commit()
    db.refresh(target_user)

    # Audit log
    log_audit_event(
        db=db,
        action="UPDATE_USER_ROLE",
        entity_type="User",
        user_id=current_user.id,
        entity_id=str(user_id),
        ip_address=get_client_ip(request),
        details={"username": target_user.username, "old_role": old_role, "new_role": role_in.role}
    )

    return target_user
