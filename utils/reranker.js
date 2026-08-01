import OpenAI from "openai";

import config from "../config/config.js";
import logger from "./logger.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function rerankDocuments(query, documents = []) {
  if (!documents.length) return [];

  logger.info("Reranking retrieved documents...");

  const docsText = documents
    .map(
      (doc, index) => `
${index}

TITLE:
${doc.title}

CONTENT:
${doc.text.slice(0, 500)}
`
    )
    .join("\n");

  try {
    const response = await client.chat.completions.create({
      model: config.RERANK_MODEL,

      temperature: 0,

      messages: [
        {
          role: "system",
          content: `You are a document reranker.

Given a user query and a list of retrieved documents,
return ONLY the indexes of the 8 most relevant documents.

Output format:

3,1,7,2

Do not explain your answer.`,
        },
        {
          role: "user",
          content: `
QUESTION:
${query}

DOCUMENTS:

${docsText}
`,
        },
      ],
    });

    const indexes = response.choices[0].message.content
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter(Number.isInteger);

    const reranked = indexes
      .map((index) => documents[index])
      .filter(Boolean);

    logger.success(
      `Reranked ${reranked.length} document(s)`
    );

    return reranked;
  } catch (error) {
    logger.warn("Reranker failed. Returning original documents.");
    return documents;
  }
}