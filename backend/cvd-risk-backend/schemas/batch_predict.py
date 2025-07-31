from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

class BatchPredictionResult(BaseModel):
    id: int
    filename: str
    total_records: int
    successful_predictions: int
    failed_predictions: int
    created_at: datetime

class BatchUploadResponse(BaseModel):
    batch_id: int
    filename: str
    total_records: int
    successful_predictions: int
    failed_predictions: int
    results: List[Dict[str, Any]]

class BatchResultsResponse(BaseModel):
    batch_id: int
    filename: str
    results: List[Dict[str, Any]]