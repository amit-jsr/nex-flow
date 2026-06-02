"""Tests for application settings and environment defaults."""

import pytest

from api.settings import RuntimeSettingsUpdate, update_runtime_settings
from configs.settings import Settings
from configs.settings import settings


def test_groq_defaults_are_configured() -> None:
    settings = Settings()
    assert settings.groq_base_url == "https://api.groq.com/openai/v1"
    assert settings.groq_default_model == "openai/gpt-oss-20b"


def test_telegram_settings_default_to_optional() -> None:
    settings = Settings()
    assert settings.public_url is None
    assert settings.telegram_bot_token is None
    assert settings.telegram_default_agent_id is None
    assert settings.telegram_default_workflow_id is None


@pytest.mark.asyncio
async def test_runtime_settings_update_configures_groq_key() -> None:
    original_key = settings.groq_api_key
    original_base_url = settings.groq_base_url
    try:
        result = await update_runtime_settings(
            RuntimeSettingsUpdate(
                groq_api_key="gsk-test",
                groq_base_url="https://api.groq.com/openai/v1/",
                groq_default_model="openai/gpt-oss-20b",
            )
        )

        assert result.groq_configured is True
        assert settings.groq_api_key == "gsk-test"
        assert settings.groq_base_url == "https://api.groq.com/openai/v1"
    finally:
        settings.groq_api_key = original_key
        settings.groq_base_url = original_base_url
