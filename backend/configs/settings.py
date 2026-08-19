"""Pydantic settings model and environment-backed configuration defaults."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "NexFlow API"
    database_url: str = "postgresql+asyncpg://nexflow:nexflow@localhost:5432/nexflow"
    database_echo: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    xai_api_key: str | None = None
    xai_base_url: str = "https://api.x.ai/v1"
    xai_default_model: str = "grok-4.3"
    aws_bedrock_region: str = "us-east-1"
    public_url: str | None = None
    telegram_bot_token: str | None = None
    telegram_default_agent_id: str | None = None
    telegram_default_workflow_id: str | None = None

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
