import { IdParseError, parseId, parseIdList } from './ids.js';

/** Parse an optional positive integer flag without silently dropping bad input. */
export function parseOptionalId(raw: string | undefined, name: string): number | undefined {
    return raw === undefined ? undefined : parseId(raw, name);
}

/** Parse an optional comma-separated positive-integer list. */
export function parseOptionalIdList(raw: string | undefined, name: string): number[] | undefined {
    return parseIdList(raw, name);
}

/** Parse TestRail's boolean list-filter spelling. */
export function parseOptionalBoolean(raw: string | undefined, name: string): boolean | undefined {
    if (raw === undefined) return undefined;
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    throw new IdParseError(`${name} must be true, false, 1, or 0 (got: ${raw === '' ? '(empty)' : raw})`);
}

/**
 * Parse a comma-separated external-reference filter. A single token preserves
 * the legacy scalar `refs` query parameter; multiple tokens select TestRail
 * 10.7's repeated `refs[]` representation.
 */
export function parseOptionalRefs(raw: string | undefined, name = '--refs'): string | readonly string[] | undefined {
    if (raw === undefined) return undefined;
    const refs = raw.split(',').map((value) => value.trim());
    if (refs.some((value) => value === '')) {
        throw new IdParseError(`${name} must be a comma-separated list of non-empty references`);
    }
    return refs.length === 1 ? refs[0] : refs;
}

/** Parse a single external-reference filter, rejecting empty or list values. */
export function parseOptionalSingleRef(raw: string | undefined, name = '--refs'): string | undefined {
    const refs = parseOptionalRefs(raw, name);
    if (refs !== undefined && typeof refs !== 'string') {
        throw new IdParseError(`${name} accepts exactly one reference`);
    }
    return refs;
}
