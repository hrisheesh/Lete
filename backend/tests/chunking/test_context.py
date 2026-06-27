from lete.app.chunking.context import generate_contextual_header

def test_generate_contextual_header_all_fields():
    chunk_text = "This is an important risk factor for the upcoming year."
    doc_name = "Apple_10K_2024.pdf"
    
    result = generate_contextual_header(
        document_name=doc_name,
        chunk_text=chunk_text,
        page_number=14,
        section_index=3
    )
    
    assert "[Document: Apple_10K_2024.pdf | Page: 14 | Section Index: 3]" in result
    assert "This is an important risk factor" in result

def test_generate_contextual_header_only_doc():
    chunk_text = "Just some plain text."
    doc_name = "notes.txt"
    
    result = generate_contextual_header(
        document_name=doc_name,
        chunk_text=chunk_text
    )
    
    assert "[Document: notes.txt]" in result
    assert "Just some plain text." in result
    assert "Page:" not in result
