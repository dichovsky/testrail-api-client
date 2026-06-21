/**
 * Live-API schema-audit regression tests.
 *
 * Fixtures under tests/fixtures/live-audit/ are SANITIZED captures from a real
 * TestRail Cloud instance (every string deep-scrubbed to "redacted"; numbers,
 * booleans, nulls and key-presence preserved exactly). Each assertion pins a
 * defect found by diffing live responses against the shipped Zod schemas:
 *   - parse-throwers: the shipped schema rejected the real wire shape.
 *   - bare-array wrappers: list endpoints returned a top-level array.
 *   - additive gaps: real fields the schema never modelled.
 *   - updateGroup: TestRail requires group_id in the BODY, not just the path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
    UserSchema,
    AttachmentSchema,
    StepHistoryEntrySchema,
    CaseFieldSchema,
    CaseFieldConfigSchema,
    ResultFieldSchema,
    ResultFieldConfigSchema,
    StatusSchema,
    CaseTypeSchema,
    TemplateSchema,
    RoleSchema,
    PlanEntrySchema,
} from '../src/schemas.js';
import { createClient, mockOk } from './helpers.js';
import type { ZodTypeAny } from 'zod';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'live-audit');
type Json = Record<string, unknown>;
const fx = (name: string): unknown => JSON.parse(readFileSync(join(FIX, `${name}.json`), 'utf-8'));
const fxObj = (name: string): Json => fx(name) as Json;
const fxArr = (name: string): Json[] => fx(name) as Json[];

// Module-level fetch mock (matches the repo's existing test convention).
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Throws with a readable path if the shipped schema rejects the real shape.
function mustParse(schema: ZodTypeAny, value: unknown): void {
    const r = schema.safeParse(value);
    if (!r.success) {
        throw new Error(r.error.issues.map((i) => `[${i.path.join('.')}] ${i.message}`).join('; '));
    }
}

describe('live-audit regression — parse-throwers (real wire shapes the schema must accept)', () => {
    it('UserSchema accepts integer-encoded mfa_required (get_current_user/get_user/get_users)', () => {
        const user = fxObj('user');
        expect(typeof user['mfa_required']).toBe('number'); // fixture genuinely exercises the bug
        expect(() => mustParse(UserSchema, user)).not.toThrow();
    });

    it('AttachmentSchema accepts numeric data_id (get_attachments_for_case entity)', () => {
        const att = fxObj('attachment-entity');
        expect(typeof att['data_id']).toBe('number');
        expect(() => mustParse(AttachmentSchema, att)).not.toThrow();
    });

    it('StepHistoryEntrySchema accepts numeric id/user_id (get_shared_step_history)', () => {
        const entries = fxArr('shared-step-history-bare');
        expect(entries.length).toBeGreaterThan(0);
        for (const e of entries) {
            expect(typeof e['id']).toBe('number');
            expect(() => mustParse(StepHistoryEntrySchema, e)).not.toThrow();
        }
    });

    it('CaseFieldSchema accepts configs whose options omit default_value (get_case_fields)', () => {
        const fields = fxArr('case-fields');
        const hasOmittedDefault = fields.some((f) =>
            ((f['configs'] as Json[] | undefined) ?? []).some(
                (c) => !('default_value' in ((c['options'] as Json | undefined) ?? {})),
            ),
        );
        expect(hasOmittedDefault).toBe(true); // fixture genuinely exercises the bug
        for (const f of fields) expect(() => mustParse(CaseFieldSchema, f)).not.toThrow();
    });

    it('ResultFieldSchema accepts configs whose options omit default_value (get_result_fields)', () => {
        for (const f of fxArr('result-fields')) expect(() => mustParse(ResultFieldSchema, f)).not.toThrow();
    });
});

describe('live-audit regression — bare-array list wrappers (top-level array, status 200)', () => {
    beforeEach(() => mockFetch.mockReset());

    it('getAttachmentsForTest tolerates a bare array response', async () => {
        mockFetch.mockResolvedValueOnce(mockOk(fx('attachments-test-bare')));
        const client = createClient();
        await expect(client.attachments.getAttachmentsForTest(1)).resolves.toEqual([]);
    });

    it('getSharedStepHistory tolerates a bare array response (and types the entries)', async () => {
        mockFetch.mockResolvedValueOnce(mockOk(fx('shared-step-history-bare')));
        const client = createClient();
        const history = await client.sharedSteps.getSharedStepHistory(1);
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeGreaterThan(0);
        expect(typeof history[0]?.id).toBe('number');
    });
});

describe('live-audit regression — updateGroup must send group_id in the body', () => {
    beforeEach(() => mockFetch.mockReset());

    it('injects group_id into the request body (TestRail rejects the body without it)', async () => {
        mockFetch.mockResolvedValueOnce(mockOk({ id: 7, name: 'redacted', user_ids: [] }));
        const client = createClient();
        await client.users.updateGroup(7, { name: 'x' });
        const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as RequestInit).body as string) as Json;
        expect(body['group_id']).toBe(7);
    });
});

describe('live-audit regression — additive gaps (fields present on the wire, now modelled)', () => {
    it('AttachmentSchema models cassandra_file_id', () => {
        expect(Object.keys(AttachmentSchema.shape)).toContain('cassandra_file_id');
    });
    it('i18n_custom_id is modelled on Status/CaseField/ResultField/CaseType/Template', () => {
        for (const s of [StatusSchema, CaseFieldSchema, ResultFieldSchema, CaseTypeSchema, TemplateSchema]) {
            expect(Object.keys(s.shape)).toContain('i18n_custom_id');
        }
    });
    it('RoleSchema models is_project_admin', () => {
        expect(Object.keys(RoleSchema.shape)).toContain('is_project_admin');
    });
    it('PlanEntrySchema models dynamic_filters', () => {
        expect(Object.keys(PlanEntrySchema.shape)).toContain('dynamic_filters');
    });
    it('CaseFieldConfig/ResultFieldConfig model the config-level id', () => {
        expect(Object.keys(CaseFieldConfigSchema.shape)).toContain('id');
        expect(Object.keys(ResultFieldConfigSchema.shape)).toContain('id');
    });
    it('FieldConfig options model has_expected/has_actual/has_additional/has_reference', () => {
        const optionKeys = Object.keys(CaseFieldConfigSchema.shape.options.shape);
        for (const key of ['has_expected', 'has_actual', 'has_additional', 'has_reference']) {
            expect(optionKeys).toContain(key);
        }
    });
});
