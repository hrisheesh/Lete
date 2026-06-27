from typing import List
import fitz # PyMuPDF
from lete.app.schemas.section import DocumentSectionCreate
from lete.app.parsing.base import BaseParser

class PdfParser(BaseParser):
    def parse(self, file_path: str, document_id: str) -> List[DocumentSectionCreate]:
        sections = []
        doc = fitz.open(file_path)
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            # Extract entire page text at once, preserving layout/paragraphs
            text = page.get_text("text")
            content = self._clean_text(text)
            
            if content:
                sections.append(DocumentSectionCreate(
                    document_id=document_id,
                    content=content,
                    page_number=page_num + 1,
                    section_index=page_num
                ))
                        
        return sections
