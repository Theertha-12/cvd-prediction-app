import os
import random
import string
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from passlib.context import CryptContext
import jwt
import joblib
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint
import traceback

# --- SQLModel for persistent user storage ---
from sqlmodel import SQLModel, Field as ORMField, Session, create_engine, select

# --- Load environment variables ---
load_dotenv()
SECRET_KEY = os.environ.get("SECRET_KEY") or ''.join(random.choices(string.ascii_letters + string.digits, k=32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# --- FastAPI App ---
app = FastAPI(
    title="CVD Risk Prediction and Medical Chatbot API",
    description="Backend API for cardiovascular disease risk prediction, user/doctor management, and a customizable AI-powered chatbot.",
    version="1.0.0"
)

# --- CORS (for frontend connection) ---
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- SQLModel User Table ---
class User(SQLModel, table=True):
    id: Optional[int] = ORMField(default=None, primary_key=True)
    username: str = ORMField(index=True, unique=True)
    hashed_password: str
    role: str
    disabled: bool = False

# --- Create SQLite DB ---
sqlite_file_name = "users.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- Pydantic Models for API ---
class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # "user" or "doctor"

class UserInDB(BaseModel):
    username: str
    hashed_password: str
    role: str
    disabled: bool = False

class PatientData(BaseModel):
    sex: int = Field(..., description="0 for female, 1 for male")
    age: float = Field(..., gt=0)
    cigsPerDay: float = Field(..., ge=0)
    totChol: float = Field(..., ge=0)
    sysBP: float = Field(..., ge=0)
    diaBP: float = Field(..., ge=0)
    glucose: float = Field(..., ge=0)

class BatchPatientData(BaseModel):
    patients: List[PatientData]

class ChatRequest(BaseModel):
    message: str

# --- User CRUD Functions ---
def get_user(username: str) -> Optional[UserInDB]:
    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()
        if user:
            return UserInDB(
                username=user.username,
                hashed_password=user.hashed_password,
                role=user.role,
                disabled=user.disabled
            )
        return None

def create_user(user: UserCreate):
    with Session(engine) as session:
        statement = select(User).where(User.username == user.username)
        existing = session.exec(statement).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        hashed_password = pwd_context.hash(user.password)
        db_user = User(
            username=user.username,
            hashed_password=hashed_password,
            role=user.role,
            disabled=False
        )
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user or not pwd_context.verify(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = get_user(username)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def require_role(required_roles: List[str]):
    def role_checker(user: UserInDB = Depends(get_current_user)):
        if user.role not in required_roles:
            raise HTTPException(status_code=403, detail="You do not have access to this resource")
        return user
    return role_checker

# --- Load Model and Scaler ---
try:
    logreg = joblib.load('final_logreg_model_7features.joblib')
    scaler = joblib.load('scaler_7features.joblib')
    selected_features = ['sex', 'age', 'cigsPerDay', 'totChol', 'sysBP', 'diaBP', 'glucose']
except Exception as e:
    raise RuntimeError(f"Failed to load model or scaler: {e}")

threshold = 0.4

# --- API Endpoints ---

@app.post("/signup")
def signup(user: UserCreate):
    create_user(user)
    return {"msg": "User created successfully"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token_data = {"sub": user.username, "role": user.role}
    access_token = create_access_token(token_data)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/model_info")
def model_info():
    return {
        "model": "Logistic Regression",
        "features": selected_features,
        "threshold": threshold,
        "version": "1.0"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(data: PatientData, user: UserInDB = Depends(require_role(["user", "doctor"]))):
    try:
        features = np.array([[getattr(data, feat) for feat in selected_features]])
        features_scaled = scaler.transform(features)
        prob = float(logreg.predict_proba(features_scaled)[0, 1])
        risk = int(prob >= threshold)
        return {
            "probability_of_CVD": prob,
            "at_risk": risk
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

@app.get("/user/history")
def get_user_history(user: UserInDB = Depends(require_role(["user"]))):
    # Placeholder for user-specific history retrieval
    return {"history": "User prediction history (to be implemented)"}

@app.post("/doctor/batch_predict")
def batch_predict(batch: BatchPatientData, user: UserInDB = Depends(require_role(["doctor"]))):
    try:
        features = np.array([[getattr(p, feat) for feat in selected_features] for p in batch.patients])
        features_scaled = scaler.transform(features)
        probs = logreg.predict_proba(features_scaled)[:, 1]
        risks = (probs >= threshold).astype(int)
        results = []
        for i, p in enumerate(batch.patients):
            results.append({
                "input": p.dict(),
                "probability_of_CVD": float(probs[i]),
                "at_risk": int(risks[i])
            })
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch prediction failed: {e}")

@app.get("/doctor/patients")
def doctor_patients(user: UserInDB = Depends(require_role(["doctor"]))):
    # Placeholder for patient management
    return {"patients": "List of patients (to be implemented)"}

@app.get("/doctor/analytics")
def doctor_analytics(user: UserInDB = Depends(require_role(["doctor"]))):
    # Placeholder for analytics dashboard
    return {"analytics": "Analytics dashboard (to be implemented)"}



@app.post("/chat")
def chat_endpoint(
    request: ChatRequest,
    user: UserInDB = Depends(require_role(["user", "doctor"]))
):
    try:
        
        llm = HuggingFaceEndpoint(
            repo_id=model_id,
            task="text-generation",
            max_new_tokens=max_tokens,
            temperature=temperature
        )
        response = llm.invoke(prompt)
        return {"response": response}
    except Exception as e:
        print("Chatbot error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

