from anthropic import Anthropic
from lete.app.providers.base import LLMProvider

class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)
        
    def ping(self) -> bool:
        try:
            # Anthropic models list
            self.client.models.list()
            return True
        except Exception as e:
            print(f"Anthropic connection failed: {e}")
            return False
