from lete.app.db.session import get_connection
from lete.app.repositories.workspace import WorkspaceRepository
from lete.app.schemas.workspace import WorkspaceCreate


def test_create_workspace():
    conn = get_connection()
    repo = WorkspaceRepository(conn)
    workspace = repo.create(WorkspaceCreate(name="Test Workspace"))

    assert workspace.name == "Test Workspace"
    assert workspace.id is not None

    fetched = repo.get(workspace.id)
    assert fetched is not None
    assert fetched.name == "Test Workspace"
    conn.close()


def test_list_and_delete_workspace():
    conn = get_connection()
    repo = WorkspaceRepository(conn)
    repo.create(WorkspaceCreate(name="Workspace 1"))
    workspace2 = repo.create(WorkspaceCreate(name="Workspace 2"))

    workspaces = repo.list()
    assert len(workspaces) == 2

    deleted = repo.delete(workspace2.id)
    assert deleted is True

    workspaces_after = repo.list()
    assert len(workspaces_after) == 1
    conn.close()
