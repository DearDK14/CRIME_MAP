from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from datetime import datetime, timezone
from app.core.database import Base

class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(Integer, primary_key=True, index=True)
    cluster_label = Column(String(50), nullable=False)
    center_lat = Column(Float, nullable=False, index=True)
    center_lon = Column(Float, nullable=False, index=True)
    radius_meters = Column(Float, nullable=False, default=300.0)
    incident_count = Column(Integer, nullable=False, default=0)
    risk_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 100.0
    risk_category = Column(String(20), nullable=False, default="Moderate")  # Low, Moderate, High, Very High
    primary_crime_type = Column(String(100), nullable=True)
    severity_breakdown = Column(JSON, nullable=True)
    temporal_concentration = Column(JSON, nullable=True)
    detection_method = Column(String(50), nullable=False, default="DBSCAN")
    geometry_geojson = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
