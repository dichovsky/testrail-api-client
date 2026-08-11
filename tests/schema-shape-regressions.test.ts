import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { listOfNested, unwrapNestedList } from '../src/modules/list.js';
import { TestRailConfigSchema } from '../src/schemas/common.js';
import { UpdateTestsResponseSchema } from '../src/schemas/tests.js';

describe('PR #253 response-shape regressions', () => {
    describe('UpdateTestsResponseSchema', () => {
        it('requires both acknowledgement fields', () => {
            expect(UpdateTestsResponseSchema.safeParse({}).success).toBe(false);
            expect(UpdateTestsResponseSchema.safeParse({ test_ids: [1] }).success).toBe(false);
            expect(UpdateTestsResponseSchema.safeParse({ labels: [] }).success).toBe(false);
            expect(UpdateTestsResponseSchema.safeParse({ test_ids: null, labels: null }).success).toBe(false);
        });

        it('accepts the documented acknowledgement', () => {
            const acknowledgement = {
                test_ids: [1, 2],
                labels: [{ id: 3, title: 'smoke' }],
            };
            expect(UpdateTestsResponseSchema.parse(acknowledgement)).toEqual(acknowledgement);
        });
    });

    describe('nested list envelopes', () => {
        const HistoryEntrySchema = z.object({
            id: z.number(),
            user_id: z.number(),
            type_id: z.number(),
        });
        const schema = listOfNested('history', HistoryEntrySchema);
        const first = { id: 1, user_id: 2, type_id: 3 };
        const second = { id: 4, user_id: 5, type_id: 6 };

        it('normalizes every unambiguous envelope shape that the schema accepts', () => {
            const nested = schema.parse([{ history: [first, second] }]);
            expect(unwrapNestedList('history', nested)).toEqual([first, second]);
            expect(unwrapNestedList('history', schema.parse({ history: [first, second] }))).toEqual([first, second]);
            expect(unwrapNestedList('history', schema.parse([first, second]))).toEqual([first, second]);
        });

        it('throws rather than returning malformed, mixed, or ambiguous envelopes as history entries', () => {
            const malformed = [{ history: 'not-an-array' }];
            const mixed = [{ history: [first] }, second];
            const multiple = [{ history: [first] }, { history: [second] }];

            expect(schema.safeParse(malformed).success).toBe(false);
            expect(schema.safeParse(mixed).success).toBe(false);
            expect(schema.safeParse(multiple).success).toBe(false);
            expect(() => unwrapNestedList('history', malformed)).toThrow();
            expect(() => unwrapNestedList('history', mixed)).toThrow();
            expect(() => unwrapNestedList('history', multiple)).toThrow();
        });
    });

    describe('TestRailConfigSchema', () => {
        const requiredConfig = {
            baseUrl: 'https://example.com',
            email: 'agent@example.com',
            apiKey: 'test-key',
        };

        it('rejects a non-function schema mismatch hook', () => {
            expect(TestRailConfigSchema.safeParse({ ...requiredConfig, onSchemaMismatch: 'warn' }).success).toBe(false);
        });

        it('accepts a function hook without replacing it', () => {
            const hook = (): void => undefined;
            const parsed = TestRailConfigSchema.parse({ ...requiredConfig, onSchemaMismatch: hook });
            expect(parsed.onSchemaMismatch).toBe(hook);
        });
    });
});
