from fastapi.testclient import TestClient
from lete.app.main import app
from lete.app.config.settings import settings

client = TestClient(app)
PREFIX = f"{settings.api_v1_str}/workspaces"


def test_create_workspace():
    response = client.post(PREFIX, json={"name": "Test API Workspace"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test API Workspace"
    assert "id" in data


def test_list_workspaces():
    client.post(PREFIX, json={"name": "Workspace 1"})
    response = client.get(PREFIX)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_workspace():
    create_resp = client.post(PREFIX, json={"name": "Fetch Me"})
    workspace_id = create_resp.json()["id"]

    response = client.get(f"{PREFIX}/{workspace_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Fetch Me"


def test_get_workspace_not_found():
    response = client.get(f"{PREFIX}/invalid-id")
    assert response.status_code == 404


def test_delete_workspace():
    create_resp = client.post(PREFIX, json={"name": "Delete Me"})
    workspace_id = create_resp.json()["id"]

    del_resp = client.delete(f"{PREFIX}/{workspace_id}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"{PREFIX}/{workspace_id}")
    assert get_resp.status_code == 404
