import uuid
from typing import Optional
from datetime import datetime

from lete.app.repositories.base import BaseRepository
from lete.app.schemas.provider_settings import (
    ProviderSettingsCreate,
    ProviderSettingsResponse,
)


class ProviderSettingsRepository(
    BaseRepository[ProviderSettingsResponse, ProviderSettingsCreate]
):
    def create(self, obj_in: ProviderSettingsCreate) -> ProviderSettingsResponse:
        obj_id = str(uuid.uuid4())
        cursor = self.conn.cursor()
        now = datetime.utcnow().isoformat()

        cursor.execute(
            """INSERT INTO provider_settings 
            (id, chat_provider, chat_base_url, chat_api_key, chat_model, 
             embedding_provider, embedding_base_url, embedding_api_key, embedding_model, 
             created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                obj_id,
                obj_in.chat_provider,
                obj_in.chat_base_url,
                obj_in.chat_api_key,
                obj_in.chat_model,
                obj_in.embedding_provider,
                obj_in.embedding_base_url,
                obj_in.embedding_api_key,
                obj_in.embedding_model,
                now,
                now,
            ),
        )

        return self.get(obj_id)

    def get(self, id: str) -> Optional[ProviderSettingsResponse]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM provider_settings WHERE id = ?", (id,))
        row = cursor.fetchone()

        if row is None:
            return None

        return ProviderSettingsResponse(**dict(row))
