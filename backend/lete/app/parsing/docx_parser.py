from typing import List
from docx import Document
from lete.app.schemas.section import DocumentSectionCreate
from lete.app.parsing.base import BaseParser

class DocxParser(BaseParser):
    def parse(self, file_path: str, document_id: str) -> List[DocumentSectionCreate]:
        sections = []
        doc = Document(file_path)
        
        section_idx = 0
        for para in doc.paragraphs:
            content = self._clean_text(para.text)
            if content:
                sections.append(DocumentSectionCreate(
                    document_id=document_id,
                    content=content,
                    page_number=1, # docx doesn't easily expose pages via python-docx
                    section_index=section_idx
                ))
                section_idx += 1
                
        return sections
