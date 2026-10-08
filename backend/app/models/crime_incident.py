from sqlalchemy import Column, Integer, String, Float, Date, Time, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.spatial_types import get_point_geography_column

class CrimeIncident(Base):
    __tablename__ = "crime_incidents"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, nullable=False, index=True)
    crime_type_id = Column(Integer, ForeignKey("crime_types.id", ondelete="RESTRICT"), nullable=False, index=True)
    incident_date = Column(Date, nullable=False, index=True)
    incident_time = Column(Time, nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location = Column(get_point_geography_column(4326), nullable=True)
    police_station_id = Column(Integer, ForeignKey("police_stations.id", ondelete="RESTRICT"), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default="Medium", index=True)  # Low, Medium, High, Critical
    status = Column(String(30), nullable=False, default="Reported", index=True)  # Reported, Under Investigation, Charges Filed, Closed
    description = Column(Text, nullable=True)
    address = Column(String(255), nullable=True)
    weapon_used = Column(String(100), nullable=True)
    victim_count = Column(Integer, default=1, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    crime_type = relationship("CrimeType", back_populates="incidents")
    police_station = relationship("PoliceStation", back_populates="incidents")
    created_by_user = relationship("User", back_populates="incidents_reported")

    # Composite indexes for high-speed spatial & temporal analytics
    __table_args__ = (
        Index("idx_incident_date_type", "incident_date", "crime_type_id"),
        Index("idx_incident_station_status", "police_station_id", "status"),
        Index("idx_incident_severity_date", "severity", "incident_date"),
        Index("idx_incident_lat_lon", "latitude", "longitude"),
    )
