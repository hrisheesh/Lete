import sqlite3
from typing import List, Dict, Any

class KeywordRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def search(self, query: str, workspace_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Perform a full-text search on chunks using FTS5 BM25 scoring.
        Uses the `chunks_fts` external content table which is automatically 
        synced via SQLite triggers.
        """
        if not query or not query.strip():
            return []
            
        # Sanitize query for FTS5 to prevent OperationalError on reserved keywords or quotes
        # We replace any non-alphanumeric character with a space
        import re
        sanitized_query = re.sub(r'[^\w\s]', ' ', query).strip()
        if not sanitized_query:
            return []
            
        cursor = self.conn.cursor()
        
        try:
            cursor.execute(
                """
                SELECT 
                    c.id as chunk_id,
                    c.document_id,
                    d.filename,
                    c.section_id,
                    c.text,
                    c.contextual_header,
                    c.chunk_index,
                    bm25(chunks_fts) * -1 as score
                FROM chunks_fts f
                JOIN chunks c ON c.rowid = f.rowid
                JOIN documents d ON d.id = c.document_id
                WHERE chunks_fts MATCH ? AND d.workspace_id = ?
                ORDER BY bm25(chunks_fts)
                LIMIT ?
                """,
                (sanitized_query, workspace_id, limit)
            )
        except sqlite3.OperationalError as e:
            # If the query contains malformed FTS syntax (e.g. unmatched quotes), FTS5 throws an OperationalError
            # A more robust solution involves sanitizing the query string, but for now we fallback to empty.
            print(f"FTS5 Query Error: {e}")
            return []
            
        results = []
        for row in cursor.fetchall():
            results.append({
                "chunk_id": row["chunk_id"],
                "document_id": row["document_id"],
                "filename": row["filename"],
                "section_id": row["section_id"],
                "text": row["text"],
                "contextual_header": row["contextual_header"],
                "chunk_index": row["chunk_index"],
                "score": row["score"]
            })
            
        return results
