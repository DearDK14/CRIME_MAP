from sqlalchemy import Column, Integer, String, Date, DateTime, JSON
from datetime import datetime, timezone
from app.core.database import Base

class CrimeStatistic(Base):
    __tablename__ = "crime_statistics"

    id = Column(Integer, primary_key=True, index=True)
    period_type = Column(String(20), nullable=False)  # daily, weekly, monthly
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)
    total_incidents = Column(Integer, nullable=False, default=0)
    high_severity_count = Column(Integer, nullable=False, default=0)
    by_category = Column(JSON, nullable=True)  # {category: count}
    by_station = Column(JSON, nullable=True)   # {station_name: count}
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
