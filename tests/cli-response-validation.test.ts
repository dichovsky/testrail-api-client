import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createCliSchemaMismatchReporter, resolveStrictResponses } from '../src/cli/response-validation.js';

function mismatchError(schema: z.ZodType, value: unknown): z.ZodError {
    const result = schema.safeParse(value);
    if (result.success) throw new Error('Test fixture must fail schema validation');
    return result.error;
}

describe('CLI response-validation reporter', () => {
    it('redacts dynamic record-value and catchall keys and rejects unsafe telemetry tokens', () => {
        const chunks: string[] = [];
        const reporter = createCliSchemaMismatchReporter({
            strict: false,
            quiet: false,
            resource: 'person@example.test',
            action: 'get?token=private',
            write: (chunk) => chunks.push(chunk),
        });
        const recordValueError = mismatchError(z.object({ attributes: z.record(z.string(), z.number()) }), {
            attributes: { alice: 'private-value' },
        });
        const catchallError = mismatchError(z.object({}).catchall(z.number()), { bob: 'private-value' });

        reporter.onSchemaMismatch({
            method: 'TRACE private-method',
            endpoint: 'get_user_by_email&email=person%40example.test',
            error: recordValueError,
            data: { attributes: { alice: 'private-value' } },
        });
        reporter.onSchemaMismatch({
            method: 'TRACE private-method',
            endpoint: 'get_user_by_email&email=person%40example.test',
            error: catchallError,
            data: { bob: 'private-value' },
        });
        reporter.flush();

        const output = chunks.join('');
        expect(output).toContain('method=UNKNOWN command=unknown:unknown code=invalid_type path=$.*.*');
        expect(output).toContain('method=UNKNOWN command=unknown:unknown code=invalid_type path=$.*');
        expect(output).not.toMatch(/alice|bob|attributes|private|person|email|token/i);
    });

    it('reports a singular suppressed warning once even when flush is repeated', () => {
        const chunks: string[] = [];
        const shallowValue = { field: 'x' };
        const nestedValue = { outer: { field: 'x' } };
        const shallowError = mismatchError(z.object({ field: z.number() }), shallowValue);
        const nestedError = mismatchError(z.object({ outer: z.object({ field: z.number() }) }), nestedValue);
        const reporter = createCliSchemaMismatchReporter({
            strict: false,
            quiet: false,
            resource: 'project',
            action: 'list',
            write: (chunk) => chunks.push(chunk),
        });

        for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE']) {
            reporter.onSchemaMismatch({
                method,
                endpoint: 'get_projects',
                error: shallowError,
                data: shallowValue,
            });
        }
        for (const method of ['GET', 'POST', 'PUT']) {
            reporter.onSchemaMismatch({
                method,
                endpoint: 'get_projects',
                error: nestedError,
                data: nestedValue,
            });
        }
        reporter.flush();
        reporter.flush();

        const lines = chunks.join('').trimEnd().split('\n');
        expect(lines.filter((line) => line.startsWith('Warning: response schema mismatch:'))).toHaveLength(10);
        expect(lines.at(-1)).toBe('Warning: suppressed 1 additional response schema mismatch warning.');
    });

    it('flattens invalid record keys and normalizes unsafe issue codes', () => {
        const chunks: string[] = [];
        const reporter = createCliSchemaMismatchReporter({
            strict: false,
            quiet: false,
            resource: 'project',
            action: 'list',
            write: (chunk) => chunks.push(chunk),
        });
        const invalidKeyError = mismatchError(z.record(z.number(), z.string()), { privateKey: 'value' });
        const unsafeCodeError = {
            issues: [{ code: 'private-value!', path: [] }],
        } as unknown as z.ZodError;

        reporter.onSchemaMismatch({ method: 'GET', endpoint: 'ignored', error: invalidKeyError, data: {} });
        reporter.onSchemaMismatch({ method: 'GET', endpoint: 'ignored', error: unsafeCodeError, data: {} });

        const output = chunks.join('');
        expect(output).toContain('code=invalid_key');
        expect(output).toContain('code=unknown path=$');
        expect(output).not.toContain('private-value');
    });

    it('pluralizes a bounded summary when multiple unique warnings are suppressed', () => {
        const chunks: string[] = [];
        const reporter = createCliSchemaMismatchReporter({
            strict: false,
            quiet: false,
            resource: 'project',
            action: 'list',
            write: (chunk) => chunks.push(chunk),
        });

        for (let depth = 0; depth < 12; depth += 1) {
            const error = {
                issues: [{ code: 'invalid_type', path: Array.from({ length: depth }, () => 'private') }],
            } as unknown as z.ZodError;
            reporter.onSchemaMismatch({ method: 'GET', endpoint: 'ignored', error, data: {} });
        }
        reporter.flush();

        expect(chunks.at(-1)).toBe('Warning: suppressed 2 additional response schema mismatch warnings.\n');
    });

    it('keeps exact strict-response environment semantics in the pure resolver', () => {
        expect(resolveStrictResponses(false, undefined)).toEqual({ ok: true, strict: false });
        expect(resolveStrictResponses(false, '1')).toEqual({ ok: true, strict: true });
        expect(resolveStrictResponses(true, '0')).toEqual({ ok: true, strict: true });
        expect(resolveStrictResponses(false, 'true')).toEqual({
            ok: false,
            error: "TESTRAIL_STRICT_RESPONSES must be exactly '1', '0', or empty/unset.",
        });
    });
});
