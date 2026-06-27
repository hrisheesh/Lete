import sqlite3
from typing import List, Dict, Any

class KeywordRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Perform a full-text search on chunks using FTS5 BM25 scoring.
        Uses the `chunks_fts` external content table which is automatically 
        synced via SQLite triggers.
        """
        if not query or not query.strip():
            return []
            
        cursor = self.conn.cursor()
        
        # SQLite FTS5 matches can be constructed safely using standard parameterization.
        # However, we must properly escape FTS5 special characters if we want a pure raw text match.
        # For a simple implementation, wrapping the query in quotes forces a phrase match,
        # but to allow standard keyword matching, we can just pass the raw query.
        
        # BM25 score in FTS5 is negative (more negative = better match)
        # We multiply by -1 to return a positive score where higher is better
        try:
            cursor.execute(
                """
                SELECT 
                    c.id as chunk_id,
                    c.document_id,
                    c.section_id,
                    c.text,
                    c.contextual_header,
                    c.chunk_index,
                    bm25(chunks_fts) * -1 as score
                FROM chunks_fts f
                JOIN chunks c ON c.rowid = f.rowid
                WHERE chunks_fts MATCH ?
                ORDER BY bm25(chunks_fts)
                LIMIT ?
                """,
                (query, limit)
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
                "section_id": row["section_id"],
                "text": row["text"],
                "contextual_header": row["contextual_header"],
                "chunk_index": row["chunk_index"],
                "score": row["score"]
            })
            
        return results
