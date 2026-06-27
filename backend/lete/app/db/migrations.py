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
    # Create processing_jobs table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS processing_jobs (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            status TEXT NOT NULL, -- 'queued', 'parsing', 'completed', 'failed'
            error_message TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        )
        """
    )

    # Create document_sections table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS document_sections (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            content TEXT NOT NULL,
            page_number INTEGER,
            section_index INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        )
        """
    )
    
    # Create chunks table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            section_id TEXT NOT NULL,
            text TEXT NOT NULL,
            contextual_header TEXT,
            chunk_index INTEGER NOT NULL,
            token_count INTEGER,
            created_at TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
            FOREIGN KEY (section_id) REFERENCES document_sections(id) ON DELETE CASCADE
        )
        """
    )

    conn.commit()
    
    # Create embedding_cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS embedding_cache (
            id TEXT PRIMARY KEY,
            text_hash TEXT UNIQUE NOT NULL,
            embedding BLOB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create chunk_embeddings vec0 virtual table
    # We use +chunk_id to store auxiliary TEXT identifier. Fixed to 1536 dimensions (OpenAI standard)
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS chunk_embeddings USING vec0(
            +chunk_id TEXT,
            embedding float[1536]
        )
    """)
    conn.commit()
    
    # Create Indices for performance on foreign keys
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_document_id ON processing_jobs(document_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sections_document_id ON document_sections(document_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_section_id ON chunks(section_id)")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    bootstrap_db()
    print("Database bootstrapped successfully.")
