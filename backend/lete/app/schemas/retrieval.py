from pydantic import BaseModel, Field
from typing import List, Optional

class SearchRequest(BaseModel):
    query: str
    limit: int = Field(default=5, ge=1, le=20)
    
class SearchResultChunk(BaseModel):
    chunk_id: str
    document_id: str
    section_id: str
    text: str
    contextual_header: Optional[str] = None
    chunk_index: int
    hybrid_score: float
    vector_score: Optional[float] = None
    keyword_score: Optional[float] = None
    
class SearchResponse(BaseModel):
    run_id: str
    results: List[SearchResultChunk]
