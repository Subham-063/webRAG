import fs from "node:fs";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

import config from "./config/config.js";
import logger from "./utils/logger.js";

import { crawlWebsite, closeBrowser } from "./utils/crawler.js";
import { scrape } from "./utils/scraper.js";
import { extractTextFromImages } from "./utils/ocr.js";
import { splitText } from "./utils/splitter.js";
import { createEmbeddings } from "./utils/embedding.js";
import { generateHash } from "./utils/hash.js";

dotenv.config();

let client;
let db;
let collection;
let progressCollection;

async function connectDatabase() {
  client = new MongoClient(process.env.MONGODB_URI);

  await client.connect();

  db = client.db(process.env.DB_NAME);

  collection = db.collection(process.env.COLLECTION_NAME);
  progressCollection = db.collection(process.env.PROGRESS_COLLECTION);

  logger.success("MongoDB connected");
}

async function disconnectDatabase() {
  try {
    if (client) {
      await client.close();
      logger.info("MongoDB connection closed");
    }
  } finally {
    client = null;
    db = null;
    collection = null;
    progressCollection = null;
  }
}

function getPageType(url) {
  const path = url.toLowerCase();

  if (path.includes("/product/")) return "product";

  if (
    path.includes("service") ||
    path.includes("consulting") ||
    path.includes("implementation") ||
    path.includes("managed")
  ) {
    return "service";
  }

  return "general";
}

async function processPage(url) {
  if (fs.existsSync("pause.txt")) {
    throw new Error("INGESTION_PAUSED");
  }

  if (await progressCollection.findOne({ url })) {
    logger.info(`Skipping → ${url}`);
    return;
  }

  logger.info(`Processing → ${url}`);

  const { title, headings, text, images } = await scrape(url);

  let imageText = "";

  try {
    imageText = await extractTextFromImages(images.map((img) => img.src));
  } catch {
    logger.warn(`OCR failed → ${url}`);
  }

  const combinedText = `${text}\n${imageText}`.trim();

  if (!combinedText) {
    logger.warn(`No content extracted → ${url}`);
    return;
  }

  const hash = generateHash(combinedText);

  const existing = await collection.findOne({ url });

  if (existing?.hash === hash) {
    logger.info(`No changes → ${url}`);

    await progressCollection.insertOne({
      url,
      completedAt: new Date(),
    });

    return;
  }

  await collection.deleteMany({ url });

  const chunks = await splitText(combinedText);

  const embeddings = await createEmbeddings(
    chunks.map((chunk) => chunk.pageContent)
  );

  const documents = chunks.map((chunk, index) => ({
    title,
    headings,
    pageType: getPageType(url),
    text: chunk.pageContent,
    embedding: embeddings[index],
    url,
    hash,
    createdAt: new Date(),
  }));

  if (documents.length) {
    await collection.insertMany(documents);

    logger.success(
      `${url} → ${documents.length} chunk(s) stored`
    );
  }

  await progressCollection.insertOne({
    url,
    completedAt: new Date(),
  });
}

async function processBatch(
  urls,
  concurrency = config.CONCURRENT_PAGES
) {
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const current = index++;
      const url = urls[current];

      logger.info(`[${current + 1}/${urls.length}] ${url}`);

      try {
        await processPage(url);
      } catch (error) {
        if (error.message === "INGESTION_PAUSED") {
          throw error;
        }

        logger.error(`Failed → ${url}`);
        logger.error(error.message);
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, urls.length) },
      () => worker()
    )
  );
}

async function ingest() {
  try {
    await connectDatabase();

    logger.info("Discovering pages...");

    const urls = await crawlWebsite(
      config.SEED_URL,
      config.MAX_PAGES
    );

    logger.success(`Found ${urls.length} page(s)`);

    await processBatch(urls);

    logger.success("Ingestion completed");
  } catch (error) {
    if (error.message === "INGESTION_PAUSED") {
      logger.warn(
        "Pause detected. Remove pause.txt and rerun ingestion."
      );
    } else {
      logger.error("Ingestion failed");
      logger.error(error.stack || error.message);
    }
  } finally {
    await disconnectDatabase();
    await closeBrowser();
    process.exit(0);
  }
}

ingest();