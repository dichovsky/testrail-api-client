/**
 * Builds a TestRail endpoint URL with optional query parameters.
 * Appends params using `&key=value` (TestRail URL quirk — uses `&`, not `?`).
 * Keys and values are automatically percent-encoded via `encodeURIComponent`.
 * Array values emit the same key once per item; empty arrays are omitted.
 * Do NOT pre-encode values before passing them; doing so will cause double-encoding.
 */
type EndpointParam = string | number;
type EndpointParamValue = EndpointParam | readonly EndpointParam[] | undefined;

export function buildEndpoint(base: string, params: Readonly<Record<string, EndpointParamValue>> = {}): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        const values: readonly EndpointParam[] = Array.isArray(value) ? value : [value as EndpointParam];
        for (const item of values) {
            // Encode every repeated value independently to prevent parameter
            // injection through strings containing `&`, `=`, or `#`.
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
        }
    }
    return parts.length > 0 ? `${base}&${parts.join('&')}` : base;
}
