from typing import Optional

def generate_contextual_header(
    document_name: str, 
    chunk_text: str, 
    page_number: int = None, 
    section_index: int = None
) -> str:
    """
    Generates a contextual header string.
    Does NOT append the chunk text to it, it just returns the header.
    """
    parts = []
    if document_name:
        parts.append(f"Document: {document_name}")
    if page_number is not None:
        parts.append(f"Page: {page_number}")
    if section_index is not None:
        parts.append(f"Section: {section_index}")
        
    header = " | ".join(parts)
    return f"[{header}]"
