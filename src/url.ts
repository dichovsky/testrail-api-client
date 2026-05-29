/**
 * Builds a TestRail endpoint URL with optional query parameters.
 * Appends params using `&key=value` (TestRail URL quirk — uses `&`, not `?`).
 * Keys and values are automatically percent-encoded via `encodeURIComponent`.
 * Do NOT pre-encode values before passing them; doing so will cause double-encoding.
 */
export function buildEndpoint(base: string, params: Record<string, string | number | undefined> = {}): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            // Encode values to prevent parameter injection via string values
            // containing `&`, `=`, or `#`.
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    return parts.length > 0 ? `${base}&${parts.join('&')}` : base;
}
