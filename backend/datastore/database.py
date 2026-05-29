from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.engine import AsyncEngine

from configs.settings import settings
from datastore.model import Base


engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global engine
    if engine is None:
        engine = create_async_engine(
            settings.database_url,
            echo=settings.database_echo,
            pool_pre_ping=True,
        )
    return engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = async_sessionmaker(get_engine(), expire_on_commit=False)
    return SessionLocal


async def get_db() -> AsyncIterator[AsyncSession]:
    async with get_session_factory()() as session:
        yield session


async def create_tables() -> None:
    async with get_engine().begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
