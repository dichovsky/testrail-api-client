/**
 * Regression guard for the live-audit `R-EXTRA` schema enrichment.
 *
 * The live-instance audit observed real server fields that the response schemas
 * did not declare. `zObject` is `.passthrough()`, so those keys survived parsing
 * but were invisible to typed consumers (`unknown`). This test pins each
 * newly-declared field: it must exist in the schema's `.shape`, accept the
 * observed value shape, accept `null`/`undefined` (every field is `.nullish()`),
 * and — for fields typed beyond `z.unknown()` — reject a wrong-typed value.
 *
 * Fields typed `z.unknown().nullish()` (value never observed on the wire) accept
 * anything by design and are only checked for presence + null tolerance.
 */
import { describe, it, expect } from 'vitest';
import {
    RunSchema,
    PlanSchema,
    CaseSchema,
    HistoryEntrySchema,
    ResultSchema,
    TestSchema,
} from '../src/schemas.js';
import type { ZodTypeAny } from 'zod';

/** Asserts a `.nullish()` field exists and tolerates null/undefined. */
function expectNullishField(field: ZodTypeAny | undefined): asserts field is ZodTypeAny {
    if (field === undefined) {
        throw new Error('expected schema field to be declared, but it was undefined');
    }
    expect(field.safeParse(null).success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
}

describe('R-EXTRA schema enrichment — newly declared response fields', () => {
    describe('RunSchema', () => {
        it('declares is_archived as a nullish boolean', () => {
            const f = RunSchema.shape.is_archived;
            expectNullishField(f);
            expect(f.safeParse(false).success).toBe(true);
            expect(f.safeParse('not-a-bool').success).toBe(false);
        });

        it('declares archived_on as a nullish number (epoch)', () => {
            const f = RunSchema.shape.archived_on;
            expectNullishField(f);
            expect(f.safeParse(1782040398).success).toBe(true);
            expect(f.safeParse('2026').success).toBe(false);
        });

        it('declares dynamic_filters as a nullish unknown', () => {
            const f = RunSchema.shape.dynamic_filters;
            expectNullishField(f);
            expect(f.safeParse({ any: 'shape' }).success).toBe(true);
        });

        it('round-trips a realistic run body carrying the new fields', () => {
            const parsed = RunSchema.parse({
                id: 1,
                suite_id: 2,
                name: 'r',
                include_all: false,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 11,
                created_on: 1,
                created_by: 40,
                url: 'https://example/run/1',
                is_archived: false,
                archived_on: null,
                dynamic_filters: null,
            });
            expect(parsed.is_archived).toBe(false);
            expect(parsed.archived_on).toBeNull();
        });
    });

    describe('PlanSchema', () => {
        it('declares is_archived as a nullish boolean', () => {
            const f = PlanSchema.shape.is_archived;
            expectNullishField(f);
            expect(f.safeParse(false).success).toBe(true);
            expect(f.safeParse('nope').success).toBe(false);
        });

        it('declares archived_on as a nullish number', () => {
            const f = PlanSchema.shape.archived_on;
            expectNullishField(f);
            expect(f.safeParse(1782040456).success).toBe(true);
            expect(f.safeParse('x').success).toBe(false);
        });
    });

    describe('CaseSchema', () => {
        it('declares refs_data and ai_automated_test as nullish unknowns', () => {
            const refsData = CaseSchema.shape.refs_data;
            const ai = CaseSchema.shape.ai_automated_test;
            expectNullishField(refsData);
            expectNullishField(ai);
            expect(refsData.safeParse('any').success).toBe(true);
            expect(ai.safeParse({ k: 1 }).success).toBe(true);
        });
    });

    describe('HistoryEntrySchema', () => {
        it('declares comments as a nullish array', () => {
            const f = HistoryEntrySchema.shape.comments;
            expectNullishField(f);
            expect(f.safeParse([]).success).toBe(true);
            expect(f.safeParse([{ text: 'x' }]).success).toBe(true);
            expect(f.safeParse('not-an-array').success).toBe(false);
        });
    });

    describe('ResultSchema', () => {
        it('declares case_id as a nullish number', () => {
            const f = ResultSchema.shape.case_id;
            expectNullishField(f);
            expect(f.safeParse(11055353).success).toBe(true);
            expect(f.safeParse('x').success).toBe(false);
        });

        it('declares quality_rating as a nullish number', () => {
            const f = ResultSchema.shape.quality_rating;
            expectNullishField(f);
            expect(f.safeParse(4).success).toBe(true);
            expect(f.safeParse('x').success).toBe(false);
        });

        it('declares defects_data as a nullish unknown', () => {
            const f = ResultSchema.shape.defects_data;
            expectNullishField(f);
            expect(f.safeParse({ any: 1 }).success).toBe(true);
        });

        it('declares attachment_ids as a nullish array', () => {
            const f = ResultSchema.shape.attachment_ids;
            expectNullishField(f);
            expect(f.safeParse([1, 2]).success).toBe(true);
            expect(f.safeParse(42).success).toBe(false);
        });
    });

    describe('TestSchema', () => {
        it('declares the five observed extra fields as nullish unknowns', () => {
            for (const key of [
                'sections_display_order',
                'cases_display_order',
                'refs_data',
                'case_comments',
                'ai_automated_test',
            ] as const) {
                const f = TestSchema.shape[key];
                expectNullishField(f);
                expect(f.safeParse('anything').success).toBe(true);
            }
        });
    });
});
