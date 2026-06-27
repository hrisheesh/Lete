from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Lete API"
    api_v1_str: str = "/api/v1"
    database_url: str = "sqlite:///./lete.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
