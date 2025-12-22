/**
 * Encodes a string to base64.
 * 
 * Supports both Node.js (using Buffer) and browser environments (using btoa).
 * In Node.js, it uses Buffer for efficiency. In browsers, it falls back to btoa.
 * 
 * @param str - The string to encode
 * @returns Base64 encoded string
 */
export function base64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return btoa(str);
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
