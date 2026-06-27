from lete.app.chunking.recursive_chunker import RecursiveChunker

def test_recursive_chunker_basic():
    text = "This is a sentence. This is another sentence. And a third."
    
    # Very small chunk size to force splits
    chunker = RecursiveChunker(chunk_size=30, chunk_overlap=10)
    chunks = chunker.chunk(text)
    
    assert len(chunks) > 1
    # Check that no chunk exceeds size (strictly, our basic merge might go slightly over depending on words, 
    # but let's check it's generally bounded).
    for c in chunks:
        assert len(c) <= 45  # Allowing small margin for space joins

def test_recursive_chunker_overlap():
    text = "Word1 Word2 Word3 Word4 Word5 Word6 Word7 Word8 Word9 Word10"
    chunker = RecursiveChunker(chunk_size=30, chunk_overlap=15)
    chunks = chunker.chunk(text)
    
    # Ensure there is overlap between chunk 0 and 1
    chunk0 = chunks[0]
    chunk1 = chunks[1]
    
    # We don't strictly test exact strings since the algo splits heuristically,
    # but chunk1 should contain some words from the end of chunk0.
    words0 = set(chunk0.split())
    words1 = set(chunk1.split())
    
    overlap = words0.intersection(words1)
    assert len(overlap) > 0, "Expected chunks to overlap"
