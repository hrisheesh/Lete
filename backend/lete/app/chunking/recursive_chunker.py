from typing import List, Dict, Any
import re
from lete.app.chunking.base import BaseChunker

class RecursiveChunker(BaseChunker):
    """
    A chunker that recursively splits text by \n\n, \n, sentence boundaries, and spaces.
    Ensures that chunks do not exceed chunk_size, with overlap handling.
    Keeps structural formatting intact.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._separators = ["\n\n", "\n", ". ", " ", ""]

    def chunk(self, text: str, document_metadata: Dict[str, Any] = None) -> List[str]:
        if not text:
            return []
        return self._split_text(text, self._separators)

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """
        Recursively splits the text using the provided separators.
        """
        if len(text) <= self.chunk_size:
            return [text]
            
        separator = separators[-1]
        for s in separators:
            if s == "":
                separator = s
                break
            if s in text:
                separator = s
                break
                
        # Split text while keeping the separator
        if separator:
            # re.split with capture group keeps the delimiter in the list
            splits = re.split(f"({re.escape(separator)})", text)
            # Combine the split with its trailing separator
            combined_splits = []
            for i in range(0, len(splits), 2):
                piece = splits[i]
                if i + 1 < len(splits):
                    piece += splits[i + 1]
                if piece:
                    combined_splits.append(piece)
            splits = combined_splits
        else:
            splits = list(text)
            
        # Now merge splits
        merged_chunks = []
        current_chunk = ""
        
        for split in splits:
            if len(current_chunk) + len(split) > self.chunk_size and current_chunk:
                merged_chunks.append(current_chunk)
                
                # Setup overlap
                overlap_text = ""
                # A simple overlap heuristic: take the last N chars, but try not to cut mid-word
                if len(current_chunk) > self.chunk_overlap:
                    overlap_text = current_chunk[-self.chunk_overlap:]
                    # optionally trim to nearest space
                    space_idx = overlap_text.find(" ")
                    if space_idx != -1 and space_idx < len(overlap_text) - 1:
                        overlap_text = overlap_text[space_idx+1:]
                else:
                    overlap_text = current_chunk
                    
                current_chunk = overlap_text + split
            else:
                current_chunk += split
                
        if current_chunk:
            merged_chunks.append(current_chunk)
            
        # Recursive step if any merged chunk is still too big
        final_chunks = []
        next_separators = separators[separators.index(separator) + 1:] if separator in separators else []
        
        for chunk in merged_chunks:
            if len(chunk) <= self.chunk_size:
                final_chunks.append(chunk)
            elif next_separators:
                final_chunks.extend(self._split_text(chunk, next_separators))
            else:
                # Fallback: strictly split by chars
                for i in range(0, len(chunk), self.chunk_size):
                    final_chunks.append(chunk[i:i + self.chunk_size])
                    
        return final_chunks
