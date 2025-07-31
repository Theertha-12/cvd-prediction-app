from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from core.config import settings
import logging

logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False
)

Base = declarative_base()


async def get_db():
    async with async_session() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")

            if settings.CREATE_DEMO_USERS:
                await create_demo_users()
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise


async def create_demo_users():
    from db.models import User
    from core.security import get_password_hash

    async with async_session() as session:
        try:
            from sqlalchemy import select
            result = await session.execute(select(User).where(User.email == "patient@demo.com"))
            if result.scalar_one_or_none():
                return

            patient = User(
                email="patient@demo.com",
                hashed_password=get_password_hash("patient123"),
                full_name="Demo Patient",
                role="patient"
            )

            doctor = User(
                email="doctor@demo.com",
                hashed_password=get_password_hash("doctor123"),
                full_name="Dr. Demo Doctor",
                role="doctor"
            )

            session.add(patient)
            session.add(doctor)
            await session.commit()
            logger.info("Demo users created successfully")
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating demo users: {e}")