# AI Research Assistant

A small RAG (Retrieval-Augmented Generation) app with two chat modes:

1. **PDF Bot** — upload a PDF, then ask questions about it.
2. **Wikipedia Bot** — type a topic, then ask questions about its Wikipedia article.

Both modes remember the conversation, so you can ask follow-up questions
("what about...?", "why?") and the bot still knows what you were talking about.

## How the RAG pipeline works (in simple words)

RAG means: *don't make Gemini answer from memory alone — give it the actual
text to read first.* Here's the pipeline every question goes through:

1. **Extract** — get plain text out of the source.
   - PDF Bot: `pypdf` reads every page of the uploaded PDF.
   - Wikipedia Bot: the `wikipedia` package downloads the article's full text.
2. **Chunk** — the text is cut into ~1000-character overlapping pieces
   ([backend/text_utils.py](backend/text_utils.py)). Small pieces retrieve better
   than one giant blob, and the overlap keeps sentences from being cut in half.
3. **Store** — each chunk is saved into **ChromaDB**, a vector database
   ([backend/vector_store.py](backend/vector_store.py)). Chroma automatically turns
   every chunk into an embedding (a list of numbers representing its meaning).
4. **Retrieve** — when you ask a question, Chroma compares your question's
   embedding to every stored chunk and returns the 4 most relevant ones.
5. **Generate** — those chunks, your question, and the recent chat history
   are combined into one prompt and sent to **Gemini 2.5 Flash**
   ([backend/gemini_client.py](backend/gemini_client.py)), which writes the answer.
6. **Show sources** — the chunks that were actually used are returned to the
   frontend so you can verify where the answer came from.

Each browser session gets its own ChromaDB collection and its own chat
history, so uploading a new PDF (or picking a new topic) always starts fresh.

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Python, FastAPI, uvicorn |
| PDF parsing | pypdf |
| Wikipedia fetching | `wikipedia` package |
| Vector database | ChromaDB (local, persisted to disk) |
| LLM | Google Gemini (`gemini-2.5-flash`) via `google-generativeai` |
| Frontend | React (Vite), plain CSS |

## Project structure

```
backend/
  main.py            FastAPI app: routes for session/upload/wikipedia/chat
  pdf_utils.py        Extracts text from a PDF using pypdf
  wiki_utils.py       Fetches a Wikipedia article's text
  text_utils.py       Splits long text into overlapping chunks
  vector_store.py     Wraps ChromaDB: store + retrieve chunks per session
  gemini_client.py     Builds the RAG prompt and calls Gemini
  requirements.txt
  .env.example        Copy to .env and add your Gemini key
frontend/
  src/
    App.jsx                     Top-level screen switcher (select/load/chat)
    api.js                      fetch() calls to the backend
    components/
      ModeSelect.jsx            "PDF Bot vs Wikipedia Bot" screen
      SourceLoader.jsx          Upload a PDF / type a topic
      ChatWindow.jsx            Message list + input box
      SourcesPanel.jsx          Collapsible source-chunk viewer per answer
    index.css                   Light theme styling
```

## How to run it

### 1. Backend (port 8000)

```bash
cd backend
python -m venv venv
./venv/Scripts/activate        # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

cp .env.example .env           # then edit .env and paste your Gemini API key
                                # get a free key at https://aistudio.google.com/apikey

uvicorn main:app --reload --port 8000
```

### 2. Frontend (port 5173)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

> Note: this project was set up with Python 3.12. Very new Python versions
> (e.g. 3.14) may not yet have prebuilt Windows wheels for ChromaDB's
> dependencies, which can force a slow/failing source build.

## Notes

- Chat history and the loaded document live in the backend's memory (and
  ChromaDB on disk) — restarting the backend clears all sessions.
- `backend/chroma_db/` is where Chroma persists its data; it's git-ignored.
- This is a learning/demo project, not hardened for production (e.g. no
  auth, no per-user storage limits).
