/**
 * The binary entrypoint's wiring — `src/cli.ts`.
 *
 * ARCH #11 moved everything process-shaped out of `runCli` and into that file,
 * which is the right seam but relocates a risk: `tests/cli.test.ts` now injects
 * a fake stdin reader, so nothing exercises the real adapter. A regression
 * there — a wrong fd, or dropping `maxBytes` so the 1 MiB cap (CTF #24)
 * defaults away — would ship with a fully green suite.
 *
 * This is the one entrypoint-style test kept for that wiring: it imports
 * `src/cli.js` for its side effect, the way the binary does, and asserts the
 * adapter forwards its argument unchanged.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MAX_STDIN_BYTES, MAX_STDIN_UPLOAD_BYTES, STDIN_FD, STDIN_READ_TIMEOUT_MS } from '../src/constants.js';

const readBoundedStdin = vi.hoisted(() => vi.fn<(maxBytes: number, fd?: number) => string>(() => 'piped-api-key'));
const readStdinBinary = vi.hoisted(() => vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))));

vi.mock('../src/cli/stdin.js', () => ({ readBoundedStdin, readStdinBinary }));

// A pipe, not a terminal, whatever the test runner's own descriptor 0 is.
const isatty = vi.hoisted(() => vi.fn<(fd: number) => boolean>(() => false));
vi.mock('node:tty', async (importOriginal) => ({ ...(await importOriginal<typeof import('node:tty')>()), isatty }));

// Never leave the process during this suite.
vi.mock('node:dns/promises', () => ({
    lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));

const mockFetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ id: 1, name: 'Demo', suite_mode: 1, url: 'https://example.testrail.io/p/1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    }),
);
globalThis.fetch = mockFetch;

// Every import of the entrypoint registers stdout and stderr 'error' listeners,
// and a constructed client registers exit/SIGINT/SIGTERM handlers.
const stdoutErrorListeners = process.stdout.listeners('error');
const stderrErrorListeners = process.stderr.listeners('error');
const processListeners = new Map(
    (['exit', 'SIGINT', 'SIGTERM'] as const).map((event) => [event, process.listeners(event)]),
);

function entrypointStdoutErrorListeners(): ((error: Error) => void)[] {
    return process.stdout.listeners('error').filter((listener) => !stdoutErrorListeners.includes(listener));
}

function entrypointStderrErrorListeners(): ((error: Error) => void)[] {
    return process.stderr.listeners('error').filter((listener) => !stderrErrorListeners.includes(listener));
}

afterEach(() => {
    vi.restoreAllMocks();
    for (const listener of entrypointStdoutErrorListeners()) process.stdout.removeListener('error', listener);
    for (const listener of entrypointStderrErrorListeners()) process.stderr.removeListener('error', listener);
    for (const [event, listeners] of processListeners) {
        for (const listener of process.listeners(event)) {
            if (!listeners.includes(listener)) process.removeListener(event, listener);
        }
    }
});

describe('src/cli.ts stdin adapter', () => {
    it('forwards the real binary input stream, byte cap, and deadline', async () => {
        const savedArgv = process.argv;
        const savedExitCode = process.exitCode;
        const savedEnv = { ...process.env };
        const savedListeners = new Map(
            (['exit', 'SIGINT', 'SIGTERM'] as const).map((event) => [event, process.listeners(event)]),
        );
        process.argv = ['node', 'testrail', 'attachment', 'add-to-case', '1', '--file', '-', '--quiet'];
        process.env['TESTRAIL_BASE_URL'] = 'https://example.testrail.io';
        process.env['TESTRAIL_EMAIL'] = 'user@example.com';
        process.env['TESTRAIL_API_KEY'] = 'test-api-key';
        process.exitCode = undefined;
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ attachment_id: 1 }), { status: 200 }));

        try {
            vi.resetModules();
            await import('../src/cli.js');
            await vi.waitFor(() => expect(process.exitCode).not.toBeUndefined(), { interval: 1, timeout: 10_000 });

            expect(process.exitCode).toBe(0);
            expect(readStdinBinary).toHaveBeenCalledExactlyOnceWith(
                process.stdin,
                MAX_STDIN_UPLOAD_BYTES,
                STDIN_READ_TIMEOUT_MS,
            );
        } finally {
            process.argv = savedArgv;
            process.exitCode = savedExitCode;
            for (const key of Object.keys(process.env)) delete process.env[key];
            Object.assign(process.env, savedEnv);
            for (const [event, listeners] of savedListeners) {
                for (const listener of process.listeners(event)) {
                    if (!listeners.includes(listener)) process.removeListener(event, listener);
                }
            }
        }
    });

    it('forwards the bounded-read cap unchanged and reads the explicit stdin descriptor', async () => {
        const savedArgv = process.argv;
        const savedExitCode = process.exitCode;
        const savedEnv = { ...process.env };
        // Creating `process.stdin` makes Node open descriptor 0 in
        // non-blocking mode, after which a synchronous read of a slow pipe
        // reports EAGAIN instead of waiting. The text path must never touch it.
        const stdinGetter = vi.spyOn(process, 'stdin', 'get');

        process.argv = ['node', 'testrail', 'project', 'get', '1', '--api-key-stdin', '--quiet'];
        process.env['TESTRAIL_BASE_URL'] = 'https://example.testrail.io';
        process.env['TESTRAIL_EMAIL'] = 'user@example.com';
        delete process.env['TESTRAIL_API_KEY'];
        process.exitCode = undefined;

        try {
            vi.resetModules();
            await import('../src/cli.js');
            await vi.waitFor(() => expect(process.exitCode).not.toBeUndefined(), { interval: 1, timeout: 10_000 });

            expect(readBoundedStdin).toHaveBeenCalled();
            // The cap must arrive intact: defaulting it away would let an
            // attacker pipe unbounded bytes into the key read.
            expect(readBoundedStdin).toHaveBeenCalledWith(MAX_STDIN_BYTES, STDIN_FD);
            // And with the explicit stdin fd — anything else would read
            // the wrong stream entirely.
            expect(readBoundedStdin.mock.calls[0]).toHaveLength(2);
            expect(isatty).toHaveBeenCalledWith(STDIN_FD);
            // The stream exists by the time the read starts, so the reader
            // polls a non-blocking descriptor under its deadline.
            expect(stdinGetter).toHaveBeenCalled();
            expect(stdinGetter.mock.invocationCallOrder[0]).toBeLessThan(
                readBoundedStdin.mock.invocationCallOrder[0] ?? Number.NaN,
            );
        } finally {
            process.argv = savedArgv;
            process.exitCode = savedExitCode;
            for (const key of Object.keys(process.env)) delete process.env[key];
            Object.assign(process.env, savedEnv);
        }
    });
});

describe('src/cli.ts stdout error handling', () => {
    it('ends quietly when the stdout reader has gone and keeps every other stream error fatal', async () => {
        const savedArgv = process.argv;
        const savedExitCode = process.exitCode;
        const savedEnv = { ...process.env };
        // A real exit would take the test worker with it.
        const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

        // Refused before any request, and silent: nothing reaches the runner's streams.
        process.argv = ['node', 'testrail', 'project', 'get', 'not-an-id', '--quiet'];
        process.env['TESTRAIL_BASE_URL'] = 'https://example.testrail.io';
        process.env['TESTRAIL_EMAIL'] = 'user@example.com';
        process.env['TESTRAIL_API_KEY'] = 'test-api-key';
        process.exitCode = undefined;

        try {
            vi.resetModules();
            await import('../src/cli.js');
            await vi.waitFor(() => expect(process.exitCode).not.toBeUndefined(), { interval: 1, timeout: 10_000 });
            expect(process.exitCode).toBe(1);

            const listeners = entrypointStdoutErrorListeners();
            expect(listeners).toHaveLength(1);
            const onStdoutError = listeners[0] as (error: Error) => void;
            // `cmd 2>&1 | head` closes stderr too; the same handler covers it.
            expect(entrypointStderrErrorListeners()).toEqual([onStdoutError]);

            // `testrail case list --all | head`: the reader closed the pipe.
            onStdoutError(Object.assign(new Error('write EPIPE'), { code: 'EPIPE' }));
            // No explicit code, so the failure recorded above is what the
            // process exits with; `process.exit(0)` would report success.
            expect(exit).toHaveBeenCalledExactlyOnceWith();

            // Anything else is a real failure and must not be swallowed.
            const other = Object.assign(new Error('write EIO'), { code: 'EIO' });
            expect(() => onStdoutError(other)).toThrow(other);
            expect(() => onStdoutError(new Error('no code at all'))).toThrow('no code at all');
            expect(exit).toHaveBeenCalledTimes(1);
            expect(mockFetch).not.toHaveBeenCalled();
        } finally {
            process.argv = savedArgv;
            process.exitCode = savedExitCode;
            for (const key of Object.keys(process.env)) delete process.env[key];
            Object.assign(process.env, savedEnv);
        }
    });
});
