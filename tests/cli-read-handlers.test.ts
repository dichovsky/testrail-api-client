/**
 * Unit tests for read handlers in src/cli/handlers/*.ts.
 *
 * Each handler is tested in isolation with a mocked TestRailClient (no
 * subprocess, no real HTTP). Coverage per handler:
 *   - happy path: valid path params + (optional) flags → client method
 *     called with the exact expected args; the result is emitted to `out`
 *   - missing required positional → IdParseError thrown before any
 *     client call (caught by main() and translated to exit 1)
 *   - invalid path-param ids (0, -1, 1.5, abc, '', 1e2, 0x1) → IdParseError
 *   - filter-flag handlers (result list-for-test/-case): comma-separated
 *     `--status-id` parsing, `--defects-filter` verbatim forwarding,
 *     malformed-list rejection
 *
 * Read handlers do not consume a body, so the body-source / dry-run paths
 * exercised by `cli-write-handlers.test.ts` are intentionally out of scope.
 */
import { describe, it, expect, vi } from 'vitest';
import { handleSectionGet, handleSectionList } from '../src/cli/handlers/section.js';
import { handleTestGet, handleTestList } from '../src/cli/handlers/test.js';
import { handleResultListForCase, handleResultListForTest } from '../src/cli/handlers/result.js';
import { handleReportList, handleReportRun } from '../src/cli/handlers/report.js';
import { handleCaseFieldList } from '../src/cli/handlers/case-field.js';
import { handleCaseStatusList } from '../src/cli/handlers/case-status.js';
import { handleResultFieldList } from '../src/cli/handlers/result-field.js';
import { handleStatusList } from '../src/cli/handlers/status.js';
import { handleTemplateList } from '../src/cli/handlers/template.js';
import { handleRoleList } from '../src/cli/handlers/role.js';
import { handlePriorityList } from '../src/cli/handlers/priority.js';
import { handleCaseTypeList } from '../src/cli/handlers/case-type.js';
import { handleVariableList } from '../src/cli/handlers/variable.js';
import { handleConfigurationList } from '../src/cli/handlers/configuration.js';
import { IdParseError } from '../src/cli/ids.js';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';

interface MockedClient {
    getSection: ReturnType<typeof vi.fn>;
    getSections: ReturnType<typeof vi.fn>;
    getTest: ReturnType<typeof vi.fn>;
    getTests: ReturnType<typeof vi.fn>;
    getResults: ReturnType<typeof vi.fn>;
    getResultsForCase: ReturnType<typeof vi.fn>;
    getReports: ReturnType<typeof vi.fn>;
    runReport: ReturnType<typeof vi.fn>;
    getCaseFields: ReturnType<typeof vi.fn>;
    getCaseStatuses: ReturnType<typeof vi.fn>;
    getResultFields: ReturnType<typeof vi.fn>;
    getStatuses: ReturnType<typeof vi.fn>;
    getTemplates: ReturnType<typeof vi.fn>;
    getVariables: ReturnType<typeof vi.fn>;
    getConfigurations: ReturnType<typeof vi.fn>;
    getRoles: ReturnType<typeof vi.fn>;
    getPriorities: ReturnType<typeof vi.fn>;
    getCaseTypes: ReturnType<typeof vi.fn>;
}

