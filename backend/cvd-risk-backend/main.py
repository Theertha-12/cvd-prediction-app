from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
import sys
import traceback
from typing import Dict, Any, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from core.config import settings
from core.model_utils import load_models, models
from db.database import create_tables

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Global chatbot instance
chatbot: Optional[Any] = None

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global chatbot
    startup_status = {
        "database": False,
        "models": False,
        "chatbot": False
    }

    try:
        logger.info("Creating database tables...")
        await create_tables()
        startup_status["database"] = True
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}", exc_info=True)

    try:
        logger.info("Loading ML models...")
        load_models()
        startup_status["models"] = True
        if "classifier" in models and "scaler" in models:
            logger.info("✅ ML models loaded successfully")
        else:
            logger.warning("⚠️ Using dummy models - production models not found")
    except Exception as e:
        logger.error(f"❌ Model loading failed: {str(e)}", exc_info=True)

    try:
        logger.info("Initializing chatbot service...")
        from utils.chatbot import ChatbotService
        chatbot = ChatbotService()
        startup_status["chatbot"] = True
        logger.info("✅ Chatbot service initialized successfully")
    except Exception as e:
        logger.error(f"❌ Chatbot initialization failed: {str(e)}", exc_info=True)

    logger.info(f"Application startup complete. Status: {startup_status}")
    yield
    logger.info("Application shutdown")


# Create FastAPI app
app = FastAPI(
    title="CVD Risk Prediction API",
    description="Production-ready cardiovascular disease risk prediction system",
    version="1.0.0",
    lifespan=lifespan,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SlowAPI rate limiting
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )


def include_routers():
    routers_config = [
        ("api.auth", "/auth", ["Authentication"]),
        ("api.predict", "/predict", ["Prediction"]),
        ("api.batch_predict", "/batch", ["Batch Prediction"]),
        ("api.chat", "/chat", ["AI Chat"]),
        ("api.profile", "/profile", ["User Profile"]),
        ("api.dashboard", "/dashboard", ["Dashboard"]),
    ]
    for module_name, prefix, tags in routers_config:
        try:
            module = __import__(module_name, fromlist=["router"])
            app.include_router(module.router, prefix=prefix, tags=tags)
            logger.info(f"✅ {module_name} router included")
        except ImportError as e:
            logger.error(f"❌ Failed to import {module_name}: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Failed to include {module_name} router: {str(e)}")


# Add routers
include_routers()


@app.get("/", response_model=Dict[str, str])
@limiter.limit("10/minute")
async def root(request: Request):
    return {
        "message": "CVD Risk Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health_check": "/health",
        "status": "operational"
    }


@app.get("/health", response_model=Dict[str, Any])
async def health_check():
    from datetime import datetime
    from utils.llm_integration import LLMService
    from db.database import engine

    health_status = {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "database": False,
            "ml_models": False,
            "llm_service": False,
            "chatbot": False
        },
        "details": {}
    }

    # Database check
    try:
        async with engine.connect():
            health_status["components"]["database"] = True
            health_status["details"]["database"] = "Connection successful"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["details"]["database_error"] = str(e)
        logger.error(f"Database health check failed: {str(e)}")

    # ML Models check
    try:
        if "classifier" in models and "scaler" in models:
            health_status["components"]["ml_models"] = True
            health_status["details"]["ml_models"] = {
                "classifier": type(models["classifier"]).__name__,
                "scaler": type(models["scaler"]).__name__
            }
        else:
            health_status["status"] = "degraded"
            health_status["details"]["ml_models"] = "Models not loaded"
    except Exception as e:
        health_status["status"] = "error"
        health_status["details"]["ml_models_error"] = str(e)

    # LLM Service check
    try:
        llm = LLMService()
        if hasattr(llm, 'client') and llm.client:
            if hasattr(llm, 'validate_api_key'):
                valid = llm.validate_api_key()
                health_status["components"]["llm_service"] = valid
                health_status["details"]["llm_service"] = (
                    "API key validated" if valid else "Invalid API key"
                )
            else:
                health_status["components"]["llm_service"] = True
                health_status["details"]["llm_service"] = "Client initialized"
        else:
            health_status["status"] = "degraded"
            health_status["details"]["llm_service"] = "Client not initialized"
    except Exception as e:
        health_status["status"] = "error"
        health_status["details"]["llm_service_error"] = str(e)

    # Chatbot check
    try:
        health_status["components"]["chatbot"] = chatbot is not None
        health_status["details"]["chatbot"] = "Initialized" if chatbot else "Not initialized"
        if chatbot and hasattr(chatbot, 'menu_answers'):
            health_status["details"]["chatbot_menu_answers"] = len(chatbot.menu_answers)
    except Exception as e:
        health_status["status"] = "error"
        health_status["details"]["chatbot_error"] = str(e)

    # Final status evaluation
    critical = ["database", "ml_models"]
    if not all(health_status["components"][c] for c in critical):
        health_status["status"] = "degraded"
    if not any(health_status["components"][c] for c in critical):
        health_status["status"] = "error"

    return health_status


@app.get("/api/status")
async def api_status():
    return {
        "api_status": "online",
        "message": "API is functioning normally"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
