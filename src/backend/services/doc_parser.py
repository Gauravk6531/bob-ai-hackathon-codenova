"""Document parser — extracts section headings from .txt and .pdf files."""
from __future__ import annotations

import re
from typing import List

try:
    import fitz  # PyMuPDF

    _PYMUPDF_AVAILABLE = True
except ImportError:
    _PYMUPDF_AVAILABLE = False

try:
    from pdfminer.high_level import extract_text as pdfminer_extract

    _PDFMINER_AVAILABLE = True
except ImportError:
    _PDFMINER_AVAILABLE = False


_HEADING_PATTERN = re.compile(
    r'^\s*(\d+(?:\.\d+)*(?:\.[A-Z](?:\.\d+)?)?)\s+(.+)$',
    re.MULTILINE,
)

_KEYWORD_HEADING = re.compile(
    r'^(?:module\s+\d|section\s+\d|chapter\s+\d|appendix\s|annex\s|\d+\.\s)',
    re.IGNORECASE | re.MULTILINE,
)


def extract_headings_from_text(text: str) -> List[str]:
    """Return a list of detected section heading strings from plain text."""
    headings: List[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if _HEADING_PATTERN.match(stripped) or _KEYWORD_HEADING.match(stripped):
            headings.append(stripped)
    return headings


def parse_file(filename: str, content: bytes) -> List[str]:
    """
    Extract headings from an uploaded file.
    Supports .txt and .pdf.
    """
    lower = filename.lower()
    if lower.endswith('.txt'):
        text = content.decode('utf-8', errors='replace')
        return extract_headings_from_text(text)
    elif lower.endswith('.pdf'):
        return _parse_pdf(content)
    else:
        # Attempt plain text decode
        text = content.decode('utf-8', errors='replace')
        return extract_headings_from_text(text)


def _parse_pdf(content: bytes) -> List[str]:
    """Extract headings from a PDF file using PyMuPDF or pdfminer."""
    if _PYMUPDF_AVAILABLE:
        import fitz  # noqa: F811
        doc = fitz.open(stream=content, filetype='pdf')
        text = '\n'.join(page.get_text() for page in doc)
        return extract_headings_from_text(text)
    elif _PDFMINER_AVAILABLE:
        import io
        text = pdfminer_extract(io.BytesIO(content))
        return extract_headings_from_text(text)
    else:
        raise RuntimeError("No PDF parser available. Install PyMuPDF or pdfminer.six.")
