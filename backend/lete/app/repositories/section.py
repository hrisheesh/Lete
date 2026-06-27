import uuid
from typing import List, Optional
from datetime import datetime

from lete.app.repositories.base import BaseRepository
from lete.app.schemas.section import DocumentSectionCreate, DocumentSectionResponse

class DocumentSectionRepository(BaseRepository[DocumentSectionResponse, DocumentSectionCreate]):
    def create(self, obj_in: DocumentSectionCreate) -> DocumentSectionResponse:
        obj_id = str(uuid.uuid4())
        cursor = self.conn.cursor()
        now = datetime.utcnow().isoformat()

        cursor.execute(
            """INSERT INTO document_sections 
            (id, document_id, content, page_number, section_index, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (
                obj_id,
                obj_in.document_id,
                obj_in.content,
                obj_in.page_number,
                obj_in.section_index,
                now,
            ),
        )

        return self.get(obj_id)

    def get(self, id: str) -> Optional[DocumentSectionResponse]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM document_sections WHERE id = ?", (id,))
        row = cursor.fetchone()

        if row is None:
            return None

        return DocumentSectionResponse(**dict(row))

    def list_by_document(self, document_id: str) -> List[DocumentSectionResponse]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM document_sections WHERE document_id = ? ORDER BY section_index ASC", (document_id,))
        rows = cursor.fetchall()
        return [DocumentSectionResponse(**dict(row)) for row in rows]
    
    def delete_by_document(self, document_id: str) -> None:
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM document_sections WHERE document_id = ?", (document_id,))
