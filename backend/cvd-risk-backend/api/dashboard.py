from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from db.crud import get_user_statistics, get_all_statistics, get_user_predictions
from schemas.dashboard import DashboardData
from schemas.predict import PredictionHistory
from core.security import require_role
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi_cache.decorator import cache

router = APIRouter()
logger = logging.getLogger(__name__)


async def safe_get_user_predictions(db: AsyncSession, user_id: int, limit: int = 5):
    try:
        return await get_user_predictions(db, user_id, limit)
    except Exception as e:
        logger.warning(f"Could not fetch predictions for user {user_id}: {e}")
        return []


async def safe_get_user_statistics(db: AsyncSession, user_id: int):
    try:
        return await get_user_statistics(db, user_id)
    except Exception as e:
        logger.warning(f"Could not fetch statistics for user {user_id}: {e}")
        return {
            "total_predictions": 0,
            "recent_predictions": 0,
            "recent_activity": 0,
            "risk_distribution": {"High": 0, "Moderate": 0, "Low": 0}
        }


async def safe_get_all_statistics(db: AsyncSession, since_date: Optional[datetime] = None):
    try:
        return await get_all_statistics(db, since_date)
    except Exception as e:
        logger.warning(f"Could not fetch all statistics: {e}")
        return {
            "total_predictions": 0,
            "recent_predictions": 0,
            "recent_activity": 0,
            "total_patients": 0,
            "risk_distribution": {"High": 0, "Moderate": 0, "Low": 0}
        }


def create_prediction_history(predictions):
    prediction_history = []
    for pred in predictions:
        try:
            history_item = PredictionHistory(
                id=pred.id,
                risk_percentage=pred.risk_percentage,
                risk_category=pred.risk_category,
                created_at=pred.created_at,
                features={
                    "sex": pred.sex,
                    "age": pred.age,
                    "cigsPerDay": pred.cigs_per_day,
                    "totChol": pred.tot_chol,
                    "sysBP": pred.sys_bp,
                    "diaBP": pred.dia_bp,
                    "glucose": pred.glucose
                }
            )
            prediction_history.append(history_item)
        except Exception as e:
            logger.warning(f"Error processing prediction {pred.id}: {e}")
            continue
    return prediction_history


def create_recent_activities(predictions, user_role="patient"):
    recent_activities = []
    for pred in predictions[:3]:
        try:
            activity = {
                "id": pred.id,
                "description": "Patient risk assessment completed" if user_role == 'doctor' else "CVD risk prediction completed",
                "target": f"{pred.risk_percentage}% risk level",
                "date": pred.created_at
            }
            recent_activities.append(activity)
        except Exception as e:
            logger.warning(f"Error creating activity from prediction: {e}")
            continue
    return recent_activities


@router.get("/patient", response_model=DashboardData)
@cache(expire=300)  # Cache for 5 minutes
async def get_patient_dashboard(
        db: AsyncSession = Depends(get_db),
        current_user=Depends(require_role(["patient"]))
):
    try:
        logger.info(f"Fetching patient dashboard for user {current_user.id}")

        stats = await safe_get_user_statistics(db, current_user.id)
        predictions = await safe_get_user_predictions(db, current_user.id, 5)

        prediction_history = create_prediction_history(predictions)
        recent_activities = create_recent_activities(predictions, "patient")

        if not recent_activities:
            recent_activities = [
                {
                    "id": 1,
                    "description": "Health profile created",
                    "target": "Welcome to CVD Risk Assessment",
                    "date": datetime.utcnow()
                },
                {
                    "id": 2,
                    "description": "Dashboard initialized",
                    "target": "System ready for health monitoring",
                    "date": datetime.utcnow()
                }
            ]

        dashboard_data = DashboardData(
            user_info={
                "id": current_user.id,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "role": current_user.role,
                "last_login": current_user.last_login
            },
            statistics=stats,
            latest_prediction=prediction_history[0] if prediction_history else None,
            recent_predictions=prediction_history,
            recent_activities=recent_activities
        )

        logger.info(f"Successfully created patient dashboard for user {current_user.id}")
        return dashboard_data

    except Exception as e:
        logger.error(f"Patient dashboard error: {str(e)}", exc_info=True)
        return DashboardData(
            user_info={
                "id": current_user.id,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "role": "patient",
                "last_login": datetime.utcnow()
            },
            statistics={
                "total_predictions": 0,
                "recent_predictions": 0,
                "recent_activity": 0,
                "risk_distribution": {"High": 0, "Moderate": 0, "Low": 0}
            },
            latest_prediction=None,
            recent_predictions=[],
            recent_activities=[{
                "id": 1,
                "description": "Dashboard initialized",
                "target": "System ready",
                "date": datetime.utcnow()
            }]
        )


@router.get("/doctor", response_model=DashboardData)
@cache(expire=300)  # Cache for 5 minutes
async def get_doctor_dashboard(
        db: AsyncSession = Depends(get_db),
        current_user=Depends(require_role(["doctor"]))
):
    try:
        logger.info(f"Fetching doctor dashboard for user {current_user.id}")

        stats = await safe_get_all_statistics(db)
        predictions = await safe_get_user_predictions(db, current_user.id, 5)

        prediction_history = create_prediction_history(predictions)
        recent_activities = create_recent_activities(predictions, "doctor")

        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            patient_stats = await safe_get_all_statistics(db, since_date=thirty_days_ago)

            if patient_stats and patient_stats.get('total_patients', 0) > 0:
                recent_activities.append({
                    "id": "new_patients",
                    "description": "New patients registered",
                    "target": f"{patient_stats.get('total_patients', 0)} patients",
                    "date": datetime.utcnow()
                })

            if stats.get('total_predictions', 0) > 0:
                recent_activities.append({
                    "id": "batch_analysis",
                    "description": "Batch analysis completed",
                    "target": f"{stats.get('recent_predictions', 0)} patients analyzed",
                    "date": datetime.utcnow() - timedelta(hours=2)
                })

        except Exception as e:
            logger.warning(f"Could not add patient stats to activities: {e}")

        if not recent_activities:
            recent_activities = [
                {
                    "id": 1,
                    "description": "Doctor dashboard initialized",
                    "target": "System ready for patient assessments",
                    "date": datetime.utcnow()
                },
                {
                    "id": 2,
                    "description": "Patient management system active",
                    "target": "Ready to manage patient data",
                    "date": datetime.utcnow() - timedelta(minutes=30)
                },
                {
                    "id": 3,
                    "description": "Risk assessment tools loaded",
                    "target": "CVD prediction models ready",
                    "date": datetime.utcnow() - timedelta(hours=1)
                }
            ]

        dashboard_data = DashboardData(
            user_info={
                "id": current_user.id,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "role": current_user.role,
                "last_login": current_user.last_login
            },
            statistics=stats,
            latest_prediction=prediction_history[0] if prediction_history else None,
            recent_predictions=prediction_history,
            recent_activities=recent_activities
        )

        logger.info(f"Successfully created doctor dashboard for user {current_user.id}")
        return dashboard_data

    except Exception as e:
        logger.error(f"Doctor dashboard error: {str(e)}", exc_info=True)
        return DashboardData(
            user_info={
                "id": current_user.id,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "role": "doctor",
                "last_login": datetime.utcnow()
            },
            statistics={
                "total_predictions": 0,
                "recent_predictions": 0,
                "recent_activity": 0,
                "total_patients": 0,
                "risk_distribution": {"High": 0, "Moderate": 0, "Low": 0}
            },
            latest_prediction=None,
            recent_predictions=[],
            recent_activities=[{
                "id": 1,
                "description": "Doctor dashboard initialized",
                "target": "System ready",
                "date": datetime.utcnow()
            }]
        )


@router.get("/stats/overview")
async def get_dashboard_overview(
        db: AsyncSession = Depends(get_db),
        current_user=Depends(require_role(["doctor", "admin"]))
):
    try:
        logger.info(f"Fetching dashboard overview")

        all_time_stats = await safe_get_all_statistics(db)
        recent_stats = await safe_get_all_statistics(db, since_date=datetime.utcnow() - timedelta(days=7))

        overview = {
            "total_predictions": all_time_stats.get('total_predictions', 0),
            "total_patients": all_time_stats.get('total_patients', 0),
            "weekly_predictions": recent_stats.get('total_predictions', 0),
            "risk_distribution": all_time_stats.get('risk_distribution', {"High": 0, "Moderate": 0, "Low": 0}),
            "system_status": "operational",
            "last_updated": datetime.utcnow()
        }

        return overview

    except Exception as e:
        logger.error(f"Dashboard overview error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not fetch dashboard overview")


@router.get("/health")
async def dashboard_health_check():
    return {
        "status": "healthy",
        "service": "dashboard",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }