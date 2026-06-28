import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query

from lete.app.api.deps import get_db_connection
from lete.app.schemas.provider_settings import ProviderSettingsCreate, ProviderSettingsResponse
from lete.app.repositories.provider_settings import ProviderSettingsRepository
from lete.app.providers.openai_provider import OpenAIProvider
from lete.app.providers.anthropic_provider import AnthropicProvider
from lete.app.providers.embeddings import OpenAIEmbeddingProvider
from lete.app.providers.utils import get_provider_base_url, is_openai_compatible

router = APIRouter()

from lete.app.config.settings import settings
import uuid
from datetime import datetime

@router.get("", response_model=ProviderSettingsResponse)
def get_settings(conn: sqlite3.Connection = Depends(get_db_connection)):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM provider_settings ORDER BY created_at DESC LIMIT 1")
    row = cursor.fetchone()
    
    if not row:
        c_prov = settings.provider_type
        c_base = settings.base_url
        c_key = settings.api_key
        c_mod = settings.model_name
        
        e_prov = settings.provider_type
        e_base = settings.base_url
        e_key = settings.api_key
        e_mod = settings.embedding_model_name
        
        created = updated = datetime.utcnow().isoformat()
        db_id = str(uuid.uuid4())
    else:
        repo = ProviderSettingsRepository(conn)
        db_settings = repo.get(row["id"])
        c_prov = db_settings.chat_provider
        c_base = db_settings.chat_base_url
        c_key = db_settings.chat_api_key
        c_mod = db_settings.chat_model
        
        e_prov = db_settings.embedding_provider or c_prov
        e_base = db_settings.embedding_base_url or c_base
        e_key = db_settings.embedding_api_key or c_key
        e_mod = db_settings.embedding_model
        
        created = db_settings.created_at
        updated = db_settings.updated_at
        db_id = db_settings.id

    env_defs = get_env_defaults()
    
    # Fallback Chat
    c_defaults = env_defs.get(c_prov, {})
    if not c_key and c_defaults.get("api_key"):
        c_key = c_defaults.get("api_key")
    if not c_mod and c_defaults.get("model_name"):
        c_mod = c_defaults.get("model_name")
    if not c_base and c_defaults.get("base_url"):
        c_base = c_defaults.get("base_url")
        
    # Fallback Embedding
    e_defaults = env_defs.get(e_prov, {})
    if not e_key and e_defaults.get("api_key"):
        e_key = e_defaults.get("api_key")
    if not e_mod and e_defaults.get("embedding_model"):
        e_mod = e_defaults.get("embedding_model")
    if not e_base and e_defaults.get("base_url"):
        e_base = e_defaults.get("base_url")

    return ProviderSettingsResponse(
        id=db_id,
        chat_provider=c_prov,
        chat_base_url=c_base,
        chat_api_key=c_key,
        chat_model=c_mod,
        embedding_provider=e_prov,
        embedding_base_url=e_base,
        embedding_api_key=e_key,
        embedding_model=e_mod,
        created_at=created,
        updated_at=updated
    )

@router.get("/env-defaults")
def get_env_defaults():
    """Returns available environment-provided default API keys, Base URLs, and suggested models to auto-populate the frontend."""
    return {
        "nvidia": {
            "api_key": settings.nvidia_api_key,
            "base_url": settings.nvidia_base_url or "https://integrate.api.nvidia.com/v1",
            "model_name": "stepfun-ai/step-3.7-flash",
            "embedding_model": "nvidia/nv-embed-v1"
        },
        "groq": {
            "api_key": settings.groq_api_key,
            "base_url": settings.groq_base_url or "https://api.groq.com/openai/v1",
            "model_name": "llama3-8b-8192",
            "embedding_model": ""
        },
        "mistral": {
            "api_key": settings.mistral_api_key,
            "base_url": settings.mistral_base_url or "https://api.mistral.ai/v1",
            "model_name": "mistral-small-latest",
            "embedding_model": ""
        },
        "huggingface": {
            "api_key": settings.huggingface_api_key,
            "base_url": "https://api-inference.huggingface.co/v1",
            "model_name": "",
            "embedding_model": ""
        },
        "anthropic": {
            "api_key": settings.anthropic_api_key,
            "base_url": "",
            "model_name": "claude-3-5-sonnet-20241022",
            "embedding_model": ""
        },
        "openrouter": {
            "api_key": settings.openrouter_api_key,
            "base_url": settings.openrouter_base_url or "https://openrouter.ai/api/v1",
            "model_name": "",
            "embedding_model": ""
        },
        "local": {
            "api_key": "",
            "base_url": "http://localhost:11434/v1",
            "model_name": "llama3",
            "embedding_model": "nomic-embed-text"
        },
        "openai": {
            "api_key": "",
            "base_url": "https://api.openai.com/v1",
            "model_name": "gpt-4o",
            "embedding_model": "text-embedding-3-small"
        }
    }

@router.put("/provider", response_model=ProviderSettingsResponse)
def update_provider_settings(
    settings_in: ProviderSettingsCreate,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    repo = ProviderSettingsRepository(conn)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM provider_settings")
    conn.commit()
    
    return repo.create(settings_in)

@router.post("/test-provider")
def test_provider_connection(
    settings_in: ProviderSettingsCreate,
    mode: str = Query("chat", pattern="^(chat|embedding)$")
):
    try:
        if mode == "chat":
            provider_type = settings_in.chat_provider
            api_key = settings_in.chat_api_key or ""
            base_url = get_provider_base_url(provider_type, settings_in.chat_base_url)
            
            if is_openai_compatible(provider_type):
                provider = OpenAIProvider(api_key=api_key, base_url=base_url)
            elif provider_type == "anthropic":
                if not api_key:
                    raise HTTPException(status_code=400, detail="API Key required for Anthropic")
                provider = AnthropicProvider(api_key=api_key)
            else:
                raise HTTPException(status_code=400, detail="Unknown provider type")
                
            success = provider.ping()
            
        elif mode == "embedding":
            provider_type = settings_in.embedding_provider or settings_in.chat_provider
            api_key = settings_in.embedding_api_key or ""
            base_url = get_provider_base_url(provider_type, settings_in.embedding_base_url)
            model_name = settings_in.embedding_model or "text-embedding-3-small"
            
            if is_openai_compatible(provider_type):
                provider = OpenAIEmbeddingProvider(api_key=api_key, model_name=model_name, base_url=base_url)
                success = provider.ping()
            else:
                raise HTTPException(status_code=400, detail="Provider does not support embeddings via OpenAI SDK")
                
        if success:
            return {"status": "success", "message": "Connection verified"}
        else:
            raise HTTPException(status_code=400, detail="Connection failed")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
