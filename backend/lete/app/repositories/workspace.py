import uuid
from typing import List, Optional
from datetime import datetime

from lete.app.repositories.base import BaseRepository
from lete.app.schemas.workspace import WorkspaceCreate, WorkspaceResponse


class WorkspaceRepository(BaseRepository[WorkspaceResponse, WorkspaceCreate]):
    def create(self, obj_in: WorkspaceCreate) -> WorkspaceResponse:
        obj_id = str(uuid.uuid4())
        cursor = self.conn.cursor()
        now = datetime.utcnow().isoformat()

        cursor.execute(
            "INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (obj_id, obj_in.name, now, now),
        )

        return self.get(obj_id)

    def get(self, id: str) -> Optional[WorkspaceResponse]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM workspaces WHERE id = ?", (id,))
        row = cursor.fetchone()

        if row is None:
            return None

        return WorkspaceResponse(**dict(row))

    def list(self) -> List[WorkspaceResponse]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM workspaces")
        rows = cursor.fetchall()

        return [WorkspaceResponse(**dict(row)) for row in rows]

    def delete(self, id: str) -> bool:
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM workspaces WHERE id = ?", (id,))
        return cursor.rowcount > 0

    def update(self, id: str, obj_in: WorkspaceCreate) -> Optional[WorkspaceResponse]:
        cursor = self.conn.cursor()
        now = datetime.utcnow().isoformat()
        cursor.execute(
            "UPDATE workspaces SET name = ?, updated_at = ? WHERE id = ?",
            (obj_in.name, now, id),
        )
        if cursor.rowcount == 0:
            return None
        return self.get(id)
