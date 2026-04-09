/** Base64-encodes a string. Uses Buffer in Node.js, UTF-8-safe btoa in browsers. */
export function base64Encode(str: string): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
    }
    // In browsers, encode the string as UTF-8 before using btoa
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1: string) => String.fromCharCode(parseInt(p1, 16))),
    );
}

/** Resolves after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
