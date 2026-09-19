/**
 * Output ownership — every byte the CLI emits leaves through the runtime's
 * writers, and nothing reaches `process.stdout` / `process.stderr` on its own.
 *
 * `runCli` took a `CliRuntime` in ARCH #11 but could not claim this: four
 * collaborators still wrote straight to the process streams — the raw-binary
 * ack behind `attachment get --out -`, the install/uninstall-skill
 * meta-commands, the schema-mismatch reporter, and `run watch`'s status line.
 * A caller embedding the CLI got most of its output through the writers it
 * supplied and the rest on the terminal, and `tests/cli.test.ts` had to spy
 * both streams to see everything.
 *
 * Each test below drives one of those paths and asserts the same two things:
 * the content arrives through the injected writers, and the process streams
 * stay untouched. The second half is what a spy on the streams cannot tell you
 * when the harness merges both sources into one string.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli/index.js';
import { TestRailClient } from '../src/client.js';

// No real DNS: validatePublicHost() would otherwise make a live lookup.
vi.mock('node:dns/promises', () => ({
    lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));

const AUTH_ENV = {
    TESTRAIL_BASE_URL: 'https://example.testrail.io',
    TESTRAIL_EMAIL: 'test@example.com',
    TESTRAIL_API_KEY: 'test-api-key',
};

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

interface Invocation {
    readonly exitCode: number;
    /** Written through `runtime.stdout`. */
    readonly stdout: string;
    /** Written through `runtime.stderr`. */
    readonly stderr: string;
    /** Anything that bypassed the runtime and hit the process streams. */
    readonly leaked: string;
}

let leaked: string[];

beforeEach(() => {
    mockFetch.mockReset();
    leaked = [];
});

afterEach(() => {
    vi.restoreAllMocks();
});

async function invoke(argv: readonly string[]): Promise<Invocation> {
    const stdout: string[] = [];
    const stderr: string[] = [];

    // Record rather than throw: a leak should surface as a readable diff of
    // what escaped, not as an exception from inside the code under test.
    const record = (chunk: unknown): boolean => {
        leaked.push(typeof chunk === 'string' ? chunk : String(chunk));
        return true;
    };
    vi.spyOn(process.stdout, 'write').mockImplementation(record);
    vi.spyOn(process.stderr, 'write').mockImplementation(record);

    const exitCode = await runCli({
        argv,
        env: AUTH_ENV,
        stdout: (chunk) => void stdout.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('binary')),
        stderr: (chunk) => void stderr.push(chunk),
        // A pipe, not a terminal: `--out -` writes bytes without the TTY warning.
        stdoutIsTTY: false,
        stdin: { isTTY: true, read: () => '' },
        createClient: (config) => new TestRailClient(config),
        platform: process.platform,
        lifetime: { onExit: () => undefined, offExit: () => undefined },
    });

    return { exitCode, stdout: stdout.join(''), stderr: stderr.join(''), leaked: leaked.join('') };
}

function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('every byte leaves through the runtime', () => {
    it('routes the install-skill meta-command', async () => {
        // `--print-path` is the one install-skill branch that touches no
        // filesystem state, so it can run against the real cwd safely.
        const result = await invoke(['install-skill', '--print-path']);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(/SKILL\.md\n$/);
        expect(result.leaked).toBe('');
    });

    it('routes the uninstall-skill meta-command', async () => {
        // Nothing is installed under the test cwd, so this takes the "not
        // found" branch: read-only, and the error text is the byte to route.
        // Its success branch writes to stdout through the same writer pair.
        const result = await invoke(['uninstall-skill']);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Nothing to uninstall');
        expect(result.leaked).toBe('');
    });

    it('routes the schema-mismatch warning', async () => {
        // `id` is declared a number; a string trips advisory validation, and
        // the reporter writes its bounded warning to stderr.
        mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'not-a-number', name: 'Demo', suite_mode: 1 }));

        const result = await invoke(['project', 'get', '1']);

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toContain('response schema mismatch');
        expect(result.leaked).toBe('');
    });

    it('routes a binary payload and its stderr ack', async () => {
        const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
        mockFetch.mockResolvedValueOnce(
            new Response(bytes, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } }),
        );

        const result = await invoke(['attachment', 'get', '17', '--out', '-']);

        expect(result.exitCode).toBe(0);
        // The payload itself is the part that most obviously bypassed the
        // runtime: `emitStdoutAck` called `process.stdout.write` unconditionally.
        expect(Buffer.from(result.stdout, 'binary')).toEqual(Buffer.from(bytes));
        expect(result.stderr).toContain('"size": 4');
        expect(result.leaked).toBe('');
    });
});
