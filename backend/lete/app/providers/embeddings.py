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
            
        all_embeddings = []
        batch_size = 500
        
        try:
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                response = self.client.embeddings.create(
                    input=batch,
                    model=self.model_name,
                    encoding_format="float"
                )
                for data in response.data:
                    emb = data.embedding
                    all_embeddings.append(emb)
                    
            return all_embeddings
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            raise e
