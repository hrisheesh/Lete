import sqlite3
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException

from lete.app.api.deps import get_db_connection
from lete.app.schemas.retrieval import SearchRequest, SearchResponse, SearchResultChunk
from lete.app.retrieval.hybrid import HybridRetriever
from lete.app.api.settings import get_settings
from lete.app.providers.embeddings import OpenAIEmbeddingProvider

router = APIRouter()

@router.post("/workspaces/{workspace_id}/search", response_model=SearchResponse)
def search_workspace(
    workspace_id: str,
    request: SearchRequest,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    try:
        uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workspace ID format")

    # 1. Instantiate the embedding provider
    prov_settings = get_settings(conn)
    query_embedding = None
    
    # We only generate an embedding if an API key or base URL is present (indicating setup)
    if prov_settings and (prov_settings.api_key or prov_settings.base_url):
        try:
            embed_provider = OpenAIEmbeddingProvider(
                api_key=prov_settings.api_key or "",
                model_name=prov_settings.embedding_model_name or "text-embedding-3-small",
                base_url=prov_settings.base_url
            )
            # Embed the query
            embeddings = embed_provider.embed([request.query])
            if embeddings:
                query_embedding = embeddings[0]
        except Exception as e:
            # If embedding fails, we fallback to pure keyword search
            print(f"Embedding failed, falling back to keyword-only search: {e}")
            query_embedding = None
            
    # 2. Execute Hybrid Search
    retriever = HybridRetriever(conn)
    results = retriever.search(
        query=request.query,
        workspace_id=workspace_id,
        query_embedding=query_embedding,
        limit=request.limit
    )
    
    # 3. Store the Trace
    run_id = str(uuid.uuid4())
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO retrieval_runs (id, workspace_id, query)
        VALUES (?, ?, ?)
        """,
        (run_id, workspace_id, request.query)
    )
    
    formatted_results = []
    for i, res in enumerate(results):
        rank = i + 1
        chunk_id = res["chunk_id"]
        hybrid_score = res["hybrid_score"]
        vector_score = res["vector_score"]
        keyword_score = res["keyword_score"]
        
        cursor.execute(
            """
            INSERT INTO retrieval_results (id, run_id, chunk_id, rank, hybrid_score, vector_score, keyword_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (str(uuid.uuid4()), run_id, chunk_id, rank, hybrid_score, vector_score, keyword_score)
        )
        
        formatted_results.append(SearchResultChunk(
            chunk_id=chunk_id,
            document_id=res["document_id"],
            section_id=res["section_id"],
            text=res["text"],
            contextual_header=res["contextual_header"],
            chunk_index=res["chunk_index"],
            hybrid_score=hybrid_score,
            vector_score=vector_score,
            keyword_score=keyword_score
        ))
        
    conn.commit()
    
    return SearchResponse(
        run_id=run_id,
        results=formatted_results
    )
