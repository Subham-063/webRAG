import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const browser = {
  headless: process.env.HEADLESS !== "false",
  timeout: 120000,
  navigationTimeout: 120000,
  clickDelay: 500,
};

const models = {
  chat: "gpt-4.1",
  rerank: "gpt-4.1-mini",
  embedding: "text-embedding-3-small",
};

const config = {
  openai,
  browser,
  models,

  // Website
  SEED_URL: process.env.SEED_URL,

  // Crawling
  MAX_PAGES: 10,
  CONCURRENCY: 3,
  CONCURRENT_PAGES: 3,

  // Browser
  PAGE_TIMEOUT: browser.navigationTimeout,
  WAIT_UNTIL: "networkidle",

  // Interaction
  MAX_SCROLLS: 20,
  MAX_BUTTONS: 30,
  MAX_ACCORDIONS: 20,

  // OCR
  OCR_LANGUAGE: "eng",
  MIN_OCR_TEXT_LENGTH: 10,

  // Chunking
  CHUNK_SIZE: 1200,
  CHUNK_OVERLAP: 200,

  // Retrieval
  VECTOR_CANDIDATES: 300,
  VECTOR_LIMIT: 15,
  KEYWORD_LIMIT: 15,

  // Embeddings
  EMBEDDING_MODEL: models.embedding,
  MAX_EMBEDDING_LENGTH: 8000,
  EMBEDDING_BATCH_SIZE: 20,

  // LLM
  CHAT_MODEL: models.chat,
  RERANK_MODEL: models.rerank,
};

export const CONFIG = Object.freeze(config);
export default CONFIG;