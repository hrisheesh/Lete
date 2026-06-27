import sqlite3
from typing import List, Dict, Any, Optional
from lete.app.repositories.keyword import KeywordRepository
from lete.app.retrieval.vector_search import VectorSearchService

class HybridRetriever:
    """
    Combines Vector Search (semantic similarity) and Keyword Search (exact match FTS5) 
    using Reciprocal Rank Fusion (RRF).
    """
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.keyword_repo = KeywordRepository(conn)
        self.vector_service = VectorSearchService(conn)

    def search(
        self, 
        query: str, 
        workspace_id: str,
        query_embedding: Optional[List[float]] = None, 
        limit: int = 5,
        rrf_k: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid search and merges results.
        
        Args:
            query: The raw text query (for FTS5 keyword search)
            workspace_id: The workspace to restrict the search to
            query_embedding: The dense vector for the query (for semantic search)
            limit: Maximum number of chunks to return
            rrf_k: The RRF constant (typically 60)
            
        Returns:
            List of chunk dictionaries sorted by hybrid_score descending.
        """
        
        # Deep Pooling: Retrieve more chunks than requested so RRF can work its magic
        # on a larger candidate set, rather than truncating before fusion.
        pool_size = max(60, limit * 2)
        
        # 1. Fetch Keyword Results
        keyword_results = self.keyword_repo.search(query, workspace_id, limit=pool_size)
        
        # 2. Fetch Vector Results
        vector_results = []
        if query_embedding:
            vector_results = self.vector_service.search(query_embedding, workspace_id, limit=pool_size)
            
        # 3. Merge and deduplicate using RRF (Reciprocal Rank Fusion)
        # RRF Score = 1 / (k + rank)
        
        merged = {} # chunk_id -> chunk_data
        
        # Process Keyword Results
        for rank, chunk in enumerate(keyword_results):
            chunk_id = chunk["chunk_id"]
            if chunk_id not in merged:
                merged[chunk_id] = {
                    **chunk,
                    "keyword_score": chunk["score"],
                    "vector_score": None,
                    "keyword_rank": rank,
                    "vector_rank": None,
                    "hybrid_score": 0.0
                }
            # Remove the raw 'score' to avoid confusion
            if "score" in merged[chunk_id]:
                del merged[chunk_id]["score"]
                
            # Add to hybrid score
            merged[chunk_id]["hybrid_score"] += 1.0 / (rrf_k + rank)
            
        # Process Vector Results
        for rank, chunk in enumerate(vector_results):
            chunk_id = chunk["chunk_id"]
            if chunk_id not in merged:
                merged[chunk_id] = {
                    **chunk,
                    "keyword_score": None,
                    "vector_score": chunk["distance"], # smaller distance is better
                    "keyword_rank": None,
                    "vector_rank": rank,
                    "hybrid_score": 0.0
                }
                # Remove distance to standardize
                if "distance" in merged[chunk_id]:
                    del merged[chunk_id]["distance"]
            else:
                merged[chunk_id]["vector_score"] = chunk["distance"]
                merged[chunk_id]["vector_rank"] = rank
                if "distance" in merged[chunk_id]:
                    del merged[chunk_id]["distance"]
                
            # Add to hybrid score
            merged[chunk_id]["hybrid_score"] += 1.0 / (rrf_k + rank)
            
        # 4. Sort by final hybrid score descending
        final_results = list(merged.values())
        final_results.sort(key=lambda x: x["hybrid_score"], reverse=True)
        
        return final_results[:limit]
