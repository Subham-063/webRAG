# WebRAG

<div align="center">

**Production-oriented Retrieval-Augmented Generation (RAG) system for transforming websites into intelligent, searchable knowledge bases.**

Concurrent Web Crawling • OCR • Hybrid Retrieval • MongoDB Atlas Vector Search • LLM Reranking

![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-412991?style=for-the-badge&logo=openai&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Web%20Crawler-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

</div>

---

## Overview

**WebRAG** is a production-oriented Retrieval-Augmented Generation (RAG) system that converts websites into intelligent, searchable knowledge bases.

The system automatically crawls websites, renders JavaScript-powered pages, extracts meaningful textual content, performs OCR on relevant images, generates semantic embeddings using OpenAI, indexes the processed knowledge inside MongoDB Atlas Vector Search, and answers user queries through hybrid retrieval and LLM-powered reranking.

Unlike traditional chatbots, WebRAG retrieves relevant knowledge before generating responses, ensuring that every answer remains grounded in the indexed content.

---

# Key Features

## Website Ingestion

- Concurrent website crawling
- Dynamic page rendering using Playwright
- Internal link discovery
- Domain-restricted crawling
- Browser reuse for improved performance

## Content Processing

- Dynamic HTML extraction
- OCR using Tesseract.js
- Intelligent image filtering
- Recursive semantic chunking
- Duplicate detection using content hashing

## Semantic Indexing

- OpenAI Embeddings (`text-embedding-3-small`)
- MongoDB Atlas Vector Search
- Metadata-aware document storage
- Incremental indexing

## Retrieval

- Vector similarity search
- MongoDB keyword search
- Hybrid retrieval pipeline
- GPT-based document reranking
- Context-grounded response generation

## Engineering

- Modular architecture
- ES Modules
- Config-driven design
- Graceful shutdown
- Worker-pool crawler
- Production-oriented codebase

---

# System Architecture

```text
                               ┌────────────────────────────┐
                               │         Website            │
                               └──────────────┬─────────────┘
                                              │
                                              ▼
                             Concurrent Playwright Crawler
                                              │
                                              ▼
                                 Dynamic Web Scraper
                                              │
                 ┌────────────────────────────┴────────────────────────────┐
                 │                                                         │
                 ▼                                                         ▼
        HTML Content Extraction                                   Image Filtering
                                                                          │
                                                                          ▼
                                                                         OCR
                 └────────────────────────────┬────────────────────────────┘
                                              ▼
                                      Combined Document
                                              ▼
                                   Recursive Text Splitter
                                              ▼
                                   OpenAI Embedding Model
                                              ▼
                              MongoDB Atlas Vector Search

══════════════════════════════════════════════════════════════════════════════

                                 Retrieval Pipeline

══════════════════════════════════════════════════════════════════════════════

                                     User Query
                                          │
                                          ▼
                                   Query Embedding
                                          │
                                          ▼
                            Hybrid Search (Vector + Keyword)
                                          │
                                          ▼
                                GPT Document Reranker
                                          │
                                          ▼
                                Context Construction
                                          │
                                          ▼
                                 OpenAI GPT-4.1 Answer
```

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Runtime | Node.js |
| Language | JavaScript (ES Modules) |
| Web Crawling | Playwright |
| OCR | Tesseract.js |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | GPT-4.1 / GPT-4.1 Mini |
| Database | MongoDB Atlas |
| Retrieval | MongoDB Atlas Vector Search |
| Search Strategy | Hybrid Retrieval (Vector + Keyword) |

---

# Project Structure

```text
WebRAG
│
├── config/
│   └── config.js
│
├── utils/
│   ├── crawler.js
│   ├── scraper.js
│   ├── embedding.js
│   ├── reranker.js
│   ├── ocr.js
│   ├── imageFilter.js
│   ├── splitter.js
│   ├── logger.js
│   └── hash.js
│
├── ask.js
├── ingestion.js
├── retriever.js
│
├── package.json
├── package-lock.json
└── README.md
```

---

# Workflow

## Ingestion Pipeline

1. Crawl the target website.
2. Render dynamic pages.
3. Extract textual content.
4. Filter meaningful images.
5. Perform OCR.
6. Merge extracted content.
7. Split into semantic chunks.
8. Generate OpenAI embeddings.
9. Store vectors in MongoDB Atlas.

---

## Retrieval Pipeline

1. Receive user query.
2. Generate query embedding.
3. Perform hybrid retrieval.
4. Rerank retrieved documents.
5. Build contextual prompt.
6. Generate grounded response using GPT-4.1.

---

# Installation

Clone the repository

```bash
git clone https://github.com/Subham-063/webRAG.git

cd webRAG
```

Install dependencies

```bash
npm install
```

Install Playwright browsers

```bash
npx playwright install
```

---

# Environment Variables

Create a `.env` file.

```env
OPENAI_API_KEY=your_openai_api_key

MONGODB_URI=your_mongodb_connection_string

DB_NAME=rag-db
COLLECTION_NAME=website-data
PROGRESS_COLLECTION=progress

INDEX_NAME=vector_index

SEED_URL=https://example.com
```

---

# Usage

## Index a Website

```bash
npm run ingest
```

Example

```env
SEED_URL=https://playwright.dev/docs
```

---

## Ask Questions

```bash
npm run ask
```

Example

```text
> What is Playwright?

> How do I install Playwright?

> What browsers does Playwright support?

> What is playwright.devices?

> How do I launch Chromium?
```

---

# Design Philosophy

> **Retrieve first. Reason later. Never answer beyond the available context.**

WebRAG minimizes hallucinations by ensuring that responses are generated only after retrieving relevant contextual information from the indexed knowledge base.

---

# Future Roadmap

- PDF ingestion
- DOCX ingestion
- Multi-source knowledge base
- Source citations
- Metadata filtering
- Streaming responses
- REST API
- Web interface
- Docker support
- LangChain integration
- LangGraph workflows
- RAG evaluation metrics

---

# Author

**Subham Jha**

B.Tech, Electronics & Instrumentation Engineering

National Institute of Technology Silchar

GitHub: https://github.com/Subham-063

---

# License

This project is licensed under the MIT License.

