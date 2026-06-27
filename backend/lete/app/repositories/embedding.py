import sqlite3
import hashlib
import uuid
import sqlite_vec
from typing import List, Dict

class EmbeddingRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_cached_embeddings(self, texts: List[str]) -> Dict[str, bytes]:
        """Fetch pre-computed embeddings for a list of texts by hashing them."""
        if not texts:
            return {}
            
        hashes = [hashlib.sha256(text.encode('utf-8')).hexdigest() for text in texts]
        placeholders = ",".join(["?"] * len(hashes))
        
        cursor = self.conn.cursor()
        cursor.execute(
            f"SELECT text_hash, embedding FROM embedding_cache WHERE text_hash IN ({placeholders})",
            hashes
        )
        return {row['text_hash']: row['embedding'] for row in cursor.fetchall()}

    def cache_embeddings(self, text_to_embedding: Dict[str, bytes]) -> None:
        """Store newly computed embeddings in the cache."""
        if not text_to_embedding:
            return
            
        cursor = self.conn.cursor()
        records = []
        for text, embedding in text_to_embedding.items():
            text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
            record_id = str(uuid.uuid4())
            records.append((record_id, text_hash, embedding))
            
        cursor.executemany(
            """
            INSERT OR IGNORE INTO embedding_cache (id, text_hash, embedding) 
            VALUES (?, ?, ?)
            """,
            records
        )

    def store_chunk_embeddings(self, chunk_id_to_embedding: Dict[str, bytes]) -> None:
        """Store embeddings in the sqlite-vec virtual table for vector search."""
        if not chunk_id_to_embedding:
            return
            
        cursor = self.conn.cursor()
        records = [
            (chunk_id, embedding) 
            for chunk_id, embedding in chunk_id_to_embedding.items()
        ]
        
        cursor.executemany(
            """
            INSERT INTO chunk_embeddings(chunk_id, embedding) 
            VALUES (?, ?)
            """,
            records
        )
        
    def delete_chunk_embeddings(self, chunk_ids: List[str]) -> None:
        """Delete embeddings for a set of chunks from sqlite-vec."""
        if not chunk_ids:
            return
            
        placeholders = ",".join(["?"] * len(chunk_ids))
        cursor = self.conn.cursor()
        cursor.execute(
            f"DELETE FROM chunk_embeddings WHERE chunk_id IN ({placeholders})",
            chunk_ids
        )
