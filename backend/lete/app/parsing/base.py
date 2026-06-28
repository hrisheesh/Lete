from abc import ABC, abstractmethod
from typing import List, Generator
from lete.app.schemas.section import DocumentSectionCreate

class BaseParser(ABC):
    @abstractmethod
    def parse(self, file_path: str, document_id: str, filename: str = "") -> List[DocumentSectionCreate]:
        """
        Parses a file and extracts DocumentSections.
        
        Args:
            file_path: Absolute path to the file on disk (may not have an extension).
            document_id: UUID of the parent document record.
            filename: Original filename with extension (e.g. "report.xls"). Used to
                      determine the file format when the on-disk path has no extension.
        """
        pass

    def _clean_text(self, text: str) -> str:
        """
        Cleans extracted text by normalizing whitespace.
        """
        import re
        return re.sub(r'\s+', ' ', text).strip()
