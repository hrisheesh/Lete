import io
import os
import pytest
from fastapi.testclient import TestClient

from lete.app.main import app

client = TestClient(app)

@pytest.fixture
def test_workspace():
    # Create a workspace to test document uploads against
    response = client.post("/api/v1/workspaces", json={"name": "Doc Test Workspace"})
    assert response.status_code == 201
    return response.json()

def test_document_upload(test_workspace):
    workspace_id = test_workspace["id"]
    file_content = b"Hello, this is a test document."
    
    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/documents/upload",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["file_type"] == "text/plain"
    assert data["workspace_id"] == workspace_id
    assert "id" in data
    assert "file_hash" in data

def test_document_duplicate_upload(test_workspace):
    workspace_id = test_workspace["id"]
    file_content = b"Duplicate content."
    
    # First upload
    response1 = client.post(
        f"/api/v1/workspaces/{workspace_id}/documents/upload",
        files={"file": ("dup.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response1.status_code == 200
    
    # Second upload of the same content
    response2 = client.post(
        f"/api/v1/workspaces/{workspace_id}/documents/upload",
        files={"file": ("dup2.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response2.status_code == 409
    assert "Duplicate file" in response2.json()["detail"]

def test_list_and_delete_documents(test_workspace):
    workspace_id = test_workspace["id"]
    
    # Upload two distinct files
    client.post(
        f"/api/v1/workspaces/{workspace_id}/documents/upload",
        files={"file": ("file1.txt", io.BytesIO(b"content 1"), "text/plain")}
    )
    resp = client.post(
        f"/api/v1/workspaces/{workspace_id}/documents/upload",
        files={"file": ("file2.txt", io.BytesIO(b"content 2"), "text/plain")}
    )
    doc2_id = resp.json()["id"]
    
    # List documents
    list_resp = client.get(f"/api/v1/workspaces/{workspace_id}/documents")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 2
    
    # Delete doc2
    del_resp = client.delete(f"/api/v1/documents/{doc2_id}")
    assert del_resp.status_code == 204
    
    # Verify deletion
    list_resp_after = client.get(f"/api/v1/workspaces/{workspace_id}/documents")
    ids = [d["id"] for d in list_resp_after.json()]
    assert doc2_id not in ids
