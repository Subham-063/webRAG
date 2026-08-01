import {
    RecursiveCharacterTextSplitter
}
from "@langchain/textsplitters";

export async function splitText(text) {

    const cleaned =
        text

        .replace(
            /\n\s*\n/g,
            "\n\n"
        )

        .trim();

    const splitter =
        new RecursiveCharacterTextSplitter({

            chunkSize:
                1200,

            chunkOverlap:
                200,

            separators: [

                "\n# ",

                "\n## ",

                "\n### ",

                "\n\n",

                "\n",

                ". ",

                " ",
            ],
        });

    return await splitter
        .createDocuments([
            cleaned
        ]);
}
