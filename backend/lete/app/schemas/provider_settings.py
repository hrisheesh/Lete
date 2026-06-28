from pydantic import BaseModel
from typing import Optional


class ProviderSettingsBase(BaseModel):
    chat_provider: str
    chat_base_url: Optional[str] = None
    chat_api_key: Optional[str] = None
    chat_model: Optional[str] = None
    
    embedding_provider: Optional[str] = None
    embedding_base_url: Optional[str] = None
    embedding_api_key: Optional[str] = None
    embedding_model: Optional[str] = None


class ProviderSettingsCreate(ProviderSettingsBase):
    pass


class ProviderSettingsResponse(ProviderSettingsBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
