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
    
    assert result == "[Document: Apple_10K_2024.pdf | Page: 14 | Section: 3]"
    assert chunk_text not in result

def test_generate_contextual_header_only_doc():
    chunk_text = "Just some plain text."
    doc_name = "notes.txt"
    
    result = generate_contextual_header(
        document_name=doc_name,
        chunk_text=chunk_text
    )
    
    assert result == "[Document: notes.txt]"
    assert chunk_text not in result
    assert "Page:" not in result