function buildClient(): MockedClient {
    return {
        getSection: vi.fn().mockResolvedValue({
            id: 1,
            suite_id: 1,
            name: 'Sec',
            display_order: 1,
            depth: 0,
        }),
        getSections: vi.fn().mockResolvedValue([{ id: 1, suite_id: 1, name: 'Sec', display_order: 1, depth: 0 }]),
        getTest: vi.fn().mockResolvedValue({ id: 100, case_id: 1, status_id: 1, run_id: 1, title: 't' }),
        getTests: vi.fn().mockResolvedValue([{ id: 100, case_id: 1, status_id: 1, run_id: 1, title: 't' }]),
        getResults: vi.fn().mockResolvedValue([{ id: 1, test_id: 4242, status_id: 1 }]),
        getResultsForCase: vi.fn().mockResolvedValue([{ id: 7, test_id: 99, status_id: 5 }]),
        getReports: vi
            .fn()
            .mockResolvedValue([{ id: 11, name: 'Coverage Report', description: 'desc', is_shared: true }]),
        runReport: vi.fn().mockResolvedValue({
            report_url: 'https://example.testrail.io/reports/view/11',
            user_report_url: 'https://example.testrail.io/reports/user/11',
        }),
        getCaseFields: vi.fn().mockResolvedValue([
            {
                id: 1,
                system_name: 'custom_steps',
                label: 'Steps',
                name: 'steps',
                type_id: 6,
                display_order: 1,
                configs: [],
                is_active: true,
                include_all: true,
                template_ids: [],
            },
        ]),
        getResultFields: vi.fn().mockResolvedValue([
            {
                id: 5,
                system_name: 'custom_step_results',
                label: 'Steps',
                name: 'step_results',
                type_id: 11,
                display_order: 1,
                configs: [],
                is_active: true,
                include_all: true,
                template_ids: [],
            },
        ]),
        getStatuses: vi.fn().mockResolvedValue([
            {
                id: 1,
                name: 'passed',
                label: 'Passed',
                color_dark: 1,
                color_medium: 1,
                color_bright: 1,
                is_system: true,
            },
        ]),
        getCaseStatuses: vi.fn().mockResolvedValue([
            {
                case_status_id: 1,
                name: 'Approved',
                abbreviation: 'APP',
                is_default: true,
                is_approved: true,
                is_untested: false,
            },
        ]),
        getTemplates: vi.fn().mockResolvedValue([{ id: 1, name: 'Test Case (Text)', is_default: true }]),
        getVariables: vi.fn().mockResolvedValue([
            { id: 1, name: 'env' },
            { id: 2, name: 'region' },
        ]),
        getConfigurations: vi.fn().mockResolvedValue([
            {
                id: 55,
                name: 'Browsers',
                project_id: 7,
                configs: [
                    { id: 66, name: 'Chrome', group_id: 55 },
                    { id: 67, name: 'Firefox', group_id: 55 },
                ],
            },
        ]),
        getRoles: vi.fn().mockResolvedValue([
            { id: 1, name: 'Lead', is_default: true },
            { id: 2, name: 'Tester', is_default: false },
        ]),
        getPriorities: vi.fn().mockResolvedValue([
            { id: 1, name: 'Low', short_name: 'Low', is_default: false, priority: 1 },
            { id: 4, name: 'Must Test', short_name: 'Must', is_default: true, priority: 4 },
        ]),
        getCaseTypes: vi.fn().mockResolvedValue([
            { id: 1, name: 'Automated', is_default: false },
            { id: 7, name: 'Functional', is_default: true },
        ]),
    };
}

interface CtxOverrides {
    pathParams?: string[];
    suiteId?: string;
    limit?: string;
    offset?: string;
    statusId?: string;
    defectsFilter?: string;
}

function buildCtx(
    client: MockedClient,
    overrides: CtxOverrides = {},
): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const ctx: HandlerContext = {
        client: client as unknown as TestRailClient,
        args: {
            pathParams: overrides.pathParams ?? [],
            ...(overrides.suiteId !== undefined && { suiteId: overrides.suiteId }),
            ...(overrides.limit !== undefined && { limit: overrides.limit }),
            ...(overrides.offset !== undefined && { offset: overrides.offset }),
            ...(overrides.statusId !== undefined && { statusId: overrides.statusId }),
            ...(overrides.defectsFilter !== undefined && { defectsFilter: overrides.defectsFilter }),
        },
        bodyInput: {},
        dryRun: false,
        force: false,
        confirmDestructive: false,
        out,
    };
    return { ctx, out };
}

// IDs that must be rejected by parseId() — the read handlers MUST refuse
// these before any client call leaves the process. "1e2" / "0x1" trip the
// positive-integer regex gate (POSITIVE_INT_RE in src/cli/ids.ts) before
// Number() is called; they would otherwise round-trip through Number()
// cleanly.
const INVALID_IDS: readonly string[] = ['0', '-1', '1.5', 'abc', '', '1e2', '0x1'];

// ── handleSectionGet ──────────────────────────────────────────────────────

describe('handleSectionGet', () => {
    it('calls client.getSection with the parsed id and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'] });
        await handleSectionGet(ctx);
        expect(client.getSection).toHaveBeenCalledTimes(1);
        expect(client.getSection).toHaveBeenCalledWith(7);
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Sec' }));
    });

    it.each([
        ['missing id', undefined],
        ['empty id', ''],
        ['non-integer id', 'abc'],
        ['zero', '0'],
        ['negative', '-1'],
        ['float', '1.5'],
        ['scientific notation', '1e2'],
        ['hex', '0x1'],
    ])('rejects %s before any client call', async (_label, raw) => {
        const client = buildClient();
        const pathParams = raw === undefined ? [] : [raw];
        const { ctx } = buildCtx(client, { pathParams });
        await expect(handleSectionGet(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getSection).not.toHaveBeenCalled();
    });
});

