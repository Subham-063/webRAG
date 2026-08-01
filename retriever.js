import dotenv from "dotenv";
import { MongoClient } from "mongodb";

import config from "./config/config.js";
import logger from "./utils/logger.js";

import { createEmbedding } from "./utils/embedding.js";
import { rerankDocuments } from "./utils/reranker.js";

dotenv.config();

let client;
let collection;

async function connectDatabase() {
  if (collection) return collection;

  client = new MongoClient(process.env.MONGODB_URI);

  await client.connect();

  collection = client
    .db(process.env.DB_NAME)
    .collection(process.env.COLLECTION_NAME);

  return collection;
}

export async function closeRetriever() {
  if (!client) return;

  await client.close();
  client = null;
  collection = null;
}

export async function retrieveDocuments(query) {
  const db = await connectDatabase();

  logger.info("Generating query embedding...");

  const queryEmbedding = await createEmbedding(query);

  logger.info("Running vector search...");

  const vectorResults = await db
    .aggregate([
      {
        $vectorSearch: {
          index: process.env.INDEX_NAME,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: config.VECTOR_CANDIDATES,
          limit: config.VECTOR_LIMIT,
        },
      },
      {
        $project: {
          _id: 0,
          title: 1,
          headings: 1,
          pageType: 1,
          text: 1,
          url: 1,
          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
    ])
    .toArray();

  logger.info("Running keyword search...");

  let keywordResults = [];

  try {
    keywordResults = await db
      .find(
        {
          $text: {
            $search: query,
          },
        },
        {
          projection: {
            _id: 0,
            title: 1,
            headings: 1,
            pageType: 1,
            text: 1,
            url: 1,
            score: {
              $meta: "textScore",
            },
          },
        }
      )
      .sort({
        score: {
          $meta: "textScore",
        },
      })
      .limit(config.KEYWORD_LIMIT)
      .toArray();
  } catch {
    logger.warn("Text search unavailable");
  }

  logger.info("Merging search results...");

  const merged = [...vectorResults, ...keywordResults];

  const unique = [];
  const seen = new Set();

  for (const doc of merged) {
    const key = `${doc.url}:${doc.text.length}:${doc.text.slice(0, 80)}`;

    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(doc);
  }

  logger.info(`Retrieved ${unique.length} unique document(s)`);

  const reranked = await rerankDocuments(query, unique);

  logger.success(
    `Returning ${reranked.length} reranked document(s)`
  );

  return reranked;
}