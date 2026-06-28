from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class QueryRequest(BaseModel):
    query: str = Field(..., description="The user's question to ask against the workspace documents.")

class Citation(BaseModel):
    id: str                  # e.g. "[1]"
    chunk_id: str
    document_id: str
    filename: str            # Original document filename
    contextual_header: str   # Chunk's contextual header
    text_preview: str        # First 200 chars of chunk text for tooltip

class QueryResponse(BaseModel):
    query_id: str
    answer: str
    citations: List[Citation]
    retrieval_run_id: str