// ── handleSectionList ─────────────────────────────────────────────────────

describe('handleSectionList', () => {
    it('calls client.getSections with the parsed project id and no options when none are provided', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'] });
        await handleSectionList(ctx);
        expect(client.getSections).toHaveBeenCalledTimes(1);
        expect(client.getSections).toHaveBeenCalledWith(3, {});
        expect(out).toHaveBeenCalledTimes(1);
    });

    it('passes parsed --suite-id through to client.getSections', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], suiteId: '9' });
        await handleSectionList(ctx);
        expect(client.getSections).toHaveBeenCalledWith(3, { suiteId: 9 });
    });

    it('passes parsed --limit and --offset through to client.getSections', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], limit: '5', offset: '10' });
        await handleSectionList(ctx);
        expect(client.getSections).toHaveBeenCalledWith(3, { limit: 5, offset: 10 });
    });

    it('combines --suite-id and pagination into one options object', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], suiteId: '9', limit: '5', offset: '10' });
        await handleSectionList(ctx);
        expect(client.getSections).toHaveBeenCalledWith(3, { suiteId: 9, limit: 5, offset: 10 });
    });

    it.each([
        ['missing project_id', undefined],
        ['empty project_id', ''],
        ['non-integer project_id', 'abc'],
        ['zero', '0'],
        ['negative', '-1'],
        ['float', '1.5'],
        ['scientific notation', '1e2'],
        ['hex', '0x1'],
    ])('rejects %s before any client call', async (_label, raw) => {
        const client = buildClient();
        const pathParams = raw === undefined ? [] : [raw];
        const { ctx } = buildCtx(client, { pathParams });
        await expect(handleSectionList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getSections).not.toHaveBeenCalled();
    });

    it('rejects non-integer --suite-id before calling the client', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], suiteId: 'abc' });
        await expect(handleSectionList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getSections).not.toHaveBeenCalled();
    });

    it('rejects --suite-id=0 (positive-integer gate)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], suiteId: '0' });
        await expect(handleSectionList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getSections).not.toHaveBeenCalled();
    });
});

// ── handleTestGet ─────────────────────────────────────────────────────────

describe('handleTestGet', () => {
    it('calls client.getTest with the parsed positive-integer id and emits the response', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['100'] });
        await handleTestGet(ctx);
        expect(client.getTest).toHaveBeenCalledTimes(1);
        expect(client.getTest).toHaveBeenCalledWith(100);
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ id: 100 }));
    });

    it.each([
        ['missing', undefined],
        ['empty', ''],
        ['zero', '0'],
        ['negative', '-5'],
        ['float', '1.5'],
        ['alpha', 'abc'],
    ])('rejects %s test id without calling the client', async (_label, raw) => {
        const client = buildClient();
        const { ctx } = buildCtx(client, raw === undefined ? {} : { pathParams: [raw] });
        await expect(handleTestGet(ctx)).rejects.toThrow(/positive integer/);
        expect(client.getTest).not.toHaveBeenCalled();
    });
});

// ── handleTestList ────────────────────────────────────────────────────────

