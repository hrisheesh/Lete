from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChunkBase(BaseModel):
    document_id: str
    section_id: str
    text: str
    contextual_header: Optional[str] = None
    chunk_index: int
    token_count: Optional[int] = None

class ChunkCreate(ChunkBase):
    pass

class ChunkResponse(ChunkBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
