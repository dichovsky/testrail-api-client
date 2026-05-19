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

export function parseId(raw: string | undefined, name: string): number {
    if (raw === undefined || raw === '' || !POSITIVE_INT_RE.test(raw)) {
        throw new IdParseError(`${name} must be a positive integer (got: ${raw ?? '(none)'})`);
    }
    // Safe: the regex guarantees a decimal-digit-only string with no leading
    // zeros, so Number() is lossless for any value that fits in a double
    // (>= 2^53 ids would already be impossible from the TestRail API).
    return Number(raw);
}

export function optInt(raw: string | undefined): number | undefined {
    if (raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : undefined;
}
