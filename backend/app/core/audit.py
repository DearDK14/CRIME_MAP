import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    user_id: Optional[int] = None,
    entity_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> Optional[AuditLog]:
    """
    Records an immutable audit log entry for security and compliance.
    """
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            ip_address=ip_address,
            details=details or {}
        )
        db.add(audit_entry)
        db.commit()
        return audit_entry
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        db.rollback()
        return None
