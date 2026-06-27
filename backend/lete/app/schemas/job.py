from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProcessingJobBase(BaseModel):
    document_id: str
    status: str
    error_message: Optional[str] = None

class ProcessingJobCreate(ProcessingJobBase):
    pass

class ProcessingJobUpdate(BaseModel):
    status: Optional[str] = None
    error_message: Optional[str] = None

class ProcessingJobResponse(ProcessingJobBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
