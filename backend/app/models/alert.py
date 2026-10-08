from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False, index=True)  # DENSITY_SPIKE, RAPID_INCREASE, REPEAT_INCIDENTS, HIGH_SEVERITY, HOTSPOT_THRESHOLD
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=False)
    severity = Column(String(20), nullable=False, default="WARNING", index=True)  # INFO, WARNING, HIGH, CRITICAL
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(150), nullable=True)
    status = Column(String(30), nullable=False, default="ACTIVE", index=True)  # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    acknowledged_by_user = relationship("User", back_populates="alerts_acknowledged")

    __table_args__ = (
        Index("idx_alert_status_severity", "status", "severity"),
    )
