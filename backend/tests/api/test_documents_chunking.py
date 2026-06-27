from fastapi.testclient import TestClient
from lete.app.main import app
import uuid

client = TestClient(app)

def test_chunking_endpoints(clear_db):
    # 1. Create a workspace
    ws_id = str(uuid.uuid4())
    client.post("/api/v1/workspaces", json={"id": ws_id, "name": "Test Workspace"})
    
    # 2. Upload a test txt document
    files = {"file": ("test.txt", b"This is a test paragraph.\n\nHere is another one.", "text/plain")}
    res_upload = client.post(f"/api/v1/workspaces/{ws_id}/documents/upload", files=files)
    assert res_upload.status_code == 200
    doc_id = res_upload.json()["id"]
    
    # 3. Process it to generate sections
    res_process = client.post(f"/api/v1/documents/{doc_id}/process")
    assert res_process.status_code == 200
    
    # 4. Chunk the document
    res_chunk = client.post(f"/api/v1/documents/{doc_id}/chunk")
    assert res_chunk.status_code == 200
    assert res_chunk.json()["status"] == "success"
    
    # 5. Fetch chunks
    res_get_chunks = client.get(f"/api/v1/documents/{doc_id}/chunks")
    assert res_get_chunks.status_code == 200
    chunks = res_get_chunks.json()
    
    assert len(chunks) > 0
    assert chunks[0]["document_id"] == doc_id
    assert "contextual_header" in chunks[0]
    assert "[Document: test.txt" in chunks[0]["contextual_header"]
