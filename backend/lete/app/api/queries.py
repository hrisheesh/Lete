import sqlite3
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from lete.app.api.deps import get_db_connection
from lete.app.schemas.query import QueryRequest
from lete.app.generation.generator import GenerationService
from lete.app.providers.embeddings import get_embedding

router = APIRouter()

@router.post("/workspaces/{workspace_id}/query")
def query_workspace(
    workspace_id: str,
    request: QueryRequest,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    # 1. Get the embedding for the query
    try:
        # Pass empty string as we don't need text hashing here
        query_embedding = get_embedding(conn, request.query)
    except Exception as e:
        print(f"Failed to get query embedding, falling back to keyword-only: {e}")
        query_embedding = None
        
    # 2. Setup GenerationService
    service = GenerationService(conn)
    result = service.generate_answer(workspace_id, request.query, query_embedding)
    
    # 3. Stream the response using Server-Sent Events (SSE)
    def sse_generator():
        # First send the metadata
        metadata = {
            "query_id": result["query_id"],
            "retrieval_run_id": result["retrieval_run_id"],
            "citations": result["citations"]
        }
        yield f"event: metadata\ndata: {json.dumps(metadata)}\n\n"
        
        # Then stream the text chunks
        for chunk in result["stream"]:
            # Need to properly escape JSON strings
            yield f"event: content\ndata: {json.dumps({'text': chunk})}\n\n"
            
        yield "event: done\ndata: {}\n\n"
        
    return StreamingResponse(sse_generator(), media_type="text/event-stream")
