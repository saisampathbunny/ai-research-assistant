"""Thin wrapper around ChromaDB: one collection per chat session.

ChromaDB stores each text chunk together with an auto-generated embedding
(a list of numbers that captures the chunk's meaning). When we "query" it
with a question, Chroma compares the question's embedding to every chunk's
embedding and returns the closest (most relevant) matches.
"""

import chromadb

# Persist to disk so chunks survive a server restart (folder is git-ignored).
_client = chromadb.PersistentClient(path="./chroma_db")


def _collection_name(session_id: str) -> str:
    return f"session_{session_id}"


def reset_session_collection(session_id: str):
    """Delete any existing collection for this session and start fresh.

    Called whenever the user uploads a new PDF or loads a new Wikipedia
    topic, so old chunks from a previous document don't leak into answers.
    """
    name = _collection_name(session_id)
    try:
        _client.delete_collection(name)
    except Exception:
        pass  # collection didn't exist yet, that's fine
    return _client.create_collection(name=name)


def add_chunks(session_id: str, chunks: list[str], metadatas: list[dict]):
    """Store text chunks (with metadata like source/title) for this session."""
    collection = _client.get_collection(_collection_name(session_id))
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.add(documents=chunks, metadatas=metadatas, ids=ids)


def query_chunks(session_id: str, question: str, n_results: int = 4) -> list[dict]:
    """Return the most relevant chunks (with metadata) for a question."""
    try:
        collection = _client.get_collection(_collection_name(session_id))
    except Exception:
        return []

    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_texts=[question],
        n_results=min(n_results, count),
    )

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    return [
        {"text": doc, "metadata": meta}
        for doc, meta in zip(documents, metadatas)
    ]
