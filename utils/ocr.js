import Tesseract from "tesseract.js";

import config from "../config/config.js";
import logger from "./logger.js";

async function recognize(image, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(
        image,
        config.OCR_LANGUAGE
      );

      return text.trim();
    } catch {
      if (attempt === retries) {
        logger.warn(`OCR failed → ${image}`);
      }
    }
  }

  return "";
}

export async function extractTextFromImages(images = []) {
  const uniqueImages = [...new Set(images)];

  if (!uniqueImages.length) return "";

  logger.info(`Running OCR on ${uniqueImages.length} image(s)...`);

  const results = await Promise.allSettled(
    uniqueImages.map((image) => recognize(image))
  );

  const extractedText = results
    .filter(
      (result) =>
        result.status === "fulfilled" &&
        result.value.length >= config.MIN_OCR_TEXT_LENGTH
    )
    .map((result) => result.value)
    .join("\n");

  logger.success("OCR completed");

  return extractedText;
}