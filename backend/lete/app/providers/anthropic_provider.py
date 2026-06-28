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

    def generate_stream(self, prompt: str, model: str, system_prompt: str = None):
        kwargs = {
            "model": model,
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}]
        }
        if system_prompt:
            kwargs["system"] = system_prompt
            
        with self.client.messages.stream(**kwargs) as stream:
            for text in stream.text_stream:
                yield text
