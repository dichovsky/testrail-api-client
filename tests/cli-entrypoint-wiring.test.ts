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
import { MAX_STDIN_BYTES } from '../src/constants.js';

const readBoundedStdin = vi.hoisted(() => vi.fn<(maxBytes: number, fd?: number) => string>(() => 'piped-api-key'));

vi.mock('../src/cli/stdin.js', () => ({ readBoundedStdin }));

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
    it('forwards the bounded-read cap unchanged and reads the default descriptor', async () => {
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
            expect(readBoundedStdin).toHaveBeenCalledWith(MAX_STDIN_BYTES);
            // And with no fd override — fd 0 is stdin; anything else would read
            // the wrong stream entirely.
            expect(readBoundedStdin.mock.calls[0]).toHaveLength(1);
        } finally {
            process.argv = savedArgv;
            (process.stdin as { isTTY?: boolean | undefined }).isTTY = savedIsTTY;
            process.exitCode = savedExitCode;
            for (const key of Object.keys(process.env)) delete process.env[key];
            Object.assign(process.env, savedEnv);
        }
    });
});
