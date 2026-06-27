from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentSectionBase(BaseModel):
    document_id: str
    content: str
    page_number: Optional[int] = None
    section_index: int

class DocumentSectionCreate(DocumentSectionBase):
    pass

class DocumentSectionResponse(DocumentSectionBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True
