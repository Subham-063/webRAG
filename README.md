# WebRAG

A Retrieval-Augmented Generation (RAG) system that transforms any website into an intelligent knowledge base. The application crawls web pages, extracts text (including OCR from images), generates embeddings, stores them in MongoDB Atlas Vector Search, and answers user queries using semantic search and an LLM.

## Features

- Recursive website crawling
- OCR support for image-based text
- Intelligent text chunking
- OpenAI Embeddings
- MongoDB Atlas Vector Search
- Semantic Retrieval
- Context-aware Question Answering
- Memory support for conversations

## Tech Stack

- Node.js
- LangChain
- MongoDB Atlas
- OpenAI API
- Playwright
- Tesseract OCR

## Project Structure

```
.
├── utils/
├── ingestion.js
├── retriever.js
├── ask.js
├── memory.js
├── package.json
└── .env.example
```

## Installation

```bash
git clone <repository-url>

npm install

cp .env.example .env
```

Fill the `.env` file with your own credentials.

Run ingestion

```bash
node ingestion.js
```

Ask questions

```bash
node ask.js
```

## Future Improvements

- PDF ingestion
- Hybrid Search
- Better reranking
- Streamlit / React UI
- Citation support
- Multi-website indexing