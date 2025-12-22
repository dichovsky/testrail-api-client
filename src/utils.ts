/**
 * Encodes a string to base64.
 * 
 * Supports both Node.js (using Buffer) and browser environments (using btoa).
 * In Node.js, it uses Buffer for efficiency. In browsers, it properly handles
 * Unicode characters by encoding to UTF-8 before using btoa.
 * 
 * @param str - The string to encode
 * @returns Base64 encoded string
 */
export function base64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  // In browsers, encode the string as UTF-8 before using btoa
  return btoa(
    encodeURIComponent(str).replace(
      /%([0-9A-F]{2})/g,
      (_, p1: string) => String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * Suspends execution for a specified duration.
 * 
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
