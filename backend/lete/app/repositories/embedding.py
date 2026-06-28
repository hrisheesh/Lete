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
        """Store embeddings in dynamically provisioned sqlite-vec virtual tables based on their dimension."""
        if not chunk_id_to_embedding:
            return
            
        # Determine dimension from the first embedding (4 bytes per float32)
        sample_embedding = next(iter(chunk_id_to_embedding.values()))
        dimension = len(sample_embedding) // 4
        table_name = f"chunk_embeddings_{dimension}"
        
        cursor = self.conn.cursor()
        
        # Ensure the table for this dimension exists
        cursor.execute(f"""
            CREATE VIRTUAL TABLE IF NOT EXISTS {table_name} USING vec0(
                +chunk_id TEXT,
                embedding float[{dimension}]
            )
        """)
        
        records = [
            (chunk_id, embedding) 
            for chunk_id, embedding in chunk_id_to_embedding.items()
        ]
        
        cursor.executemany(
            f"""
            INSERT INTO {table_name}(chunk_id, embedding) 
            VALUES (?, ?)
            """,
            records
        )
        
    def delete_chunk_embeddings(self, chunk_ids: List[str]) -> None:
        """Delete embeddings for a set of chunks from all dynamic sqlite-vec tables."""
        if not chunk_ids:
            return
            
        cursor = self.conn.cursor()
        
        # Find all dynamic chunk_embeddings_* tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'chunk_embeddings_%'")
        tables = [row['name'] for row in cursor.fetchall()]
        
        if not tables:
            return
            
        placeholders = ",".join(["?"] * len(chunk_ids))
        for table in tables:
            cursor.execute(
                f"DELETE FROM {table} WHERE chunk_id IN ({placeholders})",
                chunk_ids
            )
