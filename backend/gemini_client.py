"""Talks to Google Gemini: builds a RAG prompt and asks a question."""

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

MODEL_NAME = "gemini-2.5-flash"


def ask_gemini(question: str, context_chunks: list[str], chat_history: list[dict]) -> str:
    """Ask Gemini a question, grounded in retrieved context + past chat turns.

    context_chunks: the relevant text snippets pulled from ChromaDB.
    chat_history: previous [{"role": "user"|"assistant", "content": str}, ...]
                  so the model remembers the conversation for follow-ups.
    """
    if not api_key:
        return (
            "⚠️ No GEMINI_API_KEY found. Add your key to backend/.env "
            "(see .env.example) and restart the server."
        )

    model = genai.GenerativeModel(MODEL_NAME)

    context_text = "\n\n---\n\n".join(context_chunks) if context_chunks else "(no relevant context found)"

    # Turn prior messages into a simple transcript so Gemini has memory of
    # earlier questions/answers and can handle follow-up questions.
    history_text = ""
    for turn in chat_history[-10:]:  # keep only the last 10 turns to stay small
        speaker = "User" if turn["role"] == "user" else "Assistant"
        history_text += f"{speaker}: {turn['content']}\n"

    prompt = f"""You are a helpful research assistant. Answer the user's question
using ONLY the context provided below. If the answer isn't in the context,
say you don't know instead of making something up.

CONTEXT:
{context_text}

CONVERSATION SO FAR:
{history_text if history_text else "(this is the first question)"}

NEW QUESTION: {question}

Answer clearly and concisely:"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"⚠️ Gemini API error: {e}"
