import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client =
    new OpenAI({
        apiKey:
            process.env.OPENAI_API_KEY,
    });

export async function rerankDocuments(
    query,
    docs
) {

    const docsText =
        docs.map(
            (
                doc,
                index
            ) =>

                `${index}

TITLE:
${doc.title}

CONTENT:
${doc.text.slice(0, 500)}
`
        ).join("\n\n");

    const response =
        await client.chat.completions.create({

            model:
                "gpt-4.1-mini",

            messages: [

                {
                    role:
                        "system",

                    content:
`You are a document reranker.

Given a user query and document list,
return only the indexes of the
8 most relevant documents.

Output ONLY comma separated indexes.

Example:

3,1,7,2`
                },

                {
                    role:
                        "user",

                    content:
`
QUESTION:
${query}

DOCUMENTS:

${docsText}
`
                }
            ],

            temperature: 0
        });

    const indexes =
        response
        .choices[0]
        .message
        .content
        .split(",")

        .map(
            x =>
                parseInt(
                    x.trim()
                )
        )

        .filter(
            x =>
                !isNaN(x)
        );

    return indexes
        .map(
            i =>
                docs[i]
        )
        .filter(Boolean);
}