from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    def ping(self) -> bool:
        """Test the connection to the provider."""
        pass

class EmbeddingProvider(ABC):
    @abstractmethod
    def ping(self) -> bool:
        """Test the connection to the embedding provider."""
        pass
