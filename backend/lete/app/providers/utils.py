def get_provider_base_url(provider_type: str, custom_base_url: str | None = None) -> str | None:
    """
    Returns the appropriate base URL for OpenAI-compatible providers.
    If a custom_base_url is provided (e.g. for local or openrouter overrides), it is returned.
    Otherwise, returns the canonical endpoint for the provider.
    """
    if custom_base_url:
        return custom_base_url
        
    canonical_urls = {
        "groq": "https://api.groq.com/openai/v1",
        "mistral": "https://api.mistral.ai/v1",
        "huggingface": "https://api-inference.huggingface.co/v1",
        "nvidia": "https://integrate.api.nvidia.com/v1"
    }
    
    return canonical_urls.get(provider_type)

def is_openai_compatible(provider_type: str) -> bool:
    """Check if the provider uses the OpenAI client format."""
    return provider_type in [
        "openai", "openrouter", "local", 
        "groq", "mistral", "huggingface", "nvidia"
    ]
