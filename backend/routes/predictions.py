"""
SevAI - Predictions Route.
GET /predictions → predicted need zones for the next 7 days.
"""
from fastapi import APIRouter
from ml.prediction_model import get_predictions
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/predictions", summary="Get predicted need zones")
async def predictions():
    """
    Uses the trained RandomForest model to predict upcoming need zones
    for each major city based on month, day, and historical patterns.
    Returns: [{lat, lng, predicted_need, probability, city}]
    """
    zones = get_predictions()
    return {
        "predictions": zones,
        "count": len(zones),
        "model": "RandomForest (scikit-learn)",
        "note": "Predictions are based on historical patterns and seasonal trends.",
    }
