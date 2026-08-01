import { chromium } from "playwright";
import config from "../config/config.js";
import logger from "./logger.js";

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

export async function crawlWebsite(
  startUrl,
  maxPages = config.MAX_PAGES
) {
  const browser = await getBrowser();

  const baseDomain = new URL(startUrl).hostname;

  const queue = [startUrl];
  const visited = new Set();
  const discovered = new Set();

  async function worker() {
    const context = await browser.newContext();
    const page = await context.newPage();

    page.setDefaultNavigationTimeout(config.PAGE_TIMEOUT);
    page.setDefaultTimeout(config.PAGE_TIMEOUT);

    try {
      while (
        queue.length &&
        discovered.size < maxPages
      ) {
        const currentUrl = queue.shift();

        if (!currentUrl || visited.has(currentUrl))
          continue;

        visited.add(currentUrl);

        try {
          logger.info(`Crawling ${currentUrl}`);

          await page.goto(currentUrl, {
            waitUntil: config.WAIT_UNTIL,
            timeout: config.PAGE_TIMEOUT,
          });

          discovered.add(currentUrl);

          const links = await page.$$eval(
            "a[href]",
            (anchors) =>
              anchors
                .map((a) => a.href)
                .filter(Boolean)
          );

          for (const link of links) {
            try {
              const url = new URL(link);

              if (url.hostname !== baseDomain)
                continue;

              const cleanUrl = url.href.split("#")[0];

              if (
                !visited.has(cleanUrl) &&
                !queue.includes(cleanUrl) &&
                discovered.size + queue.length < maxPages
              ) {
                queue.push(cleanUrl);
              }
            } catch {}
          }
        } catch (error) {
          logger.warn(
            `Skipping ${currentUrl}: ${error.message}`
          );
        }
      }
    } finally {
      await context.close().catch(() => {});
    }
  }

  const workers = Array.from(
    { length: config.CONCURRENCY },
    () => worker()
  );

  await Promise.all(workers);

  logger.success(
    `Discovered ${discovered.size} page(s)`
  );

  return [...discovered];
}