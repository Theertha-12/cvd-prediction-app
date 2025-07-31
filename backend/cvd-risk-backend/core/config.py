from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str  # Will be loaded from .env
    SECRET_KEY: str    # Will be loaded from .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GROQ_API_KEY: str  # Correct spelling - will be loaded from .env
    ALLOWED_ORIGINS: List[str] = ["*"]
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    CREATE_DEMO_USERS: bool = True

    class Config:
        env_file = ".env"  # Specifies where to load the values

# This is correct - creates the settings instance
settings = Settings()