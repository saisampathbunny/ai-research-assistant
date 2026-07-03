"""FastAPI backend for the AI Research Assistant.

Two RAG modes share the same pipeline:
  1. Extract text  (from a PDF, or a Wikipedia article)
  2. Chunk it into small pieces
  3. Store the chunks in ChromaDB (a vector database)
  4. On each question: retrieve the most relevant chunks, send them + the
     question (+ chat history) to Gemini, and return the answer.

Each browser tab gets its own `session_id` so multiple people/documents
don't mix, and each session keeps its own chat history for memory.
"""

import uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pdf_utils import extract_text_from_pdf
from wiki_utils import fetch_wikipedia_article, WikipediaFetchError
from text_utils import chunk_text
from vector_store import reset_session_collection, add_chunks, query_chunks
from gemini_client import ask_gemini

app = FastAPI(title="AI Research Assistant")

# Allow the React dev server to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store: session_id -> {"history": [...], "source": {...}}
# This is fine for a demo app; it resets whenever the server restarts.
sessions: dict = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class WikipediaRequest(BaseModel):
    session_id: str
    topic: str


def _get_or_create_session(session_id: str) -> dict:
    if session_id not in sessions:
        sessions[session_id] = {"history": [], "source": None}
    return sessions[session_id]


@app.post("/api/session/new")
def new_session():
    """Create a fresh session id for a new chat (called when a mode is picked)."""
    session_id = str(uuid.uuid4())
    sessions[session_id] = {"history": [], "source": None}
    return {"session_id": session_id}


@app.post("/api/pdf/upload")
async def upload_pdf(session_id: str = Form(...), file: UploadFile = File(...)):
    """Extract text from an uploaded PDF, chunk it, and store it in ChromaDB."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Please upload a PDF file.")

    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)

    if not text.strip():
        raise HTTPException(400, "Couldn't extract any text from this PDF.")

    chunks = chunk_text(text)
    metadatas = [{"source": file.filename, "chunk_index": i} for i in range(len(chunks))]

    reset_session_collection(session_id)
    add_chunks(session_id, chunks, metadatas)

    session = _get_or_create_session(session_id)
    session["history"] = []  # new document -> fresh conversation
    session["source"] = {"type": "pdf", "name": file.filename}

    return {"message": f"Loaded '{file.filename}'", "num_chunks": len(chunks)}


@app.post("/api/wikipedia/load")
def load_wikipedia(req: WikipediaRequest):
    """Fetch a Wikipedia article, chunk it, and store it in ChromaDB."""
    try:
        article = fetch_wikipedia_article(req.topic)
    except WikipediaFetchError as e:
        raise HTTPException(404, str(e))

    chunks = chunk_text(article["content"])
    metadatas = [
        {"source": article["title"], "url": article["url"], "chunk_index": i}
        for i in range(len(chunks))
    ]

    reset_session_collection(req.session_id)
    add_chunks(req.session_id, chunks, metadatas)

    session = _get_or_create_session(req.session_id)
    session["history"] = []  # new topic -> fresh conversation
    session["source"] = {"type": "wikipedia", "name": article["title"], "url": article["url"]}

    return {"message": f"Loaded '{article['title']}'", "num_chunks": len(chunks), "url": article["url"]}


@app.post("/api/chat")
def chat(req: ChatRequest):
    """Answer a question using retrieved chunks + Gemini, remembering history."""
    session = _get_or_create_session(req.session_id)

    if session["source"] is None:
        raise HTTPException(400, "Load a PDF or Wikipedia topic before asking questions.")

    retrieved = query_chunks(req.session_id, req.message, n_results=4)
    context_chunks = [item["text"] for item in retrieved]

    answer = ask_gemini(req.message, context_chunks, session["history"])

    # Save this turn so future questions in the session have memory of it.
    session["history"].append({"role": "user", "content": req.message})
    session["history"].append({"role": "assistant", "content": answer})

    return {
        "answer": answer,
        "sources": [{"text": item["text"], "metadata": item["metadata"]} for item in retrieved],
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
