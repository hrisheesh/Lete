import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException

from lete.app.api.deps import get_db_connection
from lete.app.schemas.provider_settings import ProviderSettingsCreate, ProviderSettingsResponse
from lete.app.repositories.provider_settings import ProviderSettingsRepository
from lete.app.providers.openai_provider import OpenAIProvider
from lete.app.providers.anthropic_provider import AnthropicProvider

router = APIRouter()

@router.get("", response_model=ProviderSettingsResponse)
def get_settings(conn: sqlite3.Connection = Depends(get_db_connection)):
    cursor = conn.cursor()
    # For now, we assume a single active global provider setting. We just grab the first.
    cursor.execute("SELECT id FROM provider_settings ORDER BY created_at DESC LIMIT 1")
    row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Settings not found")
        
    repo = ProviderSettingsRepository(conn)
    return repo.get(row["id"])

@router.put("/provider", response_model=ProviderSettingsResponse)
def update_provider_settings(
    settings_in: ProviderSettingsCreate,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    repo = ProviderSettingsRepository(conn)
    # Clear out existing to maintain a single global setting for simplicity
    cursor = conn.cursor()
    cursor.execute("DELETE FROM provider_settings")
    conn.commit()
    
    return repo.create(settings_in)

@router.post("/test-provider")
def test_provider_connection(settings_in: ProviderSettingsCreate):
    try:
        if settings_in.provider_type in ["openai", "openrouter", "local"]:
            provider = OpenAIProvider(
                api_key=settings_in.api_key or "",
                base_url=settings_in.base_url
            )
        elif settings_in.provider_type == "anthropic":
            if not settings_in.api_key:
                raise HTTPException(status_code=400, detail="API Key required for Anthropic")
            provider = AnthropicProvider(api_key=settings_in.api_key)
        else:
            raise HTTPException(status_code=400, detail="Unknown provider type")
            
        success = provider.ping()
        if success:
            return {"status": "success", "message": "Connection verified"}
        else:
            raise HTTPException(status_code=400, detail="Connection failed")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
