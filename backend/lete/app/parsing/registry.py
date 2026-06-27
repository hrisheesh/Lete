from typing import Dict, Type
from lete.app.parsing.base import BaseParser
from lete.app.parsing.txt_parser import TxtParser
from lete.app.parsing.pdf_parser import PdfParser
from lete.app.parsing.docx_parser import DocxParser

class ParserRegistry:
    _parsers: Dict[str, Type[BaseParser]] = {
        "txt": TxtParser,
        "md": TxtParser,
        "csv": TxtParser, # Very simple fallback for now
        "pdf": PdfParser,
        "docx": DocxParser
    }

    @classmethod
    def get_parser(cls, extension: str) -> BaseParser:
        ext = extension.lower().strip('.')
        parser_class = cls._parsers.get(ext)
        if not parser_class:
            raise ValueError(f"No parser found for extension: {ext}")
        return parser_class()
