/**
 * CLI test suite for src/cli.ts.
 *
 * Strategy:
 * - vi.resetModules() before each dynamic import gives every test a fresh CLI module.
 * - global.fetch is mocked so network calls never leave the process.
 * - node:dns/promises is mocked so DNS resolution completes instantly (no real network).
 *   Without this, validatePublicHost() makes a real lookup that can take >30ms on CI,
 *   causing dnsValidationPromise to outlive the spy teardown window and producing
 *   cross-test stdout contamination and empty exitCodes arrays.
 * - process.exit is spied on (no-throw) so both sync and async exit paths complete;
 *   assertions use exitCodes[0] as the primary exit code.
 * - process.stdout/stderr.write are captured for output assertions.
 * - Credentials come from AUTH_ENV so the real TestRailClient config-validation passes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Mock DNS so validatePublicHost() resolves immediately without hitting the network.
// Returns a single public IP (example.com) so the private-IP check passes cleanly.
vi.mock('node:dns/promises', () => ({
    lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));

// Mock sleep so GET retry backoff (1s + 2s + 4s default) doesn't blow up test
// runtime for network-error subprocess tests. Keeps all other behavior intact.
vi.mock('../src/utils.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils.js')>();
    return {
        ...actual,
        sleep: vi.fn().mockResolvedValue(undefined),
    };
});

// Stub readBoundedStdin so tests can simulate piped-stdin input for the
// --api-key-stdin happy path without spawning a real subprocess. Default
// behaviour: throw, so any test that accidentally trips the bounded
// reader without setting up the stub fails loudly instead of returning
// the test process's actual stdin contents. vi.hoisted is required
// because vi.mock factories cannot capture file-scope variables (they're
// lifted above all imports).
const stubbedStdin = vi.hoisted(() => ({
    value: null as string | null,
}));
vi.mock('../src/cli/stdin.js', () => ({
    readBoundedStdin: (): string => {
        if (stubbedStdin.value === null) {
            throw new Error('readBoundedStdin not stubbed for this test');
        }
        return stubbedStdin.value;
    },
}));

async function withStubbedStdin<T>(value: string, fn: () => Promise<T>): Promise<T> {
    const orig = stubbedStdin.value;
    stubbedStdin.value = value;
    try {
        return await fn();
    } finally {
        stubbedStdin.value = orig;
    }
}

// ── Shared mock data ──────────────────────────────────────────────────────────

const MOCK_PROJECT = { id: 1, name: 'Demo', suite_mode: 1, url: 'https://example.testrail.io/projects/view/1' };
const MOCK_SUITE = { id: 1, name: 'Suite A', project_id: 1, url: 'https://example.testrail.io/suites/view/1' };
const MOCK_CASE = {
    id: 1,
    title: 'Case 1',
    section_id: 1,
    suite_id: 1,
    created_by: 1,
    created_on: 0,
    updated_by: 1,
    updated_on: 0,
};
const MOCK_RUN = {
    id: 1,
    suite_id: 1,
    name: 'Run 1',
    include_all: true,
    is_completed: false,
    passed_count: 0,
    blocked_count: 0,
    untested_count: 0,
    retest_count: 0,
    failed_count: 0,
    project_id: 1,
    created_on: 0,
    created_by: 1,
    url: 'https://example.testrail.io/runs/view/1',
};
const MOCK_MILESTONE = {
    id: 1,
    name: 'M1',
    is_completed: false,
    project_id: 1,
    url: 'https://example.testrail.io/milestones/view/1',
};
const MOCK_TEST = {
    id: 100,
    case_id: 1,
    status_id: 1,
    run_id: 1,
    title: 'Login works',
};
const MOCK_USER = { id: 1, name: 'Alice', email: 'alice@example.com', is_active: true };
const MOCK_PLAN = {
    id: 50,
    name: 'Release 1.0',
    is_completed: false,
    passed_count: 0,
    blocked_count: 0,
    untested_count: 0,
    retest_count: 0,
    failed_count: 0,
    project_id: 1,
    created_on: 0,
    created_by: 1,
    url: 'https://example.testrail.io/plans/view/50',
};
const MOCK_PLAN_ENTRY = {
    id: 'abc-def-uuid',
    suite_id: 1,
    name: 'Entry A',
    include_all: true,
    runs: [],
};
const MOCK_SECTION = {
    id: 1,
    suite_id: 1,
    name: 'Section A',
    description: 'A section',
    display_order: 1,
    depth: 0,
};
const MOCK_SHARED_STEP = {
    id: 1,
    title: 'Login Steps',
    project_id: 1,
    created_by: 1,
    created_on: 0,
    updated_by: 1,
    updated_on: 0,
};

const AUTH_ENV = {
    TESTRAIL_BASE_URL: 'https://example.testrail.io',
    TESTRAIL_EMAIL: 'test@example.com',
    TESTRAIL_API_KEY: 'test-api-key',
};

// ── Fetch mock ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = mockFetch;

function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: { 'Content-Type': 'application/json' },
    });
}

function binaryResponse(bytes: Uint8Array, status = 200): Response {
    return new Response(bytes, {
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: { 'Content-Type': 'application/octet-stream' },
    });
}

// ── Environment management ────────────────────────────────────────────────────

const ORIG_ARGV = process.argv.slice();
const AUTH_KEYS = Object.keys(AUTH_ENV) as (keyof typeof AUTH_ENV)[];

function setEnv(env: Record<string, string | undefined> = AUTH_ENV): void {
    for (const key of AUTH_KEYS) delete process.env[key];
    for (const [k, v] of Object.entries(env)) {
        if (v !== undefined) process.env[k] = v;
    }
}

afterEach(() => {
    process.argv = ORIG_ARGV;
    for (const key of AUTH_KEYS) delete process.env[key];
    vi.clearAllMocks();
});

// ── CLI runner ────────────────────────────────────────────────────────────────

interface CliResult {
    stdout: string;
    stderr: string;
    exitCodes: number[];
}

/**
 * Runs a fresh CLI module with the given argv and environment.
 * fetchResponses are queued in order; excess fetch calls return 404.
 *
 * Pass `fetchRejection` to make *every* fetch call reject with the given
 * error — used for network-error subprocess tests (the GET retry pipeline
 * burns ≤ DEFAULT_MAX_RETRIES + 1 attempts before surfacing the failure,
 * and any queued resolved responses would be skipped over by the
 * `mockRejectedValue` persistent default anyway).
 */
