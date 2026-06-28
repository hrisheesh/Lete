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

    def generate_stream(self, prompt: str, model: str, system_prompt: str = None):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True
        )
        
        for chunk in response:
            if chunk.choices and len(chunk.choices) > 0:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
