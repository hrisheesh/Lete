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

@router.get("/workspaces/{workspace_id}/history")
def get_workspace_history(
    workspace_id: str,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    cursor = conn.cursor()
    
    # 1. Get queries and their answers
    cursor.execute("""
        SELECT q.id, q.query_text, a.answer_text, a.retrieval_run_id, q.created_at
        FROM queries q
        LEFT JOIN answer_runs a ON q.id = a.query_id
        WHERE q.workspace_id = ?
        ORDER BY q.created_at ASC
    """, (workspace_id,))
    
    history = []
    rows = cursor.fetchall()
    
    for row in rows:
        query_id, query_text, answer_text, run_id, created_at = row
        
        citations = []
        if run_id:
            cursor.execute("""
                SELECT rr.chunk_id, c.document_id, d.filename, c.contextual_header, c.text
                FROM retrieval_results rr
                JOIN chunks c ON rr.chunk_id = c.id
                JOIN documents d ON c.document_id = d.id
                WHERE rr.run_id = ?
                ORDER BY rr.rank ASC
            """, (run_id,))
            for cr in cursor.fetchall():
                citations.append({
                    "id": cr[0],
                    "chunk_id": cr[0],
                    "document_id": cr[1],
                    "filename": cr[2],
                    "contextual_header": cr[3],
                    "text_preview": cr[4][:200] + "..." if len(cr[4]) > 200 else cr[4]
                })
                
        history.append({
            "id": query_id,
            "query": query_text,
            "answer": answer_text,
            "citations": citations,
            "created_at": created_at
        })
        
    return history
