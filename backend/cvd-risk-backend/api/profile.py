from fastapi import APIRouter, Depends  # Removed unused HTTPException import
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from core.security import get_current_user
from schemas.user import UserPublic
from db.crud import update_last_login
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/me", response_model=UserPublic)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    await update_last_login(db, current_user.id)
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )