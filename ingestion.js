import dotenv from "dotenv";
dotenv.config();

import fs from "fs";

import { MongoClient } from "mongodb";
import { createEmbedding } from "./utils/embedding.js";

import { scrapeWebsite } from "./utils/scraper.js";
import { extractTextFromImages } from "./utils/ocr.js";
import { splitText } from "./utils/splitter.js";
import { generateHash } from "./utils/hash.js";
import { crawlWebsite } from "./utils/crawler.js";

const SEED_URL =
    "https://data360.worldbank.org/en/economy/SGP";

const MAX_PAGES = 1;

async function ingest() {

    const client =
        new MongoClient(
            process.env.MONGODB_URI
        );

    await client.connect();

    const db =
        client.db(
            process.env.DB_NAME
        );

    const collection =
        db.collection(
            process.env.COLLECTION_NAME
        );

    const progressCollection =
        db.collection(
            process.env.PROGRESS_COLLECTION
        );

    console.log(
        "Discovering Pages..."
    );

    const urls =
        await crawlWebsite(
            SEED_URL,
            MAX_PAGES
        );

    console.log(
        `Found ${urls.length} pages`
    );

    let pageNumber = 0;

    for (const url of urls) {

        pageNumber++;

        if (
            fs.existsSync(
                "pause.txt"
            )
        ) {

            console.log(
                "\n=================================="
            );

            console.log(
                "PAUSE DETECTED"
            );

            console.log(
                "Remove pause.txt and rerun ingestion to continue."
            );

            break;
        }

        const alreadyProcessed =
            await progressCollection.findOne({
                url,
            });

        if (
            alreadyProcessed
        ) {

            console.log(
                `Skipping (${pageNumber}/${urls.length})`
            );

            console.log(
                url
            );

            continue;
        }

        try {

            console.log(
                "\n=================================="
            );

            console.log(
                `Page ${pageNumber}/${urls.length}`
            );

            console.log(
                `Processing: ${url}`
            );

            console.log(
                "Scraping Website..."
            );

            const {
                title,
                headings,
                text,
                images,
            } =
                await scrapeWebsite(
                    url
                );

            console.log(
                "Title:",
                title
            );

            console.log(
                "Running OCR..."
            );

            let imageText =
                "";

            try {

                imageText =
                    await extractTextFromImages(
                        images
                    );

            } catch (err) {

                console.log(
                    "OCR Pipeline Failed"
                );

                console.log(
                    err.message
                );
            }

            const combinedText =
                text +
                "\n" +
                imageText;

            const hash =
                generateHash(
                    combinedText
                );

            const existing =
                await collection.findOne({
                    url,
                });

            if (
                existing &&
                existing.hash === hash
            ) {

                console.log(
                    "No Changes Detected"
                );

                await progressCollection.insertOne({

                    url,

                    completedAt:
                        new Date(),
                });

                continue;
            }

            await collection.deleteMany({
                url,
            });

            console.log(
                `Text Length: ${combinedText.length}`
            );

            let pageType =
                "general";

            if (
                url.includes(
                    "/product/"
                )
            ) {

                pageType =
                    "product";
            }

            else if (

                url.includes(
                    "service"
                ) ||

                url.includes(
                    "consulting"
                ) ||

                url.includes(
                    "implementation"
                ) ||

                url.includes(
                    "managed"
                )

            ) {

                pageType =
                    "service";
            }

            console.log(
                "Page Type:",
                pageType
            );

            console.log(
                "Chunking..."
            );

            const docs =
                await splitText(
                    combinedText
                );

            console.log(
                `Chunks Created: ${docs.length}`
            );

            console.log(
                "Generating Embeddings..."
            );

            const embeddings =
                await Promise.all(

                    docs.map(
                        doc =>
                            createEmbedding(
                                doc.pageContent
                            )
                    )
                );

            const pageDocs =
                    docs.map(
        (
            doc,
            index
        ) => ({

            title,

            headings,

            pageType,

            text:
                doc.pageContent,

            embedding:
                embeddings[index],

            url,

            hash,

            createdAt:
                new Date(),
        })
    );

            if (
                pageDocs.length > 0
            ) {

                await collection.insertMany(
                    pageDocs
                );

                console.log(
                    `${pageDocs.length} chunks stored`
                );
            }

            await progressCollection.insertOne({

                url,

                completedAt:
                    new Date(),
            });

            console.log(
                "Page Completed"
            );

        } catch (err) {

            console.log(
                `Failed: ${url}`
            );

            console.log(
                err.message
            );
        }
    }

    console.log(
        "\n=================================="
    );

    console.log(
        "Ingestion Finished"
    );

    await client.close();

    process.exit(0);
}

ingest();
