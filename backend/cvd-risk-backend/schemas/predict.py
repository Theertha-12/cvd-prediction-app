from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PredictionInput(BaseModel):
    sex: int = Field(..., ge=0, le=1, description="0 for female, 1 for male")
    age: int = Field(..., ge=18, le=120)
    cigsPerDay: int = Field(..., ge=0, le=100)
    totChol: float = Field(..., ge=100, le=600)
    sysBP: float = Field(..., ge=80, le=300)
    diaBP: float = Field(..., ge=40, le=200)
    glucose: float = Field(..., ge=50, le=500)

class PredictionOutput(BaseModel):
    probability: float
    risk_percentage: float
    risk_category: str
    risk_color: str
    features_used: dict
    personalized_advice: str
    prediction_id: Optional[int] = None
    created_at: Optional[datetime] = None

class PredictionHistory(BaseModel):
    id: int
    risk_percentage: float
    risk_category: str
    created_at: datetime
    features: dict