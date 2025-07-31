from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from db.database import get_db
from db.crud import create_batch_prediction, get_user_batch_predictions
from db.models import BatchPrediction
from core.model_utils import batch_predict_cvd_risk
from core.security import require_role
from schemas.batch_predict import BatchUploadResponse, BatchResultsResponse, BatchPredictionResult
import pandas as pd
import io
import json
import logging
from typing import List

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/predict-csv", response_model=BatchUploadResponse)
async def batch_predict_csv(
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user=Depends(require_role(["doctor"]))
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, detail="Only CSV files accepted")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Validate CSV structure
        required_columns = ["sex", "age", "cigsPerDay", "totChol", "sysBP", "diaBP", "glucose"]
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            raise HTTPException(400, detail=f"Missing required columns: {', '.join(missing)}")

        # Add file size validation (10MB limit)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(400, detail="File size exceeds 10MB limit")

        # Add row count validation (reasonable limit)
        MAX_ROWS = 10000  # Adjust based on your system capacity
        if len(df) > MAX_ROWS:
            raise HTTPException(400, detail=f"File contains too many rows. Maximum allowed: {MAX_ROWS}")

        logger.info(f"Processing batch file: {file.filename} with {len(df)} records")

        results = batch_predict_cvd_risk(df)
        successful = len([r for r in results if "error" not in r])
        failed = len([r for r in results if "error" in r])

        logger.info(f"Batch processing complete: {successful} successful, {failed} failed")

        batch_data = {
            "filename": file.filename,
            "total_records": len(df),
            "successful_predictions": successful,
            "failed_predictions": failed,
            "results": results
        }

        db_batch = await create_batch_prediction(db, batch_data, current_user.id)

        # FIXED: Return all results instead of just first 10
        return BatchUploadResponse(
            batch_id=db_batch.id,
            filename=file.filename,
            total_records=len(df),
            successful_predictions=successful,
            failed_predictions=failed,
            results=results  # Return ALL results, not just [:10]
        )

    except pd.errors.EmptyDataError:
        raise HTTPException(400, detail="CSV file is empty")
    except pd.errors.ParserError as e:
        raise HTTPException(400, detail=f"CSV parsing error: {str(e)}")
    except UnicodeDecodeError:
        raise HTTPException(400, detail="File encoding error. Please ensure file is UTF-8 encoded")
    except Exception as e:
        logger.error(f"Batch processing error: {e}")
        raise HTTPException(500, detail=f"Internal server error: {str(e)}")


@router.get("/history", response_model=List[BatchPredictionResult])
async def get_batch_history(
        db: AsyncSession = Depends(get_db),
        current_user=Depends(require_role(["doctor"]))
):
    batch_predictions = await get_user_batch_predictions(db, current_user.id)
    return [
        BatchPredictionResult(
            id=bp.id,
            filename=bp.filename,
            total_records=bp.total_records,
            successful_predictions=bp.successful_predictions,
            failed_predictions=bp.failed_predictions,
            created_at=bp.created_at
        )
        for bp in batch_predictions
    ]


@router.get("/download/{batch_id}", response_model=BatchResultsResponse)
async def download_batch_results(
        batch_id: int,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(require_role(["doctor"]))
):
    result = await db.execute(
        select(BatchPrediction).where(
            and_(
                BatchPrediction.id == batch_id,
                BatchPrediction.user_id == current_user.id
            )
        )
    )
    batch_prediction = result.scalar_one_or_none()

    if not batch_prediction:
        raise HTTPException(404, detail="Batch prediction not found")

    return BatchResultsResponse(
        batch_id=batch_id,
        filename=batch_prediction.filename,
        results=json.loads(batch_prediction.results)
    )