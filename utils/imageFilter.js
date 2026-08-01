const IGNORE_KEYWORDS = [
    "logo",
    "logos",
    "icon",
    "icons",
    "favicon",
    "avatar",
    "profile",
    "spinner",
    "loader",
    "emoji",
    "facebook",
    "twitter",
    "linkedin",
    "instagram",
    "youtube",
    "whatsapp",
    "telegram",
    "discord",
    "banner",
    "background",
    "pixel"
];

const IGNORE_EXTENSIONS = [
    ".svg",
    ".ico",
    ".gif"
];

export function shouldProcessImage(src, width = 0, height = 0) {

    if (!src)
        return false;

    const image = src.toLowerCase();

    if (image.startsWith("data:image"))
        return false;

    if (IGNORE_EXTENSIONS.some(ext => image.endsWith(ext)))
        return false;

    if (IGNORE_KEYWORDS.some(keyword => image.includes(keyword)))
        return false;

    if (width && width < 150)
        return false;

    if (height && height < 150)
        return false;

    return true;
}