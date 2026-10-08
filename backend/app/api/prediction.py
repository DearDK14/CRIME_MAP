from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_roles, get_client_ip
from app.models.user import User
from app.models.crime_incident import CrimeIncident
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionResponse, PredictionRunRequest
from app.services.ml_service import MLService
from app.core.audit import log_audit_event

router = APIRouter(prefix="/prediction", tags=["ML Risk Assessment"])

@router.get("/results", response_model=List[PredictionResponse])
def get_prediction_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns latest zone-based historical risk assessments.
    Each zone includes explainable driving factors (e.g. 30-day velocity, severity).
    """
    return db.query(Prediction).order_by(Prediction.risk_score.desc()).all()

@router.post("/run")
def run_prediction_pipeline(
    payload: Optional[PredictionRunRequest] = None,
    request: Request = None,
    current_user: User = Depends(require_roles(["admin", "analyst"])),
    db: Session = Depends(get_db)
):
    """
    Executes the experimental short-term geographic risk assessment pipeline.
    Compares the trained model (Random Forest / Gradient Boosting) against
    a historical moving average baseline and generates feature explainability metrics.
    
    IMPORTANT DISCLAIMER:
    This output is decision-support information based on historical patterns
    and does not determine that a crime will occur.
    """
    model_type = payload.model_type if payload else "RandomForest"
    incidents = db.query(CrimeIncident).all()

    predictions, metrics = MLService.run_zone_risk_assessment(
        db=db,
        incidents=incidents,
        model_type=model_type,
        grid_rows=6,
        grid_cols=6
    )

    # Audit log
    log_audit_event(
        db=db,
        action="RUN_PREDICTION",
        entity_type="Prediction",
        user_id=current_user.id,
        entity_id=None,
        ip_address=get_client_ip(request) if request else "127.0.0.1",
        details={
            "model_type": model_type,
            "zones_evaluated": len(predictions),
            "baseline_mae": metrics.get("baseline_mae"),
            "model_mae": metrics.get("model_mae")
        }
    )

    return {
        "success": True,
        "message": "Experimental risk assessment executed successfully",
        "zones_count": len(predictions),
        "metrics": metrics,
        "disclaimer": "This output is decision-support information based on historical patterns and does not determine that a crime will occur.",
        "results": [
            {
                "id": pr.id,
                "zone_id": pr.zone_id,
                "zone_name": pr.zone_name,
                "risk_score": pr.risk_score,
                "risk_category": pr.risk_category,
                "incident_count_historical": pr.incident_count_historical,
                "important_factors": pr.important_factors,
                "center_lat": pr.center_lat,
                "center_lon": pr.center_lon,
                "geometry_geojson": pr.geometry_geojson
            }
            for pr in predictions
        ]
    }
