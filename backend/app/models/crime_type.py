from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class CrimeType(Base):
    __tablename__ = "crime_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # Violent, Property, Cyber, Narcotics, Traffic, etc.
    base_severity = Column(String(20), nullable=False, default="Medium")  # Low, Medium, High, Critical
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    incidents = relationship("CrimeIncident", back_populates="crime_type")