describe('handleTestList', () => {
    it('calls client.getTests with no options when only run_id is given', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'] });
        await handleTestList(ctx);
        expect(client.getTests).toHaveBeenCalledTimes(1);
        // No keys forwarded — second arg is an empty object literal
        expect(client.getTests).toHaveBeenCalledWith(5, {});
    });

    it('forwards limit and offset as numbers (not strings)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], limit: '50', offset: '10' });
        await handleTestList(ctx);
        expect(client.getTests).toHaveBeenCalledWith(5, { limit: 50, offset: 10 });
    });

    it('parses --status-id into a number[] (single value)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], statusId: '1' });
        await handleTestList(ctx);
        expect(client.getTests).toHaveBeenCalledWith(5, { status_id: [1] });
    });

    it('parses --status-id into a number[] (multiple comma-separated values)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], statusId: '1,5,3' });
        await handleTestList(ctx);
        expect(client.getTests).toHaveBeenCalledWith(5, { status_id: [1, 5, 3] });
    });

    it('trims whitespace around comma-separated --status-id tokens', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], statusId: ' 1 , 5 ' });
        await handleTestList(ctx);
        expect(client.getTests).toHaveBeenCalledWith(5, { status_id: [1, 5] });
    });

    it('rejects malformed --status-id token without calling the client', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], statusId: '1,abc' });
        await expect(handleTestList(ctx)).rejects.toThrow(/--status-id/);
        expect(client.getTests).not.toHaveBeenCalled();
    });

    it('rejects non-positive --status-id (zero)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], statusId: '0' });
        await expect(handleTestList(ctx)).rejects.toThrow(/--status-id/);
        expect(client.getTests).not.toHaveBeenCalled();
    });

    it('combines status_id with limit and offset', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], statusId: '1,5', limit: '50', offset: '10' });
        await handleTestList(ctx);
        expect(client.getTests).toHaveBeenCalledWith(5, { status_id: [1, 5], limit: 50, offset: 10 });
    });

    it('silently drops invalid --limit / --offset (optInt fallback) without rejecting the call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], limit: 'foo', offset: 'bar' });
        await handleTestList(ctx);
        // optInt returns undefined for non-integer; handler omits both keys
        expect(client.getTests).toHaveBeenCalledWith(5, {});
    });

    it.each([
        ['missing', undefined],
        ['empty', ''],
        ['zero', '0'],
        ['negative', '-5'],
        ['float', '1.5'],
        ['alpha', 'abc'],
    ])('rejects %s run id without calling the client', async (_label, raw) => {
        const client = buildClient();
        const { ctx } = buildCtx(client, raw === undefined ? {} : { pathParams: [raw] });
        await expect(handleTestList(ctx)).rejects.toThrow(/positive integer/);
        expect(client.getTests).not.toHaveBeenCalled();
    });
});

// ── handleResultListForTest ───────────────────────────────────────────────

describe('handleResultListForTest', () => {
    it('calls client.getResults with parsed test_id and empty options when no filter flags are passed', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['4242'] });
        await handleResultListForTest(ctx);
        expect(client.getResults).toHaveBeenCalledWith(4242, {});
        expect(out).toHaveBeenCalledWith([{ id: 1, test_id: 4242, status_id: 1 }]);
    });

    it('forwards --limit and --offset as numeric option fields', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['4242'], limit: '50', offset: '100' });
        await handleResultListForTest(ctx);
        expect(client.getResults).toHaveBeenCalledWith(4242, { limit: 50, offset: 100 });
    });

    it('parses --status-id comma list into number[] under status_id key', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['4242'], statusId: '1,5,7' });
        await handleResultListForTest(ctx);
        expect(client.getResults).toHaveBeenCalledWith(4242, { status_id: [1, 5, 7] });
    });

    it('forwards --defects-filter as a verbatim string', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['4242'], defectsFilter: 'JIRA-1234' });
        await handleResultListForTest(ctx);
        expect(client.getResults).toHaveBeenCalledWith(4242, { defects_filter: 'JIRA-1234' });
    });

    it('combines all filter flags into one options bag', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['4242'],
            limit: '25',
            offset: '0',
            statusId: '1,5',
            defectsFilter: 'JIRA-9',
        });
        await handleResultListForTest(ctx);
        expect(client.getResults).toHaveBeenCalledWith(4242, {
            limit: 25,
            offset: 0,
            status_id: [1, 5],
            defects_filter: 'JIRA-9',
        });
    });

    it('rejects malformed --status-id list (non-positive token)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['4242'], statusId: '1,abc,5' });
        await expect(handleResultListForTest(ctx)).rejects.toThrow(/--status-id/);
    });

    it('rejects empty --status-id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['4242'], statusId: '' });
        await expect(handleResultListForTest(ctx)).rejects.toThrow(/--status-id/);
    });

    it('rejects --status-id with zero or negative token', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['4242'], statusId: '1,0,5' });
        await expect(handleResultListForTest(ctx)).rejects.toThrow(/--status-id/);
    });

    it.each(INVALID_IDS)('rejects test id %s', async (badId) => {
        const { ctx } = buildCtx(buildClient(), { pathParams: [badId] });
        await expect(handleResultListForTest(ctx)).rejects.toThrow(/test id/);
    });

    it('rejects missing test id (pathParams empty)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: [] });
        await expect(handleResultListForTest(ctx)).rejects.toThrow(/test id/);
    });
});

