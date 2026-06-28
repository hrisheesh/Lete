import sqlite3
import sqlite_vec
from typing import List, Dict, Any

class VectorSearchService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def search(self, query_embedding: List[float], workspace_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for the closest chunks using the sqlite-vec virtual table.
        Uses a two-step query to avoid SQLite query planner issues with virtual tables.
        Fetches a larger internal pool (k=100) to safely filter out chunks not belonging to the workspace.
        """
        if not query_embedding:
            return []
            
        query_bytes = sqlite_vec.serialize_float32(query_embedding)
        dimension = len(query_embedding)
        table_name = f"chunk_embeddings_{dimension}"
        
        cursor = self.conn.cursor()
        
        # Check if this dimension table exists before querying
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", (table_name,))
        if not cursor.fetchone():
            return []
            
        # Step 1: Query the vector table for a large pool (to account for cross-workspace noise)
        pool_size = max(100, limit * 10)
        cursor.execute(
            f"""
            SELECT chunk_id, distance
            FROM {table_name}
            WHERE embedding MATCH ? AND k = ?
            ORDER BY distance
            """,
            (query_bytes, pool_size)
        )
        
        vec_results = cursor.fetchall()
        if not vec_results:
            return []
            
        # Step 2: Fetch the full chunk data and filter strictly by workspace_id
        chunk_ids = [row["chunk_id"] for row in vec_results]
        distance_map = {row["chunk_id"]: row["distance"] for row in vec_results}
        
        placeholders = ",".join(["?"] * len(chunk_ids))
        
        # We join documents to safely isolate by workspace
        cursor.execute(
            f"""
            SELECT 
                c.id as chunk_id,
                c.document_id,
                c.section_id,
                c.text,
                c.contextual_header,
                c.chunk_index
            FROM chunks c
            JOIN documents d ON d.id = c.document_id
            WHERE c.id IN ({placeholders}) AND d.workspace_id = ?
            """,
            (*chunk_ids, workspace_id)
        )
        
        final_results = []
        for row in cursor.fetchall():
            chunk_id = row["chunk_id"]
            final_results.append({
                "chunk_id": chunk_id,
                "document_id": row["document_id"],
                "section_id": row["section_id"],
                "text": row["text"],
                "contextual_header": row["contextual_header"],
                "chunk_index": row["chunk_index"],
                "distance": distance_map[chunk_id]
            })
            
        # Sort results back into distance order since WHERE IN doesn't guarantee order
        final_results.sort(key=lambda x: x["distance"])
        return final_results
