from typing import List
from lete.app.schemas.section import DocumentSectionCreate
from lete.app.parsing.base import BaseParser


class XlsxParser(BaseParser):
    """
    Parses Excel (.xlsx, .xls) files using openpyxl.
    Each worksheet becomes a section group.
    Rows are batched so chunks are semantically self-contained (header + N rows each).
    """
    ROWS_PER_SECTION = 100

    def parse(self, file_path: str, document_id: str) -> List[DocumentSectionCreate]:
        import openpyxl

        sections = []
        section_idx = 0

        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)

        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            rows = list(ws.iter_rows(values_only=True))

            if not rows:
                continue

            # Treat first non-empty row as header
            header = [str(cell) if cell is not None else "" for cell in rows[0]]
            data_rows = rows[1:]

            for batch_start in range(0, max(len(data_rows), 1), self.ROWS_PER_SECTION):
                batch = data_rows[batch_start: batch_start + self.ROWS_PER_SECTION]
                if not batch:
                    continue

                lines = [f"Sheet: {sheet_name}", f"Columns: {', '.join(h for h in header if h)}", ""]
                for row in batch:
                    row_vals = [str(cell) if cell is not None else "" for cell in row]
                    pairs = [
                        f"{col}: {val}"
                        for col, val in zip(header, row_vals)
                        if col and val
                    ]
                    if pairs:
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

        wb.close()
        return sections
