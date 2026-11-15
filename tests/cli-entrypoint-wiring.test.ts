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
import { MAX_STDIN_BYTES, MAX_STDIN_UPLOAD_BYTES, STDIN_READ_TIMEOUT_MS } from '../src/constants.js';

const readBoundedStdin = vi.hoisted(() => vi.fn<(maxBytes: number, fd?: number) => string>(() => 'piped-api-key'));
const readStdinBinary = vi.hoisted(() => vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))));

vi.mock('../src/cli/stdin.js', () => ({ readBoundedStdin, readStdinBinary }));

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

afterEach(() => {
    vi.restoreAllMocks();
});

describe('src/cli.ts stdin adapter', () => {
    it('forwards the real binary input stream, byte cap, and deadline', async () => {
        const savedArgv = process.argv;
        const savedIsTTY = process.stdin.isTTY;
        const savedExitCode = process.exitCode;
        const savedEnv = { ...process.env };
        const savedListeners = new Map(
            (['exit', 'SIGINT', 'SIGTERM'] as const).map((event) => [event, process.listeners(event)]),
        );
        (process.stdin as { isTTY?: boolean | undefined }).isTTY = undefined;
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
            (process.stdin as { isTTY?: boolean | undefined }).isTTY = savedIsTTY;
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
        const savedIsTTY = process.stdin.isTTY;
        const savedExitCode = process.exitCode;
        const savedEnv = { ...process.env };

        // A pipe, not a terminal, so the --api-key-stdin path actually reads.
        (process.stdin as { isTTY?: boolean | undefined }).isTTY = undefined;
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
            expect(readBoundedStdin).toHaveBeenCalledWith(MAX_STDIN_BYTES, process.stdin.fd);
            // And with the explicit stdin fd — anything else would read
            // the wrong stream entirely.
            expect(readBoundedStdin.mock.calls[0]).toHaveLength(2);
        } finally {
            process.argv = savedArgv;
            (process.stdin as { isTTY?: boolean | undefined }).isTTY = savedIsTTY;
            process.exitCode = savedExitCode;
            for (const key of Object.keys(process.env)) delete process.env[key];
            Object.assign(process.env, savedEnv);
        }
    });
});
