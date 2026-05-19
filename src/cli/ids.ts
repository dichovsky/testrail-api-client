export class IdParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IdParseError';
    }
}

// Canonical positive-integer pattern: at least one digit, no leading zeros
// (except "0" itself, which we reject below as non-positive), no sign, no
// decimal point, no exponent, no hex prefix. Number() would silently accept
// "1e2" (=100), "0x1" (=1), "  5  " (=5), and "+1" (=1); the regex closes
// those holes so an id supplied by an LLM agent or a copy-pasted URL fragment
// cannot smuggle through unexpected coercion.
const POSITIVE_INT_RE = /^[1-9]\d*$/;

// Non-negative integer pattern for optional pagination params (--limit /
// --offset). Mirrors POSITIVE_INT_RE but additionally accepts "0" as its own
// branch since `offset=0` is a valid pagination value; "01", "007", etc. are
// rejected for the same reason POSITIVE_INT_RE rejects them — leading zeros
// are not part of the canonical decimal form and would silently coerce.
// Like parseId, the regex closes the holes Number() opens ("1e2", "0x1",
// "  5  ", "+1", "01"); unlike parseId, optInt's contract is "silently drop
// bad input → undefined" so downstream code can simply omit the param.
// parseId is the strict variant for path-required ids; keeping the two
// contracts distinct is intentional.
const NON_NEG_INT_RE = /^(0|[1-9]\d*)$/;

export function parseId(raw: string | undefined, name: string): number {
    if (raw === undefined || raw === '' || !POSITIVE_INT_RE.test(raw)) {
        throw new IdParseError(`${name} must be a positive integer (got: ${raw ?? '(none)'})`);
    }
    // Safe: the regex guarantees a decimal-digit-only string with no leading
    // zeros, so Number() is lossless for any value that fits in a double
    // (>= 2^53 ids would already be impossible from the TestRail API).
    return Number(raw);
}

/**
 * Parse a TestRail plan-entry ID. Unlike numeric IDs (plan_id, run_id),
 * entry_id is a UUID-style string per TestRail's API. Mirrors the
 * `validateEntryId` rule in `client-core.ts`: non-empty after trim.
 * Returns the trimmed value so callers don't pass whitespace to the API.
 * Throws `IdParseError` so `main()` exits 1 (parity with `parseId`).
 */
export function parseEntryId(raw: string | undefined, name: string): string {
    if (typeof raw !== 'string' || raw.trim() === '') {
        throw new IdParseError(`${name} must be a non-empty string (got: ${raw ?? '(none)'})`);
    }
    return raw.trim();
}

export function optInt(raw: string | undefined): number | undefined {
    if (raw === undefined || !NON_NEG_INT_RE.test(raw)) return undefined;
    const n = Number(raw);
    return Number.isSafeInteger(n) ? n : undefined;
}

/**
 * Parse a comma-separated list of positive integers (`--status-id 1,5,7`).
 *
 * Returns `undefined` when `raw` is undefined (flag omitted) so callers can
 * spread it conditionally into the options object. Throws `IdParseError` when
 * any token is empty / non-integer / non-positive — failing fast on malformed
 * filters is preferable to silently dropping bad IDs (which would surface as
 * an unexpected empty result set).
 */
export function parseIdList(raw: string | undefined, name: string): number[] | undefined {
    if (raw === undefined) return undefined;
    if (raw === '') {
        throw new IdParseError(`${name} must be a comma-separated list of positive integers (got: empty)`);
    }
    const tokens = raw.split(',');
    const ids: number[] = [];
    for (const token of tokens) {
        const trimmed = token.trim();
        if (!POSITIVE_INT_RE.test(trimmed)) {
            throw new IdParseError(`${name} must be a comma-separated list of positive integers (got: ${raw})`);
        }
        ids.push(Number(trimmed));
    }
    return ids;
}
