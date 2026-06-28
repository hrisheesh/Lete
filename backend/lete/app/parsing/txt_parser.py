from typing import List
import re
from lete.app.schemas.section import DocumentSectionCreate
from lete.app.parsing.base import BaseParser

class TxtParser(BaseParser):
    def parse(self, file_path: str, document_id: str, filename: str = "") -> List[DocumentSectionCreate]:
        sections = []
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Split loosely by double newlines to form logical paragraphs/sections
        chunks = re.split(r'\n\s*\n', content)
        
        section_idx = 0
        for chunk in chunks:
            cleaned = self._clean_text(chunk)
            if cleaned:
                sections.append(DocumentSectionCreate(
                    document_id=document_id,
                    content=cleaned,
                    page_number=1, # Txt has no pages
                    section_index=section_idx
                ))
                section_idx += 1
                
        return sections
