from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.crime_incident import CrimeIncident
from app.models.crime_type import CrimeType
from app.models.police_station import PoliceStation
from app.models.hotspot import Hotspot
from app.schemas.analytics import (
    SummaryKPI, DataPoint, TimeSeriesPoint, HourlyPoint, WeekdayPoint, StationMetricPoint
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])

def apply_analytics_filters(
    query,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    crime_type_id: Optional[int] = None,
    severity: Optional[str] = None,
    police_station_id: Optional[int] = None
):
    if start_date:
        query = query.filter(CrimeIncident.incident_date >= start_date)
    if end_date:
        query = query.filter(CrimeIncident.incident_date <= end_date)
    if crime_type_id:
        query = query.filter(CrimeIncident.crime_type_id == crime_type_id)
    if severity:
        query = query.filter(CrimeIncident.severity == severity)
    if police_station_id:
        query = query.filter(CrimeIncident.police_station_id == police_station_id)
    return query

@router.get("/summary", response_model=SummaryKPI)
def get_summary_kpis(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    crime_type_id: Optional[int] = None,
    police_station_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes key executive KPIs: total incidents, today, this week, this month,
    high-severity count, and active hotspot count.
    """
    base_query = apply_analytics_filters(
        db.query(CrimeIncident),
        start_date=start_date,
        end_date=end_date,
        crime_type_id=crime_type_id,
        police_station_id=police_station_id
    )

    total_incidents = base_query.count()

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    incidents_today = db.query(CrimeIncident).filter(CrimeIncident.incident_date == today).count()
    incidents_this_week = db.query(CrimeIncident).filter(CrimeIncident.incident_date >= week_start).count()
    incidents_this_month = db.query(CrimeIncident).filter(CrimeIncident.incident_date >= month_start).count()

    high_severity_count = base_query.filter(CrimeIncident.severity.in_(["High", "Critical"])).count()
    active_hotspots_count = db.query(Hotspot).filter(Hotspot.is_active == True).count()

    # Highest crime category
    top_cat_result = (
        db.query(CrimeType.category, func.count(CrimeIncident.id))
        .join(CrimeType, CrimeIncident.crime_type_id == CrimeType.id)
        .group_by(CrimeType.category)
        .order_by(func.count(CrimeIncident.id).desc())
        .first()
    )
    top_cat = top_cat_result[0] if top_cat_result else "None"

    return {
        "total_incidents": total_incidents,
        "incidents_today": incidents_today,
        "incidents_this_week": incidents_this_week,
        "incidents_this_month": incidents_this_month,
        "high_severity_incidents": high_severity_count,
        "active_hotspots": active_hotspots_count,
        "highest_crime_category": top_cat,
        "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    }

@router.get("/by-type", response_model=List[DataPoint])
def get_crimes_by_type(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    police_station_id: Optional[int] = None,
    severity: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns distribution of incidents grouped by crime type name.
    """
    query = (
        db.query(CrimeType.name, func.count(CrimeIncident.id))
        .join(CrimeType, CrimeIncident.crime_type_id == CrimeType.id)
    )
    query = apply_analytics_filters(
        query, start_date=start_date, end_date=end_date, police_station_id=police_station_id, severity=severity
    )
    results = query.group_by(CrimeType.name).order_by(func.count(CrimeIncident.id).desc()).all()

    total = sum(r[1] for r in results) or 1
    return [
        {
            "label": r[0],
            "value": r[1],
            "percentage": round((r[1] / total) * 100.0, 1)
        }
        for r in results
    ]

@router.get("/by-date", response_model=List[TimeSeriesPoint])
def get_crimes_by_date(
    days: int = Query(30, ge=7, le=365, description="Number of past days"),
    crime_type_id: Optional[int] = None,
    police_station_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns daily time series crime volume and high-severity trend.
    """
    start = date.today() - timedelta(days=days)
    query = db.query(
        CrimeIncident.incident_date,
        func.count(CrimeIncident.id),
        func.sum(case((CrimeIncident.severity.in_(["High", "Critical"]), 1), else_=0))
    ).filter(CrimeIncident.incident_date >= start)

    if crime_type_id:
        query = query.filter(CrimeIncident.crime_type_id == crime_type_id)
    if police_station_id:
        query = query.filter(CrimeIncident.police_station_id == police_station_id)

    results = query.group_by(CrimeIncident.incident_date).order_by(CrimeIncident.incident_date.asc()).all()

    return [
        {
            "date": r[0].isoformat(),
            "count": r[1],
            "high_severity": int(r[2] or 0)
        }
        for r in results
    ]

@router.get("/by-hour", response_model=List[HourlyPoint])
def get_crimes_by_hour(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns 24-hour diurnal crime curve (00:00 to 23:00).
    """
    query = db.query(CrimeIncident)
    query = apply_analytics_filters(query, start_date=start_date, end_date=end_date)
    incidents = query.all()

    hour_counts = {h: 0 for h in range(24)}
    for inc in incidents:
        if inc.incident_time:
            hour_counts[inc.incident_time.hour] += 1

    return [
        {
            "hour": h,
            "hour_label": f"{h:02d}:00",
            "count": hour_counts[h]
        }
        for h in range(24)
    ]

@router.get("/by-weekday", response_model=List[WeekdayPoint])
def get_crimes_by_weekday(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns crime volume aggregated by day of the week (Monday to Sunday).
    """
    query = db.query(CrimeIncident)
    query = apply_analytics_filters(query, start_date=start_date, end_date=end_date)
    incidents = query.all()

    days_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_counts = {i: 0 for i in range(7)}

    for inc in incidents:
        if inc.incident_date:
            day_counts[inc.incident_date.weekday()] += 1

    return [
        {
            "day": days_names[i],
            "day_index": i,
            "count": day_counts[i]
        }
        for i in range(7)
    ]

@router.get("/by-station", response_model=List[StationMetricPoint])
def get_crimes_by_station(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns incident distribution and high-severity breakdown per police station.
    """
    query = (
        db.query(
            PoliceStation.id,
            PoliceStation.name,
            func.count(CrimeIncident.id),
            func.sum(case((CrimeIncident.severity.in_(["High", "Critical"]), 1), else_=0))
        )
        .join(CrimeIncident, PoliceStation.id == CrimeIncident.police_station_id)
    )
    query = apply_analytics_filters(query, start_date=start_date, end_date=end_date)
    results = (
        query.group_by(PoliceStation.id, PoliceStation.name)
        .order_by(func.count(CrimeIncident.id).desc())
        .all()
    )

    return [
        {
            "station_id": r[0],
            "station_name": r[1],
            "count": r[2],
            "high_severity": int(r[3] or 0)
        }
        for r in results
    ]
