from typing import List, Dict, Any
import re
from lete.app.chunking.base import BaseChunker

class RecursiveChunker(BaseChunker):
    """
    A chunker that recursively splits text by \n\n, \n, sentence boundaries, and spaces.
    Ensures that chunks do not exceed chunk_size, with overlap handling.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._separators = ["\n\n", "\n", ". ", " ", ""]

    def chunk(self, text: str, document_metadata: Dict[str, Any] = None) -> List[str]:
        if not text:
            return []
            
        chunks = self._split_text(text, self._separators)
        
        # Combine the small splits into chunks up to chunk_size
        final_chunks = self._merge_splits(chunks, self._separators[0])
        return final_chunks

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """
        Recursively splits the text using the provided separators.
        """
        final_chunks = []
        separator = separators[-1]
        for s in separators:
            if s == "":
                separator = s
                break
            if s in text:
                separator = s
                break
                
        if separator:
            splits = text.split(separator)
        else:
            splits = list(text)
            
        good_splits = []
        for s in splits:
            if s:
                good_splits.append(s)
                
        # Now if any split is still too large, recursively split it using remaining separators
        new_separators = separators[separators.index(separator) + 1:] if separator in separators else []
        
        for s in good_splits:
            if len(s) < self.chunk_size:
                final_chunks.append(s)
            elif new_separators:
                final_chunks.extend(self._split_text(s, new_separators))
            else:
                # If we've run out of separators, we just append it (it's a massive word)
                # Or chunk it strictly by chars.
                for i in range(0, len(s), self.chunk_size):
                    final_chunks.append(s[i:i + self.chunk_size])
                    
        # Add the separator back where appropriate (simplified for length constraints)
        # We handle merging in `_merge_splits`
        return final_chunks

    def _merge_splits(self, splits: List[str], separator: str) -> List[str]:
        """
        Takes small splits and combines them up to chunk_size, applying overlap.
        """
        docs = []
        current_doc = []
        total_len = 0
        
        for d in splits:
            len_d = len(d)
            if total_len + len_d > self.chunk_size and len(current_doc) > 0:
                chunk_text = " ".join(current_doc).strip()
                if chunk_text:
                    docs.append(chunk_text)
                    
                # Setup overlap for next chunk
                while total_len > self.chunk_overlap or (
                    total_len + len_d > self.chunk_size and len(current_doc) > 0
                ):
                    total_len -= len(current_doc[0]) + 1 # +1 for space
                    current_doc.pop(0)
                    
            current_doc.append(d)
            total_len += len_d + 1 # +1 for space
            
        if current_doc:
            chunk_text = " ".join(current_doc).strip()
            if chunk_text:
                docs.append(chunk_text)
                
        return docs
