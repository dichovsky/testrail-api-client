/**
 * Numeric ids at or above 2^53.
 *
 * The id parsers validated the digits and then called `Number()`, which rounds
 * anything past `Number.MAX_SAFE_INTEGER` to a neighbouring double. The request
 * then named a different id from the one typed — on `run delete`, a different
 * run. They must refuse instead.
 */
import { describe, expect, it } from 'vitest';
import { IdParseError, parseAttachmentId, parseId, parseIdList } from '../src/cli/ids.js';

const MAX_SAFE = String(Number.MAX_SAFE_INTEGER);
const UNSAFE = ['9007199254740992', '9007199254740993', '99999999999999999999999'] as const;

describe('CLI id parsers and unsafe integers', () => {
    it('still accept the largest safe integer', () => {
        expect(parseId(MAX_SAFE, 'run_id')).toBe(Number.MAX_SAFE_INTEGER);
        expect(parseAttachmentId(MAX_SAFE, 'attachment_id')).toBe(Number.MAX_SAFE_INTEGER);
        expect(parseIdList(`1,${MAX_SAFE}`, '--type-id')).toEqual([1, Number.MAX_SAFE_INTEGER]);
    });

    it.each(UNSAFE)('parseId rejects %s rather than rounding it', (raw) => {
        expect(() => parseId(raw, 'run_id')).toThrow(IdParseError);
        expect(() => parseId(raw, 'run_id')).toThrow(`run_id must be a safe integer (got: ${raw})`);
    });

    it.each(UNSAFE)('parseAttachmentId rejects %s rather than rounding it', (raw) => {
        expect(() => parseAttachmentId(raw, 'attachment_id')).toThrow(IdParseError);
        expect(() => parseAttachmentId(raw, 'attachment_id')).toThrow(
            `attachment_id must be a safe integer (got: ${raw})`,
        );
    });

    it.each(UNSAFE)('parseIdList rejects a list containing %s', (raw) => {
        expect(() => parseIdList(`1, ${raw},3`, '--type-id')).toThrow(IdParseError);
        expect(() => parseIdList(`1, ${raw},3`, '--type-id')).toThrow(`--type-id must be a safe integer (got: ${raw})`);
    });
});
