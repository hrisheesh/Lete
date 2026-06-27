import sqlite3
import uuid
import datetime
from typing import List, Optional

from lete.app.schemas.document import DocumentCreate, DocumentResponse


class DocumentRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_by_hash(self, workspace_id: str, file_hash: str) -> Optional[DocumentResponse]:
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM documents WHERE workspace_id = ? AND file_hash = ?",
            (workspace_id, file_hash),
        )
        row = cursor.fetchone()
        if row:
            return DocumentResponse(**dict(row))
        return None

    def create(self, doc: DocumentCreate) -> DocumentResponse:
        cursor = self.conn.cursor()
        doc_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow().isoformat()

        cursor.execute(
            """
            INSERT INTO documents (id, workspace_id, filename, file_type, file_size, file_hash, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                doc_id,
                doc.workspace_id,
                doc.filename,
                doc.file_type,
                doc.file_size,
                doc.file_hash,
                doc.status,
                now,
            ),
        )
        self.conn.commit()
        return self.get(doc_id)

    def get(self, doc_id: str) -> Optional[DocumentResponse]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        if row:
            return DocumentResponse(**dict(row))
        return None

    def list_by_workspace(self, workspace_id: str) -> List[DocumentResponse]:
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM documents WHERE workspace_id = ? ORDER BY created_at DESC",
            (workspace_id,),
        )
        rows = cursor.fetchall()
        return [DocumentResponse(**dict(row)) for row in rows]

    def delete(self, doc_id: str) -> bool:
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        self.conn.commit()
        return cursor.rowcount > 0
