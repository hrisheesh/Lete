from typing import List, Dict, Any
import sqlite3
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from lete.app.api.deps import get_db_connection

router = APIRouter()

class ChatCreate(BaseModel):
    name: str

class ChatResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    created_at: str
    updated_at: str

@router.post("/workspaces/{workspace_id}/chats", response_model=ChatResponse, status_code=201)
def create_chat(
    workspace_id: str,
    chat_in: ChatCreate,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    chat_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    cursor = conn.cursor()
    
    # Verify workspace exists
    cursor.execute("SELECT id FROM workspaces WHERE id = ?", (workspace_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    cursor.execute(
        "INSERT INTO chats (id, workspace_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (chat_id, workspace_id, chat_in.name, now, now)
    )
    conn.commit()
    
    cursor.execute("SELECT * FROM chats WHERE id = ?", (chat_id,))
    row = cursor.fetchone()
    return ChatResponse(**dict(row))

@router.get("/workspaces/{workspace_id}/chats", response_model=List[ChatResponse])
def list_chats(
    workspace_id: str,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chats WHERE workspace_id = ? ORDER BY created_at DESC", (workspace_id,))
    rows = cursor.fetchall()
    return [ChatResponse(**dict(row)) for row in rows]

@router.delete("/workspaces/{workspace_id}/chats/{chat_id}", status_code=204)
def delete_chat(
    workspace_id: str,
    chat_id: str,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chats WHERE id = ? AND workspace_id = ?", (chat_id, workspace_id))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    conn.commit()
