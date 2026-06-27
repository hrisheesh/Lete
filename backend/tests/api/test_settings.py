from fastapi.testclient import TestClient
from lete.app.main import app

client = TestClient(app)

def test_test_provider_validation():
    # Test missing API key for Anthropic
    response = client.post("/api/v1/settings/test-provider", json={
        "provider_type": "anthropic",
        "api_key": ""
    })
    assert response.status_code == 400
    assert "API Key required" in response.json()["detail"]

def test_crud_provider_settings():
    # Test setting provider settings
    payload = {
        "provider_type": "openai",
        "api_key": "sk-dummy",
        "model_name": "gpt-4o",
        "embedding_model_name": "text-embedding-3-small"
    }
    
    response = client.put("/api/v1/settings/provider", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["provider_type"] == "openai"
    assert data["api_key"] == "sk-dummy"
    
    # Test getting provider settings
    response = client.get("/api/v1/settings")
    assert response.status_code == 200
    assert response.json()["api_key"] == "sk-dummy"

def test_get_settings_not_found():
    # Assuming tests run with a fresh DB, if no settings it should return 404
    # Wait, the clear_db fixture runs before each test. But test_crud_provider_settings populated it.
    # We rely on clear_db to clear the DB, so it should be empty again.
    response = client.get("/api/v1/settings")
    assert response.status_code == 404
