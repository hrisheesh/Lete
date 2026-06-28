import sqlite3
import uuid
import json
from typing import List, Dict, Any, Generator
from lete.app.retrieval.hybrid import HybridRetriever
from lete.app.generation.packer import ContextPacker
from lete.app.providers.openai_provider import OpenAIProvider
from lete.app.providers.anthropic_provider import AnthropicProvider
from lete.app.repositories.provider_settings import ProviderSettingsRepository
from lete.app.config.settings import settings

class GenerationService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.retriever = HybridRetriever(conn)
        self.packer = ContextPacker()
        self.settings_repo = ProviderSettingsRepository(conn)
        
    def _get_provider(self, provider_type: str, base_url: str, api_key: str):
        if provider_type in ["openai", "openrouter", "local"]:
            return OpenAIProvider(api_key=api_key or "", base_url=base_url)
        elif provider_type == "anthropic":
            return AnthropicProvider(api_key=api_key)
        else:
            raise ValueError(f"Unknown provider type {provider_type}")

    def generate_answer(self, workspace_id: str, query_text: str, query_embedding: List[float] = None) -> Dict[str, Any]:
        """
        Executes hybrid search, packs context, and returns a generator that yields the answer chunks.
        """
        # Fetch current LLM settings
        cursor = self.conn.cursor()
        cursor.execute("SELECT id FROM provider_settings ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        
        if row:
            provider_config = self.settings_repo.get(row["id"])
            provider_type = provider_config.provider_type
            base_url = provider_config.base_url
            api_key = provider_config.api_key
            model = provider_config.model_name
        else:
            provider_type = settings.provider_type
            base_url = settings.base_url
            api_key = settings.api_key
            model = settings.model_name
            
        provider = self._get_provider(provider_type, base_url, api_key)
        
        # 1. Retrieve hybrid results
        limit = 5
        results = self.retriever.search(query_text, workspace_id, query_embedding, limit=limit)
        
        # 2. Pack context
        context_string, citations = self.packer.pack(results)
        
        # 3. Create queries record
        query_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO queries (id, workspace_id, query_text) VALUES (?, ?, ?)",
            (query_id, workspace_id, query_text)
        )
        
        # We need to create a retrieval run to tie things together
        run_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO retrieval_runs (id, workspace_id, query) VALUES (?, ?, ?)",
            (run_id, workspace_id, query_text)
        )
        for rank, res in enumerate(results):
            cursor.execute(
                """
                INSERT INTO retrieval_results 
                (id, run_id, chunk_id, rank, hybrid_score, vector_score, keyword_score)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()), run_id, res["chunk_id"], rank,
                    res["hybrid_score"], res.get("vector_score"), res.get("keyword_score")
                )
            )
        self.conn.commit()

        # 4. Construct prompt
        system_prompt = (
            "You are a highly intelligent and precise AI assistant answering questions based STRICTLY on the provided Context. "
            "If the Context does not contain the answer, you must truthfully state that you do not know. "
            "You must cite your sources inline using the provided citation IDs (e.g. [1], [2]). "
            "Do not hallucinate external information."
        )
        prompt = (
            f"Here is the context retrieved for the user's query:\n\n"
            f"{context_string}\n\n"
            f"User's Question: {query_text}\n\n"
            f"Please provide a comprehensive answer citing the context above using the [N] format."
        )
        
        # 5. Generate stream
        stream = provider.generate_stream(prompt, model, system_prompt=system_prompt)
        
        def generator() -> Generator[str, None, None]:
            full_text = ""
            for chunk in stream:
                full_text += chunk
                yield chunk
                
            # After stream completes, save the run
            cursor = self.conn.cursor()
            cursor.execute(
                """
                INSERT INTO answer_runs (id, query_id, retrieval_run_id, answer_text, model_used)
                VALUES (?, ?, ?, ?, ?)
                """,
                (str(uuid.uuid4()), query_id, run_id, full_text, model)
            )
            self.conn.commit()
            
        return {
            "query_id": query_id,
            "retrieval_run_id": run_id,
            "citations": [c.model_dump() for c in citations],
            "stream": generator()
        }
