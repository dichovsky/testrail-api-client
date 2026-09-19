import { TestRailClient } from '../src/client.js';
import type { ActionSpec } from '../src/cli/metadata/types.js';
import { createOutput, type Output, type OutputFormat } from '../src/cli/output.js';
import type { TestRailConfig } from '../src/types.js';

/**
 * A complete `ActionSpec` for a handler test.
 *
 * `HandlerContext.actionSpec` carries the whole spec, but a handler test only
 * ever cares about `resource` / `action` / `softMode`; the remaining fields
 * exist for the dispatcher, the help emitter, and the mapping drift gates, none
 * of which run here. `handler` is never invoked — a handler under test is
 * called directly rather than dispatched to.
 */
export function makeActionSpec(overrides: Partial<ActionSpec> & Pick<ActionSpec, 'resource' | 'action'>): ActionSpec {
    return {
        summary: `${overrides.resource} ${overrides.action}`,
        pathParams: [],
        handler: () => Promise.resolve(),
        apiEndpoint: `GET ${overrides.resource}`,
        isWrite: false,
        ...overrides,
    };
}

export interface CapturedOutput {
    /** Spread into a `HandlerContext` literal; override `out` to assert on a mock. */
    readonly output: Output;
    /** Everything written to stdout, in order. Bytes are captured as binary-encoded text. */
    readonly stdout: string[];
    /** Everything written to stderr, in order. */
    readonly stderr: string[];
}

/**
 * A real `Output` whose writers collect instead of reaching a terminal.
 *
 * Every `HandlerContext` needs the full writer set now that those fields are
 * non-optional (ARCH #13), and building it from `createOutput` rather than from
 * four bare `vi.fn()`s means a test exercises the same `--quiet` gating,
 * `Error:` prefixing, and sanitization that production does.
 */
export function captureOutput(
    opts: { quiet?: boolean; format?: OutputFormat; stdoutIsTTY?: boolean } = {},
): CapturedOutput {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const output = createOutput({
        quiet: opts.quiet ?? false,
        format: opts.format ?? 'json',
        stdoutIsTTY: opts.stdoutIsTTY ?? false,
        stdout: (chunk) => void stdout.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('binary')),
        stderr: (chunk) => void stderr.push(chunk),
    });
    return { output, stdout, stderr };
}

// Standard test client config
export const BASE_CONFIG: TestRailConfig = {
    baseUrl: 'https://example.testrail.io',
    email: 'test@example.com',
    apiKey: 'test-api-key',
    // Most unit suites replace fetch and are not testing the SSRF/DNS guard.
    // Keep those tests hermetic; dedicated client-feature and SSRF suites
    // construct their own clients with explicit DNS behavior.
    allowPrivateHosts: true,
};

export function createClient(overrides: Partial<TestRailConfig> = {}): TestRailClient {
    return new TestRailClient({ ...BASE_CONFIG, ...overrides });
}

// Mock fetch response factories
export function mockOk<T>(data: T): Response {
    return new Response(JSON.stringify(data), {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function mockErr(status: number, statusText: string, body = 'Error'): Response {
    return new Response(body, {
        status,
        statusText,
    });
}

export function mockEmpty(): Response {
    return new Response('', {
        status: 200,
        statusText: 'OK',
    });
}

// Shared minimal mock data
export const MOCK_PROJECT = {
    id: 1,
    name: 'Test Project',
    suite_mode: 1,
    url: 'https://example.testrail.io/projects/view/1',
};

export const MOCK_CASE = {
    id: 1,
    title: 'Test Case',
    section_id: 1,
    created_by: 1,
    created_on: 1234567890,
    updated_by: 1,
    updated_on: 1234567890,
    suite_id: 1,
};

export const MOCK_SUITE = {
    id: 1,
    name: 'Test Suite',
    project_id: 1,
    url: 'https://example.testrail.io/suites/view/1',
};

export const MOCK_RUN = {
    id: 1,
    suite_id: 1,
    name: 'Test Run',
    include_all: true,
    is_completed: false,
    passed_count: 0,
    blocked_count: 0,
    untested_count: 0,
    retest_count: 0,
    failed_count: 0,
    project_id: 1,
    created_on: 1234567890,
    created_by: 1,
    url: 'https://example.testrail.io/runs/view/1',
};

export const MOCK_PLAN = {
    id: 1,
    name: 'Test Plan',
    is_completed: false,
    passed_count: 0,
    blocked_count: 0,
    untested_count: 0,
    retest_count: 0,
    failed_count: 0,
    project_id: 1,
    created_on: 1234567890,
    created_by: 1,
    url: 'https://example.testrail.io/plans/view/1',
};

export const MOCK_USER = {
    id: 1,
    name: 'Test User',
    email: 'user@example.com',
    is_active: true,
};

export const MOCK_RESULT = {
    id: 1,
    test_id: 1,
    status_id: 1,
    created_by: 1,
    created_on: 1234567890,
};

export const MOCK_MILESTONE = {
    id: 1,
    name: 'Test Milestone',
    is_completed: false,
    project_id: 1,
    url: 'https://example.testrail.io/milestones/view/1',
};
