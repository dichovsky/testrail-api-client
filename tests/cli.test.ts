/**
 * CLI test suite for src/cli.ts.
 *
 * Strategy:
 * - vi.resetModules() before each dynamic import gives every test a fresh CLI module.
 * - global.fetch is mocked so network calls never leave the process.
 * - process.exit is spied on (no-throw) so both sync and async exit paths complete;
 *   assertions use exitCodes[0] as the primary exit code.
 * - process.stdout/stderr.write are captured for output assertions.
 * - Credentials come from AUTH_ENV so the real TestRailClient config-validation passes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
const MOCK_USER = { id: 1, name: 'Alice', email: 'alice@example.com', is_active: true };

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
 */
async function runCli(
    argv: string[],
    fetchResponses: Response[] = [],
    env: Record<string, string | undefined> = AUTH_ENV,
): Promise<CliResult> {
    vi.resetModules();
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Not found' }, 404));

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
    const spyExit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        exitCodes.push(code ?? 0);
    }) as never);

    try {
        await import('../src/cli.js');
        // Allow run().then()/.catch() to settle
        await new Promise<void>((resolve) => setTimeout(resolve, 30));
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

    // ── Auth resolution ──────────────────────────────────────────────────────

    describe('auth resolution', () => {
        it('should exit 1 and report missing auth when env vars absent', async () => {
            const { stderr, exitCodes } = await runCli(['project', 'get', '1'], [], {});
            expect(exitCodes).toContain(1);
            expect(stderr).toContain('Missing auth');
        });

        it('should accept credentials from --base-url / --email / --api-key flags', async () => {
            const resp = jsonResponse(MOCK_PROJECT);
            const { exitCodes } = await runCli(
                [
                    '--base-url',
                    'https://example.testrail.io',
                    '--email',
                    'test@example.com',
                    '--api-key',
                    'test-api-key',
                    'project',
                    'get',
                    '1',
                ],
                [resp],
                {}, // No env vars — credentials come from flags
            );
            expect(exitCodes).toContain(0);
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
            const { stderr, exitCodes } = await runCli(['project', 'delete', '1']);
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

        it('run unknown action should exit 1', async () => {
            const { exitCodes } = await runCli(['run', 'close', '1']);
            expect(exitCodes).toContain(1);
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

    // ── unknown resource ──────────────────────────────────────────────────────

    describe('unknown resource', () => {
        it('should exit 1 and print error for unknown resource', async () => {
            const { stderr, exitCodes } = await runCli(['webhook', 'list']);
            expect(exitCodes).toContain(1);
            expect(stderr).toContain("Unknown resource 'webhook'");
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
            expect(stdout).toMatch(/^2\s+\|\s+$/m);
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
});
