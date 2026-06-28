from typing import List, Dict, Any, Tuple
from lete.app.schemas.query import Citation
import uuid

class ContextPacker:
    """
    Packs hybrid search results into a clean LLM context block with citations.
    """
    
    @staticmethod
    def pack(results: List[Dict[str, Any]], max_tokens: int = 4000) -> Tuple[str, List[Citation]]:
        """
        Takes a list of search results, assigns them sequential citations like [1], [2], 
        and packs them into a single context string.
        """
        
        packed_text_blocks = []
        citations = []
        
        current_token_estimate = 0
        
        for idx, result in enumerate(results):
            citation_num = idx + 1
            citation_id = f"[{citation_num}]"
            
            # Extract metadata
            chunk_id = result.get("chunk_id", "")
            text = result.get("text", "")
            header = result.get("contextual_header", "")
            document_id = result.get("document_id", "unknown")
            document_name = result.get("filename", "unknown")
            
            # Simple token estimation: ~4 chars per token
            chunk_token_est = len(text) // 4 + len(header) // 4 + 20
            
            if current_token_estimate + chunk_token_est > max_tokens:
                break
                
            current_token_estimate += chunk_token_est
            
            # Build the citation object
            citation = Citation(
                id=citation_id,
                chunk_id=chunk_id,
                text=text,
                document_id=document_id,
                document_name=document_name
            )
            citations.append(citation)
            
            # Build the text block for the LLM
            block = f"{citation_id} Document: {document_name}\n"
            if header:
                block += f"Context: {header}\n"
            block += f"Content:\n{text}\n"
            
            packed_text_blocks.append(block)
            
        context_string = "\n".join(packed_text_blocks)
        
        return context_string, citations
