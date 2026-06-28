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
                kwargs = {
                    "input": batch,
                    "model": self.model_name,
                    "encoding_format": "float"
                }
                
                if "nvidia" in self.model_name.lower():
                    kwargs["extra_body"] = {"input_type": "query", "truncate": "NONE"}
                    
                response = self.client.embeddings.create(**kwargs)
                for data in response.data:
                    emb = data.embedding
                    all_embeddings.append(emb)
                    
            return all_embeddings
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            raise e

def get_embedding(conn, text: str) -> list[float]:
    """Helper to get a single embedding using current settings."""
    from lete.app.api.settings import get_settings
    from lete.app.providers.utils import get_provider_base_url
    
    prov_settings = get_settings(conn)
    
    base_url = get_provider_base_url(prov_settings.embedding_provider, prov_settings.embedding_base_url)
    
    # We only support OpenAI embedding provider for now based on previous code
    embed_provider = OpenAIEmbeddingProvider(
        api_key=prov_settings.embedding_api_key or "",
        model_name=prov_settings.embedding_model or "text-embedding-3-small",
        base_url=base_url
    )
    
    embeddings = embed_provider.embed([text])
    if embeddings:
        return embeddings[0]
    return []
