from typing import List
import csv
from lete.app.schemas.section import DocumentSectionCreate
from lete.app.parsing.base import BaseParser


class CsvParser(BaseParser):
    """
    Parses CSV files by grouping rows into sections for meaningful chunking.
    Each section contains a batch of rows + the header line so chunks are self-contained.
    """
    ROWS_PER_SECTION = 100

    def parse(self, file_path: str, document_id: str, filename: str = "") -> List[DocumentSectionCreate]:
        sections = []
        section_idx = 0

        with open(file_path, "r", encoding="utf-8", errors="replace", newline="") as f:
            reader = csv.reader(f)
            rows = list(reader)

        if not rows:
            return []

        header = rows[0]
        header_line = ", ".join(header)
        data_rows = rows[1:]

        # Group rows into sections so each chunk has context (header + N rows)
        for batch_start in range(0, max(len(data_rows), 1), self.ROWS_PER_SECTION):
            batch = data_rows[batch_start: batch_start + self.ROWS_PER_SECTION]
            if not batch:
                continue

            lines = [f"Columns: {header_line}", ""]
            for row in batch:
                # Format as "Column: Value" pairs for semantic richness
                pairs = [f"{col.strip()}: {val.strip()}" for col, val in zip(header, row)]
                lines.append(" | ".join(pairs))

            content = self._clean_text("\n".join(lines))
            if content:
                sections.append(DocumentSectionCreate(
                    document_id=document_id,
                    content=content,
                    page_number=1,
                    section_index=section_idx
                ))
                section_idx += 1

        return sections
