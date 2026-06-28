import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException

from lete.app.api.deps import get_db_connection
from lete.app.schemas.provider_settings import ProviderSettingsCreate, ProviderSettingsResponse
from lete.app.repositories.provider_settings import ProviderSettingsRepository
from lete.app.providers.openai_provider import OpenAIProvider
from lete.app.providers.anthropic_provider import AnthropicProvider
from lete.app.providers.utils import get_provider_base_url, is_openai_compatible

router = APIRouter()

from lete.app.config.settings import settings
import uuid
from datetime import datetime

@router.get("", response_model=ProviderSettingsResponse)
def get_settings(conn: sqlite3.Connection = Depends(get_db_connection)):
    cursor = conn.cursor()
    # For now, we assume a single active global provider setting. We just grab the first.
    cursor.execute("SELECT id FROM provider_settings ORDER BY created_at DESC LIMIT 1")
    row = cursor.fetchone()
    
    if not row:
        prov_type = settings.provider_type
        base = settings.base_url
        key = settings.api_key
        mod = settings.model_name
        embed_mod = settings.embedding_model_name
        created = updated = datetime.utcnow().isoformat()
        db_id = str(uuid.uuid4())
    else:
        repo = ProviderSettingsRepository(conn)
        db_settings = repo.get(row["id"])
        prov_type = db_settings.provider_type
        base = db_settings.base_url
        key = db_settings.api_key
        mod = db_settings.model_name
        embed_mod = db_settings.embedding_model_name
        created = db_settings.created_at
        updated = db_settings.updated_at
        db_id = db_settings.id

    # Fallback to env-defaults if fields are missing
    defaults = get_env_defaults().get(prov_type, {})
    if not key and defaults.get("api_key"):
        key = defaults.get("api_key")
    if not mod and defaults.get("model_name"):
        mod = defaults.get("model_name")
    if not embed_mod and defaults.get("embedding_model_name"):
        embed_mod = defaults.get("embedding_model_name")

    return ProviderSettingsResponse(
        id=db_id,
        provider_type=prov_type,
        base_url=base,
        api_key=key,
        model_name=mod,
        embedding_model_name=embed_mod,
        created_at=created,
        updated_at=updated
    )

@router.get("/env-defaults")
def get_env_defaults():
    """Returns available environment-provided default API keys and suggested models to auto-populate the frontend."""
    return {
        "nvidia": {
            "api_key": settings.nvidia_api_key,
            "model_name": "stepfun-ai/step-3.7-flash",
            "embedding_model_name": "nvidia/nv-embed-v1"
        },
        "groq": {
            "api_key": settings.groq_api_key,
            "model_name": "llama3-8b-8192",
            "embedding_model_name": ""
        },
        "mistral": {
            "api_key": settings.mistral_api_key,
            "model_name": "mistral-small-latest"
        },
        "huggingface": {
            "api_key": settings.huggingface_api_key,
            "model_name": ""
        },
        "anthropic": {
            "api_key": settings.anthropic_api_key,
            "model_name": "claude-3-5-sonnet-20241022"
        },
        "openrouter": {
            "api_key": settings.openrouter_api_key,
            "model_name": ""
        }
    }

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
        if is_openai_compatible(settings_in.provider_type):
            base_url = get_provider_base_url(settings_in.provider_type, settings_in.base_url)
            provider = OpenAIProvider(
                api_key=settings_in.api_key or "",
                base_url=base_url
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
