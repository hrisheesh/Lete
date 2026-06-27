from openai import OpenAI
from lete.app.providers.base import LLMProvider

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, base_url: str | None = None):
        # Allow connecting to local instances or OpenRouter by omitting/overriding base_url
        self.client = OpenAI(api_key=api_key or "dummy-key-for-local", base_url=base_url)
        
    def ping(self) -> bool:
        try:
            self.client.models.list()
            return True
        except Exception as e:
            print(f"OpenAI connection failed: {e}")
            return False
