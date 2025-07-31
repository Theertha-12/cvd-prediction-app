from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from uuid import uuid4
import logging
import sys

from db.database import get_db
from db.models import ChatSession
from db.crud import (
    get_or_create_chat_session,
    create_chat_message,
    get_chat_history,
    get_user_chat_sessions,
    get_latest_prediction
)
from schemas.chat import ChatMessage, ChatResponse, ChatHistory, ChatSessionInfo
from core.security import get_current_user
from utils.chatbot import ChatbotService
from slowapi import Limiter
from slowapi.util import get_remote_address

# Logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
logger.addHandler(handler)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Global chatbot instance (shared from lifespan in main.py)
chatbot: Optional[ChatbotService] = None

@router.post("/message", response_model=ChatResponse)
@limiter.limit("5/minute")
async def send_message(
        request: Request,  # Required by limiter decorator
        chat_message: ChatMessage,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    global chatbot

    if chatbot is None:
        logger.warning("Chatbot not initialized -- initializing now")
        try:
            chatbot = ChatbotService()
            logger.info("✅ Chatbot initialized during request")
        except Exception as e:
            logger.error(f"Emergency chatbot init failed: {str(e)}", exc_info=True)
            return ChatResponse(
                response="Our health assistant is currently unavailable. Please try again later.",
                source="system_error",
                session_id=chat_message.session_id,
                personalized=False
            )

    try:
        # Validate message
        if not chat_message.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )
        if len(chat_message.message) > 500:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message exceeds 500 character limit"
            )

        # Get or create chat session
        session = await get_or_create_chat_session(
            db,
            chat_message.session_id,
            current_user.id
        )
        logger.info(f"Using chat session: {session.session_id}")

        # Get chatbot response with prediction context
        response = await chatbot.get_personalized_response(
            message=chat_message.message,
            role=current_user.role,
            prediction_context=chat_message.prediction_context
        )
        logger.info(f"Chatbot response generated: {response['source']}")

        # Save to database
        await create_chat_message(
            db,
            session_id=chat_message.session_id,
            message=chat_message.message,
            response=response["response"],
            source=response["source"]
        )
        logger.info("Message saved")

        return ChatResponse(
            response=response["response"],
            source=response["source"],
            session_id=chat_message.session_id,
            personalized=response.get("personalized", False)
        )

    except HTTPException as e:
        logger.warning(f"Client error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Chat processing failed: {str(e)}", exc_info=True)
        return ChatResponse(
            response="I'm having trouble responding right now. Please try again later.",
            source="system_error",
            session_id=chat_message.session_id,
            personalized=False
        )

@router.get("/history/{session_id}", response_model=ChatHistory)
async def get_session_history(
        session_id: str,
        limit: int = 50,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    try:
        # Check session ownership
        result = await db.execute(
            select(ChatSession).where(
                and_(
                    ChatSession.session_id == session_id,
                    ChatSession.user_id == current_user.id
                )
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        messages = await get_chat_history(db, session_id, limit)
        logger.info(f"Retrieved {len(messages)} messages for session: {session_id}")

        return ChatHistory(
            session_id=session_id,
            messages=[
                {
                    "id": msg.id,
                    "message": msg.message,
                    "response": msg.response,
                    "source": msg.source,
                    "created_at": msg.created_at,
                    "is_user": True if msg.source == "user" else False
                }
                for msg in messages
            ]
        )
    except Exception as e:
        logger.error(f"History retrieval failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat history"
        )

@router.get("/sessions", response_model=List[ChatSessionInfo])
async def get_user_sessions(
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    try:
        sessions = await get_user_chat_sessions(db, current_user.id)
        logger.info(f"Found {len(sessions)} sessions for user: {current_user.id}")
        return [
            ChatSessionInfo(
                session_id=s.session_id,
                session_name=s.session_name,
                created_at=s.created_at,
                updated_at=s.updated_at
            ) for s in sessions
        ]
    except Exception as e:
        logger.error(f"Session fetch failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat sessions"
        )

@router.post("/new-session", response_model=ChatSessionInfo)
async def create_new_session(
        session_name: Optional[str] = "New Chat",
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    try:
        session_id = str(uuid4())
        session = await get_or_create_chat_session(
            db,
            session_id=session_id,
            user_id=current_user.id,
            session_name=session_name
        )
        logger.info(f"New session created: {session.session_id}")
        return ChatSessionInfo(
            session_id=session.session_id,
            session_name=session.session_name,
            created_at=session.created_at,
            updated_at=session.updated_at
        )
    except Exception as e:
        logger.error(f"Session creation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create new session"
        )

@router.put("/session/{session_id}/rename")
async def rename_session(
        session_id: str,
        new_name: str,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(ChatSession).where(
                and_(
                    ChatSession.session_id == session_id,
                    ChatSession.user_id == current_user.id
                )
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            logger.warning(f"Unauthorized rename attempt: {session_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        old_name = session.session_name
        session.session_name = new_name
        db.add(session)
        await db.commit()
        await db.refresh(session)
        logger.info(f"Renamed session {session_id}: {old_name} → {new_name}")
        return {"message": "Session renamed successfully"}
    except Exception as e:
        logger.error(f"Rename failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rename session"
        )