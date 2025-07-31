from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from db.crud import create_prediction, get_user_predictions
from schemas.predict import PredictionInput, PredictionOutput, PredictionHistory
from core.model_utils import predict_cvd_risk
from core.security import get_current_user
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
from typing import List

router = APIRouter()
logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)


@router.post("/single", response_model=PredictionOutput)
@limiter.limit("10/minute")
async def predict_single(
        request: Request,
        prediction_input: PredictionInput,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    try:
        features = [
            prediction_input.sex,
            prediction_input.age,
            prediction_input.cigsPerDay,
            prediction_input.totChol,
            prediction_input.sysBP,
            prediction_input.diaBP,
            prediction_input.glucose
        ]

        result = predict_cvd_risk(features, {
            "user_id": current_user.id,
            "role": current_user.role
        })

        prediction_data = prediction_input.model_dump()
        prediction_data.update(result)
        db_prediction = await create_prediction(db, prediction_data, current_user.id)

        result["prediction_id"] = db_prediction.id
        result["created_at"] = db_prediction.created_at
        # Return form data along with prediction results
        result["form_data"] = prediction_input.model_dump()

        return PredictionOutput(**result)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.get("/history", response_model=List[PredictionHistory])
async def get_prediction_history(
        limit: int = 10,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    predictions = await get_user_predictions(db, current_user.id, limit)
    return [
        PredictionHistory(
            id=prediction.id,
            risk_percentage=prediction.risk_percentage,
            risk_category=prediction.risk_category,
            created_at=prediction.created_at,
            features={
                "sex": prediction.sex,
                "age": prediction.age,
                "cigsPerDay": prediction.cigs_per_day,
                "totChol": prediction.tot_chol,
                "sysBP": prediction.sys_bp,
                "diaBP": prediction.dia_bp,
                "glucose": prediction.glucose
            }
        )
        for prediction in predictions
    ]