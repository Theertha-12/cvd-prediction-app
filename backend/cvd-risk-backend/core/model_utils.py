import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional
import logging
import os
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import make_classification
import warnings

# Suppress sklearn warnings
warnings.filterwarnings("ignore", category=UserWarning)

logger = logging.getLogger(__name__)

# Risk categories
RISK_LOW = "Low"
RISK_MODERATE = "Moderate"
RISK_HIGH = "High"
RISK_COLORS = {
    RISK_LOW: "green",
    RISK_MODERATE: "orange",
    RISK_HIGH: "red"
}

# Global model storage
models = {}


def load_models():
    """Load ML models and scaler at application startup"""
    global models
    current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    models_dir = current_dir.parent / "models"

    try:
        classifier_path = models_dir / "final_logreg_model_7features.joblib"
        scaler_path = models_dir / "scaler_7features.joblib"

        if classifier_path.exists() and scaler_path.exists():
            models["classifier"] = joblib.load(classifier_path)
            models["scaler"] = joblib.load(scaler_path)
            logger.info("Production models loaded successfully")
            return

        logger.warning("Production models not found. Creating dummy models")
        self_train_dummy_models()
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        self_train_dummy_models()


def self_train_dummy_models():
    """Create and train dummy models when real models are unavailable"""
    X, y = make_classification(
        n_samples=1000,
        n_features=7,
        n_informative=5,
        n_classes=2,
        random_state=42
    )

    models["scaler"] = StandardScaler()
    X_scaled = models["scaler"].fit_transform(X)

    models["classifier"] = LogisticRegression(max_iter=1000, random_state=42)
    models["classifier"].fit(X_scaled, y)
    logger.info("Dummy models created successfully")


def predict_cvd_risk(features: List[float], user_data: Optional[dict] = None) -> Dict:
    """Predict CVD risk from input features"""
    try:
        if len(features) != 7:
            raise ValueError("Exactly 7 features required")

        features_array = np.array(features).reshape(1, -1)
        features_scaled = models["scaler"].transform(features_array)

        probability = models["classifier"].predict_proba(features_scaled)[0][1]
        risk_percent = round(probability * 100, 2)  # Renamed to lowercase

        if risk_percent < 30:
            risk_category = RISK_LOW
        elif risk_percent < 70:
            risk_category = RISK_MODERATE
        else:
            risk_category = RISK_HIGH

        personalized_advice = generate_personalized_advice(
            risk_percent,  # Use renamed variable
            risk_category,
            user_data
        )

        feature_names = ["sex", "age", "cigsPerDay", "totChol", "sysBP", "diaBP", "glucose"]

        return {
            "probability": float(probability),
            "risk_percentage": risk_percent,  # Use renamed variable
            "risk_category": risk_category,
            "risk_color": RISK_COLORS[risk_category],
            "personalized_advice": personalized_advice,
            "features_used": dict(zip(feature_names, features))
        }
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise RuntimeError(f"Prediction error: {e}")


def generate_personalized_advice(
        risk_percent: float,  # Renamed parameter to lowercase
        risk_category: str,
        user_data: Optional[dict] = None
) -> str:
    """Generate personalized advice based on risk level and user role"""
    role = user_data.get("role", "patient") if user_data else "patient"

    base_advice = {
        RISK_LOW: "Your cardiovascular risk is low. Maintain your healthy lifestyle with regular exercise and a balanced diet.",
        RISK_MODERATE: "You have moderate cardiovascular risk. Consider lifestyle changes like quitting smoking and improving your diet.",
        RISK_HIGH: "You have high cardiovascular risk. Please consult a healthcare professional immediately."
    }.get(risk_category, "")

    # Role-specific additions
    if role == "doctor":
        clinical_recs = {
            RISK_LOW: "Recommend annual check-ups and basic lifestyle counseling.",
            RISK_MODERATE: "Consider initiating statin therapy per ACC/AHA guidelines. Monitor BP and lipids quarterly.",
            RISK_HIGH: "Urgent intervention needed. Consider aggressive medical therapy and specialist referral."
        }
        return f"{base_advice} CLINICAL RECOMMENDATION: {clinical_recs.get(risk_category, '')}"

    # Patient-specific additions
    patient_actions = {
        RISK_LOW: "Keep up the good work! Aim for 150 minutes of exercise per week.",
        RISK_MODERATE: "Schedule a check-up with your doctor. Reduce salt and saturated fats in your diet.",
        RISK_HIGH: "Contact your doctor immediately. Monitor your blood pressure daily."
    }
    return f"{base_advice} ACTION ITEMS: {patient_actions.get(risk_category, '')}"


def batch_predict_cvd_risk(df: pd.DataFrame) -> List[Dict]:
    """Batch prediction for CSV data"""
    results = []
    required_columns = ["sex", "age", "cigsPerDay", "totChol", "sysBP", "diaBP", "glucose"]

    # Validate columns
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    # Process each row
    for idx, row in df.iterrows():
        try:
            features = [row[col] for col in required_columns]
            result = predict_cvd_risk(features)
            result["row_id"] = idx
            results.append(result)
        except Exception as e:
            logger.error(f"Row {idx} prediction failed: {e}")
            results.append({
                "row_id": idx,
                "error": str(e),
                "risk_category": "Error"
            })

    return results


def get_model_info() -> Dict:
    """Get information about loaded models"""
    if not models:
        return {"status": "models_not_loaded"}

    classifier = models.get("classifier", None)
    scaler = models.get("scaler", None)

    return {
        "classifier_type": type(classifier).__name__ if classifier else None,
        "scaler_type": type(scaler).__name__ if scaler else None,
        "features": 7,
        "status": "loaded"
    }