async function runCli(
    argv: string[],
    fetchResponses: Response[] = [],
    env: Record<string, string | undefined> = AUTH_ENV,
    fetchRejection?: Error,
): Promise<CliResult> {
    vi.resetModules();
    // Fully reset between runs so queued mockResolvedValueOnce items from a
    // previous test cannot leak into the next test's fetch sequence (a real
    // hazard when a test pre-queues N responses but the CLI consumes fewer
    // than N — clearAllMocks() only resets call history, not pending `once`
    // implementations).
    mockFetch.mockReset();
    if (fetchRejection !== undefined) {
        mockFetch.mockRejectedValue(fetchRejection);
    } else {
        mockFetch.mockResolvedValue(jsonResponse({ error: 'Not found' }, 404));
    }

    process.argv = ['node', 'testrail', ...argv];
    setEnv(env);

    for (const resp of fetchResponses) {
        mockFetch.mockResolvedValueOnce(resp);
    }

    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    const exitCodes: number[] = [];

    const spyOut = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        stdoutChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
        return true;
    });
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
        // Wait for main() to call process.exit (which our spy resolves the
        // promise from), bounded by a generous timeout to cover GET retry
        // chains (≤ DEFAULT_MAX_RETRIES exponential backoffs ≈ 7s).
        await Promise.race([exitPromise, new Promise<void>((resolve) => setTimeout(resolve, 15_000))]);
    } catch {
        // When process.exit is a no-op, code may continue past an early exit() call
        // into states that were never meant to execute (e.g. new TestRailClient with
        // undefined credentials). Swallow these secondary errors; assertions rely on
        // the exitCodes recorded before the throw.
    } finally {
        spyOut.mockRestore();
        spyErr.mockRestore();
        spyExit.mockRestore();
    }

    return { stdout: stdoutChunks.join(''), stderr: stderrChunks.join(''), exitCodes };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CLI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Meta flags ───────────────────────────────────────────────────────────

    describe('--version', () => {
        it('should print the package version and exit 0 first', async () => {
            const { stdout, exitCodes } = await runCli(['--version']);
            expect(stdout).toContain('testrail-cli v');
            expect(exitCodes[0]).toBe(0);
        });
    });

    describe('--help', () => {
        it('should print help text and exit 0 first', async () => {
            const { stdout, exitCodes } = await runCli(['--help']);
            expect(stdout).toContain('testrail <resource> <action>');
            expect(exitCodes[0]).toBe(0);
        });
    });

    describe('no arguments', () => {
        it('should show help when no args provided and exit 0 first', async () => {
            const { stdout, exitCodes } = await runCli([]);
            expect(stdout).toContain('testrail <resource> <action>');
            expect(exitCodes[0]).toBe(0);
        });
    });

    describe('only one positional', () => {
        it('should print usage to stderr and exit 1 when action is missing', async () => {
            const { stderr, exitCodes } = await runCli(['project']);
            expect(stderr).toContain('Usage: testrail <resource> <action>');
            expect(exitCodes).toContain(1);
        });
    });

    // ── Auth resolution ──────────────────────────────────────────────────────

    describe('auth resolution', () => {
        it('should exit 1 and report missing auth when env vars absent', async () => {
            const { stderr, exitCodes } = await runCli(['project', 'get', '1'], [], {});
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Missing auth');
        });

        it('should accept --base-url / --email flags with the API key from env', async () => {
            // CTF #11: --api-key (argv) was removed in v3.0. The remaining
            // non-env channel is --api-key-stdin (covered by the stdin test
            // below). The URL/email flags still work because they don't
            // carry secrets.
            const resp = jsonResponse(MOCK_PROJECT);
            const { exitCodes } = await runCli(
                ['--base-url', 'https://example.testrail.io', '--email', 'test@example.com', 'project', 'get', '1'],
                [resp],
                { TESTRAIL_API_KEY: 'test-api-key' },
            );
            expect(exitCodes).toContain(0);
        });

        it('--api-key-stdin reads the key from stdin and authenticates without TESTRAIL_API_KEY env (CTF #11 happy path)', async () => {
            // Simulate piped stdin: set isTTY=false so the gate doesn't
            // reject, and stub readBoundedStdin to return the test key
            // (trailing newline simulates `echo $KEY |` behaviour;
            // index.ts .trim()s it).
            const origIsTTY = process.stdin.isTTY;
            process.stdin.isTTY = false;
            try {
                const { exitCodes } = await withStubbedStdin('sk-from-stdin-test\n', () =>
                    runCli(
                        [
                            '--base-url',
                            'https://example.testrail.io',
                            '--email',
                            'test@example.com',
                            '--api-key-stdin',
                            'project',
                            'get',
                            '1',
                        ],
                        [jsonResponse(MOCK_PROJECT)],
                        {}, // No env vars — credential comes from stubbed stdin
                    ),
                );
                expect(exitCodes).toContain(0);
                // Verify the API call carried the stdin-supplied key in the
                // Authorization header (base64(email:apiKey)).
                const init = mockFetch.mock.calls.at(-1)?.[1] as RequestInit;
                const headers = init?.headers as Record<string, string>;
                const expectedAuth = `Basic ${Buffer.from('test@example.com:sk-from-stdin-test').toString('base64')}`;
                expect(headers?.['Authorization']).toBe(expectedAuth);
            } finally {
                process.stdin.isTTY = origIsTTY;
            }
        });

        it('--api-key-stdin rejects an empty stdin payload with exit 1', async () => {
            const origIsTTY = process.stdin.isTTY;
            process.stdin.isTTY = false;
            try {
                const { exitCodes, stderr } = await withStubbedStdin('   \n', () =>
                    runCli(
                        [
                            '--base-url',
                            'https://example.testrail.io',
                            '--email',
                            'test@example.com',
                            '--api-key-stdin',
                            'project',
                            'get',
                            '1',
                        ],
                        [],
                        {},
                    ),
                );
                expect(exitCodes).toContain(1);
                expect(stderr).toMatch(/--api-key-stdin received an empty stdin input/);
                expect(mockFetch).not.toHaveBeenCalled();
            } finally {
                process.stdin.isTTY = origIsTTY;
            }
        });

        it('--api-key-stdin error paths honor --quiet (suppress stderr while still exiting 1)', async () => {
            // CTF #11 + Copilot review: error paths in main() that wrote
            // directly to stderr bypassed --quiet. Verify the empty-stdin
            // rejection (the cheapest error path to trigger) honours
            // --quiet now that it routes through err().
            const origIsTTY = process.stdin.isTTY;
            process.stdin.isTTY = false;
            try {
                const { exitCodes, stderr } = await withStubbedStdin('', () =>
                    runCli(
                        [
                            '--base-url',
                            'https://example.testrail.io',
                            '--email',
                            'test@example.com',
                            '--api-key-stdin',
                            '--quiet',
                            'project',
                            'get',
                            '1',
                        ],
                        [],
                        {},
                    ),
                );
                expect(exitCodes).toContain(1);
                expect(stderr).toBe('');
            } finally {
                process.stdin.isTTY = origIsTTY;
            }
        });

        it('--api-key-stdin requires piped stdin (rejects when stdin is a TTY)', async () => {
            // runCli runs in-process; vitest workers typically have
            // process.stdin.isTTY === undefined (treated as TTY for the
            // purposes of CTF #11's gate). The gate must reject because
            // there's no way to read a credential from a terminal-attached
            // stdin without prompting (and the CLI is non-interactive).
            const origIsTTY = process.stdin.isTTY;
            process.stdin.isTTY = true;
            try {
                const { exitCodes, stderr } = await runCli(
                    [
                        '--base-url',
                        'https://example.testrail.io',
                        '--email',
                        'test@example.com',
                        '--api-key-stdin',
                        'project',
                        'get',
                        '1',
                    ],
                    [],
                    {},
                );
                expect(exitCodes).toContain(1);
                expect(stderr).toMatch(/--api-key-stdin requires the API key to be piped/);
                expect(mockFetch).not.toHaveBeenCalled();
            } finally {
                process.stdin.isTTY = origIsTTY;
            }
        });

        it('rejects --api-key (argv) as an unknown flag — removed in v3.0 (CTF #11)', async () => {
            const { exitCodes, stderr } = await runCli([
                '--base-url',
                'https://example.testrail.io',
                '--email',
                'test@example.com',
                '--api-key',
                'sk-secret-12345',
                'project',
                'get',
                '1',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/unknown flag '--api-key'/);
            expect(mockFetch).not.toHaveBeenCalled();
            // Defense-in-depth: stderr must not echo the secret it received.
            expect(stderr).not.toContain('sk-secret-12345');
        });
    });

    // ── project ──────────────────────────────────────────────────────────────

    describe('project', () => {
        it('project get <id> should output JSON and exit 0', async () => {
            const { stdout, exitCodes } = await runCli(['project', 'get', '1'], [jsonResponse(MOCK_PROJECT)]);
            const parsed = JSON.parse(stdout.trim()) as typeof MOCK_PROJECT;
            expect(parsed.id).toBe(1);
            expect(exitCodes).toContain(0);
        });

        it('project list should call getProjects and exit 0', async () => {
            const { stdout, exitCodes } = await runCli(
                ['project', 'list'],
                [jsonResponse({ projects: [MOCK_PROJECT] })],
            );
            expect(stdout).toContain('"name": "Demo"');
            expect(exitCodes).toContain(0);
        });

        it('project list with --limit and --offset', async () => {
            const { exitCodes } = await runCli(
                ['project', 'list', '--limit', '5', '--offset', '10'],
                [jsonResponse({ projects: [] })],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=5'), expect.anything());
        });

        it('project get with non-integer id should exit 1', async () => {
            const { exitCodes } = await runCli(['project', 'get', 'abc']);
            expect(exitCodes).toContain(1);
        });

        it('project get with missing id should exit 1', async () => {
            const { exitCodes } = await runCli(['project', 'get']);
            expect(exitCodes).toContain(1);
        });

        it('project unknown action should exit 1', async () => {
            const { stderr, exitCodes } = await runCli(['project', 'nope', '1']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Unknown action');
        });
    });

    // ── suite ─────────────────────────────────────────────────────────────────

    describe('suite', () => {
        it('suite get <id> should exit 0', async () => {
            const { exitCodes } = await runCli(['suite', 'get', '1'], [jsonResponse(MOCK_SUITE)]);
            expect(exitCodes).toContain(0);
        });

        it('suite list --project-id should exit 0', async () => {
            const { exitCodes } = await runCli(['suite', 'list', '--project-id', '2'], [jsonResponse([MOCK_SUITE])]);
            expect(exitCodes).toContain(0);
        });

        it('suite list with missing --project-id should exit 1', async () => {
            const { exitCodes } = await runCli(['suite', 'list']);
            expect(exitCodes).toContain(1);
        });

        it('suite unknown action should exit 1', async () => {
            const { stderr, exitCodes } = await runCli(['suite', 'create']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Unknown action');
        });
    });

    // ── section (read) ────────────────────────────────────────────────────────

    describe('section (read)', () => {
        it('section get <id> should output JSON and exit 0', async () => {
            const { stdout, exitCodes } = await runCli(['section', 'get', '1'], [jsonResponse(MOCK_SECTION)]);
            const parsed = JSON.parse(stdout.trim()) as typeof MOCK_SECTION;
            expect(parsed.id).toBe(1);
            expect(parsed.name).toBe('Section A');
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('get_section/1');
        });

        it('section get <id> with --format table renders a table', async () => {
            const { stdout, exitCodes } = await runCli(
                ['section', 'get', '1', '--format', 'table'],
                [jsonResponse(MOCK_SECTION)],
            );
            expect(exitCodes).toContain(0);
            // Table renderer emits a header row with the schema keys.
            expect(stdout).toContain('id');
            expect(stdout).toContain('name');
            expect(stdout).toContain('Section A');
        });

        it('section get with missing id should exit 1', async () => {
            const { exitCodes, stderr } = await runCli(['section', 'get']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/section id/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section get with non-integer id should exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'get', 'abc']);
            expect(exitCodes).toContain(1);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section get with id=0 should exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'get', '0']);
            expect(exitCodes).toContain(1);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section get with negative id should exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'get', '-1']);
            expect(exitCodes).toContain(1);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section get with float id should exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'get', '1.5']);
            expect(exitCodes).toContain(1);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section get with scientific-notation id should exit 1 (rejects "1e2")', async () => {
            const { exitCodes } = await runCli(['section', 'get', '1e2']);
            expect(exitCodes).toContain(1);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section get with hex id should exit 1 (rejects "0x1")', async () => {
            const { exitCodes } = await runCli(['section', 'get', '0x1']);
            expect(exitCodes).toContain(1);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section get propagates 404 as exit 1', async () => {
            const { exitCodes } = await runCli(
                ['section', 'get', '999'],
                [jsonResponse({ error: 'Section not found' }, 404)],
            );
            expect(exitCodes).toContain(1);
        });

        it('section get propagates 401 as exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'get', '1'], [jsonResponse({ error: 'Unauthorized' }, 401)]);
            expect(exitCodes).toContain(1);
        });

        it('section get propagates 403 as exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'get', '1'], [jsonResponse({ error: 'Forbidden' }, 403)]);
            expect(exitCodes).toContain(1);
        });

        it('section list <project_id> should exit 0 and call get_sections/{project_id}', async () => {
            const { stdout, exitCodes } = await runCli(
                ['section', 'list', '1'],
                [jsonResponse({ sections: [MOCK_SECTION] })],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim()) as (typeof MOCK_SECTION)[];
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed[0]?.id).toBe(1);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('get_sections/1');
        });

        it('section list with --suite-id appends suite_id query param', async () => {
            const { exitCodes } = await runCli(
                ['section', 'list', '1', '--suite-id', '2'],
                [jsonResponse({ sections: [MOCK_SECTION] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('get_sections/1');
            expect(url).toContain('suite_id=2');
        });

        it('section list with --limit and --offset appends pagination', async () => {
            const { exitCodes } = await runCli(
                ['section', 'list', '1', '--limit', '5', '--offset', '10'],
                [jsonResponse({ sections: [] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('limit=5');
            expect(url).toContain('offset=10');
        });

        it('section list with --format table renders a table', async () => {
            const { stdout, exitCodes } = await runCli(
                ['section', 'list', '1', '--format', 'table'],
                [jsonResponse({ sections: [MOCK_SECTION] })],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('Section A');
        });

        it('section list with missing project_id should exit 1', async () => {
            const { exitCodes, stderr } = await runCli(['section', 'list']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/project id/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section list with non-integer project_id should exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'list', 'abc']);
            expect(exitCodes).toContain(1);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section list with non-integer --suite-id should exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'list', '1', '--suite-id', 'abc']);
            expect(exitCodes).toContain(1);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('section list propagates 401 as exit 1', async () => {
            const { exitCodes } = await runCli(
                ['section', 'list', '1'],
                [jsonResponse({ error: 'Unauthorized' }, 401)],
            );
            expect(exitCodes).toContain(1);
        });

        it('section list propagates 403 as exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'list', '1'], [jsonResponse({ error: 'Forbidden' }, 403)]);
            expect(exitCodes).toContain(1);
        });

        it('section list propagates 404 as exit 1', async () => {
            const { exitCodes } = await runCli(
                ['section', 'list', '999'],
                [jsonResponse({ error: 'Project not found' }, 404)],
            );
            expect(exitCodes).toContain(1);
        });

        it('section get surfaces network error as exit 1', async () => {
            // GET retries the network error 3x before surfacing per the
            // project retry pipeline (1s + 2s + 4s backoff = ~7s of sleep).
            // `mockRejectedValue` (not Once) makes *every* attempt reject so
            // the retry chain runs deterministically through to final
            // failure. Test timeout bumped past the worst-case retry window.
            const { exitCodes } = await runCli(['section', 'get', '1'], [], AUTH_ENV, new TypeError('fetch failed'));
            expect(exitCodes).toContain(1);
        }, 15_000);

        it('section list surfaces network error as exit 1', async () => {
            const { exitCodes } = await runCli(['section', 'list', '1'], [], AUTH_ENV, new TypeError('fetch failed'));
            expect(exitCodes).toContain(1);
        }, 15_000);
    });

    // ── case ──────────────────────────────────────────────────────────────────

    describe('case', () => {
        it('case get <id> should exit 0', async () => {
            const { exitCodes } = await runCli(['case', 'get', '5'], [jsonResponse(MOCK_CASE)]);
            expect(exitCodes).toContain(0);
        });

        it('case list --project-id should exit 0', async () => {
            const { exitCodes } = await runCli(
                ['case', 'list', '--project-id', '3'],
                [jsonResponse({ cases: [MOCK_CASE] })],
            );
            expect(exitCodes).toContain(0);
        });

        it('case list with --suite-id passes suiteId filter', async () => {
            const { exitCodes } = await runCli(
                ['case', 'list', '--project-id', '3', '--suite-id', '7'],
                [jsonResponse({ cases: [MOCK_CASE] })],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('suite_id'), expect.anything());
        });

        it('case unknown action should exit 1', async () => {
            const { exitCodes } = await runCli(['case', 'update', '1']);
            expect(exitCodes).toContain(1);
        });

        it('case history <id> should exit 0 and call get_history_for_case', async () => {
            const { exitCodes } = await runCli(
                ['case', 'history', '42'],
                [jsonResponse({ history: [{ id: 1, user_id: 5, type_id: 2, timestamp: 1700000000 }] })],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_history_for_case/42'),
                expect.anything(),
            );
        });

        it('case history passes --limit and --offset to the API', async () => {
            const { exitCodes } = await runCli(
                ['case', 'history', '42', '--limit', '10', '--offset', '20'],
                [jsonResponse({ history: [] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('limit=10');
            expect(url).toContain('offset=20');
        });

        it('case history rejects non-positive id', async () => {
            const { exitCodes } = await runCli(['case', 'history', '0']);
            expect(exitCodes).toContain(1);
        });

        it('case update-bulk POSTs to update_cases/{suite_id}', async () => {
            const { exitCodes } = await runCli(
                ['case', 'update-bulk', '5', '--data', '{"case_ids":[1,2],"priority_id":3}'],
                [jsonResponse([MOCK_CASE])],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('update_cases/5');
        });

        it('case delete-bulk requires --yes', async () => {
            const { exitCodes, stderr } = await runCli([
                'case',
                'delete-bulk',
                '5',
                '--project-id',
                '9',
                '--data',
                '{"case_ids":[1]}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes/);
        });

        it('case delete-bulk with --yes POSTs and includes project_id query param', async () => {
            const { exitCodes } = await runCli(
                ['case', 'delete-bulk', '5', '--project-id', '9', '--yes', '--data', '{"case_ids":[1,2]}'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_cases/5');
            expect(url).toContain('project_id=9');
        });

        it('case delete-bulk with --soft adds soft=1 to the URL', async () => {
            const { exitCodes } = await runCli(
                ['case', 'delete-bulk', '5', '--project-id', '9', '--soft', '--yes', '--data', '{"case_ids":[1]}'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('soft=1');
        });

        it('case delete-bulk with --dry-run skips the API call even with --yes', async () => {
            const { exitCodes, stdout } = await runCli([
                'case',
                'delete-bulk',
                '5',
                '--project-id',
                '9',
                '--yes',
                '--dry-run',
                '--data',
                '{"case_ids":[1]}',
            ]);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('destructive');
        });

        it('case delete-bulk without --project-id rejects', async () => {
            const { exitCodes, stderr } = await runCli([
                'case',
                'delete-bulk',
                '5',
                '--yes',
                '--data',
                '{"case_ids":[1]}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--project-id/);
        });

        it('case copy-to-section POSTs to copy_cases_to_section/{section_id}', async () => {
            const { exitCodes } = await runCli(
                ['case', 'copy-to-section', '7', '--data', '{"case_ids":[1,2]}'],
                [jsonResponse([MOCK_CASE])],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('copy_cases_to_section/7');
        });

        it('case move-to-section POSTs to move_cases_to_section/{section_id}', async () => {
            const { exitCodes } = await runCli(
                ['case', 'move-to-section', '7', '--data', '{"case_ids":[1,2],"suite_id":3}'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('move_cases_to_section/7');
        });

        it('case move-to-section rejects body missing suite_id', async () => {
            const { exitCodes } = await runCli(['case', 'move-to-section', '7', '--data', '{"case_ids":[1]}']);
            expect(exitCodes).toContain(1);
        });
    });

    // ── run ───────────────────────────────────────────────────────────────────

    describe('run', () => {
        it('run get <id> should exit 0', async () => {
            const { exitCodes } = await runCli(['run', 'get', '10'], [jsonResponse(MOCK_RUN)]);
            expect(exitCodes).toContain(0);
        });

        it('run list --project-id should exit 0', async () => {
            const { exitCodes } = await runCli(
                ['run', 'list', '--project-id', '4'],
                [jsonResponse({ runs: [MOCK_RUN] })],
            );
            expect(exitCodes).toContain(0);
        });

        it('run list with limit and offset', async () => {
            const { exitCodes } = await runCli(
                ['run', 'list', '--project-id', '4', '--limit', '10', '--offset', '5'],
                [jsonResponse({ runs: [MOCK_RUN] })],
            );
            expect(exitCodes).toContain(0);
        });

        it('run close without --yes rejects (destructive: irreversible)', async () => {
            const { exitCodes, stderr } = await runCli(['run', 'close', '1']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('run close with --yes POSTs to close_run/{run_id}', async () => {
            const { exitCodes } = await runCli(
                ['run', 'close', '42', '--yes'],
                [jsonResponse({ ...MOCK_RUN, id: 42, is_completed: true })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('close_run/42');
        });

        it('run close with --dry-run skips the API call even with --yes; preview marks destructive', async () => {
            const { exitCodes, stdout } = await runCli(['run', 'close', '42', '--yes', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('destructive');
        });
    });

    // ── test ──────────────────────────────────────────────────────────────────

    describe('test', () => {
        it('test get <id> should exit 0 and call get_test/{test_id}', async () => {
            const { exitCodes, stdout } = await runCli(['test', 'get', '100'], [jsonResponse(MOCK_TEST)]);
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim()) as typeof MOCK_TEST;
            expect(parsed.id).toBe(100);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_test/100'), expect.anything());
        });

        it('test get renders in table format', async () => {
            const { stdout, exitCodes } = await runCli(
                ['test', 'get', '100', '--format', 'table'],
                [jsonResponse(MOCK_TEST)],
            );
            expect(exitCodes).toContain(0);
            // Table format uses " | " column separators; field names are printed
            expect(stdout).toContain('case_id');
            expect(stdout).toContain('status_id');
        });

        it('test get without id should exit 1', async () => {
            const { stderr, exitCodes } = await runCli(['test', 'get']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/positive integer/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])(
            'test get rejects non-positive-integer id "%s"',
            async (bad) => {
                const { exitCodes } = await runCli(['test', 'get', bad]);
                expect(exitCodes).toContain(1);
                expect(mockFetch).not.toHaveBeenCalled();
            },
        );

        it('test list <run_id> should exit 0 and call get_tests/{run_id}', async () => {
            const { exitCodes } = await runCli(['test', 'list', '5'], [jsonResponse({ tests: [MOCK_TEST] })]);
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_tests/5'), expect.anything());
        });

        it('test list with --limit and --offset forwards both to the query string', async () => {
            const { exitCodes } = await runCli(
                ['test', 'list', '5', '--limit', '50', '--offset', '10'],
                [jsonResponse({ tests: [MOCK_TEST] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('get_tests/5');
            expect(url).toContain('limit=50');
            expect(url).toContain('offset=10');
        });

        it('test list with --status-id passes a comma-joined list to the API', async () => {
            const { exitCodes } = await runCli(
                ['test', 'list', '5', '--status-id', '1,5'],
                [jsonResponse({ tests: [MOCK_TEST] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('get_tests/5');
            // URLSearchParams percent-encodes ',' → '%2C'; accept either form
            expect(url).toMatch(/status_id=1(,|%2C)5/);
        });

        it('test list with --status-id rejects malformed token', async () => {
            const { exitCodes, stderr } = await runCli(['test', 'list', '5', '--status-id', '1,abc']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--status-id/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('test list renders the tests array as table rows', async () => {
            const { stdout, exitCodes } = await runCli(
                ['test', 'list', '5', '--format', 'table'],
                [jsonResponse({ tests: [MOCK_TEST] })],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('case_id');
            expect(stdout).toContain('Login works');
        });

        it('test list without run_id should exit 1', async () => {
            const { stderr, exitCodes } = await runCli(['test', 'list']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/positive integer/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])(
            'test list rejects non-positive-integer run_id "%s"',
            async (bad) => {
                const { exitCodes } = await runCli(['test', 'list', bad]);
                expect(exitCodes).toContain(1);
                expect(mockFetch).not.toHaveBeenCalled();
            },
        );

        it('test list returns empty array when API responds with no tests field', async () => {
            const { exitCodes, stdout } = await runCli(['test', 'list', '5'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
            expect(stdout.trim()).toBe('[]');
        });

        it('test get with explicit --format json emits parseable JSON', async () => {
            const { exitCodes, stdout } = await runCli(
                ['test', 'get', '100', '--format', 'json'],
                [jsonResponse(MOCK_TEST)],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim()) as typeof MOCK_TEST;
            expect(parsed).toEqual(MOCK_TEST);
        });

        it('test list with explicit --format json emits parseable JSON array', async () => {
            const { exitCodes, stdout } = await runCli(
                ['test', 'list', '5', '--format', 'json'],
                [jsonResponse({ tests: [MOCK_TEST] })],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim()) as (typeof MOCK_TEST)[];
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toEqual(MOCK_TEST);
        });

        it('test get surfaces a network error (TypeError: fetch failed) as exit 1', async () => {
            // GET retries 3× on network errors — every attempt must reject.
            const { exitCodes, stderr } = await runCli(
                ['test', 'get', '100'],
                [],
                AUTH_ENV,
                new TypeError('fetch failed'),
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/fetch failed|Network error|TestRail API error/);
        });

        it('test list surfaces a network error (TypeError: fetch failed) as exit 1', async () => {
            const { exitCodes, stderr } = await runCli(
                ['test', 'list', '5'],
                [],
                AUTH_ENV,
                new TypeError('fetch failed'),
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/fetch failed|Network error|TestRail API error/);
        });

        it('test list rejects --status-id 0 at the subprocess level', async () => {
            const { exitCodes, stderr } = await runCli(['test', 'list', '5', '--status-id', '0']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--status-id/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('test list rejects empty --status-id "" at the subprocess level', async () => {
            const { exitCodes, stderr } = await runCli(['test', 'list', '5', '--status-id', '']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--status-id/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('test unknown action should exit 1', async () => {
            const { stderr, exitCodes } = await runCli(['test', 'delete', '1']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Unknown action');
        });

        it('test get surfaces 404 as TestRail API error and exits 1', async () => {
            const { exitCodes, stderr } = await runCli(
                ['test', 'get', '999'],
                [new Response('not found', { status: 404, statusText: 'Not Found' })],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('TestRail API error');
        });

        it('test get surfaces 401 as TestRail API error and exits 1', async () => {
            const { exitCodes, stderr } = await runCli(
                ['test', 'get', '1'],
                [new Response('auth required', { status: 401, statusText: 'Unauthorized' })],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('TestRail API error');
        });

        it('test list surfaces 403 as TestRail API error and exits 1', async () => {
            const { exitCodes, stderr } = await runCli(
                ['test', 'list', '5'],
                [new Response('forbidden', { status: 403, statusText: 'Forbidden' })],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('TestRail API error');
        });
    });

    // ── result ────────────────────────────────────────────────────────────────

    describe('result', () => {
        it('result list --run-id should exit 0', async () => {
            const { exitCodes } = await runCli(['result', 'list', '--run-id', '11'], [jsonResponse({ results: [] })]);
            expect(exitCodes).toContain(0);
        });

        it('result list with limit and offset', async () => {
            const { exitCodes } = await runCli(
                ['result', 'list', '--run-id', '11', '--limit', '20', '--offset', '0'],
                [jsonResponse({ results: [] })],
            );
            expect(exitCodes).toContain(0);
        });

        it('result unknown action should exit 1', async () => {
            const { stderr, exitCodes } = await runCli(['result', 'get', '1']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Unknown action');
        });

        // ── result list-for-test ──────────────────────────────────────────
        // Per-test read endpoint (`GET get_results/{test_id}`). Exercises
        // the new filter-flag pipeline (`--status-id`, `--defects-filter`)
        // alongside the existing pagination flags.

        it('result list-for-test <id> should exit 0 and GET get_results/<id>', async () => {
            const { exitCodes } = await runCli(['result', 'list-for-test', '4242'], [jsonResponse({ results: [] })]);
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('get_results/4242');
        });

        it('result list-for-test propagates --limit / --offset / --status-id / --defects-filter to URL', async () => {
            const { exitCodes } = await runCli(
                [
                    'result',
                    'list-for-test',
                    '4242',
                    '--limit',
                    '25',
                    '--offset',
                    '0',
                    '--status-id',
                    '1,5',
                    '--defects-filter',
                    'JIRA-99',
                ],
                [jsonResponse({ results: [] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('limit=25');
            expect(url).toContain('offset=0');
            // serializeIdList joins with comma; encodeURIComponent leaves digits/commas as-is except commas → %2C
            expect(url).toMatch(/status_id=1(%2C|,)5/);
            expect(url).toContain('defects_filter=JIRA-99');
        });

        it('result list-for-test rejects missing positional', async () => {
            const { stderr, exitCodes } = await runCli(['result', 'list-for-test']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/test id/);
        });

        // '-1' is parsed as a short-flag '-1' by parseArgs and rejected by
        // the unknown-flag gate before ever reaching parseId; the other
        // tokens flow through to parseId and produce the canonical "test id
        // must be a positive integer" message. Both paths exit 1, which is
        // what the contract guarantees.
        it.each(['0', '1.5', 'abc', '1e2', '0x1'])(
            'result list-for-test rejects invalid id %s with the "test id" error',
            async (badId) => {
                const { stderr, exitCodes } = await runCli(['result', 'list-for-test', badId]);
                expect(exitCodes).toContain(1);
                expect(stderr).toMatch(/test id/);
            },
        );

        it('result list-for-test rejects negative id -1 (parsed as unknown flag → exit 1)', async () => {
            const { exitCodes } = await runCli(['result', 'list-for-test', '-1']);
            expect(exitCodes).toContain(1);
        });

        it('result list-for-test rejects malformed --status-id', async () => {
            const { stderr, exitCodes } = await runCli(['result', 'list-for-test', '4242', '--status-id', '1,abc']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--status-id/);
        });

        it('result list-for-test renders --format table without throwing', async () => {
            const { exitCodes, stdout } = await runCli(
                ['result', 'list-for-test', '4242', '--format', 'table'],
                [
                    jsonResponse({
                        results: [
                            { id: 1, test_id: 4242, status_id: 1, created_by: 1, created_on: 0 },
                            { id: 2, test_id: 4242, status_id: 5, created_by: 1, created_on: 0 },
                        ],
                    }),
                ],
            );
            expect(exitCodes).toContain(0);
            // Table renderer emits column headers; presence of `id` and `status_id`
            // suffices as a smoke check.
            expect(stdout).toContain('id');
            expect(stdout).toContain('status_id');
        });

        it('result list-for-test --format json emits parseable JSON array', async () => {
            const { exitCodes, stdout } = await runCli(
                ['result', 'list-for-test', '4242', '--format', 'json'],
                [jsonResponse({ results: [{ id: 1, test_id: 4242, status_id: 1, created_by: 1, created_on: 0 }] })],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout) as unknown;
            expect(Array.isArray(parsed)).toBe(true);
        });

        it.each([
            [404, /404/],
            [401, /401/],
            [403, /403/],
        ])('result list-for-test surfaces %s as exit 1', async (status, errMatch) => {
            const { stderr, exitCodes } = await runCli(
                ['result', 'list-for-test', '4242'],
                [jsonResponse({ error: 'x' }, status)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(errMatch);
        });

        it('result list-for-test surfaces network error as exit 1', async () => {
            mockFetch.mockReset();
            mockFetch.mockRejectedValue(new TypeError('fetch failed'));
            const { exitCodes } = await runCli(['result', 'list-for-test', '4242']);
            expect(exitCodes).toContain(1);
        });

        // ── result list-for-case ──────────────────────────────────────────
        // Per-case-in-run read endpoint (`GET get_results_for_case/{run_id}/{case_id}`).
        // Two-positional-id shape exercises both path-param slots.

        it('result list-for-case <run_id> <case_id> should exit 0', async () => {
            const { exitCodes } = await runCli(
                ['result', 'list-for-case', '100', '87'],
                [jsonResponse({ results: [] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('get_results_for_case/100/87');
        });

        it('result list-for-case propagates all filter flags', async () => {
            const { exitCodes } = await runCli(
                [
                    'result',
                    'list-for-case',
                    '100',
                    '87',
                    '--limit',
                    '10',
                    '--offset',
                    '20',
                    '--status-id',
                    '5',
                    '--defects-filter',
                    'JIRA-1234',
                ],
                [jsonResponse({ results: [] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('limit=10');
            expect(url).toContain('offset=20');
            expect(url).toContain('status_id=5');
            expect(url).toContain('defects_filter=JIRA-1234');
        });

        it('result list-for-case missing case id should exit 1', async () => {
            const { stderr, exitCodes } = await runCli(['result', 'list-for-case', '100']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/case id/);
        });

        it.each(['0', '1.5', 'abc', '1e2', '0x1'])(
            'result list-for-case rejects run id %s with the "run id" error',
            async (badId) => {
                const { stderr, exitCodes } = await runCli(['result', 'list-for-case', badId, '87']);
                expect(exitCodes).toContain(1);
                expect(stderr).toMatch(/run id/);
            },
        );

        it('result list-for-case rejects negative run id -1 (parsed as flag → exit 1)', async () => {
            const { exitCodes } = await runCli(['result', 'list-for-case', '-1', '87']);
            expect(exitCodes).toContain(1);
        });

        it.each(['0', '1.5', 'abc', '1e2', '0x1'])(
            'result list-for-case rejects case id %s with the "case id" error',
            async (badId) => {
                const { stderr, exitCodes } = await runCli(['result', 'list-for-case', '100', badId]);
                expect(exitCodes).toContain(1);
                expect(stderr).toMatch(/case id/);
            },
        );

        it('result list-for-case rejects negative case id -1 (parsed as flag → exit 1)', async () => {
            const { exitCodes } = await runCli(['result', 'list-for-case', '100', '-1']);
            expect(exitCodes).toContain(1);
        });

        it('result list-for-case renders --format table without throwing', async () => {
            const { exitCodes, stdout } = await runCli(
                ['result', 'list-for-case', '100', '87', '--format', 'table'],
                [
                    jsonResponse({
                        results: [
                            { id: 7, test_id: 99, status_id: 1, created_by: 1, created_on: 0 },
                            { id: 8, test_id: 99, status_id: 5, created_by: 1, created_on: 0 },
                        ],
                    }),
                ],
            );
            expect(exitCodes).toContain(0);
            // Table renderer emits column headers; presence of `id` and `status_id`
            // suffices as a smoke check.
            expect(stdout).toContain('id');
            expect(stdout).toContain('status_id');
        });

        it('result list-for-case --format json emits parseable JSON array', async () => {
            const { exitCodes, stdout } = await runCli(
                ['result', 'list-for-case', '100', '87', '--format', 'json'],
                [jsonResponse({ results: [{ id: 7, test_id: 99, status_id: 5, created_by: 1, created_on: 0 }] })],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout) as unknown;
            expect(Array.isArray(parsed)).toBe(true);
        });

        it.each([
            [404, /404/],
            [401, /401/],
            [403, /403/],
        ])('result list-for-case surfaces %s as exit 1', async (status, errMatch) => {
            const { stderr, exitCodes } = await runCli(
                ['result', 'list-for-case', '100', '87'],
                [jsonResponse({ error: 'x' }, status)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(errMatch);
        });

        it('result list-for-case surfaces network error as exit 1', async () => {
            mockFetch.mockReset();
            mockFetch.mockRejectedValue(new TypeError('fetch failed'));
            const { exitCodes } = await runCli(['result', 'list-for-case', '100', '87']);
            expect(exitCodes).toContain(1);
        });
    });

    // ── milestone ─────────────────────────────────────────────────────────────

    describe('milestone', () => {
        it('milestone get <id> should exit 0', async () => {
            const { exitCodes } = await runCli(['milestone', 'get', '3'], [jsonResponse(MOCK_MILESTONE)]);
            expect(exitCodes).toContain(0);
        });

        it('milestone list --project-id should exit 0', async () => {
            const { exitCodes } = await runCli(
                ['milestone', 'list', '--project-id', '2'],
                [jsonResponse({ milestones: [MOCK_MILESTONE] })],
            );
            expect(exitCodes).toContain(0);
        });

        it('milestone list with limit and offset', async () => {
            const { exitCodes } = await runCli(
                ['milestone', 'list', '--project-id', '2', '--limit', '5', '--offset', '2'],
                [jsonResponse({ milestones: [MOCK_MILESTONE] })],
            );
            expect(exitCodes).toContain(0);
        });

        it('milestone unknown action should exit 1', async () => {
            const { exitCodes } = await runCli(['milestone', 'delete', '1']);
            expect(exitCodes).toContain(1);
        });
    });

    // ── user ──────────────────────────────────────────────────────────────────

    describe('user', () => {
        it('user get <id> should exit 0', async () => {
            const { exitCodes } = await runCli(['user', 'get', '1'], [jsonResponse(MOCK_USER)]);
            expect(exitCodes).toContain(0);
        });

        it('user list should exit 0', async () => {
            const { exitCodes } = await runCli(['user', 'list'], [jsonResponse({ users: [MOCK_USER] })]);
            expect(exitCodes).toContain(0);
        });

        it('user list with --limit', async () => {
            const { exitCodes } = await runCli(
                ['user', 'list', '--limit', '25'],
                [jsonResponse({ users: [MOCK_USER] })],
            );
            expect(exitCodes).toContain(0);
        });

        it('user unknown action should exit 1', async () => {
            const { exitCodes } = await runCli(['user', 'create']);
            expect(exitCodes).toContain(1);
        });
    });

    // ── shared-step ───────────────────────────────────────────────────────────

    describe('shared-step', () => {
        it('shared-step get <id> should exit 0', async () => {
            const { exitCodes } = await runCli(['shared-step', 'get', '1'], [jsonResponse(MOCK_SHARED_STEP)]);
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_shared_step/1'), expect.anything());
        });

        it('shared-step list --project-id should exit 0', async () => {
            const { exitCodes } = await runCli(
                ['shared-step', 'list', '--project-id', '3'],
                [jsonResponse([MOCK_SHARED_STEP])],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_shared_steps/3'), expect.anything());
        });

        it('shared-step get rejects non-positive id', async () => {
            const { exitCodes } = await runCli(['shared-step', 'get', '0']);
            expect(exitCodes).toContain(1);
        });

        it('shared-step list requires --project-id', async () => {
            const { exitCodes } = await runCli(['shared-step', 'list']);
            expect(exitCodes).toContain(1);
        });

        it('shared-step history <id> should exit 0 and call get_shared_step_history', async () => {
            const { exitCodes } = await runCli(
                ['shared-step', 'history', '42'],
                [jsonResponse({ history: [{ id: 1, user_id: 5, type_id: 2, created_on: 1700000000 }] })],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_shared_step_history/42'),
                expect.anything(),
            );
        });

        it('shared-step history passes --limit and --offset to the API', async () => {
            const { exitCodes } = await runCli(
                ['shared-step', 'history', '42', '--limit', '5', '--offset', '15'],
                [jsonResponse({ history: [] })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('limit=5');
            expect(url).toContain('offset=15');
        });

        it('shared-step history rejects non-positive id', async () => {
            const { exitCodes } = await runCli(['shared-step', 'history', '-1']);
            expect(exitCodes).toContain(1);
        });
    });

    // ── case-status ───────────────────────────────────────────────────────────

    describe('case-status', () => {
        it('case-status list should exit 0 and call get_case_statuses', async () => {
            const { exitCodes } = await runCli(
                ['case-status', 'list'],
                [
                    jsonResponse([
                        {
                            case_status_id: 1,
                            name: 'Approved',
                            abbreviation: 'APP',
                            is_default: true,
                            is_approved: true,
                            is_untested: false,
                        },
                    ]),
                ],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_case_statuses'), expect.anything());
        });

        it('case-status unknown action should exit 1', async () => {
            const { exitCodes } = await runCli(['case-status', 'get', '1']);
            expect(exitCodes).toContain(1);
        });
    });

    // ── case-field ────────────────────────────────────────────────────────────

    describe('case-field', () => {
        const VALID_PAYLOAD = JSON.stringify({
            type: 'String',
            name: 'preconds',
            label: 'Preconditions',
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { is_required: false, default_value: '' },
                },
            ],
        });

        const MOCK_CASE_FIELD = {
            id: 99,
            system_name: 'custom_preconds',
            label: 'Preconditions',
            name: 'preconds',
            type_id: 1,
            display_order: 1,
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { is_required: false, default_value: '' },
                },
            ],
            is_active: true,
            include_all: true,
            template_ids: [],
        };

        it('case-field add POSTs to add_case_field and returns the created field', async () => {
            const { exitCodes } = await runCli(
                ['case-field', 'add', '--data', VALID_PAYLOAD],
                [jsonResponse(MOCK_CASE_FIELD)],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('add_case_field');
        });

        it('case-field add exits 1 when body is missing', async () => {
            const { exitCodes, stderr } = await runCli(['case-field', 'add']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Body required');
        });

        it('case-field add --dry-run validates payload but does not POST', async () => {
            const { stdout, exitCodes } = await runCli(['case-field', 'add', '--data', VALID_PAYLOAD, '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"dryRun": true');
            expect(stdout).toContain('case-field add');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('case-field add rejects body missing required fields', async () => {
            const { exitCodes, stderr } = await runCli(['case-field', 'add', '--data', '{"type":"String","name":"x"}']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/validation failed/);
        });

        it('case-field unknown action should exit 1', async () => {
            const { exitCodes } = await runCli(['case-field', 'list']);
            expect(exitCodes).toContain(1);
        });
    });

    // ── unknown resource ──────────────────────────────────────────────────────

    describe('unknown resource', () => {
        it('should exit 1 and print error for unknown resource', async () => {
            const { stderr, exitCodes } = await runCli(['webhook', 'list']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain("Unknown resource 'webhook'");
        });
    });

    // ── stderr sanitization (CTF #16) ────────────────────────────────────────
    //
    // Error messages reflected from TestRail (server response bodies,
    // validation errors carrying user input) and from argv echoed back in
    // CLI rejection messages must be sanitized before reaching the user's
    // terminal. Otherwise an attacker who controls a TestRail field value
    // (or a typo'd flag name) can inject ANSI/OSC escapes — recoloring,
    // cursor movement, window-title spoofing, or command injection on
    // terminals that honour OSC 7/9.
    describe('stderr sanitization', () => {
        it('strips ESC + BEL from --data-file error messages reflecting the user-supplied path', async () => {
            // body.ts reflects --data-file <path> verbatim in the error
            // message when readFileSync fails. Argv carrying an OSC 0
            // window-title-spoof payload reaches err() through that path.
            const { exitCodes, stderr } = await runCli([
                'project',
                'add',
                '--data-file',
                '/tmp/nonexistent-\x1b]0;evil\x07-path',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).not.toContain('\x1b');
            expect(stderr).not.toContain('\x07');
            // The sanitized fragment 'evil' (with controls stripped)
            // should still surface for debuggability.
            expect(stderr).toContain('evil');
            expect(stderr).toMatch(/Cannot read --data-file/);
        });

        it('strips control chars from the flag name in unknown-flag errors', async () => {
            // Argv-injected ESC in the flag name itself. Without the
            // sanitizer at the unknown-flag write site, the OSC would fire
            // when the validation error is printed.
            const { exitCodes, stderr } = await runCli(['--ev\x1bil-flag', 'project', 'list']);
            expect(exitCodes).toContain(1);
            expect(stderr).not.toContain('\x1b');
            expect(stderr).toMatch(/unknown flag/);
        });

        it('strips control chars from a validation error carrying user input', async () => {
            // parseId reflects the raw `--project-id` value in the error
            // message; the err() boundary sanitizes before write.
            const { exitCodes, stderr } = await runCli(['project', 'get', 'ab\x07c']);
            expect(exitCodes).toContain(1);
            expect(stderr).not.toContain('\x07');
            expect(stderr).toMatch(/must be a positive integer/);
        });

        // CTF #18: --format table renders TestRail-controlled field values
        // verbatim. Without sanitization, a malicious title (or any string
        // cell) injected into the response payload would execute terminal
        // escape sequences on the user's stdout. The renderer's
        // valueToString boundary now scrubs every cell.
        it('--format table strips ANSI escapes from TestRail-returned cell values', async () => {
            const evilProject = {
                ...MOCK_PROJECT,
                name: 'innocent \x1b]0;Pwned!\x07 name',
                announcement: 'a\x1b[31mred\x1b[0m b',
            };
            const { exitCodes, stdout } = await runCli(
                ['project', 'get', '1', '--format', 'table'],
                [jsonResponse(evilProject)],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).not.toContain('\x1b');
            expect(stdout).not.toContain('\x07');
            // Sanitized text still surfaces so users can see the field value.
            expect(stdout).toContain('Pwned');
            expect(stdout).toContain('red');
        });
    });

    // ── unknown flag rejection (CTF #10) ─────────────────────────────────────
    //
    // parseArgs is invoked with strict:false for defensive future-Node
    // tolerance, but a post-parse loop in main() rejects any flag not in
    // KNOWN_FLAGS. Without this gate, `--dryrun` (missing hyphen) is
    // silently accepted as a free-form key while `values['dry-run']`
    // stays undefined, executing what the user intended as a preview.
    describe('unknown flag rejection', () => {
        it('case delete-bulk: --dryrun typo is rejected, no API call made', async () => {
            const { exitCodes, stderr } = await runCli([
                'case',
                'delete-bulk',
                '7',
                '--project-id',
                '1',
                '--yes',
                '--dryrun',
                '--data',
                '{"case_ids":[1]}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/unknown flag '--dryrun'/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('attachment delete: --dryrun typo is rejected, no API call made', async () => {
            const { exitCodes, stderr } = await runCli(['attachment', 'delete', '1', '--yes', '--dryrun']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/unknown flag '--dryrun'/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('positive control: --dry-run (correct spelling) is accepted', async () => {
            const { exitCodes, stdout } = await runCli([
                'case',
                'delete-bulk',
                '7',
                '--project-id',
                '1',
                '--yes',
                '--dry-run',
                '--data',
                '{"case_ids":[1]}',
            ]);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('dryRun');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('unknown flag emits exit 1 even on a read action that would otherwise succeed', async () => {
            // Don't queue a fetch response — the validation gate must reject
            // before any API call, so an unconsumed mockResolvedValueOnce
            // would leak into the next test's queue (vi.clearAllMocks() only
            // clears call history, not the .mockResolvedValueOnce stack).
            const { exitCodes, stderr } = await runCli(['project', 'list', '--limmit', '10']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/unknown flag '--limmit'/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('unknown flag rejection honors --quiet (suppress stderr while still exiting 1)', async () => {
            // Copilot review: the strict-flag gate wrote directly to stderr,
            // bypassing the --quiet contract. Verify it now routes through
            // err() which suppresses output when quiet is set.
            const { exitCodes, stderr } = await runCli(['--quiet', 'project', 'list', '--limmit', '10']);
            expect(exitCodes).toContain(1);
            expect(stderr).toBe('');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    // ── output format ─────────────────────────────────────────────────────────

    describe('--format table', () => {
        it('should render output as a table with column headers', async () => {
            const { stdout, exitCodes } = await runCli(
                ['project', 'get', '1', '--format', 'table'],
                [jsonResponse(MOCK_PROJECT)],
            );
            // Table format uses " | " column separators and includes field names
            expect(stdout).toMatch(/id/);
            expect(exitCodes).toContain(0);
        });

        it('should render (empty) for an empty list in table format', async () => {
            const { stdout } = await runCli(['project', 'list', '--format', 'table'], [jsonResponse({ projects: [] })]);
            expect(stdout).toContain('(empty)');
        });
    });

    describe('--quiet', () => {
        it('should suppress stdout while still exiting 0', async () => {
            const { stdout, exitCodes } = await runCli(
                ['project', 'get', '1', '--quiet'],
                [jsonResponse(MOCK_PROJECT)],
            );
            expect(stdout).toBe('');
            expect(exitCodes).toContain(0);
        });
    });

    // ── API error handling ────────────────────────────────────────────────────

    describe('API error handling', () => {
        it('should exit 1 and write error to stderr when API returns 404', async () => {
            const { stderr, exitCodes } = await runCli(
                ['project', 'get', '999'],
                [new Response('not found', { status: 404, statusText: 'Not Found' })],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('TestRail API error');
        });
    });

    // ── renderTable edge cases ────────────────────────────────────────────────

    describe('renderTable edge cases', () => {
        it('should render list items as rows in table format', async () => {
            // getResultsForRun returns response.results; valid Result objects are rendered as table rows
            const { stdout } = await runCli(
                ['result', 'list', '--run-id', '1', '--format', 'table'],
                [jsonResponse({ results: [{ status_id: 1, comment: 'pass' }] })],
            );
            expect(stdout).toContain('pass');
        });

        it('should render undefined/absent cell values as empty string in table format', async () => {
            // First row defines `comment` column; second row omits it and should render as empty.
            const { stdout, exitCodes } = await runCli(
                ['result', 'list', '--run-id', '1', '--format', 'table'],
                [jsonResponse({ results: [{ status_id: 1, comment: 'filled' }, { status_id: 2 }] })],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('status_id | comment');
            // Ensure the row with status_id=2 has an empty `comment` cell.
            expect(stdout).toMatch(/^2\s+\|\s*$/m);
        });

        it('should JSON.stringify nested object cell values in table format', async () => {
            // A result with custom_fields (nested object) exercises the `typeof v === 'object'` branch
            const { stdout, exitCodes } = await runCli(
                ['result', 'list', '--run-id', '1', '--format', 'table'],
                [jsonResponse({ results: [{ status_id: 1, custom_fields: { tag: 'v1' } }] })],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('custom_fields');
        });

        it('should convert boolean cell values to string in table format', async () => {
            // MOCK_USER has is_active: true — exercises the boolean branch of valueToString
            const { stdout, exitCodes } = await runCli(
                ['user', 'get', '1', '--format', 'table'],
                [jsonResponse(MOCK_USER)],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('true');
        });
    });

    // ── quiet mode error suppression ──────────────────────────────────────────

    describe('--quiet with error', () => {
        it('should suppress stderr output when --quiet is set and API returns error', async () => {
            const { stderr, exitCodes } = await runCli(
                ['project', 'get', '999', '--quiet'],
                [new Response('not found', { status: 404, statusText: 'Not Found' })],
            );
            // --quiet suppresses err() output, but exit code is still 1
            expect(exitCodes).toContain(1);
            expect(stderr).toBe('');
        });
    });

    // ── optInt invalid input ──────────────────────────────────────────────────

    describe('invalid --limit value', () => {
        it('should ignore non-integer --limit and still complete the request', async () => {
            const { exitCodes } = await runCli(
                ['project', 'list', '--limit', 'foo'],
                [jsonResponse({ projects: [MOCK_PROJECT] })],
            );
            // optInt('foo') returns undefined; request proceeds without limit param
            expect(exitCodes).toContain(0);
        });
    });

    // ── Write actions (subprocess happy-paths) ────────────────────────────────

    describe('case add', () => {
        it('POSTs the payload and returns the created case', async () => {
            const { stdout, exitCodes } = await runCli(
                ['case', 'add', '5', '--data', '{"title":"New Case"}'],
                [jsonResponse(MOCK_CASE)],
            );
            const parsed = JSON.parse(stdout.trim()) as typeof MOCK_CASE;
            expect(parsed.id).toBe(1);
            expect(exitCodes).toContain(0);
        });

        it('exits 1 when body is missing', async () => {
            const { stderr, exitCodes } = await runCli(['case', 'add', '5']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Body required');
        });

        it('exits 1 on malformed JSON', async () => {
            const { stderr, exitCodes } = await runCli(['case', 'add', '5', '--data', '{ broken']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Invalid JSON');
        });

        it('--dry-run validates payload but does not POST', async () => {
            const { stdout, exitCodes } = await runCli(['case', 'add', '5', '--data', '{"title":"x"}', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"dryRun": true');
            expect(stdout).toContain('"sectionId": 5');
        });
    });

    describe('case update', () => {
        it('POSTs the partial payload', async () => {
            const { exitCodes } = await runCli(
                ['case', 'update', '7', '--data', '{"title":"Renamed"}'],
                [jsonResponse({ ...MOCK_CASE, title: 'Renamed' })],
            );
            expect(exitCodes).toContain(0);
        });
    });

    describe('section move', () => {
        it('POSTs to move_section/{section_id} with parent_id=null body', async () => {
            const { exitCodes } = await runCli(
                ['section', 'move', '5', '--data', '{"parent_id":null,"after_id":42}'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('move_section/5');
            const init = mockFetch.mock.calls.at(-1)?.[1] as RequestInit;
            const body = JSON.parse(init.body as string) as Record<string, unknown>;
            expect(body['parent_id']).toBeNull();
            expect(body['after_id']).toBe(42);
        });

        it('exits 1 when body is missing', async () => {
            const { stderr, exitCodes } = await runCli(['section', 'move', '5']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Body required');
        });

        it('--dry-run validates payload but does not POST', async () => {
            const { stdout, exitCodes } = await runCli([
                'section',
                'move',
                '5',
                '--data',
                '{"parent_id":null}',
                '--dry-run',
            ]);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"dryRun": true');
            expect(stdout).toContain('"sectionId": 5');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    // ── Structural-setup write actions ────────────────────────────────────
    // Subprocess coverage for the project/suite/section/milestone add+update
    // CLI surface. Unit-level coverage lives in tests/cli-write-handlers.test.ts;
    // these cases verify the end-to-end shape: dispatch → handler → URL → exit.
    describe('project add/update', () => {
        it('project add POSTs to add_project (no path param) with the payload', async () => {
            const { exitCodes } = await runCli(
                ['project', 'add', '--data', '{"name":"P","suite_mode":1}'],
                [jsonResponse(MOCK_PROJECT)],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('add_project');
        });

        it('project update POSTs to update_project/{project_id}', async () => {
            const { exitCodes } = await runCli(
                ['project', 'update', '1', '--data', '{"name":"Renamed"}'],
                [jsonResponse(MOCK_PROJECT)],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('update_project/1');
        });
    });

    describe('suite add/update', () => {
        it('suite add POSTs to add_suite/{project_id}', async () => {
            const { exitCodes } = await runCli(
                ['suite', 'add', '1', '--data', '{"name":"S"}'],
                [jsonResponse(MOCK_SUITE)],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('add_suite/1');
        });

        it('suite update POSTs to update_suite/{suite_id}', async () => {
            const { exitCodes } = await runCli(
                ['suite', 'update', '1', '--data', '{"name":"S2"}'],
                [jsonResponse(MOCK_SUITE)],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('update_suite/1');
        });
    });

    describe('section add/update', () => {
        it('section add POSTs to add_section/{project_id} with suite_id in body', async () => {
            const { exitCodes } = await runCli(
                ['section', 'add', '1', '--data', '{"name":"Sec","suite_id":1}'],
                [jsonResponse({ id: 33, suite_id: 1, name: 'Sec', display_order: 1, depth: 0 })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('add_section/1');
            const init = mockFetch.mock.calls.at(-1)?.[1] as RequestInit;
            const body = JSON.parse(init.body as string) as Record<string, unknown>;
            expect(body['suite_id']).toBe(1);
        });

        it('section update POSTs to update_section/{section_id}', async () => {
            const { exitCodes } = await runCli(
                ['section', 'update', '33', '--data', '{"name":"Sec2"}'],
                [jsonResponse({ id: 33, suite_id: 1, name: 'Sec2', display_order: 1, depth: 0 })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('update_section/33');
        });

        it('section add --dry-run does not POST', async () => {
            const { stdout, exitCodes } = await runCli([
                'section',
                'add',
                '1',
                '--data',
                '{"name":"Sec"}',
                '--dry-run',
            ]);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"dryRun": true');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('milestone add/update', () => {
        it('milestone add POSTs to add_milestone/{project_id}', async () => {
            const { exitCodes } = await runCli(
                ['milestone', 'add', '1', '--data', '{"name":"M"}'],
                [jsonResponse(MOCK_MILESTONE)],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('add_milestone/1');
        });

        it('milestone update POSTs is_completed toggle', async () => {
            const { exitCodes } = await runCli(
                ['milestone', 'update', '5', '--data', '{"is_completed":true}'],
                [jsonResponse({ ...MOCK_MILESTONE, is_completed: true })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('update_milestone/5');
            const init = mockFetch.mock.calls.at(-1)?.[1] as RequestInit;
            const body = JSON.parse(init.body as string) as Record<string, unknown>;
            expect(body['is_completed']).toBe(true);
        });
    });

    describe('run add', () => {
        it('POSTs the payload and returns the created run', async () => {
            const { exitCodes } = await runCli(
                ['run', 'add', '1', '--data', '{"name":"smoke"}'],
                [jsonResponse(MOCK_RUN)],
            );
            expect(exitCodes).toContain(0);
        });

        it('exits 1 when payload is missing required `name`', async () => {
            const { stderr, exitCodes } = await runCli(['run', 'add', '1', '--data', '{"suite_id":1}']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('validation failed');
        });
    });

    describe('run update', () => {
        it('POSTs the payload and returns the updated run', async () => {
            const { exitCodes } = await runCli(
                ['run', 'update', '1', '--data', '{"name":"Updated"}'],
                [jsonResponse({ ...MOCK_RUN, name: 'Updated' })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('update_run/1');
            const init = mockFetch.mock.calls.at(-1)?.[1] as RequestInit;
            const body = JSON.parse(init.body as string) as Record<string, unknown>;
            expect(body['name']).toBe('Updated');
        });

        it('exits 1 when --data is missing and no other body source', async () => {
            const { stderr, exitCodes } = await runCli(['run', 'update', '1']);
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('exits 1 when run_id is non-numeric', async () => {
            const { stderr, exitCodes } = await runCli(['run', 'update', 'abc', '--data', '{}']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('run_id');
        });

        it('exits 1 when run_id is zero', async () => {
            const { exitCodes } = await runCli(['run', 'update', '0', '--data', '{}']);
            expect(exitCodes).toContain(1);
        });

        it('exits 1 when run_id is negative', async () => {
            const { exitCodes } = await runCli(['run', 'update', '-1', '--data', '{}']);
            expect(exitCodes).toContain(1);
        });

        it('exits 1 when run_id is fractional', async () => {
            const { exitCodes } = await runCli(['run', 'update', '1.5', '--data', '{}']);
            expect(exitCodes).toContain(1);
        });

        it('exits 1 when run_id is empty positional', async () => {
            const { exitCodes } = await runCli(['run', 'update', '', '--data', '{}']);
            expect(exitCodes).toContain(1);
        });

        it('exits 1 when run_id is scientific notation', async () => {
            const { exitCodes } = await runCli(['run', 'update', '1e2', '--data', '{}']);
            expect(exitCodes).toContain(1);
        });

        it('exits 1 when run_id is hex', async () => {
            const { exitCodes } = await runCli(['run', 'update', '0x1', '--data', '{}']);
            expect(exitCodes).toContain(1);
        });

        it('exits 1 when payload has wrong field type', async () => {
            const { stderr, exitCodes } = await runCli(['run', 'update', '1', '--data', '{"name":42}']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('validation failed');
        });

        it('--dry-run does not call the API and emits a preview with payload + source=data', async () => {
            const { stdout, exitCodes } = await runCli(['run', 'update', '1', '--data', '{"name":"x"}', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            const out = JSON.parse(stdout) as Record<string, unknown>;
            expect(out['dryRun']).toBe(true);
            expect(out['action']).toBe('run update');
            expect(out['runId']).toBe(1);
            expect(out['payload']).toEqual({ name: 'x' });
            expect(out['source']).toBe('data');
        });

        it('--dry-run with --data-file emits payload + source=file', async () => {
            // Q11b: assert source distinguishes --data vs --data-file body channels.
            const fs = await import('node:fs');
            const os = await import('node:os');
            const path = await import('node:path');
            const tmp = path.join(os.tmpdir(), `testrail-run-update-${Date.now()}.json`);
            fs.writeFileSync(tmp, '{"name":"from-file"}', 'utf-8');
            try {
                const { stdout, exitCodes } = await runCli(['run', 'update', '1', '--data-file', tmp, '--dry-run']);
                expect(exitCodes).toContain(0);
                expect(mockFetch).not.toHaveBeenCalled();
                const out = JSON.parse(stdout) as Record<string, unknown>;
                expect(out['dryRun']).toBe(true);
                expect(out['action']).toBe('run update');
                expect(out['runId']).toBe(1);
                expect(out['payload']).toEqual({ name: 'from-file' });
                expect(out['source']).toBe('file');
            } finally {
                fs.unlinkSync(tmp);
            }
        });

        it('exits 1 and propagates TestRailApiError on network error (TypeError: fetch failed)', async () => {
            // Q11b gate: POST does not retry on network errors (only 429), so
            // a single mockRejectedValueOnce is sufficient. The error must
            // surface as a non-zero exit, not be swallowed.
            mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
            const { exitCodes, stderr } = await runCli(['run', 'update', '1', '--data', '{"name":"x"}']);
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('--format table renders tabular output', async () => {
            const { stdout, exitCodes } = await runCli(
                ['run', 'update', '1', '--data', '{"name":"Updated"}', '--format', 'table'],
                [jsonResponse({ ...MOCK_RUN, name: 'Updated' })],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('Updated');
        });

        it('--format json (default) emits parseable JSON', async () => {
            const { stdout, exitCodes } = await runCli(
                ['run', 'update', '1', '--data', '{"name":"Updated"}'],
                [jsonResponse({ ...MOCK_RUN, name: 'Updated' })],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout) as Record<string, unknown>;
            expect(parsed['name']).toBe('Updated');
        });

        it('exits 1 on 400 (bad payload server-side)', async () => {
            const { exitCodes } = await runCli(
                ['run', 'update', '1', '--data', '{"name":"x"}'],
                [jsonResponse({ error: 'Bad payload' }, 400)],
            );
            expect(exitCodes).toContain(1);
        });

        it('exits 1 on 404 (run not found)', async () => {
            const { exitCodes } = await runCli(
                ['run', 'update', '9999', '--data', '{"name":"x"}'],
                [jsonResponse({ error: 'Not found' }, 404)],
            );
            expect(exitCodes).toContain(1);
        });

        it('exits 1 on 401 (auth)', async () => {
            const { exitCodes } = await runCli(
                ['run', 'update', '1', '--data', '{"name":"x"}'],
                [jsonResponse({ error: 'Unauthorized' }, 401)],
            );
            expect(exitCodes).toContain(1);
        });

        it('exits 1 on 403 (forbidden)', async () => {
            const { exitCodes } = await runCli(
                ['run', 'update', '1', '--data', '{"name":"x"}'],
                [jsonResponse({ error: 'Forbidden' }, 403)],
            );
            expect(exitCodes).toContain(1);
        });
    });

    describe('run close', () => {
        it('POSTs without a body when --yes is passed', async () => {
            const { exitCodes } = await runCli(
                ['run', 'close', '10', '--yes'],
                [jsonResponse({ ...MOCK_RUN, is_completed: true })],
            );
            expect(exitCodes).toContain(0);
        });
    });

    describe('result add', () => {
        it('POSTs the payload with both positional ids', async () => {
            const { exitCodes } = await runCli(
                ['result', 'add', '5', '7', '--data', '{"status_id":1}'],
                [jsonResponse({ id: 100, status_id: 1 })],
            );
            expect(exitCodes).toContain(0);
        });

        it('exits 1 when case_id positional is missing', async () => {
            const { exitCodes } = await runCli(['result', 'add', '5', '--data', '{"status_id":1}']);
            expect(exitCodes).toContain(1);
        });
    });

    describe('install-skill', () => {
        it('--print-path emits the bundled SKILL.md path and exits 0 without writing', async () => {
            const { stdout, exitCodes } = await runCli(['install-skill', '--print-path']);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('SKILL.md');
        });
    });

    describe('plan', () => {
        it('plan get <id> should exit 0', async () => {
            const { exitCodes } = await runCli(['plan', 'get', '50'], [jsonResponse(MOCK_PLAN)]);
            expect(exitCodes).toContain(0);
        });

        it('plan list --project-id <id> should exit 0', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'list', '--project-id', '1'],
                [jsonResponse({ plans: [MOCK_PLAN] })],
            );
            expect(exitCodes).toContain(0);
        });

        it('plan list honors --limit and --offset', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'list', '--project-id', '1', '--limit', '5', '--offset', '10'],
                [jsonResponse({ plans: [MOCK_PLAN] })],
            );
            expect(exitCodes).toContain(0);
            // Verify both flags actually reach the TestRail URL — without this,
            // dropping either forward in handlePlanList would still pass.
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=5'), expect.anything());
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('offset=10'), expect.anything());
        });

        it('plan add POSTs the payload and returns the created plan', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'add', '1', '--data', '{"name":"Release 1.0"}'],
                [jsonResponse(MOCK_PLAN)],
            );
            expect(exitCodes).toContain(0);
        });

        it('plan add exits 1 when payload is missing required `name`', async () => {
            const { stderr, exitCodes } = await runCli(['plan', 'add', '1', '--data', '{"description":"d"}']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('validation failed');
        });

        it('plan update POSTs the payload', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'update', '50', '--data', '{"name":"renamed"}'],
                [jsonResponse({ ...MOCK_PLAN, name: 'renamed' })],
            );
            expect(exitCodes).toContain(0);
        });

        it('plan add-entry POSTs the payload and returns the created entry', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'add-entry', '50', '--data', '{"suite_id":1,"include_all":true}'],
                [jsonResponse(MOCK_PLAN_ENTRY)],
            );
            expect(exitCodes).toContain(0);
        });

        it('plan add-entry exits 1 when payload is missing required suite_id', async () => {
            const { stderr, exitCodes } = await runCli(['plan', 'add-entry', '50', '--data', '{"name":"oops"}']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('validation failed');
        });

        it('plan add --dry-run does not call the API', async () => {
            const { stdout, exitCodes } = await runCli(['plan', 'add', '1', '--data', '{"name":"R"}', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('plan add');
        });

        it('plan add-run-to-entry POSTs the payload and returns the created run', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'add-run-to-entry', '50', 'abc-def-uuid', '--data', '{"config_ids":[1,2]}'],
                [jsonResponse(MOCK_RUN)],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_run_to_plan_entry/50/abc-def-uuid'),
                expect.anything(),
            );
        });

        it('plan add-run-to-entry exits 1 when payload is missing required config_ids', async () => {
            const { stderr, exitCodes } = await runCli([
                'plan',
                'add-run-to-entry',
                '50',
                'abc-def-uuid',
                '--data',
                '{"include_all":true}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('validation failed');
        });

        it('plan add-run-to-entry exits 1 when --data is missing', async () => {
            const { stderr, exitCodes } = await runCli(['plan', 'add-run-to-entry', '50', 'abc-def-uuid']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Body required');
        });

        it('plan add-run-to-entry --dry-run does not call the API', async () => {
            const { stdout, exitCodes } = await runCli([
                'plan',
                'add-run-to-entry',
                '50',
                'abc-def-uuid',
                '--data',
                '{"config_ids":[1]}',
                '--dry-run',
            ]);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('plan add-run-to-entry');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan add-run-to-entry --format table renders the result as a table', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'add-run-to-entry', '50', 'abc-def-uuid', '--data', '{"config_ids":[1]}', '--format', 'table'],
                [jsonResponse(MOCK_RUN)],
            );
            expect(exitCodes).toContain(0);
            // Table rendering surfaces the run id/name as plain text
            expect(stdout).toContain('Run 1');
        });

        it('plan add-run-to-entry surfaces 404 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'add-run-to-entry', '50', 'abc-def-uuid', '--data', '{"config_ids":[1]}'],
                [jsonResponse({ error: 'not found' }, 404)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan update-entry POSTs the payload', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'update-entry', '50', 'abc-def-uuid', '--data', '{"name":"renamed"}'],
                [jsonResponse(MOCK_PLAN_ENTRY)],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_plan_entry/50/abc-def-uuid'),
                expect.anything(),
            );
        });

        it('plan update-entry accepts an empty body', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'update-entry', '50', 'abc-def-uuid', '--data', '{}'],
                [jsonResponse(MOCK_PLAN_ENTRY)],
            );
            expect(exitCodes).toContain(0);
        });

        it('plan update-entry exits 1 when --data is missing', async () => {
            const { stderr, exitCodes } = await runCli(['plan', 'update-entry', '50', 'abc-def-uuid']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Body required');
        });

        it('plan update-entry exits 1 on Zod validation failure', async () => {
            const { stderr, exitCodes } = await runCli([
                'plan',
                'update-entry',
                '50',
                'abc-def-uuid',
                '--data',
                '{"name":42}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('validation failed');
        });

        it('plan update-entry --dry-run does not call the API', async () => {
            const { stdout, exitCodes } = await runCli([
                'plan',
                'update-entry',
                '50',
                'abc-def-uuid',
                '--data',
                '{"name":"R"}',
                '--dry-run',
            ]);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('plan update-entry');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan update-run-in-entry POSTs the payload', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'update-run-in-entry', '77', '--data', '{"description":"new"}'],
                [jsonResponse(MOCK_RUN)],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_run_in_plan_entry/77'),
                expect.anything(),
            );
        });

        it('plan update-run-in-entry exits 1 when --data is missing', async () => {
            const { stderr, exitCodes } = await runCli(['plan', 'update-run-in-entry', '77']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Body required');
        });

        it('plan update-run-in-entry exits 1 on Zod validation failure', async () => {
            const { stderr, exitCodes } = await runCli([
                'plan',
                'update-run-in-entry',
                '77',
                '--data',
                '{"description":42}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('validation failed');
        });

        it('plan update-run-in-entry exits 1 when run_id is not a positive integer', async () => {
            const { stderr, exitCodes } = await runCli(['plan', 'update-run-in-entry', '0', '--data', '{}']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('run_id');
        });

        it('plan update-run-in-entry --dry-run does not call the API', async () => {
            const { stdout, exitCodes } = await runCli([
                'plan',
                'update-run-in-entry',
                '77',
                '--data',
                '{"description":"x"}',
                '--dry-run',
            ]);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('plan update-run-in-entry');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan update-run-in-entry --format json emits parseable JSON', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'update-run-in-entry', '77', '--data', '{}', '--format', 'json'],
                [jsonResponse(MOCK_RUN)],
            );
            expect(exitCodes).toContain(0);
            // Trim trailing whitespace/newlines before parsing
            const parsed = JSON.parse(stdout.trim());
            expect(parsed).toMatchObject({ id: 1 });
        });

        it('plan add-run-to-entry exits 1 when entry_id is missing positional', async () => {
            // Only one positional after action → resource has only plan_id, entry_id missing
            const { stderr, exitCodes } = await runCli([
                'plan',
                'add-run-to-entry',
                '50',
                '--data',
                '{"config_ids":[1]}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('entry_id');
        });

        // ── Format-coverage symmetry ──────────────────────────────────────

        it('plan add-run-to-entry --format json emits parseable JSON', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'add-run-to-entry', '50', 'abc-def-uuid', '--data', '{"config_ids":[1]}', '--format', 'json'],
                [jsonResponse(MOCK_RUN)],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim());
            expect(parsed).toMatchObject({ id: 1 });
        });

        it('plan update-entry --format table renders the result as a table', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'update-entry', '50', 'abc-def-uuid', '--data', '{"name":"renamed"}', '--format', 'table'],
                [jsonResponse(MOCK_PLAN_ENTRY)],
            );
            expect(exitCodes).toContain(0);
            expect(stdout.length).toBeGreaterThan(0);
        });

        it('plan update-entry --format json emits parseable JSON', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'update-entry', '50', 'abc-def-uuid', '--data', '{"name":"x"}', '--format', 'json'],
                [jsonResponse(MOCK_PLAN_ENTRY)],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim());
            expect(parsed).toBeTruthy();
        });

        it('plan update-run-in-entry --format table renders the result as a table', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'update-run-in-entry', '77', '--data', '{}', '--format', 'table'],
                [jsonResponse(MOCK_RUN)],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('Run 1');
        });

        // ── Error-path symmetry (401, 403, 404, network) ──────────────────

        it('plan update-entry surfaces 401 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'update-entry', '50', 'abc-def-uuid', '--data', '{"name":"x"}'],
                [jsonResponse({ error: 'unauthorized' }, 401)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan update-entry surfaces 403 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'update-entry', '50', 'abc-def-uuid', '--data', '{"name":"x"}'],
                [jsonResponse({ error: 'forbidden' }, 403)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan update-entry surfaces 404 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'update-entry', '50', 'abc-def-uuid', '--data', '{"name":"x"}'],
                [jsonResponse({ error: 'not found' }, 404)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan update-entry surfaces network error as exit 1', async () => {
            mockFetch.mockReset();
            mockFetch.mockRejectedValue(new TypeError('fetch failed: ECONNREFUSED'));
            const { stderr, exitCodes } = await runCli([
                'plan',
                'update-entry',
                '50',
                'abc-def-uuid',
                '--data',
                '{"name":"x"}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan add-run-to-entry surfaces 401 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'add-run-to-entry', '50', 'abc-def-uuid', '--data', '{"config_ids":[1]}'],
                [jsonResponse({ error: 'unauthorized' }, 401)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan add-run-to-entry surfaces 403 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'add-run-to-entry', '50', 'abc-def-uuid', '--data', '{"config_ids":[1]}'],
                [jsonResponse({ error: 'forbidden' }, 403)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan add-run-to-entry surfaces network error as exit 1', async () => {
            mockFetch.mockReset();
            mockFetch.mockRejectedValue(new TypeError('fetch failed: ECONNREFUSED'));
            const { stderr, exitCodes } = await runCli([
                'plan',
                'add-run-to-entry',
                '50',
                'abc-def-uuid',
                '--data',
                '{"config_ids":[1]}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan update-run-in-entry surfaces 401 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'update-run-in-entry', '77', '--data', '{}'],
                [jsonResponse({ error: 'unauthorized' }, 401)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan update-run-in-entry surfaces 403 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'update-run-in-entry', '77', '--data', '{}'],
                [jsonResponse({ error: 'forbidden' }, 403)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan update-run-in-entry surfaces 404 as TestRailApiError exit 1', async () => {
            const { stderr, exitCodes } = await runCli(
                ['plan', 'update-run-in-entry', '77', '--data', '{}'],
                [jsonResponse({ error: 'not found' }, 404)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        it('plan update-run-in-entry surfaces network error as exit 1', async () => {
            mockFetch.mockReset();
            mockFetch.mockRejectedValue(new TypeError('fetch failed: ECONNREFUSED'));
            const { stderr, exitCodes } = await runCli(['plan', 'update-run-in-entry', '77', '--data', '{}']);
            expect(exitCodes).toContain(1);
            expect(stderr.length).toBeGreaterThan(0);
        });

        // ── Whitespace-only entry_id (subprocess) ─────────────────────────

        it('plan update-entry exits 1 when entry_id is whitespace-only', async () => {
            const { stderr, exitCodes } = await runCli(['plan', 'update-entry', '50', '   ', '--data', '{"name":"x"}']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('entry_id');
        });

        // ── plan close (destructive, irreversible) ─────────────────────────
        it('plan close without --yes rejects (destructive: irreversible)', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'close', '50']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan close with --yes POSTs to close_plan/{plan_id}', async () => {
            const { exitCodes } = await runCli(
                ['plan', 'close', '50', '--yes'],
                [jsonResponse({ ...MOCK_PLAN, is_completed: true })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('close_plan/50');
            const init = mockFetch.mock.calls.at(-1)?.[1] as { method?: string } | undefined;
            expect(init?.method).toBe('POST');
        });

        it('plan close --dry-run skips the API call even with --yes; preview marks destructive', async () => {
            const { exitCodes, stdout } = await runCli(['plan', 'close', '50', '--yes', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('destructive');
        });

        it('plan close --dry-run without --yes also previews without API call', async () => {
            const { exitCodes, stdout } = await runCli(['plan', 'close', '50', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            expect(stdout).toContain('plan close');
        });

        // ── plan delete (destructive; no --soft) ───────────────────────────
        it('plan delete without --yes rejects', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'delete', '50']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan delete with --yes POSTs to delete_plan/{plan_id}', async () => {
            const { exitCodes, stdout } = await runCli(['plan', 'delete', '50', '--yes'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_plan/50');
            const init = mockFetch.mock.calls.at(-1)?.[1] as { method?: string } | undefined;
            expect(init?.method).toBe('POST');
            expect(stdout).toContain('"deleted": true');
        });

        it('plan delete --dry-run skips the API call even with --yes', async () => {
            const { exitCodes, stdout } = await runCli(['plan', 'delete', '50', '--yes', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('destructive');
        });

        // ── plan delete-entry (entry_id is a UUID string) ──────────────────
        it('plan delete-entry without --yes rejects', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'delete-entry', '50', 'abc-def-uuid']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan delete-entry with --yes POSTs to delete_plan_entry/{plan_id}/{entry_id}', async () => {
            const { exitCodes, stdout } = await runCli(
                ['plan', 'delete-entry', '50', 'abc-def-uuid', '--yes'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_plan_entry/50/abc-def-uuid');
            expect(stdout).toContain('"deleted": true');
        });

        it('plan delete-entry --dry-run skips the API call even with --yes', async () => {
            const { exitCodes, stdout } = await runCli([
                'plan',
                'delete-entry',
                '50',
                'abc-def-uuid',
                '--yes',
                '--dry-run',
            ]);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('destructive');
        });

        it('plan delete-entry rejects missing entry_id', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'delete-entry', '50', '--yes']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/entry_id/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan delete-entry rejects non-positive plan_id before --yes check', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'delete-entry', '0', 'abc-def-uuid']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/plan_id/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        // ── plan delete-run-from-entry ─────────────────────────────────────
        it('plan delete-run-from-entry without --yes rejects', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'delete-run-from-entry', '42']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan delete-run-from-entry with --yes POSTs to delete_run_from_plan_entry/{run_id}', async () => {
            const { exitCodes, stdout } = await runCli(
                ['plan', 'delete-run-from-entry', '42', '--yes'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_run_from_plan_entry/42');
            expect(stdout).toContain('"deleted": true');
        });

        it('plan delete-run-from-entry --dry-run skips the API call even with --yes', async () => {
            const { exitCodes, stdout } = await runCli(['plan', 'delete-run-from-entry', '42', '--yes', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            expect(stdout).toContain('dryRun');
            expect(stdout).toContain('destructive');
        });

        // ── Error path: 404 surfaces as exit 1 (sample for the cluster) ────
        it('plan close surfaces 404 from TestRail as exit 1', async () => {
            const { exitCodes, stderr } = await runCli(
                ['plan', 'close', '999', '--yes'],
                [jsonResponse({ error: 'Plan not found' }, 404)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/404/);
        });

        it('plan delete surfaces 401 from TestRail as exit 1', async () => {
            const { exitCodes, stderr } = await runCli(
                ['plan', 'delete', '50', '--yes'],
                [jsonResponse({ error: 'Auth failed' }, 401)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/401/);
        });

        it('plan delete-entry surfaces 403 from TestRail as exit 1', async () => {
            const { exitCodes, stderr } = await runCli(
                ['plan', 'delete-entry', '50', 'abc-uuid', '--yes'],
                [jsonResponse({ error: 'Forbidden' }, 403)],
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/403/);
        });

        // ── --format table emits a tabular preview for dry-run ────────────
        it('plan close --dry-run --format table renders a table preview', async () => {
            const { exitCodes, stdout } = await runCli([
                'plan',
                'close',
                '50',
                '--yes',
                '--dry-run',
                '--format',
                'table',
            ]);
            expect(exitCodes).toContain(0);
            expect(mockFetch).not.toHaveBeenCalled();
            expect(stdout).toContain('plan close');
        });

        // ── --format json emits JSON-parseable stdout for each destructive op ─
        // `plan close --format table` already exists; these mirror it for the
        // other three destructive ops so every --format json path is exercised
        // end-to-end (not just at the unit-handler level).

        it('plan delete --format json --yes emits JSON-parseable stdout', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'delete', '50', '--yes', '--format', 'json'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim()) as { planId: number; deleted: boolean };
            expect(parsed).toEqual({ planId: 50, deleted: true });
        });

        it('plan delete-entry --format json --yes emits JSON-parseable stdout', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'delete-entry', '50', 'abc-def-uuid', '--yes', '--format', 'json'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim()) as { planId: number; entryId: string; deleted: boolean };
            expect(parsed).toEqual({ planId: 50, entryId: 'abc-def-uuid', deleted: true });
        });

        it('plan delete-run-from-entry --format json --yes emits JSON-parseable stdout', async () => {
            const { stdout, exitCodes } = await runCli(
                ['plan', 'delete-run-from-entry', '42', '--yes', '--format', 'json'],
                [jsonResponse({})],
            );
            expect(exitCodes).toContain(0);
            const parsed = JSON.parse(stdout.trim()) as { runId: number; deleted: boolean };
            expect(parsed).toEqual({ runId: 42, deleted: true });
        });

        // ── network-error mapping for plan delete-run-from-entry ──────────
        // `plan close` / `plan delete` / `plan delete-entry` already have 401/403/404
        // mock-status paths above; mirror them here for delete-run-from-entry
        // and exercise the fetch-rejection path (network/TLS failure) which
        // surfaces as exit 1. runCli applies its own mockReset(), so use the
        // `fetchRejection` parameter to install a persistent rejection.
        it('plan delete-run-from-entry maps a network error to exit 1', async () => {
            const { exitCodes, stderr } = await runCli(
                ['plan', 'delete-run-from-entry', '42', '--yes'],
                [],
                AUTH_ENV,
                new TypeError('fetch failed'),
            );
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/fetch failed/);
        });

        // ── whitespace-only entry_id is rejected before any API call ──────
        it('plan delete-entry rejects whitespace-only entry_id', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'delete-entry', '50', '   ', '--yes']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/entry_id/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        // ── ID boundary subprocess tests (mirror plan delete-entry coverage) ─
        // `plan delete-entry` already exercises non-positive-integer plan_id at
        // the subprocess level (line 1638 above). These extend that coverage to
        // the other three destructive ops so the parseId boundary is enforced
        // by the actual CLI binary, not just the unit handlers.
        // NOTE: '-1' is omitted from the it.each set because parseArgs
        // (strict: false) interprets `--1` / `-1` as a flag, not a
        // positional — so the negative-int branch is exercised at the
        // unit level (cli-write-handlers.test.ts) but not here. The
        // remaining four values cover the other parseId boundary cases.
        it.each([['0'], ['1.5'], ['abc'], ['']])(
            'plan close rejects non-positive-integer plan_id (%s) before destructive gate',
            async (raw) => {
                const { exitCodes, stderr } = await runCli(['plan', 'close', raw, '--yes']);
                expect(exitCodes).toContain(1);
                expect(stderr).toMatch(/plan_id/);
                expect(mockFetch).not.toHaveBeenCalled();
            },
        );

        it.each([['0'], ['1.5'], ['abc'], ['']])(
            'plan delete rejects non-positive-integer plan_id (%s) before destructive gate',
            async (raw) => {
                const { exitCodes, stderr } = await runCli(['plan', 'delete', raw, '--yes']);
                expect(exitCodes).toContain(1);
                expect(stderr).toMatch(/plan_id/);
                expect(mockFetch).not.toHaveBeenCalled();
            },
        );

        it.each([['0'], ['1.5'], ['abc'], ['']])(
            'plan delete-run-from-entry rejects non-positive-integer run_id (%s) before destructive gate',
            async (raw) => {
                const { exitCodes, stderr } = await runCli(['plan', 'delete-run-from-entry', raw, '--yes']);
                expect(exitCodes).toContain(1);
                expect(stderr).toMatch(/run_id/);
                expect(mockFetch).not.toHaveBeenCalled();
            },
        );

        // ── --soft rejection: TestRail has no soft preview for any plan op ─
        // Mirrors `milestone delete` / `project delete` --soft rejection tests.
        it('plan close rejects --soft (TestRail does not support soft on close_plan)', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'close', '50', '--soft', '--yes']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/plan close does not support --soft/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan delete rejects --soft (TestRail does not support soft on delete_plan)', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'delete', '50', '--soft', '--yes']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/plan delete does not support --soft/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan delete-entry rejects --soft (TestRail does not support soft on delete_plan_entry)', async () => {
            const { exitCodes, stderr } = await runCli([
                'plan',
                'delete-entry',
                '50',
                'abc-def-uuid',
                '--soft',
                '--yes',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/plan delete-entry does not support --soft/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('plan delete-run-from-entry rejects --soft (TestRail does not support soft on delete_run_from_plan_entry)', async () => {
            const { exitCodes, stderr } = await runCli(['plan', 'delete-run-from-entry', '42', '--soft', '--yes']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/plan delete-run-from-entry does not support --soft/);
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('result add-bulk', () => {
        it('POSTs the array payload', async () => {
            // ResultSchema requires status_id; bare {id} would fail response validation.
            const { exitCodes } = await runCli(
                ['result', 'add-bulk', '11', '--data', '{"results":[{"case_id":1,"status_id":1}]}'],
                [jsonResponse([{ id: 100, status_id: 1 }])],
            );
            expect(exitCodes).toContain(0);
        });
    });

    describe('result add-bulk-by-test', () => {
        it('POSTs the array payload to add_results/{run_id}', async () => {
            const { exitCodes } = await runCli(
                ['result', 'add-bulk-by-test', '11', '--data', '{"results":[{"test_id":42,"status_id":1}]}'],
                [jsonResponse([{ id: 200, status_id: 1 }])],
            );
            expect(exitCodes).toContain(0);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_results/11'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('rejects body missing test_id', async () => {
            const { exitCodes, stderr } = await runCli([
                'result',
                'add-bulk-by-test',
                '11',
                '--data',
                '{"results":[{"status_id":1}]}',
            ]);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/validation failed/i);
        });
    });

    describe('attachment', () => {
        let tmp: string;
        beforeEach(() => {
            tmp = mkdtempSync(join(tmpdir(), 'tr-cli-attach-'));
        });
        afterEach(() => {
            rmSync(tmp, { recursive: true, force: true });
        });

        it('list-for-case GETs and returns the array', async () => {
            const { exitCodes, stdout } = await runCli(
                ['attachment', 'list-for-case', '42'],
                [jsonResponse({ attachments: [{ attachment_id: 1, name: 'a.png' }] })],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"attachment_id"');
        });

        it('add-to-case uploads --file and returns attachment_id', async () => {
            const filePath = join(tmp, 'shot.png');
            writeFileSync(filePath, Buffer.from([1, 2, 3]));
            const { exitCodes, stdout } = await runCli(
                ['attachment', 'add-to-case', '42', '--file', filePath],
                [jsonResponse({ attachment_id: 999 })],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('999');
        });

        it('add-to-case --dry-run skips fetch entirely', async () => {
            const filePath = join(tmp, 'shot.png');
            writeFileSync(filePath, Buffer.from([1, 2, 3]));
            const { exitCodes, stdout } = await runCli([
                'attachment',
                'add-to-case',
                '42',
                '--file',
                filePath,
                '--dry-run',
            ]);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"dryRun"');
            expect(stdout).toContain('"size"');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('add-to-case exits 1 when --file is missing', async () => {
            const { exitCodes, stderr } = await runCli(['attachment', 'add-to-case', '42']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('--file');
        });

        it('get downloads binary to --out path', async () => {
            const outPath = join(tmp, 'fetched.bin');
            const { exitCodes, stdout } = await runCli(
                ['attachment', 'get', '42', '--out', outPath],
                [binaryResponse(new Uint8Array([0xab, 0xcd]))],
            );
            expect(exitCodes).toContain(0);
            expect(existsSync(outPath)).toBe(true);
            expect(Array.from(readFileSync(outPath))).toEqual([0xab, 0xcd]);
            expect(stdout).toContain('"size"');
        });

        it('get refuses to overwrite without --force', async () => {
            const outPath = join(tmp, 'exists.bin');
            writeFileSync(outPath, 'old');
            const { exitCodes, stderr } = await runCli(['attachment', 'get', '42', '--out', outPath]);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Refusing to overwrite');
            expect(readFileSync(outPath, 'utf-8')).toBe('old');
        });

        it('delete without --yes exits 1', async () => {
            const { exitCodes, stderr } = await runCli(['attachment', 'delete', '42']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('--yes');
        });

        it('delete --yes succeeds', async () => {
            const { exitCodes } = await runCli(['attachment', 'delete', '42', '--yes'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
        });

        it('delete --yes --dry-run skips API call (dry-run wins)', async () => {
            const { exitCodes, stdout } = await runCli(['attachment', 'delete', '42', '--yes', '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"destructive": true');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('bdd', () => {
        let tmp: string;
        beforeEach(() => {
            tmp = mkdtempSync(join(tmpdir(), 'tr-cli-bdd-'));
        });
        afterEach(() => {
            rmSync(tmp, { recursive: true, force: true });
        });

        it('get writes Gherkin text to --out path', async () => {
            const outPath = join(tmp, 'login.feature');
            const gherkin = 'Feature: Login\n  Scenario: ok\n';
            // text/plain — must NOT be JSON-parsed.
            const textResp = new Response(gherkin, {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'text/plain' },
            });
            const { exitCodes, stdout } = await runCli(['bdd', 'get', '42', '--out', outPath], [textResp]);
            expect(exitCodes).toContain(0);
            expect(existsSync(outPath)).toBe(true);
            expect(readFileSync(outPath, 'utf-8')).toBe(gherkin);
            expect(stdout).toContain('"size"');
        });

        it('get refuses to overwrite without --force', async () => {
            const outPath = join(tmp, 'exists.feature');
            writeFileSync(outPath, 'old');
            const { exitCodes, stderr } = await runCli(['bdd', 'get', '42', '--out', outPath]);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Refusing to overwrite');
            expect(readFileSync(outPath, 'utf-8')).toBe('old');
        });

        it('get --dry-run skips fetch and write', async () => {
            const outPath = join(tmp, 'preview.feature');
            const { exitCodes, stdout } = await runCli(['bdd', 'get', '42', '--out', outPath, '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"dryRun"');
            expect(existsSync(outPath)).toBe(false);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('add uploads --file and returns updated Case', async () => {
            const filePath = join(tmp, 'login.feature');
            writeFileSync(filePath, 'Feature: Login\n');
            const updatedCase = {
                id: 1,
                title: 'BDD case',
                section_id: 1,
                suite_id: 1,
                created_by: 1,
                created_on: 0,
                updated_by: 1,
                updated_on: 0,
            };
            const { exitCodes, stdout } = await runCli(
                ['bdd', 'add', '1', '--file', filePath],
                [jsonResponse(updatedCase)],
            );
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"id"');
        });

        it('add --dry-run skips fetch entirely', async () => {
            const filePath = join(tmp, 'login.feature');
            writeFileSync(filePath, 'Feature: Login\n');
            const { exitCodes, stdout } = await runCli(['bdd', 'add', '1', '--file', filePath, '--dry-run']);
            expect(exitCodes).toContain(0);
            expect(stdout).toContain('"dryRun"');
            expect(stdout).toContain('"size"');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('add exits 1 when --file is missing', async () => {
            const { exitCodes, stderr } = await runCli(['bdd', 'add', '1']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('--file');
        });
    });

    // ── Destructive single-entity deletes (subprocess smoke) ──────────────────
    //
    // One subprocess case per action verifies the locked-in --yes gate and
    // that the URL ends up at the expected endpoint. Soft-mode + dry-run
    // semantics are covered exhaustively by tests/cli-write-handlers.test.ts
    // — these subprocess cases lock the wiring between argv → dispatch →
    // handler → client (the layer the handler tests can't reach).

    describe('case delete (destructive)', () => {
        it('rejects without --yes', async () => {
            const { exitCodes, stderr } = await runCli(['case', 'delete', '42']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('with --yes POSTs to delete_case/{id}', async () => {
            const { exitCodes } = await runCli(['case', 'delete', '42', '--yes'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_case/42');
            expect(url).not.toContain('soft=');
        });

        it('with --soft --yes adds soft=1 to the URL', async () => {
            const { exitCodes, stdout } = await runCli(
                ['case', 'delete', '42', '--soft', '--yes'],
                [jsonResponse({ affected_tests: 3 })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('soft=1');
            expect(stdout).toContain('"preview"');
        });
    });

    describe('run delete (destructive)', () => {
        it('rejects without --yes', async () => {
            const { exitCodes, stderr } = await runCli(['run', 'delete', '17']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('with --yes POSTs to delete_run/{id}', async () => {
            const { exitCodes } = await runCli(['run', 'delete', '17', '--yes'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_run/17');
            expect(url).not.toContain('soft=');
        });

        it('with --soft --yes adds soft=1', async () => {
            const { exitCodes } = await runCli(
                ['run', 'delete', '17', '--soft', '--yes'],
                [jsonResponse({ affected_tests: 5 })],
            );
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('soft=1');
        });
    });

    describe('suite delete (destructive)', () => {
        it('rejects without --yes', async () => {
            const { exitCodes, stderr } = await runCli(['suite', 'delete', '5']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('with --yes POSTs to delete_suite/{id}', async () => {
            const { exitCodes } = await runCli(['suite', 'delete', '5', '--yes'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_suite/5');
        });
    });

    describe('section delete (destructive)', () => {
        it('rejects without --yes', async () => {
            const { exitCodes, stderr } = await runCli(['section', 'delete', '9']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('with --yes POSTs to delete_section/{id}', async () => {
            const { exitCodes } = await runCli(['section', 'delete', '9', '--yes'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_section/9');
        });
    });

    describe('milestone delete (destructive; --soft NOT supported)', () => {
        it('rejects without --yes', async () => {
            const { exitCodes, stderr } = await runCli(['milestone', 'delete', '3']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('with --yes POSTs to delete_milestone/{id}', async () => {
            const { exitCodes } = await runCli(['milestone', 'delete', '3', '--yes'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_milestone/3');
        });

        it('rejects --soft (TestRail does not support soft on delete_milestone)', async () => {
            const { exitCodes, stderr } = await runCli(['milestone', 'delete', '3', '--soft', '--yes']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/milestone delete does not support --soft/);
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('project delete (destructive; highest blast radius; --soft NOT supported)', () => {
        it('rejects without --yes', async () => {
            const { exitCodes, stderr } = await runCli(['project', 'delete', '1']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/--yes to confirm/);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('with --yes POSTs to delete_project/{id}', async () => {
            const { exitCodes } = await runCli(['project', 'delete', '1', '--yes'], [jsonResponse({})]);
            expect(exitCodes).toContain(0);
            const url = mockFetch.mock.calls.at(-1)?.[0] as string;
            expect(url).toContain('delete_project/1');
        });

        it('rejects --soft (TestRail does not support soft on delete_project)', async () => {
            const { exitCodes, stderr } = await runCli(['project', 'delete', '1', '--soft', '--yes']);
            expect(exitCodes).toContain(1);
            expect(stderr).toMatch(/project delete does not support --soft/);
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });
});
