import uuid
from typing import Optional
from datetime import datetime

from lete.app.repositories.base import BaseRepository
from lete.app.schemas.job import ProcessingJobCreate, ProcessingJobResponse, ProcessingJobUpdate

class ProcessingJobRepository(BaseRepository[ProcessingJobResponse, ProcessingJobCreate]):
    def create(self, obj_in: ProcessingJobCreate) -> ProcessingJobResponse:
        obj_id = str(uuid.uuid4())
        cursor = self.conn.cursor()
        now = datetime.utcnow().isoformat()

        cursor.execute(
            """INSERT INTO processing_jobs 
            (id, document_id, status, error_message, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (
                obj_id,
                obj_in.document_id,
                obj_in.status,
                obj_in.error_message,
                now,
                now,
            ),
        )

        return self.get(obj_id)

    def get(self, id: str) -> Optional[ProcessingJobResponse]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM processing_jobs WHERE id = ?", (id,))
        row = cursor.fetchone()

        if row is None:
            return None

        return ProcessingJobResponse(**dict(row))
    
    def get_by_document(self, document_id: str) -> Optional[ProcessingJobResponse]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM processing_jobs WHERE document_id = ? ORDER BY created_at DESC LIMIT 1", (document_id,))
        row = cursor.fetchone()

        if row is None:
            return None

        return ProcessingJobResponse(**dict(row))

    def update(self, id: str, obj_in: ProcessingJobUpdate) -> Optional[ProcessingJobResponse]:
        cursor = self.conn.cursor()
        now = datetime.utcnow().isoformat()
        
        updates = []
        params = []
        
        if obj_in.status is not None:
            updates.append("status = ?")
            params.append(obj_in.status)
        if obj_in.error_message is not None:
            updates.append("error_message = ?")
            params.append(obj_in.error_message)
            
        updates.append("updated_at = ?")
        params.append(now)
        
        params.append(id)
        
        set_clause = ", ".join(updates)
        
        cursor.execute(f"UPDATE processing_jobs SET {set_clause} WHERE id = ?", tuple(params))
        return self.get(id)
