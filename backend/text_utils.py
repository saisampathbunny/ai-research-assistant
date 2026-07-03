"""Small helper for splitting long text into overlapping chunks.

Why chunks? Gemini (and the retriever) work best on small pieces of text
instead of one giant wall of text. Overlap keeps a bit of context from the
previous chunk so we don't cut a sentence's meaning in half.
"""

CHUNK_SIZE = 1000  # characters per chunk
CHUNK_OVERLAP = 200  # characters shared between consecutive chunks


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split `text` into overlapping chunks of roughly `chunk_size` characters."""
    text = text.strip()
    if not text:
        return []

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        # move the window forward, keeping `overlap` characters for context
        start += chunk_size - overlap

    return chunks
