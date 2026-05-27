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
import { writeFileSync, mkdtempSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
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
            const result = resolveBody({ readStdin: () => VALID_JSON }, AddCasePayloadSchema);
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.source).toBe('stdin');
                expect(result.payload.title).toBe('My case');
            }
        });

        it('rejects stdin with malformed JSON', () => {
            const result = resolveBody({ readStdin: () => 'not json' }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('Invalid JSON');
        });

        it('surfaces a thunk failure as a structured "Cannot read stdin" error', () => {
            const result = resolveBody(
                {
                    readStdin: () => {
                        throw new Error('EAGAIN');
                    },
                },
                AddCasePayloadSchema,
            );
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('Cannot read stdin');
        });

        it('falls back to String(e) when stdin thunk throws a non-Error value', () => {
            // Defensive: a thunk that rejects with a plain string (rather than
            // an Error instance) must not crash on `.message` access. Exercises
            // the `e instanceof Error ? e.message : String(e)` false branch.
            const result = resolveBody(
                {
                    readStdin: () => {
                        // eslint-disable-next-line @typescript-eslint/only-throw-error
                        throw 'string-shaped failure';
                    },
                },
                AddCasePayloadSchema,
            );
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error).toContain('Cannot read stdin');
                expect(result.error).toContain('string-shaped failure');
            }
        });

        it('does not invoke the thunk when --data is also provided (mutex check happens first)', () => {
            let called = 0;
            const result = resolveBody(
                {
                    dataFlag: VALID_JSON,
                    readStdin: () => {
                        called += 1;
                        return VALID_JSON;
                    },
                },
                AddCasePayloadSchema,
            );
            expect(result.ok).toBe(false); // mutex error
            expect(called).toBe(0); // thunk never ran
        });
    });

    describe('--data-file symlink rejection and size cap (SEC #17)', () => {
        it('rejects a --data-file path that is a symlink', () => {
            if (process.platform === 'win32') return; // symlinks may require elevated privileges on Windows
            // O_NOFOLLOW causes openSync to fail when the path is a symlink,
            // preventing traversal to a sensitive file outside the cwd.
            const realFile = join(tmp, 'real.json');
            const symlinkPath = join(tmp, 'link.json');
            writeFileSync(realFile, JSON.stringify({ title: 'test' }), 'utf-8');
            symlinkSync(realFile, symlinkPath);
            try {
                const result = resolveBody({ dataFileFlag: symlinkPath }, AddCasePayloadSchema);
                expect(result.ok).toBe(false);
                // O_NOFOLLOW throws ELOOP on macOS/Linux; the message surfaces
                // via the catch branch as "Cannot read --data-file '...': ..."
                if (!result.ok) {
                    expect(result.error).toMatch(/Cannot read --data-file|not a regular file/i);
                }
            } finally {
                try {
                    unlinkSync(symlinkPath);
                } catch {
                    /* best-effort */
                }
            }
        });

        it('rejects a --data-file path that exceeds MAX_DATA_FILE_BYTES', () => {
            // A file larger than 1 MiB must be rejected before being read into
            // memory to prevent memory exhaustion (SEC #17).
            const bigFile = join(tmp, 'big.json');
            // Write a file slightly over the 1 MiB limit
            const padding = 'a'.repeat(1_100_000);
            writeFileSync(bigFile, `{"title":"${padding}"}`, 'utf-8');
            const result = resolveBody({ dataFileFlag: bigFile }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error).toContain('exceeds maximum size');
            }
        });

        it('rejects a --data-file path that is a directory (isFile() guard)', () => {
            // openSync(O_RDONLY | O_NOFOLLOW) succeeds on directories; the
            // fstatSync().isFile() check must catch this before readFileSync.
            const result = resolveBody({ dataFileFlag: tmp }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error).toMatch(/not a regular file/i);
            }
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
            const result = resolveBody({ dataFlag: VALID_JSON, readStdin: () => VALID_JSON }, AddCasePayloadSchema);
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error).toContain('Multiple body sources');
        });

        it('rejects when all three sources are provided', () => {
            const path = join(tmp, 'p.json');
            writeFileSync(path, VALID_JSON, 'utf-8');
            const result = resolveBody(
                { dataFlag: VALID_JSON, dataFileFlag: path, readStdin: () => VALID_JSON },
                AddCasePayloadSchema,
            );
            expect(result.ok).toBe(false);
        });
    });
});
