# AI Research Assistant

An AI-powered research assistant that uses Retrieval-Augmented Generation (RAG)
to answer questions from uploaded PDF documents and Wikipedia articles.

## Overview

AI Research Assistant allows users to interact with external knowledge sources
through a simple chat interface.

The application supports two modes:

- **PDF Bot** — Upload a PDF and ask questions about its content.
- **Wikipedia Bot** — Enter a topic and ask questions about the related
  Wikipedia article.

The system retrieves relevant information from the selected source before
sending it to the Gemini LLM. This helps generate answers based on the actual
source content instead of relying only on the model's internal knowledge.

## Features

- Upload and analyze PDF documents.
- Retrieve information from Wikipedia.
- Retrieval-Augmented Generation (RAG).
- Semantic search using vector embeddings.
- ChromaDB vector database.
- Gemini 2.5 Flash for answer generation.
- Conversation memory for follow-up questions.
- Source chunks displayed with each answer.
- Separate session for each user interaction.

## How It Works

The application follows a simple RAG pipeline:

```text
User
  |
  v
Frontend
HTML + CSS + JavaScript
  |
  v
FastAPI Backend
  |
  +---- PDF / Wikipedia
  |
  v
Text Extraction
  |
  v
Text Chunking
  |
  v
ChromaDB
  |
  v
Similarity Search
  |
  v
Relevant Chunks
  |
  v
Gemini 2.5 Flash
  |
  v
Answer + Sources
  |
  v
Frontend
