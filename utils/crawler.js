import { chromium } from "playwright";

export async function crawlWebsite(
    startUrl,
    maxPages = 1
) {

    const browser =
        await chromium.launch({
            headless: true,
        });

    const page =
        await browser.newPage();

    const visited =
        new Set();

    const urls =
        new Set();

    const queue =
        [startUrl];

    const baseDomain =
        new URL(startUrl).hostname;

    while (
        queue.length > 0 &&
        urls.size < maxPages
    ) {

        const currentUrl =
            queue.shift();

        if (
            visited.has(currentUrl)
        ) {
            continue;
        }

        visited.add(
            currentUrl
        );

        try {

            console.log(
                `Crawling: ${currentUrl}`
            );

            await page.goto(
                currentUrl,
                {
                    waitUntil:
                        "networkidle",
                    timeout:
                        60000,
                }
            );

            urls.add(
                currentUrl
            );

            const links =
                await page.$$eval(
                    "a",
                    anchors =>
                        anchors.map(
                            a => a.href
                        )
                );

            for (
                const link
                of links
            ) {

                try {

                    const url =
                        new URL(
                            link
                        );

                    if (
                        url.hostname ===
                        baseDomain
                    ) {

                        const cleanUrl =
                            url.href.split(
                                "#"
                            )[0];

                        if (
                            !visited.has(
                                cleanUrl
                            )
                        ) {

                            queue.push(
                                cleanUrl
                            );
                        }
                    }

                } catch {}
            }

        } catch (err) {

            console.log(
                `Failed: ${currentUrl}`
            );
        }
    }

    await browser.close();

    return [
        ...urls,
    ];
}

