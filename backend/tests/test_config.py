from lete.app.config.settings import settings


def test_settings_loaded():
    assert settings.project_name == "Lete API"
    assert settings.api_v1_str == "/api/v1"
