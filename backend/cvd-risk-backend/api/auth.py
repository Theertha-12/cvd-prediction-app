from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
import logging

from db.database import get_db
from db.models import User as UserModel
from db.crud import get_user_by_email
from schemas.user import UserCreate, UserLogin, UserPublic, Token
from core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_user = await get_user_by_email(db, email=str(user.email))
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        hashed_password = get_password_hash(user.password)
        new_user = UserModel(
            email=str(user.email),
            hashed_password=hashed_password,
            full_name=user.full_name,
            role=user.role
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return UserPublic(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role,
            is_active=new_user.is_active,
            created_at=new_user.created_at,
            last_login=new_user.last_login
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Registration error: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    try:
        user = await get_user_by_email(db, email=str(credentials.email))
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.email), "role": user.role},
            expires_delta=access_token_expires
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
            user_role=user.role
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.get("/me", response_model=UserPublic)
async def get_logged_in_user(current_user: UserModel = Depends(get_current_user)):
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )
