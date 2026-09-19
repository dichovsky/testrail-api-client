/**
 * `withDiagnostics` — the scope that replaced a six-step protocol the CLI used
 * to execute by hand.
 *
 * Every rule below was previously reachable only by driving a whole CLI
 * invocation: the ordering (reserve, register, write, remove, finish), the
 * outcome classification, and the choice between three warning strings. They
 * are asserted directly here, with a fake process lifetime so no test ever
 * registers a real `exit` listener — which, once added, nothing removes.
 */
import { mkdtempSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    DIAGNOSTIC_UNSUPPORTED_PLATFORM,
    diagnosticSupportError,
    withDiagnostics,
    type ProcessLifetime,
} from '../src/cli/diagnostics.js';
import { TestRailApiError } from '../src/errors.js';

const CREDENTIALS = { baseUrl: 'https://example.testrail.io', email: 'user@example.test', apiKey: 'test-key' };

let directory: string;
let warnings: string[];
let listeners: Set<() => void>;
let lifetime: ProcessLifetime;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'diagnostic-scope-'));
    warnings = [];
    listeners = new Set();
    lifetime = {
        onExit: (listener) => void listeners.add(listener),
        offExit: (listener) => void listeners.delete(listener),
    };
});

afterEach(() => {
    vi.restoreAllMocks();
});

function deps(reportFailure: (error: unknown) => void = () => undefined): Parameters<typeof withDiagnostics>[1] {
    return { lifetime, warn: (chunk: string) => void warnings.push(chunk), reportFailure };
}

function request(overrides: Record<string, unknown> = {}): Parameters<typeof withDiagnostics>[0] {
    return {
        path: join(directory, 'error.json'),
        otherOutput: undefined,
        dryRun: false,
        credentials: CREDENTIALS,
        ...overrides,
    };
}

function writtenRecord(): Record<string, unknown> {
    const files = readdirSync(directory);
    expect(files).toHaveLength(1);
    return JSON.parse(readFileSync(join(directory, files[0] as string), 'utf8')) as Record<string, unknown>;
}

describe('diagnosticSupportError', () => {
    it('refuses only Windows, and owns the reason', () => {
        // The CLI refuses early, before stdin or credentials, but reads the
        // reason from here — this sentence used to exist byte-identically in
        // two files.
        expect(diagnosticSupportError('win32')).toBe(DIAGNOSTIC_UNSUPPORTED_PLATFORM);
        expect(diagnosticSupportError('darwin')).toBeUndefined();
        expect(diagnosticSupportError('linux')).toBeUndefined();
    });
});

