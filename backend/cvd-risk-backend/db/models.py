from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean,
    ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="patient", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime, nullable=True)

    # Relationships
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    batch_predictions = relationship("BatchPrediction", back_populates="user", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sex = Column(Integer, nullable=False)
    age = Column(Integer, nullable=False)
    cigs_per_day = Column(Integer, nullable=False)
    tot_chol = Column(Float, nullable=False)
    sys_bp = Column(Float, nullable=False)
    dia_bp = Column(Float, nullable=False)
    glucose = Column(Float, nullable=False)
    probability = Column(Float, nullable=False)
    risk_percentage = Column(Float, nullable=False)
    risk_category = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="predictions")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(255), unique=True, nullable=False)
    session_name = Column(String(255), default="New Chat", nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), ForeignKey("chat_sessions.session_id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    source = Column(String(50), default="ai", nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")


class BatchPrediction(Base):
    __tablename__ = "batch_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    total_records = Column(Integer, nullable=False)
    successful_predictions = Column(Integer, nullable=False)
    failed_predictions = Column(Integer, nullable=False)
    results = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="batch_predictions")
