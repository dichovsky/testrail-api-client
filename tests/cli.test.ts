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

    describe('run close', () => {
        it('POSTs without a body', async () => {
            const { exitCodes } = await runCli(
                ['run', 'close', '10'],
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
});
