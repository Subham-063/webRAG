import Tesseract from "tesseract.js";

export async function extractTextFromImages(images) {

    let extractedText = "";

    const seen =
        new Set();

    for (const image of images) {

        if (
            seen.has(image)
        ) {
            continue;
        }

        seen.add(image);

        try {

            const result =
                await Tesseract.recognize(
                    image,
                    "eng"
                );

            const text =
                result.data.text
                    .trim();

            if (
                text.length > 10
            ) {

                extractedText +=
                    text + "\n";
            }

            console.log(
                `OCR Done: ${image}`
            );

        } catch {

            console.log(
                `OCR Failed: ${image}`
            );
        }
    }

    return extractedText;
}
