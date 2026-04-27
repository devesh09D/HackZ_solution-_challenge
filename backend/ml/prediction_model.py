"""
SevAI - RandomForest Prediction Model.
Predicts upcoming need zones based on historical task data.
Compatible with Vertex AI deployment (scikit-learn pipelines).
"""
import numpy as np
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

# ── Label maps ────────────────────────────────────────────────────────────────
NEED_TYPES = ["food", "water", "shelter", "medical", "clothing", "education", "sanitation", "rescue"]
NEED_TO_IDX = {n: i for i, n in enumerate(NEED_TYPES)}

CITIES = [
    {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
    {"name": "Delhi", "lat": 28.6139, "lng": 77.2090},
    {"name": "Bangalore", "lat": 12.9716, "lng": 77.5946},
    {"name": "Chennai", "lat": 13.0827, "lng": 80.2707},
    {"name": "Kolkata", "lat": 22.5726, "lng": 88.3639},
    {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
    {"name": "Pune", "lat": 18.5204, "lng": 73.8567},
    {"name": "Ahmedabad", "lat": 23.0225, "lng": 72.5714},
    {"name": "Jaipur", "lat": 26.9124, "lng": 75.7873},
    {"name": "Lucknow", "lat": 26.8467, "lng": 80.9462},
]

_model = None


def _build_synthetic_training_data(n_samples: int = 500):
    """Generate synthetic historical data to train the model."""
    import random
    random.seed(0)
    np.random.seed(0)

    X, y = [], []
    for _ in range(n_samples):
        city = random.choice(CITIES)
        # Features: lat, lng, month, day_of_week, hour, people_affected_avg
        month = random.randint(1, 12)
        dow = random.randint(0, 6)
        hour = random.randint(0, 23)
        people = random.randint(5, 500)

        # Simulate seasonal/location trends
        if month in [6, 7, 8, 9]:  # Monsoon → water, rescue, shelter
            need = random.choices(NEED_TYPES, [1, 4, 3, 2, 1, 1, 2, 4])[0]
        elif month in [12, 1, 2]:  # Winter → food, clothing, shelter
            need = random.choices(NEED_TYPES, [4, 1, 3, 2, 4, 1, 1, 1])[0]
        else:
            need = random.choice(NEED_TYPES)

        X.append([city["lat"], city["lng"], month, dow, hour, people])
        y.append(NEED_TO_IDX[need])

    return np.array(X), np.array(y)


def load_model():
    """Train and cache the prediction model on startup."""
    global _model
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.pipeline import Pipeline

        logger.info("🤖 Training RandomForest prediction model...")
        X, y = _build_synthetic_training_data(n_samples=800)

        _model = Pipeline([
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=1))
        ])
        _model.fit(X, y)
        logger.info("✅ Prediction model trained successfully.")
    except Exception as e:
        logger.warning(f"Model training failed: {e}. Will use rule-based predictions.")
        _model = None


def get_predictions() -> List[Dict]:
    """
    Generate predicted need zones for the next 7 days.
    Returns a list of prediction zone objects.
    """
    from datetime import datetime
    now = datetime.utcnow()
    predictions = []

    for city in CITIES:
        features = np.array([[
            city["lat"], city["lng"],
            now.month, now.weekday(), now.hour, 100
        ]])

        if _model is not None:
            try:
                proba = _model.predict_proba(features)[0]
                top_idx = int(np.argmax(proba))
                probability = float(proba[top_idx])
                predicted_need = NEED_TYPES[top_idx]
            except Exception:
                predicted_need, probability = _rule_based_prediction(now.month)
        else:
            predicted_need, probability = _rule_based_prediction(now.month)

        predictions.append({
            "lat": city["lat"] + 0.02,
            "lng": city["lng"] + 0.02,
            "predicted_need": predicted_need,
            "probability": round(probability, 3),
            "city": city["name"],
        })

    return predictions


def _rule_based_prediction(month: int):
    """Fallback rule-based prediction when model is unavailable."""
    import random
    random.seed(month)
    if month in [6, 7, 8, 9]:
        need = random.choices(["water", "rescue", "shelter", "food"], [4, 4, 3, 2])[0]
        prob = round(random.uniform(0.65, 0.90), 3)
    elif month in [12, 1, 2]:
        need = random.choices(["food", "clothing", "shelter"], [4, 4, 3])[0]
        prob = round(random.uniform(0.60, 0.85), 3)
    else:
        need = random.choice(NEED_TYPES)
        prob = round(random.uniform(0.45, 0.75), 3)
    return need, prob
