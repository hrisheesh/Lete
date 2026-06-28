from typing import Dict, FrozenSet, Type
from lete.app.parsing.base import BaseParser
from lete.app.parsing.txt_parser import TxtParser
from lete.app.parsing.pdf_parser import PdfParser
from lete.app.parsing.docx_parser import DocxParser
from lete.app.parsing.csv_parser import CsvParser
from lete.app.parsing.xlsx_parser import XlsxParser
from lete.app.parsing.pptx_parser import PptxParser
from lete.app.parsing.json_parser import JsonParser


class ParserRegistry:
    """
    Central registry mapping file extensions to their parser implementations.

    IMPORTANT: If you add a new parser, add its extension here AND in SUPPORTED_EXTENSIONS.
    The upload endpoint uses SUPPORTED_EXTENSIONS to reject unsupported files BEFORE they
    are persisted to disk, so the user gets a clear 422 error immediately instead of a
    silent background failure minutes later.
    """

    _parsers: Dict[str, Type[BaseParser]] = {
        # Plain text formats
        "txt":  TxtParser,
        "md":   TxtParser,
        "rst":  TxtParser,
        # Structured data
        "csv":  CsvParser,   # Proper CSV parser, not raw text dump
        "tsv":  CsvParser,
        "xlsx": XlsxParser,
        "xls":  XlsxParser,
        # Document formats
        "pdf":  PdfParser,
        "docx": DocxParser,
        # Presentation formats
        "pptx": PptxParser,
        # Data interchange
        "json": JsonParser,
    }

    # Frozenset of all extensions we accept — used at upload time for early rejection.
    SUPPORTED_EXTENSIONS: FrozenSet[str] = frozenset(_parsers.keys())

    @classmethod
    def get_parser(cls, extension: str) -> BaseParser:
        ext = extension.lower().strip(".")
        parser_class = cls._parsers.get(ext)
        if not parser_class:
            supported = ", ".join(sorted(cls.SUPPORTED_EXTENSIONS))
            raise ValueError(
                f"Unsupported file type: '.{ext}'. "
                f"Supported formats: {supported}"
            )
        return parser_class()

    @classmethod
    def is_supported(cls, extension: str) -> bool:
        return extension.lower().strip(".") in cls.SUPPORTED_EXTENSIONS
