from typing import Optional

def generate_contextual_header(
    document_name: str,
    chunk_text: str,
    page_number: Optional[int] = None,
    section_index: Optional[int] = None
) -> str:
    """
    Prepends a contextual header to the raw chunk text.
    This helps the language model and the embedding model understand
    where this chunk came from when it's retrieved in isolation.
    """
    parts = [f"Document: {document_name}"]
    
    if page_number is not None:
        parts.append(f"Page: {page_number}")
        
    if section_index is not None:
        parts.append(f"Section Index: {section_index}")
        
    header = " | ".join(parts)
    
    return f"[{header}]\n\n{chunk_text.strip()}"
