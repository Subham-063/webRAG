import { chromium } from "playwright";
import * as cheerio from "cheerio";

export async function scrapeWebsite(url) {

    const browser =
        await chromium.launch({
            headless: true,
        });

    const page =
        await browser.newPage({

            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        });

    console.log("Opening Page...");

    await page.goto(url, {

        waitUntil:
            "domcontentloaded",

        timeout:
            120000,
    });

    console.log(
        "Page Loaded:"
    );

    console.log(
        page.url()
    );

    // ==========================
    // SAFE AUTO SCROLL
    // ==========================

    console.log(
        "Starting Scroll..."
    );

    for (
        let i = 0;
        i < 20;
        i++
    ) {

        await page.mouse.wheel(
            0,
            1000
        );

        await page.waitForTimeout(
            200
        );
    }

    console.log(
        "Scroll Finished"
    );

    // ==========================
    // HOVER MENUS
    // ==========================

    // try {

    //     console.log(
    //         "Starting Hover..."
    //     );

    //     const navItems =
    //         (
    //             await page
    //                 .locator(
    //                     "header a, nav a"
    //                 )
    //                 .all()
    //         ).slice(
    //             0,
    //             30
    //         );

    //     console.log(
    //         "Nav Items:",
    //         navItems.length
    //     );

    //     for (
    //         const item
    //         of navItems
    //     ) {

    //         try {

    //             await item.hover();

    //             await page.waitForTimeout(
    //                 500
    //             );

    //         } catch {}
    //     }

    //     console.log(
    //         "Hover Finished"
    //     );

    // } catch (err) {

    //     console.log(
    //         "Hover Error:",
    //         err.message
    //     );
    // }

    // ==========================
    // BUTTONS
    // ==========================

    try {

        console.log(
            "Starting Button Clicks..."
        );

        const buttons =
            (
                await page
                    .locator(
                        "button"
                    )
                    .all()
            ).slice(
                0,
                30
            );

        console.log(
            "Buttons:",
            buttons.length
        );

        for (
            const btn
            of buttons
        ) {

            try {

                await btn.click({

                    timeout:
                        300,
                });

            } catch {}
        }

        console.log(
            "Button Clicks Finished"
        );

    } catch {}
    
    // ==========================
    // ACCORDIONS
    // ==========================

    const clickableSelectors = [

        "[aria-expanded='false']",

        ".accordion",

        ".faq",

        ".expand",

        ".dropdown-toggle",

        ".elementor-tab-title",

        ".elementor-accordion-title",

        "[role='button']",
    ];

    for (
        const selector
        of clickableSelectors
    ) {

        try {

            const elements =
                (
                    await page
                        .locator(
                            selector
                        )
                        .all()
                ).slice(
                    0,
                    20
                );

            for (
                const element
                of elements
            ) {

                try {

                    await element.click({

                        timeout:
                            300,
                    });

                } catch {}
            }

        } catch {}
    }

    await page.waitForTimeout(
        1000
    );

    // ==========================
    // HTML
    // ==========================

    console.log(
        "Extracting HTML..."
    );

    const html =
        await page.content();

    const title =
        await page.title();

    await browser.close();

    const $ =
        cheerio.load(html);

    // ==========================
    // REMOVE NOISE
    // ==========================

    $(
        `
        script,
        style,
        noscript,
        footer,
        aside,
        form,
        svg
        `
    ).remove();

    // ==========================
    // HEADINGS
    // ==========================

    const headings = [];

    $("h1,h2,h3").each(
        (i, el) => {

            const heading =
                $(el)
                    .text()
                    .trim();

            if (
                heading.length > 0
            ) {

                headings.push(
                    heading
                );
            }
        }
    );

    // ==========================
    // CONTENT
    // ==========================

    let text = "";

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

    for (
        const selector
        of contentSelectors
    ) {

        const element =
            $(selector);

        if (
            !element.length
        ) {

            continue;
        }

        const extractedText =
            element.text();

        if (

            extractedText &&
            extractedText.trim().length > 500

        ) {

            text =
                extractedText;

            console.log(
                `Using selector: ${selector}`
            );

            break;
        }
    }

    text =
        text

        .replace(
            /\s+/g,
            " "
        )

        .trim();

    // ==========================
    // IMAGES
    // ==========================

    const images = [];

    $("img").each(
        (i, el) => {

            let src =
                $(el).attr(
                    "src"
                );

            if (!src) {

                return;
            }

            src =
                src.trim();

            const lower =
                src.toLowerCase();

            if (

                lower.includes(
                    "logo"
                ) ||

                lower.includes(
                    "icon"
                ) ||

                lower.includes(
                    "avatar"
                ) ||

                lower.includes(
                    "spinner"
                ) ||

                lower.includes(
                    "loader"
                )

            ) {

                return;
            }

            if (

                lower.includes(
                    ".png"
                ) ||

                lower.includes(
                    ".jpg"
                ) ||

                lower.includes(
                    ".jpeg"
                ) ||

                lower.includes(
                    ".webp"
                )

            ) {

                images.push(
                    src
                );
            }
        }
    );

    const uniqueImages =
        [...new Set(images)];

    console.log(
        "\n=========================="
    );

    console.log(
        "Title:",
        title
    );

    console.log(
        "Text Length:",
        text.length
    );

    console.log(
        "Headings:",
        headings.length
    );

    console.log(
        "Images Found:",
        uniqueImages.length
    );

    console.log(
        "==========================\n"
    );

    return {

        title,

        headings,

        text,

        images:
            uniqueImages,
    };
}
