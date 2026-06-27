from typing import List, Optional
import uuid
import datetime
from sqlite3 import Connection
from lete.app.schemas.chunk import ChunkCreate, ChunkResponse

class ChunkRepository:
    def __init__(self, db: Connection):
        self.db = db

    def create(self, chunk: ChunkCreate) -> ChunkResponse:
        chunk_id = str(uuid.uuid4())
        created_at = datetime.datetime.utcnow().isoformat()
        
        cursor = self.db.cursor()
        cursor.execute(
            """
            INSERT INTO chunks (
                id, document_id, section_id, text, contextual_header, 
                chunk_index, token_count, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                chunk_id,
                chunk.document_id,
                chunk.section_id,
                chunk.text,
                chunk.contextual_header,
                chunk.chunk_index,
                chunk.token_count,
                created_at
            )
        )
        self.db.commit()
        
        return ChunkResponse(
            id=chunk_id,
            document_id=chunk.document_id,
            section_id=chunk.section_id,
            text=chunk.text,
            contextual_header=chunk.contextual_header,
            chunk_index=chunk.chunk_index,
            token_count=chunk.token_count,
            created_at=created_at
        )

    def get_by_document(self, document_id: str) -> List[ChunkResponse]:
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT id, document_id, section_id, text, contextual_header, chunk_index, token_count, created_at FROM chunks WHERE document_id = ? ORDER BY chunk_index ASC",
            (document_id,)
        )
        rows = cursor.fetchall()
        
        return [
            ChunkResponse(
                id=row[0],
                document_id=row[1],
                section_id=row[2],
                text=row[3],
                contextual_header=row[4],
                chunk_index=row[5],
                token_count=row[6],
                created_at=row[7]
            ) for row in rows
        ]
        
    def delete_by_document(self, document_id: str) -> None:
        cursor = self.db.cursor()
        cursor.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
        self.db.commit()
