import pytest
import sqlite3
from lete.app.db.migrations import bootstrap_db
from lete.app.repositories.workspace import WorkspaceRepository
from lete.app.schemas.workspace import WorkspaceCreate
from lete.app.config.settings import settings


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    settings.database_url = "sqlite:///:memory:"
    bootstrap_db()


def test_create_workspace():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    repo = WorkspaceRepository(conn)
    workspace = repo.create(WorkspaceCreate(name="Test Workspace"))

    assert workspace.name == "Test Workspace"
    assert workspace.id is not None

    fetched = repo.get(workspace.id)
    assert fetched is not None
    assert fetched.name == "Test Workspace"


def test_list_and_delete_workspace():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    repo = WorkspaceRepository(conn)
    repo.create(WorkspaceCreate(name="Workspace 1"))
    workspace2 = repo.create(WorkspaceCreate(name="Workspace 2"))

    workspaces = repo.list()
    assert len(workspaces) == 2

    deleted = repo.delete(workspace2.id)
    assert deleted is True

    workspaces_after = repo.list()
    assert len(workspaces_after) == 1
