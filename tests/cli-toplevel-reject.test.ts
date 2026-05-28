/**
 * Coverage for the top-level `main().then(onFulfilled, onRejected)` handler in
 * src/cli/index.ts.
 *
 * main() is written to catch every reachable error internally and resolve with
 * an exit code, so the rejection arm only fires for a "hypothetical failure
 * that bypasses the inner try/catch" (e.g. a synchronous throw from a
 * collaborator invoked outside main()'s try block). To exercise it
 * deterministically we mock `createOutput` — called unconditionally near the
 * top of main(), before its try block — to throw. That makes main() reject,
 * driving the onRejected callback (sanitized stderr write + process.exit(1)).
 *
 * This mock is file-scoped (hoisted), so it lives in its own file rather than
 * polluting the main cli.test.ts suite where createOutput must work normally.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// DNS + sleep mocks mirror cli.test.ts so module load doesn't hit the network
// or real timers (defensive — the reject fires before any network work here).
vi.mock('node:dns/promises', () => ({
    lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));
vi.mock('../src/utils.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils.js')>();
    return { ...actual, sleep: vi.fn().mockResolvedValue(undefined) };
});

// Force a synchronous throw from createOutput so main() rejects. The thrown
// value is controllable per-test (hoisted control) so we can cover both arms
// of the onRejected handler's `e instanceof Error ? e.message : String(e)`:
// an Error (message extracted) and a non-Error (String() fallback). The Error
// message carries a control char to also prove the arm routes through
// sanitizeForTerminal before writing to stderr.
const rejectControl = vi.hoisted(() => ({ throwNonError: false }));
vi.mock('../src/cli/output.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/cli/output.js')>();
    return {
        ...actual,
        createOutput: () => {
            if (rejectControl.throwNonError) {
                // Throw a non-Error to exercise the handler's String(e) arm.
                // Typed `unknown` so this is an intentional non-Error throw.
                const nonError: unknown = 'boom-string-not-an-error';
                throw nonError;
            }
            throw new Error('boom-from-createOutput\x1b[31m');
        },
    };
});

const ORIG_ARGV = process.argv.slice();

describe('top-level main() rejection handler', () => {
    afterEach(() => {
        process.argv = ORIG_ARGV;
        rejectControl.throwNonError = false;
        vi.resetModules();
        vi.clearAllMocks();
    });

    async function runUntilExit(): Promise<{ stderr: string; exitCodes: number[] }> {
        vi.resetModules();
        // Valid resource/action argv so main() runs past the meta-flag gates
        // and reaches createOutput (which the mock makes throw).
        process.argv = ['node', 'testrail', 'project', 'list'];
        process.env['TESTRAIL_BASE_URL'] = 'https://example.testrail.io';
        process.env['TESTRAIL_EMAIL'] = 'test@example.com';
        process.env['TESTRAIL_API_KEY'] = 'test-api-key';

        const stderrChunks: string[] = [];
        const exitCodes: number[] = [];
        const spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });
        let exitResolve!: () => void;
        const exitPromise = new Promise<void>((resolve) => {
            exitResolve = resolve;
        });
        const spyExit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
            exitCodes.push(code ?? 0);
            exitResolve();
        }) as never);

        try {
            await import('../src/cli.js');
            await Promise.race([exitPromise, new Promise<void>((resolve) => setTimeout(resolve, 5_000))]);
        } finally {
            spyErr.mockRestore();
            spyExit.mockRestore();
            delete process.env['TESTRAIL_BASE_URL'];
            delete process.env['TESTRAIL_EMAIL'];
            delete process.env['TESTRAIL_API_KEY'];
        }
        return { stderr: stderrChunks.join(''), exitCodes };
    }

    it('writes a sanitized error to stderr and exits 1 when main() rejects with an Error', async () => {
        rejectControl.throwNonError = false;
        const { stderr, exitCodes } = await runUntilExit();
        expect(exitCodes).toContain(1);
        expect(stderr).toContain('Error:');
        // Error branch: the Error.message is surfaced...
        expect(stderr).toContain('boom-from-createOutput');
        // ...and the ESC byte must have been stripped by sanitizeForTerminal.
        expect(stderr).not.toContain('\x1b');
    });

    it('falls back to String(e) and exits 1 when main() rejects with a non-Error', async () => {
        // Exercises the `e instanceof Error ? e.message : String(e)` false arm
        // in the onRejected handler — a thrown string is stringified, not
        // `.message`-accessed.
        rejectControl.throwNonError = true;
        const { stderr, exitCodes } = await runUntilExit();
        expect(exitCodes).toContain(1);
        expect(stderr).toContain('Error:');
        expect(stderr).toContain('boom-string-not-an-error');
    });
});
