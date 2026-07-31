import crypto from "crypto";

export function generateHash(content) {

    return crypto
        .createHash("md5")
        .update(content)
        .digest("hex");
}