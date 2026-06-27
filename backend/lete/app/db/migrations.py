from lete.app.db.session import get_connection


def bootstrap_db():
    """Run initial table creation migrations."""
    conn = get_connection()
    cursor = conn.cursor()

    # Create workspaces table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create provider_settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS provider_settings (
            id TEXT PRIMARY KEY,
            provider_type TEXT NOT NULL,
            base_url TEXT,
            api_key TEXT,
            model_name TEXT,
            embedding_model_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    bootstrap_db()
    print("Database bootstrapped successfully.")
