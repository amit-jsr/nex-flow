from configs.settings import Settings


def test_xai_defaults_are_configured() -> None:
    settings = Settings()
    assert settings.xai_base_url == "https://api.x.ai/v1"
    assert settings.xai_default_model == "grok-4.3"


def test_telegram_settings_default_to_optional() -> None:
    settings = Settings()
    assert settings.public_url is None
    assert settings.telegram_bot_token is None
    assert settings.telegram_default_agent_id is None
    assert settings.telegram_default_workflow_id is None
