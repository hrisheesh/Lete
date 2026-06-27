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

    # Create documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_type TEXT,
            file_size INTEGER,
            file_hash TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    
    # Auto-populate default provider settings if empty
    from lete.app.config.settings import settings
    import uuid
    import datetime
    
    cursor.execute("SELECT COUNT(*) FROM provider_settings")
    if cursor.fetchone()[0] == 0 and settings.default_api_key:
        cursor.execute("""
            INSERT INTO provider_settings 
            (id, provider_type, base_url, api_key, model_name, embedding_model_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()),
            settings.default_provider_type,
            settings.default_base_url,
            settings.default_api_key,
            settings.default_model_name,
            settings.default_embedding_model,
            datetime.datetime.utcnow().isoformat(),
            datetime.datetime.utcnow().isoformat()
        ))
        conn.commit()
        
    conn.close()


if __name__ == "__main__":
    bootstrap_db()
    print("Database bootstrapped successfully.")
