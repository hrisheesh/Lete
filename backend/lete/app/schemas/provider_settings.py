from pydantic import BaseModel
from typing import Optional


class ProviderSettingsBase(BaseModel):
    provider_type: str
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    embedding_model_name: Optional[str] = None


class ProviderSettingsCreate(ProviderSettingsBase):
    pass


class ProviderSettingsResponse(ProviderSettingsBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
