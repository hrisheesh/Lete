from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    def ping(self) -> bool:
        """Test the connection to the provider."""
        pass
        
    @abstractmethod
    def generate_stream(self, prompt: str, model: str, system_prompt: str = None):
        """Generate response and yield chunks."""
        pass

class EmbeddingProvider(ABC):
    @abstractmethod
    def ping(self) -> bool:
        """Test the connection to the embedding provider."""
        pass
        
    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        pass
