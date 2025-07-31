from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, Dict, List
from datetime import datetime


class UserBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=3)
    role: Optional[str] = "patient"

    @field_validator('password')
    def validate_password(cls, v):
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        special_chars = set('@$!%*?&')
        if not any(char in special_chars for char in v):
            raise ValueError('Password must contain at least one special character (@$!%*?&)')
        return v

    @field_validator('email')
    def validate_email_domain(cls, v):
        if "@example.com" in v:
            raise ValueError("Email addresses from example.com are not allowed.")
        return v


class UserLogin(UserBase):
    email: EmailStr
    password: str


class UserPublic(UserBase):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str


class ChatMessage(BaseModel):
    message: str
    session_id: str
    prediction_context: Optional[Dict] = Field(
        None,
        description="Prediction context for patient-specific responses"
    )

    @field_validator('prediction_context')
    def validate_prediction_context(cls, v):
        if v:
            required_keys = {'patientId', 'riskScore', 'riskCategory'}
            if not required_keys.issubset(v.keys()):
                missing = required_keys - set(v.keys())
                raise ValueError(f"Missing required prediction context keys: {missing}")
        return v


class ChatResponse(BaseModel):
    response: str
    source: str
    session_id: str
    personalized: bool = False


class ChatHistory(BaseModel):
    session_id: str
    messages: List[Dict]


class ChatSessionInfo(BaseModel):
    session_id: str
    session_name: str
    created_at: datetime
    updated_at: datetime


class PredictionResult(BaseModel):
    patient_id: str
    risk_score: float
    risk_category: str
    key_factors: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BatchPredictionRequest(BaseModel):
    patient_data: List[Dict]


class BatchPredictionResponse(BaseModel):
    results: List[PredictionResult]
    summary: Dict[str, int]


class SinglePredictionRequest(BaseModel):
    age: int
    sex: int
    chest_pain_type: int
    resting_bp: int
    cholesterol: int
    fasting_bs: int
    resting_ecg: int
    max_hr: int
    exercise_angina: int
    oldpeak: float
    st_slope: int


class SinglePredictionResponse(BaseModel):
    risk_score: float
    risk_category: str
    key_factors: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RiskFactorAnalysis(BaseModel):
    patient_id: str
    top_risk_factors: List[Dict[str, float]]
    recommendations: List[str]


class ClinicalGuideline(BaseModel):
    guideline_id: str
    title: str
    category: str
    content: str
    source: str
    publication_date: datetime


class ChatSessionContext(BaseModel):
    session_id: str
    patient_context: Optional[PredictionResult] = None
    clinical_mode: bool = True
    last_interaction: datetime = Field(default_factory=datetime.utcnow)


class DoctorChatRequest(BaseModel):
    message: str
    clinical_context: Dict = Field(
        default_factory=dict,
        description="Additional clinical context for the conversation"
    )
    prediction_context: Optional[Dict] = Field(
        None,
        description="Prediction data to guide the response"
    )


class DoctorChatResponse(BaseModel):
    response: str
    references: List[ClinicalGuideline] = []
    management_strategies: List[str] = []
    risk_analysis: Optional[RiskFactorAnalysis] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PatientChatRequest(BaseModel):
    message: str
    simplified: bool = True
    risk_context: Optional[Dict] = None


class PatientChatResponse(BaseModel):
    response: str
    simplified: bool = True
    risk_aware: bool = False
    follow_up_questions: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)