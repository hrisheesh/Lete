from typing import List
from lete.app.schemas.section import DocumentSectionCreate
from lete.app.parsing.base import BaseParser


class JsonParser(BaseParser):
    """
    Parses JSON files by pretty-printing them as human-readable text sections.
    If the root is a list, each item becomes its own section.
    If the root is a dict, the whole document is a single section.
    """
    MAX_ITEMS_PER_SECTION = 20

    def parse(self, file_path: str, document_id: str, filename: str = "") -> List[DocumentSectionCreate]:
        import json

        sections = []

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                # Fallback: treat as plain text if invalid JSON
                f.seek(0)
                content = self._clean_text(f.read())
                if content:
                    sections.append(DocumentSectionCreate(
                        document_id=document_id,
                        content=content,
                        page_number=1,
                        section_index=0
                    ))
                return sections

        if isinstance(data, list):
            # Batch list items into sections
            for batch_start in range(0, max(len(data), 1), self.MAX_ITEMS_PER_SECTION):
                batch = data[batch_start: batch_start + self.MAX_ITEMS_PER_SECTION]
                content = self._clean_text(json.dumps(batch, indent=2, ensure_ascii=False))
                if content:
                    sections.append(DocumentSectionCreate(
                        document_id=document_id,
                        content=content,
                        page_number=1,
                        section_index=batch_start // self.MAX_ITEMS_PER_SECTION
                    ))
        else:
            # Single dict or primitive
            content = self._clean_text(json.dumps(data, indent=2, ensure_ascii=False))
            if content:
                sections.append(DocumentSectionCreate(
                    document_id=document_id,
                    content=content,
                    page_number=1,
                    section_index=0
                ))

        return sections
