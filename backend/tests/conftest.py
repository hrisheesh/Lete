import os
import pytest
from fastapi.testclient import TestClient

from lete.app.config.settings import settings
from lete.app.db.migrations import bootstrap_db
from lete.app.db.session import get_connection

TEST_DB_PATH = "test_lete.db"


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # Override settings for tests
    settings.database_url = f"sqlite:///./{TEST_DB_PATH}"

    # Bootstrap the test database
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    bootstrap_db()

    yield

    # Teardown: remove the test database file
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture(autouse=True)
def clear_db():
    # Clear tables before each test
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM workspaces")
    cursor.execute("DELETE FROM provider_settings")
    conn.commit()
    conn.close()
    yield
