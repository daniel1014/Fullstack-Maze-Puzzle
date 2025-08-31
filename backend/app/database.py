from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import SQLModel
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Create async engine with optimized settings
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,  # 30 minutes
    pool_timeout=30,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine, 
    expire_on_commit=False,
    autoflush=False
)


async def init_db() -> None:
    """Initialize database tables. Only use in development/testing."""
    if settings.ENVIRONMENT != "production":
        try:
            async with engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.create_all)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
            raise


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()