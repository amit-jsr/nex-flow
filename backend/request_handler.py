from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import datastore.model  # noqa: F401
from api.api_router import api_router
from configs.settings import settings
from datastore.database import create_tables, get_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    await create_tables()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    @app.get("/health")
    async def health(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
        await db.execute(text("SELECT 1"))
        return {"status": "ok"}

    return app


app = create_app()
