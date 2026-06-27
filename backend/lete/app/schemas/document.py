from pydantic import BaseModel
from typing import Optional


class DocumentBase(BaseModel):
    workspace_id: str
    filename: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: str
    status: str = "pending"


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True
