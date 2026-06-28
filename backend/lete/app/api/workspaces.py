from typing import List
import sqlite3
from fastapi import APIRouter, Depends, HTTPException

from lete.app.api.deps import get_db_connection
from lete.app.schemas.workspace import WorkspaceCreate, WorkspaceResponse
from lete.app.repositories.workspace import WorkspaceRepository

router = APIRouter()


@router.post("", response_model=WorkspaceResponse, status_code=201)
def create_workspace(
    workspace_in: WorkspaceCreate, conn: sqlite3.Connection = Depends(get_db_connection)
):
    repo = WorkspaceRepository(conn)
    return repo.create(workspace_in)


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(conn: sqlite3.Connection = Depends(get_db_connection)):
    repo = WorkspaceRepository(conn)
    return repo.list()


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: str, conn: sqlite3.Connection = Depends(get_db_connection)
):
    repo = WorkspaceRepository(conn)
    workspace = repo.get(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.delete("/{workspace_id}", status_code=204)
def delete_workspace(
    workspace_id: str, conn: sqlite3.Connection = Depends(get_db_connection)
):
    repo = WorkspaceRepository(conn)
    success = repo.delete(workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workspace not found")

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(
    workspace_id: str,
    workspace_in: WorkspaceCreate,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    repo = WorkspaceRepository(conn)
    workspace = repo.update(workspace_id, workspace_in)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace
