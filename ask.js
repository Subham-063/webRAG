import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import config from "./config/config.js";
import logger from "./utils/logger.js";

import { retrieveDocuments, closeRetriever } from "./retriever.js";
import { closeBrowser } from "./utils/crawler.js";

const SYSTEM_PROMPT = `
You are a helpful AI assistant.

Answer ONLY using the supplied context.
If the answer is not present in the context, say you don't know.

Keep answers:
- Accurate
- Concise
- Well formatted
- Free from hallucinations
`.trim();

function buildContext(documents = []) {
    return documents
        .map((doc, index) => {
            const source = doc.url || doc.metadata?.url || "Unknown";

            return `[${index + 1}] Source: ${source}

${doc.text}`;
        })
        .join("\n\n");
}

async function generateAnswer(question, documents) {
    const context = buildContext(documents);

    const response = await config.openai.chat.completions.create({
        model: config.models.chat,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT,
            },
            {
                role: "user",
                content: `
Context:

${context}

Question:

${question}
                `.trim(),
            },
        ],
    });

    return (
        response.choices?.[0]?.message?.content?.trim() ??
        "No answer generated."
    );
}

async function answerQuestion(question) {
    const documents = await retrieveDocuments(question);

    if (!documents.length) {
        logger.warn("No relevant documents found.");
        return "I couldn't find any relevant information.";
    }

    return generateAnswer(question, documents);
}

async function interactiveChat() {
    const rl = readline.createInterface({
        input,
        output,
    });

    logger.info("WebRAG is ready.");

    try {
        while (true) {
            const question = (await rl.question("\n> ")).trim();

            if (!question) continue;

            if (["exit", "quit", "q"].includes(question.toLowerCase())) {
                break;
            }

            try {
                const answer = await answerQuestion(question);
                console.log(`\n${answer}\n`);
            } catch (error) {
                logger.error(error.stack || error.message);
            }
        }
    } finally {
        rl.close();
    }
}

async function shutdown(code = 0) {
    try {
        await closeRetriever();
    } catch (error) {
        logger.error(error.message);
    }

    try {
        await closeBrowser();
    } catch (error) {
        logger.error(error.message);
    }

    process.exit(code);
}

process.on("SIGINT", async () => {
    logger.info("Shutting down...");
    await shutdown(0);
});

process.on("SIGTERM", async () => {
    logger.info("Shutting down...");
    await shutdown(0);
});

(async () => {
    try {
        await interactiveChat();
        await shutdown(0);
    } catch (error) {
        logger.error(error.stack || error.message);
        await shutdown(1);
    }
})();