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
            chat_provider TEXT NOT NULL,
            chat_base_url TEXT,
            chat_api_key TEXT,
            chat_model TEXT,
            embedding_provider TEXT,
            embedding_base_url TEXT,
            embedding_api_key TEXT,
            embedding_model TEXT,
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
    
    # Drop the legacy static 1536-dimensional table if it exists.
    # Dynamic tables will now be created per-dimension as `chunk_embeddings_{dim}`.
    cursor.execute("DROP TABLE IF EXISTS chunk_embeddings")
    
    # Check if chunks_fts is stale (missing contextual_header)
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='chunks_fts'")
    fts_schema = cursor.fetchone()
    needs_rebuild = False
    
    if fts_schema and 'contextual_header' not in fts_schema[0]:
        cursor.execute("DROP TABLE chunks_fts")
        needs_rebuild = True
        
    # Create chunks_fts virtual table for keyword search (External Content Table)
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
            text,
            contextual_header,
            content='chunks',
            content_rowid='rowid',
            tokenize='porter unicode61'
        )
    """)
    
    if needs_rebuild:
        cursor.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild')")
        
    # Create Triggers to auto-sync FTS5 index
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks
        BEGIN
            INSERT INTO chunks_fts(rowid, text, contextual_header) 
            VALUES (new.rowid, new.text, new.contextual_header);
        END;
    """)
    
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks
        BEGIN
            INSERT INTO chunks_fts(chunks_fts, rowid, text, contextual_header) 
            VALUES ('delete', old.rowid, old.text, old.contextual_header);
        END;
    """)
    
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks
        BEGIN
            INSERT INTO chunks_fts(chunks_fts, rowid, text, contextual_header) 
            VALUES ('delete', old.rowid, old.text, old.contextual_header);
            INSERT INTO chunks_fts(rowid, text, contextual_header) 
            VALUES (new.rowid, new.text, new.contextual_header);
        END;
    """)
    conn.commit()
    
    # Create retrieval_runs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS retrieval_runs (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            query TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
    """)
    
    # Create retrieval_results table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS retrieval_results (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            chunk_id TEXT NOT NULL,
            rank INTEGER NOT NULL,
            hybrid_score REAL NOT NULL,
            vector_score REAL,
            keyword_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES retrieval_runs(id) ON DELETE CASCADE,
            FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    
    # Create queries table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS queries (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            query_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
    """)

    # Create answer_runs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS answer_runs (
            id TEXT PRIMARY KEY,
            query_id TEXT NOT NULL,
            retrieval_run_id TEXT,
            answer_text TEXT,
            model_used TEXT,
            prompt_tokens INTEGER,
            completion_tokens INTEGER,
            total_tokens INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
            FOREIGN KEY (retrieval_run_id) REFERENCES retrieval_runs(id) ON DELETE SET NULL
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
