from typing import List
from lete.app.schemas.section import DocumentSectionCreate
from lete.app.parsing.base import BaseParser

# python-calamine is a Rust-based library that handles ALL Excel formats correctly:
#   - .xlsx  (standard Open XML)
#   - .xlsx  (Strict Open XML — which openpyxl CANNOT read)
#   - .xls   (legacy BIFF8 binary, Excel 97-2003)
#   - .xlsb  (binary xlsx)
#   - .ods   (OpenDocument Spreadsheet)
#
# We replace the old openpyxl+xlrd dual-backend approach with a single calamine
# backend that handles all formats transparently, regardless of file extension.


class XlsxParser(BaseParser):
    """
    Parses all Excel-family files (.xlsx, .xls, .xlsb, .ods, etc.) via python-calamine.
    
    calamine auto-detects the actual file format from its binary content (magic bytes),
    completely ignoring the filename extension. This means it correctly handles:
      - Standard xlsx (ZIP/OOXML)
      - Strict Open XML xlsx (the variant that breaks openpyxl)
      - Legacy .xls binary (BIFF8)
      - .xlsb (binary xlsx)
    
    Each worksheet produces batches of sections so every chunk is self-contained
    (header + N rows), yielding high-quality embeddings.
    """
    ROWS_PER_SECTION = 100

    def parse(self, file_path: str, document_id: str, filename: str = "") -> List[DocumentSectionCreate]:
        from python_calamine import CalamineWorkbook

        wb = CalamineWorkbook.from_path(file_path)
        sections: List[DocumentSectionCreate] = []
        section_idx = 0

        for sheet_name in wb.sheet_names:
            sheet = wb.get_sheet_by_name(sheet_name)
            rows = list(sheet.to_python())

            if not rows:
                continue

            # Treat first row as header; stringify all values
            header = [str(cell) if cell is not None else "" for cell in rows[0]]
            data_rows = [
                [str(cell) if cell is not None else "" for cell in row]
                for row in rows[1:]
            ]

            header_line = ", ".join(h for h in header if h)

            for batch_start in range(0, max(len(data_rows), 1), self.ROWS_PER_SECTION):
                batch = data_rows[batch_start: batch_start + self.ROWS_PER_SECTION]
                if not batch:
                    continue

                lines = [
                    f"Sheet: {sheet_name}",
                    f"Columns: {header_line}",
                    "",
                ]
                for row in batch:
                    pairs = [
                        f"{col}: {val}"
                        for col, val in zip(header, row)
                        if col and val
                    ]
                    if pairs:
                        lines.append(" | ".join(pairs))

                content = self._clean_text("\n".join(lines))
                if content:
                    sections.append(
                        DocumentSectionCreate(
                            document_id=document_id,
                            content=content,
                            page_number=1,
                            section_index=section_idx,
                        )
                    )
                    section_idx += 1

        return sections