// ── handleResultListForCase ───────────────────────────────────────────────

describe('handleResultListForCase', () => {
    it('calls client.getResultsForCase with parsed run_id + case_id and empty options', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['100', '87'] });
        await handleResultListForCase(ctx);
        expect(client.getResultsForCase).toHaveBeenCalledWith(100, 87, {});
        expect(out).toHaveBeenCalledWith([{ id: 7, test_id: 99, status_id: 5 }]);
    });

    it('forwards pagination flags', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['100', '87'], limit: '10', offset: '20' });
        await handleResultListForCase(ctx);
        expect(client.getResultsForCase).toHaveBeenCalledWith(100, 87, { limit: 10, offset: 20 });
    });

    it('forwards --status-id and --defects-filter together', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['100', '87'],
            statusId: '5',
            defectsFilter: 'JIRA-7',
        });
        await handleResultListForCase(ctx);
        expect(client.getResultsForCase).toHaveBeenCalledWith(100, 87, {
            status_id: [5],
            defects_filter: 'JIRA-7',
        });
    });

    it.each(INVALID_IDS)('rejects run id %s (case id valid)', async (badId) => {
        const { ctx } = buildCtx(buildClient(), { pathParams: [badId, '87'] });
        await expect(handleResultListForCase(ctx)).rejects.toThrow(/run id/);
    });

    it.each(INVALID_IDS)('rejects case id %s (run id valid)', async (badId) => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['100', badId] });
        await expect(handleResultListForCase(ctx)).rejects.toThrow(/case id/);
    });

    it('rejects when both ids missing', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: [] });
        await expect(handleResultListForCase(ctx)).rejects.toThrow(/run id/);
    });

    it('rejects when case id is missing (only run id supplied)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['100'] });
        await expect(handleResultListForCase(ctx)).rejects.toThrow(/case id/);
    });

    it('rejects malformed --status-id even when ids are valid', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['100', '87'], statusId: '1,,5' });
        await expect(handleResultListForCase(ctx)).rejects.toThrow(/--status-id/);
    });
});

// ── handleReportList ─────────────────────────────────────────────────────

describe('handleReportList', () => {
    it('calls client.getReports with the parsed project_id and emits the result array', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'] });
        await handleReportList(ctx);
        expect(client.getReports).toHaveBeenCalledTimes(1);
        expect(client.getReports).toHaveBeenCalledWith(3);
        expect(out).toHaveBeenCalledWith([expect.objectContaining({ id: 11, name: 'Coverage Report' })]);
    });

    it.each(INVALID_IDS)('rejects project_id %s before any client call', async (badId) => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: [badId] });
        await expect(handleReportList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getReports).not.toHaveBeenCalled();
    });

    it('rejects missing project_id (pathParams empty)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: [] });
        await expect(handleReportList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getReports).not.toHaveBeenCalled();
    });
});

// ── handleReportRun ──────────────────────────────────────────────────────

describe('handleReportRun', () => {
    it('calls client.runReport with the parsed report_template_id and emits the result object', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['11'] });
        await handleReportRun(ctx);
        expect(client.runReport).toHaveBeenCalledTimes(1);
        expect(client.runReport).toHaveBeenCalledWith(11);
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                report_url: 'https://example.testrail.io/reports/view/11',
            }),
        );
    });

    it.each(INVALID_IDS)('rejects report_template_id %s before any client call', async (badId) => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: [badId] });
        await expect(handleReportRun(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.runReport).not.toHaveBeenCalled();
    });

    it('rejects missing report_template_id (pathParams empty)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: [] });
        await expect(handleReportRun(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.runReport).not.toHaveBeenCalled();
    });
});

// ── handleCaseFieldList ───────────────────────────────────────────────────
//
// `case-field list`, `case-status list`, `result-field list`, and
// `status list` share the same zero-arg shape: the endpoint takes no
// path/query params and the handler rejects extra positional args
// fail-fast (a typo like `status list 5` must surface as an error, not
// a silent ignore of the `5`). All four reject with `IdParseError` for
// parity with the rest of the CLI's arg-parse failures, so `main()` exits
// 1 through the same code path. `case-status list` was retroactively
// tightened to match — the previous two-tier behaviour where it silently
// ignored extras is no longer present.

