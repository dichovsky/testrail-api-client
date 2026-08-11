/**
 * Black-box regression coverage for CLI response-schema controls.
 *
 * The CLI module owns process argv/env/output and invokes main() at import
 * time, so this suite exercises the public command surface in-process while
 * replacing only DNS and fetch. Assertions intentionally inspect stderr and
 * stdout rather than importing response-warning helpers.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const originalFetch = globalThis.fetch;
const originalArgv = process.argv.slice();
const originalMaxListeners = process.getMaxListeners();
const originalIsTTY = process.stdin.isTTY;

const MANAGED_ENV_KEYS = [
    'TESTRAIL_BASE_URL',
    'TESTRAIL_EMAIL',
    'TESTRAIL_API_KEY',
    'TESTRAIL_STRICT_RESPONSES',
] as const;

const originalEnv = Object.fromEntries(MANAGED_ENV_KEYS.map((key) => [key, process.env[key]])) as Record<
    (typeof MANAGED_ENV_KEYS)[number],
    string | undefined
>;

const AUTH_ENV = {
    TESTRAIL_BASE_URL: 'https://example.testrail.io',
    TESTRAIL_EMAIL: 'cli-test@example.invalid',
    TESTRAIL_API_KEY: 'test-only-api-key',
} as const;

const mockFetch = vi.fn();

vi.mock('node:dns/promises', () => ({
    lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));

interface CliResult {
    readonly stdout: string;
    readonly stderr: string;
    readonly exitCodes: readonly number[];
}

function jsonResponse(data: unknown): Response {
    return new Response(JSON.stringify(data), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
    });
}

function replaceManagedEnv(env: Readonly<Record<string, string | undefined>>): void {
    for (const key of MANAGED_ENV_KEYS) delete process.env[key];
    for (const [key, value] of Object.entries(env)) {
        if (value !== undefined) process.env[key] = value;
    }
}

function envWithStrict(value: string | undefined): Record<string, string | undefined> {
    return { ...AUTH_ENV, TESTRAIL_STRICT_RESPONSES: value };
}

async function runCli(
    argv: readonly string[],
    fetchResponses: readonly Response[] = [],
    env: Readonly<Record<string, string | undefined>> = AUTH_ENV,
): Promise<CliResult> {
    vi.resetModules();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(jsonResponse({ error: 'unexpected request' }));
    for (const response of fetchResponses) mockFetch.mockResolvedValueOnce(response);

    process.argv = ['node', 'testrail', ...argv];
    replaceManagedEnv(env);

    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    const exitCodes: number[] = [];
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        stdoutChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
        return true;
    });
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
        stderrChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
        return true;
    });

    let resolveExit!: () => void;
    const exited = new Promise<void>((resolve) => {
        resolveExit = resolve;
    });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        exitCodes.push(code ?? 0);
        resolveExit();
    }) as never);

    try {
        await import('../src/cli.js');
        await Promise.race([
            exited,
            new Promise<never>((_resolve, reject) => {
                setTimeout(() => reject(new Error('CLI did not exit within 5 seconds')), 5_000).unref();
            }),
        ]);
    } finally {
        stdoutSpy.mockRestore();
        stderrSpy.mockRestore();
        exitSpy.mockRestore();
    }

    return {
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
        exitCodes,
    };
}

function project(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
    return {
        id: 1,
        name: 'Project',
        suite_mode: 1,
        url: 'https://example.testrail.io/projects/view/1',
        ...overrides,
    };
}

function projectPage(
    item: Readonly<Record<string, unknown>>,
    offset: number,
    next: string | null,
): Record<string, unknown> {
    return {
        offset,
        limit: 1,
        size: 1,
        _links: {
            next,
            prev: offset === 0 ? null : '/api/v2/get_projects?limit=1&offset=0',
        },
        projects: [item],
    };
}

const DRIFTED_USER = {
    id: 'RAW_ENTITY_ID_DO_NOT_LOG',
    name: 42,
    email: 99,
    is_active: 'RAW_STATUS_DO_NOT_LOG',
    secret_payload: 'RAW_RESPONSE_SECRET_DO_NOT_LOG',
} as const;

const EMAIL_QUERY_MARKER = 'query-target-do-not-log@example.invalid';

beforeAll(() => {
    // Every fresh CLI module opts into process lifecycle handlers. The test
    // worker is short-lived, but repeated imports would otherwise emit a
    // MaxListenersExceededWarning unrelated to the behavior under test.
    process.setMaxListeners(0);
    globalThis.fetch = mockFetch;
});

beforeEach(() => {
    process.stdin.isTTY = true;
});

afterEach(() => {
    process.argv = originalArgv;
    replaceManagedEnv(originalEnv);
    (process.stdin as { isTTY?: boolean }).isTTY = originalIsTTY;
    vi.restoreAllMocks();
});

afterAll(() => {
    globalThis.fetch = originalFetch;
    process.setMaxListeners(originalMaxListeners);
});

describe('CLI response-schema controls', () => {
    it('warns by default with method, command, codes, and paths but no response or request data', async () => {
        const result = await runCli(
            ['user', 'get-by-email', '--email', EMAIL_QUERY_MARKER],
            [jsonResponse(DRIFTED_USER)],
        );

        expect(result.exitCodes[0]).toBe(0);
        expect(JSON.parse(result.stdout)).toEqual(DRIFTED_USER);
        expect(result.stderr).toContain(
            'Warning: response schema mismatch: method=GET command=user:get-by-email code=invalid_type path=$.*',
        );
        expect(result.stderr.match(/Warning: response schema mismatch:/g)).toHaveLength(1);
        expect(result.stderr).not.toMatch(/path=\$\.(?:id|name|email|is_active)/);

        // Neither the raw endpoint/query nor Zod's human messages/raw values
        // belong in privacy-safe telemetry.
        expect(result.stderr).not.toContain('get_user_by_email');
        expect(result.stderr).not.toContain(EMAIL_QUERY_MARKER);
        expect(result.stderr).not.toContain('RAW_ENTITY_ID_DO_NOT_LOG');
        expect(result.stderr).not.toContain('RAW_STATUS_DO_NOT_LOG');
        expect(result.stderr).not.toContain('RAW_RESPONSE_SECRET_DO_NOT_LOG');
        expect(result.stderr).not.toContain('example.testrail.io');
        expect(result.stderr).not.toMatch(/invalid input|expected|received/i);
    });

    it.each([
        ['unset', undefined],
        ['empty', ''],
        ['zero', '0'],
    ] as const)('treats TESTRAIL_STRICT_RESPONSES=%s as advisory', async (_label, strictValue) => {
        const result = await runCli(
            ['user', 'get-by-email', '--email', EMAIL_QUERY_MARKER],
            [jsonResponse(DRIFTED_USER)],
            envWithStrict(strictValue),
        );

        expect(result.exitCodes[0]).toBe(0);
        expect(JSON.parse(result.stdout)).toEqual(DRIFTED_USER);
        expect(result.stderr).toContain('Warning: response schema mismatch:');
    });

    it('enables strict response validation when TESTRAIL_STRICT_RESPONSES is exactly 1', async () => {
        const result = await runCli(
            ['user', 'get-by-email', '--email', EMAIL_QUERY_MARKER],
            [jsonResponse(DRIFTED_USER)],
            envWithStrict('1'),
        );

        expect(result.exitCodes[0]).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).not.toContain('Warning: response schema mismatch:');
        expect(result.stderr).not.toContain(EMAIL_QUERY_MARKER);
        expect(result.stderr).not.toContain('RAW_RESPONSE_SECRET_DO_NOT_LOG');
    });

    it('lets --strict-responses opt in even when the environment explicitly selects advisory mode', async () => {
        const result = await runCli(
            ['user', 'get-by-email', '--email', EMAIL_QUERY_MARKER, '--strict-responses'],
            [jsonResponse(DRIFTED_USER)],
            envWithStrict('0'),
        );

        expect(result.exitCodes[0]).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).not.toContain('Warning: response schema mismatch:');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it.each(['true', '2', ' ', '01', ' 1'])(
        "rejects invalid TESTRAIL_STRICT_RESPONSES value '%s' before auth or network access",
        async (strictValue) => {
            const result = await runCli(['project', 'list'], [], {
                TESTRAIL_STRICT_RESPONSES: strictValue,
            });

            expect(result.exitCodes[0]).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain("TESTRAIL_STRICT_RESPONSES must be exactly '1', '0', or empty/unset.");
            expect(result.stderr).not.toContain('Missing auth');
            expect(mockFetch).not.toHaveBeenCalled();
        },
    );

    it('does not let --strict-responses bypass an invalid environment value', async () => {
        const result = await runCli(['project', 'list', '--strict-responses'], [], {
            TESTRAIL_STRICT_RESPONSES: 'true',
        });

        expect(result.exitCodes[0]).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain("TESTRAIL_STRICT_RESPONSES must be exactly '1', '0', or empty/unset.");
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it.each(['true', 'false', '1', '0'])(
        'rejects --strict-responses=%s instead of silently selecting advisory mode',
        async (flagValue) => {
            const result = await runCli([`--strict-responses=${flagValue}`, 'project', 'list'], [], {});

            expect(result.exitCodes[0]).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('--strict-responses does not take a value; pass the flag without `=`.');
            expect(result.stderr).not.toContain('Missing auth');
            expect(mockFetch).not.toHaveBeenCalled();
        },
    );

    it('suppresses advisory warnings and normal output under --quiet', async () => {
        const result = await runCli(
            ['user', 'get-by-email', '--email', EMAIL_QUERY_MARKER, '--quiet'],
            [jsonResponse(DRIFTED_USER)],
        );

        expect(result.exitCodes[0]).toBe(0);
        expect(result.stdout).toBe('');
        expect(result.stderr).toBe('');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('keeps strict failure silent under --quiet while preserving exit code 1', async () => {
        const result = await runCli(
            ['user', 'get-by-email', '--email', EMAIL_QUERY_MARKER, '--strict-responses', '--quiet'],
            [jsonResponse(DRIFTED_USER)],
        );

        expect(result.exitCodes[0]).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toBe('');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('deduplicates same-depth sibling drift without exposing field names', async () => {
        const manyDistinctIssues = {
            id: 'private-id',
            name: 1,
            announcement: false,
            show_announcement: 'private-show',
            is_completed: 'private-complete',
            completed_on: 'private-time',
            suite_mode: 'private-mode',
            url: 2,
            default_role_id: 'private-role-id',
            default_role: 3,
            groups: 'private-groups',
            users: 'private-users',
        };
        const result = await runCli(['project', 'get', '123'], [jsonResponse(manyDistinctIssues)]);
        const warningLines = result.stderr
            .trimEnd()
            .split('\n')
            .filter((line) => line.startsWith('Warning: response schema mismatch:'));

        expect(result.exitCodes[0]).toBe(0);
        expect(JSON.parse(result.stdout)).toEqual(manyDistinctIssues);
        expect(warningLines).toHaveLength(1);
        expect(warningLines[0]).toContain('code=invalid_type path=$.*');
        expect(result.stderr).not.toContain('suppressed');
        expect(result.stderr).not.toMatch(/path=\$\.(?:id|name|announcement|suite_mode|groups|users)/);
        expect(result.stderr).not.toContain('123');
        expect(result.stderr).not.toContain('private-');
        expect(result.stderr).not.toContain('get_project');
    });

    it('returns two advisory pages, normalizes row indexes, and deduplicates their warning fingerprint', async () => {
        const first = project({ id: 101, name: 'First', suite_mode: 'RAW_MODE_FIRST' });
        const second = project({ id: 202, name: 'Second', suite_mode: 'RAW_MODE_SECOND' });
        const firstPage = projectPage(first, 0, '/api/v2/get_projects?limit=1&offset=1');
        const secondPage = projectPage(second, 1, null);
        const result = await runCli(
            ['project', 'list', '--all', '--page-size', '1'],
            [jsonResponse(firstPage), jsonResponse(secondPage)],
        );
        const normalizedWarning =
            'Warning: response schema mismatch: method=GET command=project:list code=invalid_type path=$.*.*.*';

        expect(result.exitCodes[0]).toBe(0);
        expect(JSON.parse(result.stdout)).toEqual([first, second]);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.stderr.split(normalizedWarning)).toHaveLength(2);
        expect(result.stderr).not.toContain('projects.0.suite_mode');
        expect(result.stderr).not.toContain('RAW_MODE_FIRST');
        expect(result.stderr).not.toContain('RAW_MODE_SECOND');
    });

    it.each([
        ['create', ['case', 'add-bulk', '12', '--data', '[{"title":"Example"}]', '--strict-responses']],
        ['update', ['case', 'update-bulk', '5', '--data', '{"case_ids":[1]}', '--strict-responses']],
    ] as const)('preserves an indeterminate-outcome error for strict bulk case %s', async (_label, argv) => {
        const rawMarker = 'SENSITIVE_WRITE_RESPONSE_DO_NOT_LOG';
        const result = await runCli(argv, [jsonResponse({ unexpected: rawMarker })]);

        expect(result.exitCodes[0]).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain('write outcome is indeterminate');
        expect(result.stderr).not.toContain('Schema validation failed');
        expect(result.stderr).not.toContain(rawMarker);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('fails a two-page strict aggregate without rendering the valid first page', async () => {
        const first = project({ id: 101, name: 'First' });
        const second = project({ id: 202, name: 'Second', suite_mode: 'RAW_MODE_SECOND' });
        const firstPage = projectPage(first, 0, '/api/v2/get_projects?limit=1&offset=1');
        const secondPage = projectPage(second, 1, null);
        const result = await runCli(
            ['project', 'list', '--all', '--page-size', '1', '--strict-responses'],
            [jsonResponse(firstPage), jsonResponse(secondPage)],
        );

        expect(result.exitCodes[0]).toBe(1);
        expect(result.stdout).toBe('');
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.stderr).not.toContain('Warning: response schema mismatch:');
        expect(result.stderr).not.toContain('RAW_MODE_SECOND');
    });
});
