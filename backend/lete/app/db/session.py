import sqlite3
from contextlib import contextmanager
from typing import Generator
from lete.app.config.settings import settings


def get_db_path() -> str:
    # Remove the sqlite:/// prefix if present
    path = settings.database_url
    if path.startswith("sqlite:///"):
        path = path.replace("sqlite:///", "")
    return path


def get_connection() -> sqlite3.Connection:
    """Create and return a raw SQLite connection.
    In the future, extensions like sqlite-vec can be loaded here.
    """
    conn = sqlite3.connect(get_db_path(), check_same_thread=False)
    # Return rows as dictionaries for easier data mapping
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Provide a transactional scope around a series of operations."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
