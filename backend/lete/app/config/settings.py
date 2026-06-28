from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Lete API"
    api_v1_str: str = "/api/v1"
    database_url: str = "sqlite:///./lete.db"
    
    # Provider Settings (Fallback from .env)
    provider_type: str = "openai"
    base_url: str | None = None
    api_key: str | None = None
    model_name: str | None = None
    embedding_model_name: str | None = None
    
    # Environment-provided default API keys
    nvidia_api_key: str | None = None
    groq_api_key: str | None = None
    mistral_api_key: str | None = None
    huggingface_api_key: str | None = None
    anthropic_api_key: str | None = None
    openrouter_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
