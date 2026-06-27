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
            (id, provider_type, base_url, api_key, model_name, embedding_model_name, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                obj_id,
                obj_in.provider_type,
                obj_in.base_url,
                obj_in.api_key,
                obj_in.model_name,
                obj_in.embedding_model_name,
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
