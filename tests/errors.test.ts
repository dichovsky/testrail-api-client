import { describe, expect, it } from 'vitest';
import { MAX_SANITIZED_CAUSE_DEPTH } from '../src/constants.js';
import { isLicenseRestriction, sanitizedCause } from '../src/errors.js';

describe('isLicenseRestriction', () => {
    // TestRail sends `{"error": "<text>"}`. When `error` is not a string, the
    // classifier falls back to matching the raw body, so a wrapper shape that
    // nests the text is still recognised.
    it('classifies a 403 whose error is an object that carries the license text', () => {
        const body = '{"error":{"message":"This feature requires Enterprise license"}}';

        expect(isLicenseRestriction(403, body)).toBe(true);
    });

    it('does not classify a 403 whose non-string error never mentions Enterprise licensing', () => {
        expect(isLicenseRestriction(403, '{"error":{"code":7}}')).toBe(false);
    });
});

describe('sanitizedCause', () => {
    it('stops copying at MAX_SANITIZED_CAUSE_DEPTH, including AggregateError members', () => {
        // A chain whose AggregateError sits at the depth limit keeps the error
        // itself but copies none of its members.
        let reason: unknown = new AggregateError([new Error('member')], 'deepest');
        for (let level = 0; level < MAX_SANITIZED_CAUSE_DEPTH; level += 1) {
            reason = new Error(`level ${level}`, { cause: reason });
        }

        let copy = sanitizedCause(reason) as Error;
        for (let level = 0; level < MAX_SANITIZED_CAUSE_DEPTH; level += 1) copy = copy.cause as Error;

        expect(copy).toBeInstanceOf(AggregateError);
        expect(copy.message).toBe('deepest');
        expect((copy as AggregateError).errors).toEqual([]);
        expect(copy.cause).toBeUndefined();
    });

    it('ends a cyclic cause chain at the depth limit', () => {
        const a = new Error('a');
        const b = new Error('b', { cause: a });
        Object.defineProperty(a, 'cause', { value: b });

        let copy = sanitizedCause(a) as Error | undefined;
        let levels = 0;
        while (copy !== undefined) {
            levels += 1;
            copy = copy.cause as Error | undefined;
        }
        expect(levels).toBe(MAX_SANITIZED_CAUSE_DEPTH + 1);
    });
});
