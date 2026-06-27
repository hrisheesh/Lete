from typing import List
import fitz # PyMuPDF
from lete.app.schemas.section import DocumentSectionCreate
from lete.app.parsing.base import BaseParser

class PdfParser(BaseParser):
    def parse(self, file_path: str, document_id: str) -> List[DocumentSectionCreate]:
        sections = []
        doc = fitz.open(file_path)
        
        section_idx = 0
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            
            # Simple chunking by paragraph/blocks for now
            # PyMuPDF block format: (x0, y0, x1, y1, "text", block_no, block_type)
            blocks = page.get_text("blocks")
            
            for block in blocks:
                if block[6] == 0: # 0 means text block
                    content = self._clean_text(block[4])
                    if content:
                        sections.append(DocumentSectionCreate(
                            document_id=document_id,
                            content=content,
                            page_number=page_num + 1,
                            section_index=section_idx
                        ))
                        section_idx += 1
                        
        return sections
