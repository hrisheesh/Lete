from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseChunker(ABC):
    """
    Interface for all chunking algorithms.
    """
    @abstractmethod
    def chunk(self, text: str, document_metadata: Dict[str, Any] = None) -> List[str]:
        """
        Splits a large text into smaller, overlapping chunks.
        
        Args:
            text: The raw text to chunk.
            document_metadata: Optional dict containing metadata like document title, 
                               author, etc. to prepend to the chunk as a contextual header.
                               
        Returns:
            A list of string chunks.
        """
        pass
