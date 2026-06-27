from pydantic import BaseModel
from datetime import datetime


class WorkspaceBase(BaseModel):
    name: str


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(WorkspaceBase):
    pass


class WorkspaceResponse(WorkspaceBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
