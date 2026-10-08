from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone
from app.core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String(50), nullable=False, index=True)
    zone_name = Column(String(100), nullable=False)
    geometry_geojson = Column(JSON, nullable=True)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 100.0
    risk_category = Column(String(20), nullable=False, default="Moderate")  # Low, Moderate, High, Very High
    incident_count_historical = Column(Integer, default=0)
    recent_trend_ratio = Column(Float, default=1.0)
    severity_weighted_index = Column(Float, default=0.0)
    model_name = Column(String(100), default="RandomForestRiskModel")
    important_factors = Column(JSON, nullable=True)  # Explainable factors dictionary
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
