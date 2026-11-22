import { ENTRY_ID_RE } from '../validation.js';

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

/**
 * Convert a string the caller has already matched against POSITIVE_INT_RE.
 * The pattern does not bound the length, and `Number()` rounds anything past
 * 2^53 - 1 to a neighbouring double — the request would then name a different
 * id from the one typed. Refuse instead.
 */
function toSafeInteger(digits: string, name: string): number {
    const value = Number(digits);
    if (!Number.isSafeInteger(value)) {
        throw new IdParseError(`${name} must be a safe integer (got: ${digits})`);
    }
    return value;
}

export function parseId(raw: string | undefined, name: string): number {
    if (raw === undefined || raw === '' || !POSITIVE_INT_RE.test(raw)) {
        throw new IdParseError(`${name} must be a positive integer (got: ${raw ?? '(none)'})`);
    }
    return toSafeInteger(raw, name);
}

/**
 * Parse a TestRail plan-entry ID. Validates UUID format (SEC #29) to prevent
 * path-traversal sequences from appearing in the API URL. Reuses the same
 * `ENTRY_ID_RE` the programmatic `validateEntryId` enforces (single source of
 * truth — `validation.ts` is a leaf module so importing it doesn't drag the
 * HTTP layer into the CLI).
 * Returns the trimmed value so callers don't pass whitespace to the API.
 * Throws `IdParseError` so `main()` exits 1 (parity with `parseId`).
 */
export function parseEntryId(raw: string | undefined, name: string): string {
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (!ENTRY_ID_RE.test(trimmed)) {
        throw new IdParseError(
            `${name} must be a UUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) (got: ${raw ?? '(none)'})`,
        );
    }
    return trimmed;
}

/**
 * Parse a TestRail attachment ID. Accepts either a positive integer (older /
 * Cloud instances) or a well-formed RFC 4122 UUID string (TestRail 7.1+).
 * UUID format is validated against the same `ENTRY_ID_RE` the programmatic
 * `validateAttachmentId` uses — accepting arbitrary strings would allow
 * path-traversal sequences (e.g. `../../admin`) to be injected into the URL
 * (SEC #29 parity).
 * Returns a `number` for integer inputs, a trimmed `string` for UUID inputs.
 * Throws `IdParseError` so `main()` exits 1 (parity with `parseId` and
 * `parseEntryId`).
 */
export function parseAttachmentId(raw: string | undefined, name: string): number | string {
    if (raw !== undefined && POSITIVE_INT_RE.test(raw)) {
        return toSafeInteger(raw, name);
    }
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (ENTRY_ID_RE.test(trimmed)) {
        return trimmed;
    }
    throw new IdParseError(`${name} must be a positive integer or a UUID string (got: ${raw ?? '(none)'})`);
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
        ids.push(toSafeInteger(trimmed, name));
    }
    return ids;
}
