/**
 * Encodes a string to base64.
 * Works in both Node.js and browser environments.
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
