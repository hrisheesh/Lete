import sqlite3
import uuid
import json
from typing import List, Dict, Any, Generator
from lete.app.retrieval.hybrid import HybridRetriever
from lete.app.generation.packer import ContextPacker
from lete.app.providers.openai_provider import OpenAIProvider
from lete.app.providers.anthropic_provider import AnthropicProvider
from lete.app.repositories.provider_settings import ProviderSettingsRepository
from lete.app.providers.utils import get_provider_base_url, is_openai_compatible
from lete.app.config.settings import settings

class GenerationService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.retriever = HybridRetriever(conn)
        self.packer = ContextPacker()
        self.settings_repo = ProviderSettingsRepository(conn)
        
    def _get_provider(self, provider_type: str, base_url: str, api_key: str):
        if is_openai_compatible(provider_type):
            resolved_base_url = get_provider_base_url(provider_type, base_url)
            return OpenAIProvider(api_key=api_key or "", base_url=resolved_base_url)
        elif provider_type == "anthropic":
            return AnthropicProvider(api_key=api_key)
        else:
            raise ValueError(f"Unknown provider type {provider_type}")

    def generate_answer(self, workspace_id: str, query_text: str, query_embedding: List[float] = None) -> Dict[str, Any]:
        """
        Executes hybrid search, packs context, and returns a generator that yields the answer chunks.
        """
        # Fetch current LLM settings
        from lete.app.api.settings import get_settings
        
        provider_config = get_settings(self.conn)
        provider_type = provider_config.chat_provider
        base_url = provider_config.chat_base_url
        api_key = provider_config.chat_api_key
        model = provider_config.chat_model
            
            
        provider = self._get_provider(provider_type, base_url, api_key)
        
        # 1. Retrieve hybrid results
        limit = 5
        results = self.retriever.search(query_text, workspace_id, query_embedding, limit=limit)
        
        # 2. Pack context
        context_string, citations = self.packer.pack(results)
        
        # 3. Create queries record
        query_id = str(uuid.uuid4())
        cursor = self.conn.cursor()
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
            "You are a highly intelligent and precise AI assistant. "
            "PRIORITY 1: Answer questions based on the provided Context and cite your sources inline using the provided citation IDs (e.g. [1], [2]). "
            "PRIORITY 2: If the Context does not contain the answer, you may use your general knowledge to fulfill the user's request, but you MUST clearly state that your answer is based on general knowledge and not the provided documents. "
            "For creative or formatting requests (e.g., 'draw a mermaid diagram', 'summarize this concept generally'), always attempt to fulfill the request to the best of your ability."
        )
        prompt = (
            f"Here is the context retrieved for the user's query:\n\n"
            f"{context_string}\n\n"
            f"User's Question: {query_text}\n\n"
            f"Please provide a comprehensive answer citing the context above using the [N] format."
        )
        
        # 5. CoT and rCoT Generation Pipeline (silent reasoning, streamed final answer)
        def generator() -> Generator[str, None, None]:
            full_text = ""
            
            # PHASE 1: CoT — silent, non-streaming, background reasoning
            cot_prompt = (
                f"Context:\n{context_string}\n\n"
                f"Question: {query_text}\n\n"
                f"Before answering, think step-by-step. First, analyze what information is available in the Context to answer the Question. "
                f"If the Context is missing key information, identify what general knowledge will be needed to fully answer the user, especially for formatting or diagram requests."
            )
            cot_text = ""
            for chunk in provider.generate_stream(cot_prompt, model, system_prompt=system_prompt):
                cot_text += chunk
                
            # PHASE 2: rCoT (Verification) — silent, non-streaming, self-critique
            rcot_prompt = (
                f"Context:\n{context_string}\n\n"
                f"Original Question: {query_text}\n\n"
                f"Initial Reasoning: {cot_text}\n\n"
                f"Review the Initial Reasoning critically. "
                f"Verify that any claims attributed to the Context are actually present there. "
                f"Ensure you are prepared to fulfill any diagram or formatting requests (like mermaid) using general knowledge if the Context lacks specifics."
            )
            rcot_text = ""
            for chunk in provider.generate_stream(rcot_prompt, model, system_prompt=system_prompt):
                rcot_text += chunk
                
            # PHASE 3: Final Answer — streamed to the user
            final_prompt = (
                f"Context:\n{context_string}\n\n"
                f"Question: {query_text}\n\n"
                f"Reasoning Summary: {cot_text}\n\n"
                f"Verification: {rcot_text}\n\n"
                f"Now write the final, comprehensive, well-formatted answer. "
                f"Draw from the Context first (citing with [N]). If using general knowledge, state that explicitly. "
                f"Always fulfill requests for diagrams or charts. "
                f"1. For MERMAID: Use ```mermaid and wrap node text in double quotes (A[\"Node\"]). NEVER use spaces in subgraph IDs.\n"
                f"2. For CHARTS (bar/line/pie): Use ```chart and output VALID JSON like this: {{\"type\": \"bar\", \"title\": \"Title\", \"data\": [{{\"name\": \"A\", \"value\": 100}}], \"keys\": [\"value\"]}}\n"
            )
            for chunk in provider.generate_stream(final_prompt, model, system_prompt=system_prompt):
                full_text += chunk
                yield chunk
                
            # Save the run after stream completes
            cursor = self.conn.cursor()
            cursor.execute(
                "INSERT INTO answer_runs (id, query_id, retrieval_run_id, answer_text, model_used) VALUES (?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), query_id, run_id, full_text, model)
            )
            self.conn.commit()
            
        return {
            "query_id": query_id,
            "retrieval_run_id": run_id,
            "citations": [c.model_dump() for c in citations],
            "stream": generator()
        }

