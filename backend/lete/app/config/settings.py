from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    project_name: str = "Lete API"
    api_v1_str: str = "/api/v1"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
