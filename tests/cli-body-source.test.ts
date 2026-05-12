/**
 * Unit tests for src/cli/body.ts — the write-action body-source resolver.
 *
 * Covers every supported input source (--data, --data-file, stdin), the
 * mutex enforcement, malformed-JSON handling, file-not-found, and Zod
 * validation rejection. Schema interaction uses AddCasePayloadSchema as a
 * representative; per-schema parse/reject behavior is covered by
 * tests/payload-schemas.test.ts.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveBody } from '../src/cli/body.js';
import { AddCasePayloadSchema } from '../src/schemas.js';

const VALID_JSON = '{"title":"My case"}';

describe('resolveBody', () => {
    let tmp: string;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-cli-body-'));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    describe('zero sources', () => {
        it('rejects when no body source is provided', () => {
            const result = resolveBody({}, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error).toContain('Body required');
                expect(result.error).toContain('--data');
                expect(result.error).toContain('--data-file');
                expect(result.error).toContain('stdin');
            }
        });
    });

    describe('--data', () => {
        it('parses a valid inline JSON payload', () => {
            const result = resolveBody({ dataFlag: VALID_JSON }, AddCasePayloadSchema);
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.source).toBe('data');
                expect(result.payload.title).toBe('My case');
            }
        });

        it('rejects malformed JSON', () => {
            const result = resolveBody({ dataFlag: '{ not valid' }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('Invalid JSON');
        });

        it('rejects JSON that fails Zod validation', () => {
            const result = resolveBody({ dataFlag: '{"title":123}' }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('validation failed');
        });
    });

    describe('--data-file', () => {
        it('reads and parses a valid file', () => {
            const path = join(tmp, 'payload.json');
            writeFileSync(path, VALID_JSON, 'utf-8');
            const result = resolveBody({ dataFileFlag: path }, AddCasePayloadSchema);
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.source).toBe('file');
                expect(result.payload.title).toBe('My case');
            }
        });

        it('rejects when the file does not exist', () => {
            const result = resolveBody({ dataFileFlag: join(tmp, 'missing.json') }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('Cannot read --data-file');
        });

        it('rejects when the file contains malformed JSON', () => {
            const path = join(tmp, 'bad.json');
            writeFileSync(path, '{ broken', 'utf-8');
            const result = resolveBody({ dataFileFlag: path }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('Invalid JSON');
        });
    });

    describe('stdin', () => {
        it('parses stdin contents when provided', () => {
            const result = resolveBody({ stdin: VALID_JSON }, AddCasePayloadSchema);
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.source).toBe('stdin');
                expect(result.payload.title).toBe('My case');
            }
        });

        it('rejects stdin with malformed JSON', () => {
            const result = resolveBody({ stdin: 'not json' }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('Invalid JSON');
        });
    });

    describe('mutually-exclusive sources', () => {
        it('rejects when both --data and --data-file are provided', () => {
            const result = resolveBody({ dataFlag: VALID_JSON, dataFileFlag: 'p' }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error).toContain('Multiple body sources');
                expect(result.error).toContain('data');
                expect(result.error).toContain('file');
            }
        });

        it('rejects when --data and stdin are both provided', () => {
            const result = resolveBody({ dataFlag: VALID_JSON, stdin: VALID_JSON }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('Multiple body sources');
        });

        it('rejects when all three sources are provided', () => {
            const path = join(tmp, 'p.json');
            writeFileSync(path, VALID_JSON, 'utf-8');
            const result = resolveBody(
                { dataFlag: VALID_JSON, dataFileFlag: path, stdin: VALID_JSON },
                AddCasePayloadSchema,
            );
            expect(result.ok).toBe(false);
        });
    });
});
