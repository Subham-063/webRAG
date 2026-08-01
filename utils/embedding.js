import OpenAI from "openai";

import config from "../config/config.js";
import logger from "./logger.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbedding(text) {
  try {
    const {
      data: [{ embedding }],
    } = await client.embeddings.create({
      model: config.EMBEDDING_MODEL,
      input: text.slice(0, config.MAX_EMBEDDING_LENGTH),
    });

    return embedding;
  } catch (error) {
    logger.error("Embedding generation failed");
    throw error;
  }
}

export async function createEmbeddings(texts = []) {
  if (!texts.length) return [];

  const embeddings = [];

  for (
    let i = 0;
    i < texts.length;
    i += config.EMBEDDING_BATCH_SIZE
  ) {
    const batch = texts.slice(
      i,
      i + config.EMBEDDING_BATCH_SIZE
    );

    const results = await Promise.all(
      batch.map(createEmbedding)
    );

    embeddings.push(...results);
  }

  return embeddings;
}