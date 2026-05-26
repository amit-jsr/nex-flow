from config import Settings


def test_xai_defaults_are_configured() -> None:
    settings = Settings()
    assert settings.xai_base_url == "https://api.x.ai/v1"
    assert settings.xai_default_model == "grok-4.3"
