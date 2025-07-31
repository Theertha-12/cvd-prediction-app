from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_, between, or_
from typing import Optional, Sequence, Dict, List
from datetime import datetime, timedelta, timezone
import json
import logging

from db.models import User, Prediction, ChatSession, ChatMessage, BatchPrediction

logger = logging.getLogger(__name__)


# -------------------- User Management --------------------

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, email: str, full_name: str, hashed_password: str, role: str) -> User:
    db_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        role=role
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_last_login(db: AsyncSession, user_id: int):
    user = await db.get(User, user_id)
    if user:
        user.last_login = datetime.now(timezone.utc)
        await db.commit()


# -------------------- Predictions --------------------

async def create_prediction(db: AsyncSession, prediction_data: dict, user_id: int) -> Prediction:
    db_prediction = Prediction(
        user_id=user_id,
        sex=prediction_data["sex"],
        age=prediction_data["age"],
        cigs_per_day=prediction_data["cigsPerDay"],
        tot_chol=prediction_data["totChol"],
        sys_bp=prediction_data["sysBP"],
        dia_bp=prediction_data["diaBP"],
        glucose=prediction_data["glucose"],
        probability=prediction_data["probability"],
        risk_percentage=prediction_data["risk_percentage"],
        risk_category=prediction_data["risk_category"]
    )
    db.add(db_prediction)
    await db.commit()
    await db.refresh(db_prediction)
    return db_prediction


async def get_user_predictions(db: AsyncSession, user_id: int, limit: int = 10) -> Sequence[Prediction]:
    result = await db.execute(
        select(Prediction)
        .where(Prediction.user_id == user_id)
        .order_by(desc(Prediction.created_at))
        .limit(limit)
    )
    return result.scalars().all()


