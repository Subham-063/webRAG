import { chromium } from "playwright";
import { URL } from "node:url";

import config from "../config/config.js";
import logger from "./logger.js";
import { shouldProcessImage } from "./imageFilter.js";

let browser = null;

async function getBrowser() {
  if (browser?.isConnected()) return browser;

  browser = await chromium.launch({
    headless: config.browser.headless,
    args: [
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
    ],
  });

  browser.once("disconnected", () => {
    browser = null;
  });

  return browser;
}

export async function closeBrowser() {
  if (!browser) return;

  try {
    await browser.close();
  } finally {
    browser = null;
  }
}

async function newPage() {
  const context = await (await getBrowser()).newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136 Safari/537.36",
  });

  const page = await context.newPage();

  page.setDefaultNavigationTimeout(config.browser.navigationTimeout);
  page.setDefaultTimeout(config.browser.timeout);

  return { context, page };
}

// ---------- Page Interaction ----------

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let previousHeight = 0;
      let stableCount = 0;

      const timer = setInterval(() => {
        window.scrollBy(0, window.innerHeight);

        const currentHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );

        if (currentHeight === previousHeight) {
          stableCount++;
        } else {
          stableCount = 0;
          previousHeight = currentHeight;
        }

        if (stableCount >= 3) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 200);
    });
  });
}

async function clickElements(page, selectors) {
  for (const selector of selectors) {
    const elements = await page.$$(selector);

    for (const element of elements) {
      try {
        await element.scrollIntoViewIfNeeded();
        await element.click({
          timeout: config.browser.clickDelay,
        });

        await page.waitForTimeout(config.browser.clickDelay);
      } catch {}
    }
  }
}

async function expandInteractiveContent(page) {
  await clickElements(page, [
    "button",
    "[role='button']",
    "summary",
    "[aria-expanded='false']",
    "[data-toggle]",
    "[data-bs-toggle]",
    ".accordion-button",
    ".accordion-header",
    ".accordion-title",
    ".faq",
    ".faq-question",
    ".expand",
    ".dropdown-toggle",
    ".elementor-tab-title",
    ".elementor-accordion-title",
  ]);

  await page.evaluate(() => {
    document.querySelectorAll("details").forEach((item) => {
      item.open = true;
    });

    document
      .querySelectorAll("[aria-expanded='false']")
      .forEach((element) => {
        element.dispatchEvent(
          new MouseEvent("click", { bubbles: true })
        );
      });
  });

  await page.waitForTimeout(500);
}

function normalize(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

// ---------- Page Extraction ----------

async function extractPageData(page, pageUrl) {
  return page.evaluate((baseUrl) => {
    const normalize = (text = "") =>
      text.replace(/\s+/g, " ").trim();

    const absoluteUrl = (src) => {
      try {
        return new URL(src, baseUrl).href;
      } catch {
        return null;
      }
    };

    const contentSelectors = [
      "main",
      "article",
      "[role='main']",
      ".content",
      ".main-content",
      "#content",
      "#main",
      "body",
    ];

    let text = "";

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);

      if (!element) continue;

      const content = normalize(element.innerText);

      if (content.length > 500) {
        text = content;
        break;
      }
    }

    const headings = [
      ...document.querySelectorAll("h1,h2,h3,h4,h5,h6"),
    ]
      .map((heading) => normalize(heading.innerText))
      .filter(Boolean);

    const images = [...document.images]
      .map((img) => ({
        src:
          img.currentSrc ||
          img.src ||
          img.dataset.src ||
          img.dataset.lazy ||
          img.dataset.original ||
          img.getAttribute("data-src") ||
          img.getAttribute("data-lazy-src") ||
          img.getAttribute("data-original") ||
          img
            .getAttribute("srcset")
            ?.split(",")[0]
            ?.trim()
            ?.split(" ")[0] ||
          "",
        alt: normalize(img.alt),
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
      }))
      .map((img) => ({
        ...img,
        src: absoluteUrl(img.src),
      }))
      .filter((img) => img.src);

    return {
      text,
      headings,
      images,
    };
  }, pageUrl);
}

function filterImages(images) {
  const seen = new Set();

  return images.filter((image) => {
    if (
      !shouldProcessImage(
        image.src,
        image.width,
        image.height
      )
    ) {
      return false;
    }

    if (seen.has(image.src)) {
      return false;
    }

    seen.add(image.src);

    return true;
  });
}

// ---------- Main Scraper ----------

export async function scrape(url) {
  const { context, page } = await newPage();

  try {
    logger.info(`Scraping → ${url}`);

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: config.browser.navigationTimeout,
    });

    await autoScroll(page);
    await expandInteractiveContent(page);
    await autoScroll(page);

    const {
      text,
      headings,
      images,
    } = await extractPageData(page, url);

    const title = normalize(await page.title());

    const filteredImages = filterImages(images);

    logger.success(
      `Completed → ${title || url}`
    );

    logger.info(
      `Content: ${text.length} chars | Headings: ${headings.length} | Images: ${filteredImages.length}`
    );

    return {
      url,
      title,
      text,
      headings: [...new Set(headings)],
      images: filteredImages,
    };
  } catch (error) {
    logger.error(`Scrape failed → ${url}`);
    logger.error(error.message);

    return {
      url,
      title: "",
      text: "",
      headings: [],
      images: [],
      error: error.message,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

export default {
  scrape,
  closeBrowser,
};

