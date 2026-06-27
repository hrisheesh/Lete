from openai import OpenAI
from lete.app.providers.base import EmbeddingProvider

class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str, model_name: str = "text-embedding-3-small", base_url: str | None = None):
        self.model_name = model_name
        self.client = OpenAI(api_key=api_key or "dummy-key-for-local", base_url=base_url)
        
    def ping(self) -> bool:
        try:
            # We ping by embedding a small test string
            self.embed(["test"])
            return True
        except Exception as e:
            print(f"OpenAI Embedding connection failed: {e}")
            return False
            
    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
            
        try:
            response = self.client.embeddings.create(
                input=texts,
                model=self.model_name
            )
            # The response contains a data array matching the input order
            return [data.embedding for data in response.data]
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            raise e
