"""Extract plain text out of an uploaded PDF file using pypdf."""

from io import BytesIO
from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Read every page of a PDF and return all the text joined together."""
    reader = PdfReader(BytesIO(file_bytes))

    text = ""
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text += page_text + "\n"

    return text
