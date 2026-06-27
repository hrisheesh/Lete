from abc import ABC, abstractmethod
from typing import List, Generator
from lete.app.schemas.section import DocumentSectionCreate

class BaseParser(ABC):
    @abstractmethod
    def parse(self, file_path: str, document_id: str) -> List[DocumentSectionCreate]:
        """
        Parses a file and extracts DocumentSections.
        """
        pass

    def _clean_text(self, text: str) -> str:
        """
        Cleans extracted text by normalizing whitespace.
        """
        import re
        return re.sub(r'\s+', ' ', text).strip()
