"""Pydantic settings model and environment-backed configuration defaults."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "NxFlow API"
    database_url: str = "postgresql+asyncpg://nxflow:nxflow@localhost:5432/nxflow"
    database_echo: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]
    openai_api_key: str | None = None
    openai_base_url: str = "https://api.openai.com/v1"
    openai_default_model: str = "gpt-4o-mini"
    anthropic_api_key: str | None = None
    groq_api_key: str | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_default_model: str = "openai/gpt-oss-20b"
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