describe.skipIf(process.platform === 'win32')('withDiagnostics', () => {
    it("returns the work's value and leaves no file behind on success", async () => {
        const result = await withDiagnostics(request(), deps(), async () => 'ok');

        expect(result).toBe('ok');
        expect(readdirSync(directory)).toEqual([]);
        expect(warnings).toEqual([]);
    });

    it('registers an exit listener for the reservation and removes it again', async () => {
        let duringRun = 0;
        await withDiagnostics(request(), deps(), async () => {
            duringRun = listeners.size;
        });

        // Registered while the work runs — an async `finally` alone cannot
        // release the reservation when SIGINT terminates synchronously.
        expect(duringRun).toBe(1);
        // …and removed, so the exit path and the normal path cannot both
        // finish the same reservation.
        expect(listeners.size).toBe(0);
    });

    it('reports the failure before writing, and rethrows the original error', async () => {
        const reserved = join(directory, 'error.json');
        const boom = new TestRailApiError(500, 'Server Error', 'upstream exploded');
        // Observe the ordering through the filesystem rather than through a
        // marker only one side pushes: the reservation exists but is empty
        // until `write()` lands, so reading it at report time says which ran
        // first. Asserting on a single pushed string cannot fail.
        const observed: string[] = [];

        await expect(
            withDiagnostics(
                request({ path: reserved }),
                deps(() => void observed.push(readFileSync(reserved, 'utf8') === '' ? 'before-write' : 'after-write')),
                async () => {
                    throw boom;
                },
            ),
        ).rejects.toBe(boom);

        // The operation's own error must reach the user first; the record is a
        // side effect of that failure, never a replacement for it.
        expect(observed).toEqual(['before-write']);
        const record = writtenRecord();
        expect(record['version']).toBe(1);
        expect(record['status']).toBe(500);
    });

    it('warns about a failed cleanup after a SUCCESSFUL command without implying the operation failed', async () => {
        const reserved = join(directory, 'error.json');

        await withDiagnostics(request({ path: reserved }), deps(), async () => {
            // Replace the reservation so finalization cannot verify it, the
            // way a concurrent writer or an unlinked staging dir would.
            unlinkSync(reserved);
            writeFileSync(reserved, 'foreign');
        });

        // The distinction the two warning strings exist to draw: a cleanup
        // failure after success must not read as though the API call failed.
        expect(warnings.join('')).toContain('Command succeeded, but diagnostic file cleanup failed');
        expect(warnings.join('')).not.toContain('remains failed or indeterminate');
    });

    it.each([
        { label: 'never dispatched', dispatch: false, outcome: 'not_dispatched' },
        { label: 'dispatched', dispatch: true, outcome: 'failed_or_indeterminate' },
    ])('classifies a $label failure as $outcome', async ({ dispatch, outcome }) => {
        await expect(
            withDiagnostics(request(), deps(), async (scope) => {
                if (dispatch) scope.markDispatched();
                throw new Error('failed');
            }),
        ).rejects.toThrow('failed');

        // A request that never left the process is provably harmless; one that
        // did may have changed server state, and the record must not claim
        // otherwise.
        expect(writtenRecord()['operationOutcome']).toBe(outcome);
    });

    it.each([
        { label: 'dry-run', overrides: { dryRun: true } },
        { label: 'no --diagnostic-file', overrides: { path: undefined } },
    ])('reserves nothing for $label', async ({ overrides }) => {
        await expect(
            withDiagnostics(request(overrides), deps(), async () => {
                throw new Error('failed');
            }),
        ).rejects.toThrow('failed');

        expect(readdirSync(directory)).toEqual([]);
        expect(listeners.size).toBe(0);
        expect(warnings).toEqual([]);
    });

    it('reports a reservation that cannot be made safely, and runs no work', async () => {
        const occupied = join(directory, 'error.json');
        writeFileSync(occupied, 'pre-existing');
        const reported: unknown[] = [];
        const work = vi.fn();

        await expect(
            withDiagnostics(
                request({ path: occupied }),
                deps((error) => void reported.push(error)),
                work,
            ),
        ).rejects.toThrow();

        // The reservation refuses an existing path; the work must not run, and
        // the user must still be told why.
        expect(work).not.toHaveBeenCalled();
        expect(reported).toHaveLength(1);
        expect(readFileSync(occupied, 'utf8')).toBe('pre-existing');
    });

    it('warns without replacing the error when the record cannot be saved', async () => {
        const reported: unknown[] = [];
        const boom = new Error('original');

        await expect(
            withDiagnostics(
                request(),
                deps((error) => void reported.push(error)),
                async () => {
                    // Break serialization so the write fails at the last step.
                    // Note this also trips the redactor's own JSON.stringify,
                    // so the record degrades to `redaction_unavailable` before
                    // the write fails — the warning is still the assertion.
                    vi.spyOn(JSON, 'stringify').mockImplementation(() => {
                        throw new Error('serialization exploded');
                    });
                    throw boom;
                },
            ),
        ).rejects.toBe(boom);

        // Degrades to a warning; the diagnostic never surfaces in place of the
        // operation's own error.
        expect(reported).toEqual([boom]);
        expect(warnings.join('')).toContain('Could not save the diagnostic file');
    });
});