async def get_latest_prediction(db: AsyncSession, user_id: int) -> Optional[Prediction]:
    result = await db.execute(
        select(Prediction)
        .where(Prediction.user_id == user_id)
        .order_by(desc(Prediction.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


# -------------------- Batch Predictions --------------------

async def create_batch_prediction(db: AsyncSession, batch_data: dict, user_id: int) -> BatchPrediction:
    db_batch = BatchPrediction(
        user_id=user_id,
        filename=batch_data["filename"],
        total_records=batch_data["total_records"],
        successful_predictions=batch_data["successful_predictions"],
        failed_predictions=batch_data["failed_predictions"],
        results=json.dumps(batch_data["results"])
    )
    db.add(db_batch)
    await db.commit()
    await db.refresh(db_batch)
    return db_batch


async def get_user_batch_predictions(db: AsyncSession, user_id: int) -> Sequence[BatchPrediction]:
    result = await db.execute(
        select(BatchPrediction)
        .where(BatchPrediction.user_id == user_id)
        .order_by(desc(BatchPrediction.created_at))
    )
    return result.scalars().all()


# -------------------- Chat Sessions & Messages --------------------

async def get_or_create_chat_session(
        db: AsyncSession,
        session_id: str,
        user_id: int,
        session_name: str = "New Chat"
) -> ChatSession:
    result = await db.execute(
        select(ChatSession).where(ChatSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            session_name=session_name
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
    return session


async def create_chat_message(
        db: AsyncSession,
        session_id: str,
        message: str,
        response: str,
        source: str = "ai"
) -> ChatMessage:
    db_message = ChatMessage(
        session_id=session_id,
        message=message,
        response=response,
        source=source
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message


async def get_chat_history(db: AsyncSession, session_id: str, limit: int = 50) -> Sequence[ChatMessage]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .limit(limit)
    )
    return result.scalars().all()


async def get_user_chat_sessions(db: AsyncSession, user_id: int) -> Sequence[ChatSession]:
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(desc(ChatSession.updated_at))
    )
    return result.scalars().all()


# -------------------- Analytics & Dashboard --------------------

async def get_user_statistics(db: AsyncSession, user_id: int) -> Dict:
    # Total predictions count
    total_predictions = await db.execute(
        select(func.count(Prediction.id)).where(Prediction.user_id == user_id)
    )
    total = total_predictions.scalar() or 0

    # Risk category distribution
    risk_distribution = await db.execute(
        select(
            Prediction.risk_category,
            func.count(Prediction.id).label("count")
        )
        .where(Prediction.user_id == user_id)
        .group_by(Prediction.risk_category)
    )
    risk_stats = {row.risk_category: row.count for row in risk_distribution}

    # Recent predictions (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_predictions = await db.execute(
        select(func.count(Prediction.id))
        .where(
            and_(
                Prediction.user_id == user_id,
                Prediction.created_at >= seven_days_ago
            )
        )
    )
    recent = recent_predictions.scalar() or 0

    # Calculate high risk percentage
    high_risk_count = risk_stats.get('High', 0)
    total_risk_cases = sum(risk_stats.values()) if risk_stats else 0
    high_risk_percentage = round((high_risk_count / total_risk_cases * 100), 2) if total_risk_cases > 0 else 0

    return {
        "total_predictions": total,
        "recent_predictions": recent,
        "risk_distribution": risk_stats,
        "high_risk_percentage": high_risk_percentage
    }


async def get_all_statistics(db: AsyncSession) -> Dict:
    # Total patient count
    total_users = await db.execute(
        select(func.count(User.id)).where(User.role == "patient")
    )
    users_count = total_users.scalar() or 0

    # Total predictions count
    total_predictions = await db.execute(select(func.count(Prediction.id)))
    predictions_count = total_predictions.scalar() or 0

    # Risk category distribution
    risk_distribution = await db.execute(
        select(
            Prediction.risk_category,
            func.count(Prediction.id).label("count")
        )
        .group_by(Prediction.risk_category)
    )
    risk_stats = {row.risk_category: row.count for row in risk_distribution}

    # Recent activity (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_activity = await db.execute(
        select(func.count(Prediction.id)).where(Prediction.created_at >= thirty_days_ago)
    )
    recent = recent_activity.scalar() or 0

    # New patients in last 30 days
    new_patients_result = await db.execute(
        select(func.count(User.id))
        .where(
            and_(
                User.role == "patient",
                User.created_at >= thirty_days_ago
            )
        )
    )
    new_patients = new_patients_result.scalar() or 0

    # Calculate high risk percentage
    high_risk_count = risk_stats.get('High', 0)
    total_risk_cases = sum(risk_stats.values()) if risk_stats else 0
    high_risk_percentage = round((high_risk_count / total_risk_cases * 100), 2) if total_risk_cases > 0 else 0

    return {
        "total_patients": users_count,
        "total_predictions": predictions_count,
        "recent_activity": recent,
        "new_patients": new_patients,
        "risk_distribution": risk_stats,
        "high_risk_percentage": high_risk_percentage
    }


async def generate_recent_activities(
        db: AsyncSession,
        user_id: int,
        role: str,
        limit: int = 5
) -> List[Dict]:
    """
    Generate recent activities for dashboard timeline
    """
    activities = []

    # Get recent predictions
    predictions = await get_user_predictions(db, user_id, limit)
    for pred in predictions:
        activities.append({
            "id": f"pred_{pred.id}",
            "description": "Cardiovascular risk prediction" if role == "patient" else "Patient risk assessment",
            "target": f"{pred.risk_percentage}% {pred.risk_category} risk",
            "date": pred.created_at
        })

    # Get recent chat sessions for patients
    if role == "patient":
        chat_sessions = await get_user_chat_sessions(db, user_id)
        for session in chat_sessions[:min(limit, len(chat_sessions))]:
            activities.append({
                "id": f"chat_{session.session_id}",
                "description": "Chat session with doctor",
                "target": session.session_name,
                "date": session.updated_at or session.created_at
            })

    # For doctors, add patient registration events
    if role == "doctor":
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        new_patients = await db.execute(
            select(User)
            .where(
                and_(
                    User.role == "patient",
                    User.created_at >= thirty_days_ago
                )
            )
            .order_by(desc(User.created_at))
            .limit(limit)
        )
        for patient in new_patients.scalars():
            activities.append({
                "id": f"patient_{patient.id}",
                "description": "New patient registered",
                "target": patient.full_name,
                "date": patient.created_at
            })

    # Sort all activities by date
    activities.sort(key=lambda x: x["date"], reverse=True)

    return activities[:limit]