"""FastAPI routes for runtime provider settings and secret-backed model configuration."""

from pydantic import BaseModel, Field
from fastapi import APIRouter

from configs.settings import settings


router = APIRouter()


class RuntimeSettingsUpdate(BaseModel):
    groq_api_key: str | None = Field(default=None)
    groq_base_url: str | None = Field(default=None)
    groq_default_model: str | None = Field(default=None)
    openai_api_key: str | None = Field(default=None)
    openai_base_url: str | None = Field(default=None)
    openai_default_model: str | None = Field(default=None)
    anthropic_api_key: str | None = Field(default=None)


class RuntimeSettingsRead(BaseModel):
    groq_configured: bool
    groq_base_url: str
    groq_default_model: str
    openai_configured: bool
    openai_base_url: str
    openai_default_model: str
    anthropic_configured: bool


@router.get("/", response_model=RuntimeSettingsRead)
async def read_runtime_settings() -> RuntimeSettingsRead:
    return runtime_settings_read()


@router.patch("/", response_model=RuntimeSettingsRead)
async def update_runtime_settings(payload: RuntimeSettingsUpdate) -> RuntimeSettingsRead:
    apply_runtime_settings(payload.model_dump(exclude_unset=True))
    return runtime_settings_read()


def runtime_settings_read() -> RuntimeSettingsRead:
    return RuntimeSettingsRead(
        groq_configured=bool(settings.groq_api_key),
        groq_base_url=settings.groq_base_url,
        groq_default_model=settings.groq_default_model,
        openai_configured=bool(settings.openai_api_key),
        openai_base_url=settings.openai_base_url,
        openai_default_model=settings.openai_default_model,
        anthropic_configured=bool(settings.anthropic_api_key),
    )


def apply_runtime_settings(values: dict) -> None:
    groq_api_key = values.get("groq_api_key")
    groq_base_url = values.get("groq_base_url")
    groq_default_model = values.get("groq_default_model")
    openai_api_key = values.get("openai_api_key")
    openai_base_url = values.get("openai_base_url")
    openai_default_model = values.get("openai_default_model")
    anthropic_api_key = values.get("anthropic_api_key")

    if isinstance(groq_api_key, str):
        settings.groq_api_key = groq_api_key.strip() or None
    if isinstance(groq_base_url, str):
        settings.groq_base_url = groq_base_url.strip().rstrip("/") or settings.groq_base_url
    if isinstance(groq_default_model, str):
        settings.groq_default_model = groq_default_model.strip() or settings.groq_default_model
    if isinstance(openai_api_key, str):
        settings.openai_api_key = openai_api_key.strip() or None
    if isinstance(openai_base_url, str):
        settings.openai_base_url = openai_base_url.strip().rstrip("/") or settings.openai_base_url
    if isinstance(openai_default_model, str):
        settings.openai_default_model = openai_default_model.strip() or settings.openai_default_model
    if isinstance(anthropic_api_key, str):
        settings.anthropic_api_key = anthropic_api_key.strip() or None
