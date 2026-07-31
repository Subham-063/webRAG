import dotenv from "dotenv";
dotenv.config();

import readline from "readline";
import OpenAI from "openai";

import { retrieveDocuments } from "./retriever.js";

import {
    addMessage,
    getHistory,
}
from "./memory.js";

const client = new OpenAI({
    apiKey:
        process.env.OPENAI_API_KEY,
});

async function rewriteQuestion(
    question
) {

    const history =
        getHistory();

    if (
        history.length === 0
    ) {

        return question;
    }

    const historyText =
        history
            .map(
                msg =>
                    `${msg.role}: ${msg.content}`
            )
            .join("\n");

    try {

        const response =
            await client.chat.completions.create({

                model:
                    "gpt-4.1-mini",

                messages: [

                    {
                        role:
                            "system",

                        content:
`You rewrite follow-up questions into standalone questions.

Use the conversation history.

If the question is already standalone,
return it unchanged.

Return ONLY the rewritten question.`
                    },

                    {
                        role:
                            "user",

                        content:
`
Conversation:

${historyText}

New Question:

${question}
`
                    }
                ],

                temperature:
                    0
            });

        return response
            .choices[0]
            .message
            .content
            .trim();

    } catch {

        return question;
    }
}

async function askQuestion(
    question
) {

    const rewrittenQuestion =
        await rewriteQuestion(
            question
        );

    console.log(
        "\nStandalone Query:"
    );

    console.log(
        rewrittenQuestion
    );

    console.log(
        "\nRetrieving Documents...\n"
    );

    const docs =
        await retrieveDocuments(
            rewrittenQuestion
        );

    if (!docs.length) {

        console.log(
            "No relevant documents found."
        );

        return;
    }

    console.log(
        "Documents Retrieved Successfully\n"
    );

    // console.log(
    //     "===== RETRIEVED DOCUMENTS =====\n"
    // );

    // docs.forEach(
    //     (
    //         doc,
    //         index
    //     ) => {

    //         console.log(
    //             `${index + 1}. ${doc.title}`
    //         );

    //         console.log(
    //             `Type: ${doc.pageType}`
    //         );

    //         console.log(
    //             doc.url
    //         );

    //         console.log(
    //             "\n-----------------\n"
    //         );
    //     }
    // );

    const prompt = `
You are a RAG assistant.

Answer ONLY using information from the provided context.

You may perform simple reasoning and summarization.

Do NOT use outside knowledge.

If the answer is not present in the context, say:

"I could not find the answer in the website data."

CONTEXT:

${docs.map(doc => `
TITLE:
${doc.title}

TYPE:
${doc.pageType}

URL:
${doc.url}

CONTENT:
${doc.text}
`).join("\n\n")}

QUESTION:
${rewrittenQuestion}
`;

    console.log(
        "Generating Answer...\n"
    );

    try {

        const llmStart =
            Date.now();

        const response =
            await client.chat.completions.create({

                model:
                    "gpt-4.1",

                messages: [

                    {
                        role:
                            "system",

                        content:
`You are a Retrieval-Augmented Generation assistant.

Use ONLY the retrieved context.

Do NOT use external knowledge.

Do NOT generate a Sources section.

The application displays sources separately.

If the context lacks the answer, say:

"I could not find the answer in the website data."`,
                    },

                    {
                        role:
                            "user",

                        content:
                            prompt,
                    },
                ],

                temperature:
                    0.2,
            });

        const llmTime =
            Date.now() -
            llmStart;

        const answer =
            response
            .choices[0]
            .message
            .content;

        console.log(
            "\n========== ANSWER ==========\n"
        );

        console.log(
            answer
        );

        addMessage(
            "user",
            question
        );

        addMessage(
            "assistant",
            answer
        );

        const uniqueSources =
            new Map();

        docs.forEach(doc => {

            if (
                !uniqueSources.has(
                    doc.url
                )
            ) {

                uniqueSources.set(
                    doc.url,
                    doc.title
                );
            }
        });

        console.log(
            "\n===== SOURCES =====\n"
        );

        for (
            const [url, title]
            of uniqueSources
        ) {

            console.log(
                title
            );

            console.log(
                url
            );

            console.log();
        }

        console.log(
            `LLM Response Time: ${llmTime} ms`
        );

        console.log(
            "\n--------------------\n"
        );

    } catch (err) {

        console.log(
            "LLM Error:"
        );

        console.log(
            err.message
        );
    }
}

const rl =
    readline.createInterface({

        input:
            process.stdin,

        output:
            process.stdout,
    });

function chatLoop() {

    rl.question(

        "\nAsk a Question (type 'exit' to quit): ",

        async (question) => {

            if (

                question
                .trim()
                .toLowerCase() ===
                "exit"

            ) {

                console.log(
                    "\nGoodbye!"
                );

                rl.close();

                process.exit(0);
            }

            if (
                !question.trim()
            ) {

                chatLoop();

                return;
            }

            await askQuestion(
                question
            );

            chatLoop();
        }
    );
}

console.log(
    "\n===== RAG Chat Started ====="
);

chatLoop();
