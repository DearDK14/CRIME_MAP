from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.spatial_types import get_point_geography_column

class PoliceStation(Base):
    __tablename__ = "police_stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    station_code = Column(String(20), unique=True, nullable=False, index=True)
    jurisdiction_area = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location = Column(get_point_geography_column(4326), nullable=True)
    contact_number = Column(String(30), nullable=True)
    officer_in_charge = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    officers = relationship("User", back_populates="police_station")
    incidents = relationship("CrimeIncident", back_populates="police_station")
