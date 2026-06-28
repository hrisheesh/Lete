from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class QueryRequest(BaseModel):
    query: str = Field(..., description="The user's question to ask against the workspace documents.")

class Citation(BaseModel):
    id: str
    chunk_id: str
    text: str
    document_id: str
    document_name: str

class QueryResponse(BaseModel):
    query_id: str
    answer: str
    citations: List[Citation]
    retrieval_run_id: str
