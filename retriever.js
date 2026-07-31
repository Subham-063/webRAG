import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import { createEmbedding } from "./utils/embedding.js";
import { rerankDocuments } from "./utils/reranker.js";


export async function retrieveDocuments(query) {

    const client =
        new MongoClient(
            process.env.MONGODB_URI
        );

    await client.connect();

    const collection =
        client
        .db(
            process.env.DB_NAME
        )
        .collection(
            process.env.COLLECTION_NAME
        );

    const queryEmbedding =
        await createEmbedding(query);

    // ==========================
    // VECTOR SEARCH
    // ==========================

    const vectorResults =
        await collection.aggregate([

            {
                $vectorSearch: {

                    index:
                        process.env.INDEX_NAME,

                    path:
                        "embedding",

                    queryVector:
                        queryEmbedding,

                    numCandidates:
                        300,

                    limit:
                        15,
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
                    score: { $meta: "vectorSearchScore", },
                },
            },
        ]).toArray();

    // ==========================
    // KEYWORD SEARCH
    // ==========================

    let keywordResults = [];

    try {

        keywordResults =
            await collection.find(

                {
                    $text: {
                        $search: query
                    }
                },

                {
                    projection: {

                        _id: 0,

                        title: 1,

                        pageType: 1,

                        text: 1,

                        url: 1,

                        score: {
                            $meta:
                                "textScore"
                        }
                    }
                }

            )
            .sort({
                score: {
                    $meta:
                        "textScore"
                }
            })
            .limit(15)
            .toArray();

    } catch (err) {

        console.log(
            "Text Search Unavailable"
        );
    }

    // ==========================
    // MERGE RESULTS
    // ==========================

    const merged =
        [
            ...vectorResults,
            ...keywordResults,
        ];

    const unique =
        [];

    const seen =
        new Set();

    for (
        const doc
        of merged
    ) {

        const key =
            doc.text
                .slice(0, 200);

        if (
            seen.has(key)
        ) {
            continue;
        }

        seen.add(key);

        unique.push(doc);
    }

    await client.close();

    const reranked =
    await rerankDocuments(
        query,
        unique
    );

return reranked;
}