describe('handleCaseFieldList', () => {
    it('calls client.getCaseFields with no args and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client);
        await handleCaseFieldList(ctx);
        expect(client.getCaseFields).toHaveBeenCalledTimes(1);
        expect(client.getCaseFields).toHaveBeenCalledWith();
        expect(out).toHaveBeenCalledWith([expect.objectContaining({ id: 1, system_name: 'custom_steps' })]);
    });

    it('rejects extra positional args before any client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'] });
        await expect(handleCaseFieldList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleCaseFieldList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getCaseFields).not.toHaveBeenCalled();
    });

    it('rejects multiple extra positional args', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['1', '2', '3'] });
        await expect(handleCaseFieldList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleCaseFieldList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getCaseFields).not.toHaveBeenCalled();
    });
});

// ── handleCaseStatusList ──────────────────────────────────────────────────

describe('handleCaseStatusList', () => {
    it('calls client.getCaseStatuses with no args and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client);
        await handleCaseStatusList(ctx);
        expect(client.getCaseStatuses).toHaveBeenCalledTimes(1);
        expect(client.getCaseStatuses).toHaveBeenCalledWith();
        expect(out).toHaveBeenCalledWith([expect.objectContaining({ case_status_id: 1, name: 'Approved' })]);
    });

    it('rejects extra positional args before any client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'] });
        await expect(handleCaseStatusList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleCaseStatusList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getCaseStatuses).not.toHaveBeenCalled();
    });

    it('rejects multiple extra positional args', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['1', '2', '3'] });
        await expect(handleCaseStatusList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleCaseStatusList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getCaseStatuses).not.toHaveBeenCalled();
    });
});

// ── handleResultFieldList ─────────────────────────────────────────────────

describe('handleResultFieldList', () => {
    it('calls client.getResultFields with no args and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client);
        await handleResultFieldList(ctx);
        expect(client.getResultFields).toHaveBeenCalledTimes(1);
        expect(client.getResultFields).toHaveBeenCalledWith();
        expect(out).toHaveBeenCalledWith([expect.objectContaining({ id: 5, system_name: 'custom_step_results' })]);
    });

    it('rejects extra positional args before any client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['7'] });
        await expect(handleResultFieldList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleResultFieldList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getResultFields).not.toHaveBeenCalled();
    });
});

// ── handleStatusList ──────────────────────────────────────────────────────

describe('handleStatusList', () => {
    it('calls client.getStatuses with no args and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client);
        await handleStatusList(ctx);
        expect(client.getStatuses).toHaveBeenCalledTimes(1);
        expect(client.getStatuses).toHaveBeenCalledWith();
        expect(out).toHaveBeenCalledWith([expect.objectContaining({ id: 1, name: 'passed' })]);
    });

    it('rejects extra positional args before any client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['1'] });
        await expect(handleStatusList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleStatusList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getStatuses).not.toHaveBeenCalled();
    });
});

// ── handleRoleList ────────────────────────────────────────────────────────
//
// `role list`, `priority list`, and `case-type list` share the same
// zero-arg shape as the other metadata read handlers (`case-field list`,
// `case-status list`, `result-field list`, `status list`). Extra positional
// args reject with `IdParseError` so a typo like `role list 5` surfaces
// instead of silently ignoring the `5`.

describe('handleRoleList', () => {
    it('calls client.getRoles with no args and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client);
        await handleRoleList(ctx);
        expect(client.getRoles).toHaveBeenCalledTimes(1);
        expect(client.getRoles).toHaveBeenCalledWith();
        expect(out).toHaveBeenCalledWith([
            expect.objectContaining({ id: 1, name: 'Lead' }),
            expect.objectContaining({ id: 2, name: 'Tester' }),
        ]);
    });

    it('rejects extra positional args before any client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'] });
        await expect(handleRoleList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleRoleList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getRoles).not.toHaveBeenCalled();
    });

    it('rejects multiple extra positional args', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['1', '2', '3'] });
        await expect(handleRoleList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleRoleList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getRoles).not.toHaveBeenCalled();
    });
});

// ── handlePriorityList ────────────────────────────────────────────────────

