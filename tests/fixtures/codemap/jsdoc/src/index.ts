/**
 * Compares two PNG images pixel-by-pixel and returns the number of mismatched pixels.
 *
 * Second paragraph that should be dropped.
 *
 * @param a - first image
 * @param b - second image
 * @returns mismatch count
 * @deprecated since 6.0.0, use comparePngAsync
 * @example
 *   comparePng(a, b)
 * @since 1.0.0
 */
export function comparePng(a: string, b: string): number {
    return a.length + b.length;
}

/** Single-line doc with `string with    spaces` literal preserved. */
export function withLiteral(input: string = 'a   b   c'): string {
    return input;
}
