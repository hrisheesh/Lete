import sqlite3
from lete.app.db.session import get_connection, get_db


def test_get_connection():
    conn = get_connection()
    assert isinstance(conn, sqlite3.Connection)
    conn.close()


def test_get_db_context_manager():
    with get_db() as db:
        assert isinstance(db, sqlite3.Connection)
        cursor = db.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        assert result[0] == 1
