import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbedding(text) {

    const response =
        await client.embeddings.create({

            model:
                "text-embedding-3-small",

            input:
                text.slice(
                    0,
                    8000
                ),
        });

    return response
        .data[0]
        .embedding;
}