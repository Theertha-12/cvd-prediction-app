from pydantic import BaseModel
from typing import Dict, List
from schemas.chat import ChatSessionInfo
from schemas.predict import PredictionHistory

class UserStatistics(BaseModel):
    total_predictions: int
    recent_predictions: int
    risk_distribution: Dict[str, int]

class SystemStatistics(BaseModel):
    total_patients: int
    total_predictions: int
    recent_activity: int
    risk_distribution: Dict[str, int]

class DashboardData(BaseModel):
    user_info: dict
    statistics: Dict
    recent_predictions: List[PredictionHistory]
    chat_sessions: List[ChatSessionInfo]