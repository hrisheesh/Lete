import pytest
from lete.app.generation.packer import ContextPacker

def test_context_packer_citations():
    results = [
        {
            "chunk_id": "chunk_1",
            "text": "The sky is blue.",
            "contextual_header": "Introduction",
            "document_id": "doc_1",
            "filename": "colors.pdf"
        },
        {
            "chunk_id": "chunk_2",
            "text": "Grass is green.",
            "contextual_header": "Body",
            "document_id": "doc_1",
            "filename": "colors.pdf"
        }
    ]
    
    context, citations = ContextPacker.pack(results)
    
    assert len(citations) == 2
    assert citations[0].id == "[1]"
    assert citations[0].chunk_id == "chunk_1"
    
    assert citations[1].id == "[2]"
    assert citations[1].chunk_id == "chunk_2"
    
    assert "[1] Document: colors.pdf" in context
    assert "Context: Introduction" in context
    assert "The sky is blue." in context
    
    assert "[2] Document: colors.pdf" in context
    assert "Context: Body" in context
    assert "Grass is green." in context

def test_context_packer_token_limit():
    results = [
        {
            "chunk_id": f"chunk_{i}",
            "text": "A" * 1000, # ~250 tokens
            "contextual_header": "",
            "document_id": "doc_1",
            "filename": "big.pdf"
        }
        for i in range(10)
    ]
    
    # max_tokens=1000, each chunk is ~250 tokens, plus header ~20 tokens
    # so we should fit about 3-4 chunks
    context, citations = ContextPacker.pack(results, max_tokens=1000)
    
    assert 0 < len(citations) < 10
    assert len(citations) == 3
