import os
from lete.app.parsing.txt_parser import TxtParser
from lete.app.parsing.registry import ParserRegistry

def test_txt_parser(tmp_path):
    file_path = tmp_path / "test.txt"
    file_path.write_text("Hello world.\n\nThis is a new section.\n    It has some extra spaces.\n\nSection 3.")
    
    parser = TxtParser()
    sections = parser.parse(str(file_path), "doc_123")
    
    assert len(sections) == 3
    assert sections[0].content == "Hello world."
    assert sections[1].content == "This is a new section. It has some extra spaces."
    assert sections[2].content == "Section 3."
    assert sections[0].document_id == "doc_123"

def test_registry():
    parser = ParserRegistry.get_parser("txt")
    assert isinstance(parser, TxtParser)
    
    parser = ParserRegistry.get_parser("md")
    assert isinstance(parser, TxtParser)
    
    parser = ParserRegistry.get_parser("csv")
    assert isinstance(parser, TxtParser)
    
    try:
        ParserRegistry.get_parser("unknown")
        assert False, "Should have raised ValueError"
    except ValueError:
        pass