describe('handlePriorityList', () => {
    it('calls client.getPriorities with no args and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client);
        await handlePriorityList(ctx);
        expect(client.getPriorities).toHaveBeenCalledTimes(1);
        expect(client.getPriorities).toHaveBeenCalledWith();
        expect(out).toHaveBeenCalledWith([
            expect.objectContaining({ id: 1, short_name: 'Low' }),
            expect.objectContaining({ id: 4, is_default: true }),
        ]);
    });

    it('rejects extra positional args before any client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'] });
        await expect(handlePriorityList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handlePriorityList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getPriorities).not.toHaveBeenCalled();
    });
});

// ── handleCaseTypeList ────────────────────────────────────────────────────

describe('handleCaseTypeList', () => {
    it('calls client.getCaseTypes with no args and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client);
        await handleCaseTypeList(ctx);
        expect(client.getCaseTypes).toHaveBeenCalledTimes(1);
        expect(client.getCaseTypes).toHaveBeenCalledWith();
        expect(out).toHaveBeenCalledWith([
            expect.objectContaining({ id: 1, name: 'Automated' }),
            expect.objectContaining({ id: 7, is_default: true }),
        ]);
    });

    it('rejects extra positional args before any client call', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'] });
        await expect(handleCaseTypeList(ctx)).rejects.toBeInstanceOf(IdParseError);
        await expect(handleCaseTypeList(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.getCaseTypes).not.toHaveBeenCalled();
    });
});

// ── handleTemplateList ────────────────────────────────────────────────────
//
// `template list <project_id>` takes one positive-integer path param.
// parseId rejects 0, -1, 1.5, abc, '', 1e2, 0x1 (the full INVALID_IDS set)
// before any client call leaves the process.

describe('handleTemplateList', () => {
    it('calls client.getTemplates with the parsed project_id and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'] });
        await handleTemplateList(ctx);
        expect(client.getTemplates).toHaveBeenCalledTimes(1);
        expect(client.getTemplates).toHaveBeenCalledWith(3);
        expect(out).toHaveBeenCalledWith([expect.objectContaining({ id: 1, name: 'Test Case (Text)' })]);
    });

    it('rejects missing project_id without calling the client', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: [] });
        await expect(handleTemplateList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getTemplates).not.toHaveBeenCalled();
    });

    it.each(INVALID_IDS)('rejects project_id %s before calling the client', async (raw) => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: [raw] });
        await expect(handleTemplateList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getTemplates).not.toHaveBeenCalled();
    });
});

// ── handleVariableList ────────────────────────────────────────────────────

describe('handleVariableList', () => {
    it('calls client.getVariables with the parsed project id and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'] });
        await handleVariableList(ctx);
        expect(client.getVariables).toHaveBeenCalledTimes(1);
        expect(client.getVariables).toHaveBeenCalledWith(3);
        expect(out).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 1, name: 'env' })]));
    });

    it.each([
        ['missing project_id', undefined],
        ['empty project_id', ''],
        ['non-integer project_id', 'abc'],
        ['zero', '0'],
        ['negative', '-1'],
        ['float', '1.5'],
        ['scientific notation', '1e2'],
        ['hex', '0x1'],
    ])('rejects %s before any client call', async (_label, raw) => {
        const client = buildClient();
        const pathParams = raw === undefined ? [] : [raw];
        const { ctx } = buildCtx(client, { pathParams });
        await expect(handleVariableList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getVariables).not.toHaveBeenCalled();
    });
});

// ── handleConfigurationList ───────────────────────────────────────────────

describe('handleConfigurationList', () => {
    it('calls client.getConfigurations with the parsed project id and emits the full tree', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'] });
        await handleConfigurationList(ctx);
        expect(client.getConfigurations).toHaveBeenCalledTimes(1);
        expect(client.getConfigurations).toHaveBeenCalledWith(7);
        // The full ConfigurationGroup[] tree (with nested configs[]) must be
        // emitted verbatim — there's no client-side filtering.
        expect(out).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 55,
                    name: 'Browsers',
                    configs: expect.arrayContaining([expect.objectContaining({ name: 'Chrome' })]) as unknown,
                }),
            ]),
        );
    });

    it.each(INVALID_IDS.map((id) => [id]))('rejects invalid project_id %p before any client call', async (raw) => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: [raw] });
        await expect(handleConfigurationList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getConfigurations).not.toHaveBeenCalled();
    });

    it('rejects missing project_id (no positional arg)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: [] });
        await expect(handleConfigurationList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getConfigurations).not.toHaveBeenCalled();
    });
});
