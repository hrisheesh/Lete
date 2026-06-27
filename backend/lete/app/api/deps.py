from typing import Generator
import sqlite3
from lete.app.db.session import get_connection


def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Dependency that provides a database connection for requests."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
