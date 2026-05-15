/**
 * Unit tests for the write handlers in
 * src/cli/handlers/{case,result,run,plan}-write.ts.
 *
 * Each handler is tested in isolation with a mocked TestRailClient (no
 * subprocess, no real HTTP). Coverage per handler:
 *   - happy path: valid path params + body → client method called with the
 *     correct args, parsed payload emitted
 *   - dry-run: client method NOT called; emitted preview includes the
 *     parsed payload and an action label
 *   - body rejection: Zod failure surfaces as a thrown Error (caught by
 *     main() and translated to exit 1)
 *   - path-param validation: non-positive-integer ids reject before the
 *     body is even read
 *   - missing body (where applicable): "Body required" message
 *
 * Plan handlers additionally cover nested validation (entries[] / runs[]
 * inside AddPlanPayloadSchema) since that's the main schema-complexity
 * delta over the flat case/run/result payloads.
 */
import { describe, it, expect, vi } from 'vitest';
import { handleCaseAdd, handleCaseUpdate } from '../src/cli/handlers/case-write.js';
import { handleRunAdd, handleRunClose } from '../src/cli/handlers/run-write.js';
import { handleResultAdd, handleResultAddBulk, handleResultAddBulkByTest } from '../src/cli/handlers/result-write.js';
import { handlePlanAdd, handlePlanUpdate, handlePlanAddEntry } from '../src/cli/handlers/plan-write.js';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';

interface MockedClient {
    addCase: ReturnType<typeof vi.fn>;
    updateCase: ReturnType<typeof vi.fn>;
    addRun: ReturnType<typeof vi.fn>;
    closeRun: ReturnType<typeof vi.fn>;
    addResultForCase: ReturnType<typeof vi.fn>;
    addResultsForCases: ReturnType<typeof vi.fn>;
    addResults: ReturnType<typeof vi.fn>;
    addPlan: ReturnType<typeof vi.fn>;
    updatePlan: ReturnType<typeof vi.fn>;
    addPlanEntry: ReturnType<typeof vi.fn>;
}

function buildClient(): MockedClient {
    return {
        addCase: vi.fn().mockResolvedValue({ id: 1, title: 'created' }),
        updateCase: vi.fn().mockResolvedValue({ id: 1, title: 'updated' }),
        addRun: vi.fn().mockResolvedValue({ id: 10, name: 'r' }),
        closeRun: vi.fn().mockResolvedValue({ id: 10, name: 'r', is_completed: true }),
        addResultForCase: vi.fn().mockResolvedValue({ id: 100, status_id: 1 }),
        addResultsForCases: vi.fn().mockResolvedValue([{ id: 100 }, { id: 101 }]),
        addResults: vi.fn().mockResolvedValue([{ id: 200 }, { id: 201 }]),
        addPlan: vi.fn().mockResolvedValue({ id: 50, name: 'p' }),
        updatePlan: vi.fn().mockResolvedValue({ id: 50, name: 'p2' }),
        addPlanEntry: vi.fn().mockResolvedValue({ id: 'abc-uuid', suite_id: 1, name: 'e' }),
    };
}

interface CtxOverrides {
    pathParams?: string[];
    dataFlag?: string;
    dryRun?: boolean;
}

function buildCtx(
    client: MockedClient,
    overrides: CtxOverrides = {},
): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const ctx: HandlerContext = {
        client: client as unknown as TestRailClient,
        args: { pathParams: overrides.pathParams ?? [] },
        bodyInput: overrides.dataFlag !== undefined ? { dataFlag: overrides.dataFlag } : {},
        dryRun: overrides.dryRun ?? false,
        force: false,
        confirmDestructive: false,
        out,
    };
    return { ctx, out };
}

// ── case add ──────────────────────────────────────────────────────────────

describe('handleCaseAdd', () => {
    it('calls client.addCase with parsed payload and outputs result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['5'], dataFlag: '{"title":"Hi"}' });
        await handleCaseAdd(ctx);
        expect(client.addCase).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Hi' }));
        expect(out).toHaveBeenCalledWith({ id: 1, title: 'created' });
    });

    it('dry-run does not call the client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['5'], dataFlag: '{"title":"Hi"}', dryRun: true });
        await handleCaseAdd(ctx);
        expect(client.addCase).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'case add', sectionId: 5 }));
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['5'] });
        await expect(handleCaseAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body that fails Zod validation', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['5'], dataFlag: '{"title":123}' });
        await expect(handleCaseAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when section_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{"title":"x"}' });
        await expect(handleCaseAdd(ctx)).rejects.toThrow(/section_id/);
    });
});

// ── case update ───────────────────────────────────────────────────────────

describe('handleCaseUpdate', () => {
    it('calls client.updateCase and outputs result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"title":"renamed"}' });
        await handleCaseUpdate(ctx);
        expect(client.updateCase).toHaveBeenCalledWith(7, expect.objectContaining({ title: 'renamed' }));
        expect(out).toHaveBeenCalled();
    });

    it('accepts empty update body ({} is valid for UpdateCasePayload)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['7'], dataFlag: '{}' });
        await handleCaseUpdate(ctx);
        expect(client.updateCase).toHaveBeenCalledWith(7, expect.any(Object));
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"title":"x"}', dryRun: true });
        await handleCaseUpdate(ctx);
        expect(client.updateCase).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'case update', caseId: 7 }));
    });
});

// ── run add ───────────────────────────────────────────────────────────────

describe('handleRunAdd', () => {
    it('calls client.addRun with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'], dataFlag: '{"name":"smoke"}' });
        await handleRunAdd(ctx);
        expect(client.addRun).toHaveBeenCalledWith(3, expect.objectContaining({ name: 'smoke' }));
        expect(out).toHaveBeenCalled();
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['3'], dataFlag: '{"suite_id":1}' });
        await expect(handleRunAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('dry-run includes projectId in preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'], dataFlag: '{"name":"smoke"}', dryRun: true });
        await handleRunAdd(ctx);
        expect(client.addRun).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'run add', projectId: 3 }));
    });
});

// ── run close ─────────────────────────────────────────────────────────────

describe('handleRunClose', () => {
    it('calls client.closeRun with the parsed run_id (no body needed)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['10'] });
        await handleRunClose(ctx);
        expect(client.closeRun).toHaveBeenCalledWith(10);
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ is_completed: true }));
    });

    it('rejects non-positive run_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'] });
        await expect(handleRunClose(ctx)).rejects.toThrow(/run_id/);
    });

    it('dry-run does not call the client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['10'], dryRun: true });
        await handleRunClose(ctx);
        expect(client.closeRun).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'run close', runId: 10 }));
    });

    it('ignores any body provided for run close (no body required)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['10'], dataFlag: '{"ignored":true}' });
        await handleRunClose(ctx);
        expect(client.closeRun).toHaveBeenCalledWith(10);
    });
});

// ── result add ────────────────────────────────────────────────────────────

describe('handleResultAdd', () => {
    it('calls client.addResultForCase with both path params and parsed body', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['5', '7'], dataFlag: '{"status_id":1}' });
        await handleResultAdd(ctx);
        expect(client.addResultForCase).toHaveBeenCalledWith(5, 7, expect.objectContaining({ status_id: 1 }));
        expect(out).toHaveBeenCalled();
    });

    it('rejects when case_id is missing', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['5'], dataFlag: '{"status_id":1}' });
        await expect(handleResultAdd(ctx)).rejects.toThrow(/case_id/);
    });

    it('rejects body missing required status_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['5', '7'], dataFlag: '{"comment":"ok"}' });
        await expect(handleResultAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('dry-run includes both runId and caseId', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['5', '7'], dataFlag: '{"status_id":1}', dryRun: true });
        await handleResultAdd(ctx);
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'result add', runId: 5, caseId: 7 }),
        );
    });
});

// ── result add-bulk ──────────────────────────────────────────────────────

describe('handleResultAddBulk', () => {
    it('calls client.addResultsForCases with the array payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['11'],
            dataFlag: '{"results":[{"case_id":1,"status_id":1},{"case_id":2,"status_id":5}]}',
        });
        await handleResultAddBulk(ctx);
        expect(client.addResultsForCases).toHaveBeenCalledWith(
            11,
            expect.objectContaining({ results: expect.arrayContaining([expect.objectContaining({ case_id: 1 })]) }),
        );
        expect(out).toHaveBeenCalled();
    });

    it('rejects when a result lacks case_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['11'], dataFlag: '{"results":[{"status_id":1}]}' });
        await expect(handleResultAddBulk(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects empty body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['11'] });
        await expect(handleResultAddBulk(ctx)).rejects.toThrow(/Body required/);
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['11'],
            dataFlag: '{"results":[]}',
            dryRun: true,
        });
        await handleResultAddBulk(ctx);
        expect(client.addResultsForCases).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'result add-bulk', runId: 11 }),
        );
    });
});

// ── result add-bulk-by-test ──────────────────────────────────────────────

describe('handleResultAddBulkByTest', () => {
    it('calls client.addResults with the array payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['11'],
            dataFlag: '{"results":[{"test_id":1,"status_id":1},{"test_id":2,"status_id":5}]}',
        });
        await handleResultAddBulkByTest(ctx);
        expect(client.addResults).toHaveBeenCalledWith(
            11,
            expect.objectContaining({ results: expect.arrayContaining([expect.objectContaining({ test_id: 1 })]) }),
        );
        expect(out).toHaveBeenCalled();
    });

    it('rejects when a result lacks test_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['11'], dataFlag: '{"results":[{"status_id":1}]}' });
        await expect(handleResultAddBulkByTest(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects empty body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['11'] });
        await expect(handleResultAddBulkByTest(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects non-positive-integer run_id', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['0'],
            dataFlag: '{"results":[{"test_id":1,"status_id":1}]}',
        });
        await expect(handleResultAddBulkByTest(ctx)).rejects.toThrow();
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['11'],
            dataFlag: '{"results":[]}',
            dryRun: true,
        });
        await handleResultAddBulkByTest(ctx);
        expect(client.addResults).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'result add-bulk-by-test', runId: 11 }),
        );
    });
});

// ── plan add ──────────────────────────────────────────────────────────────

describe('handlePlanAdd', () => {
    it('calls client.addPlan with parsed payload and outputs result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'], dataFlag: '{"name":"Release 1.0"}' });
        await handlePlanAdd(ctx);
        expect(client.addPlan).toHaveBeenCalledWith(3, expect.objectContaining({ name: 'Release 1.0' }));
        expect(out).toHaveBeenCalledWith({ id: 50, name: 'p' });
    });

    it('accepts nested entries with runs', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['3'],
            dataFlag: '{"name":"R","entries":[{"suite_id":1,"runs":[{"config_ids":[2]}]}]}',
        });
        await handlePlanAdd(ctx);
        expect(client.addPlan).toHaveBeenCalledWith(
            3,
            expect.objectContaining({
                entries: expect.arrayContaining([expect.objectContaining({ suite_id: 1 })]),
            }),
        );
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'], dataFlag: '{"name":"R"}', dryRun: true });
        await handlePlanAdd(ctx);
        expect(client.addPlan).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'plan add', projectId: 3 }));
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['3'] });
        await expect(handlePlanAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['3'], dataFlag: '{"description":"oops"}' });
        await expect(handlePlanAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects entry missing required suite_id', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['3'],
            dataFlag: '{"name":"R","entries":[{"name":"bad"}]}',
        });
        await expect(handlePlanAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{"name":"R"}' });
        await expect(handlePlanAdd(ctx)).rejects.toThrow(/project_id/);
    });
});

// ── plan update ──────────────────────────────────────────────────────────

describe('handlePlanUpdate', () => {
    it('calls client.updatePlan with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50'], dataFlag: '{"name":"renamed"}' });
        await handlePlanUpdate(ctx);
        expect(client.updatePlan).toHaveBeenCalledWith(50, expect.objectContaining({ name: 'renamed' }));
        expect(out).toHaveBeenCalledWith({ id: 50, name: 'p2' });
    });

    it('accepts an empty body (all fields optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['50'], dataFlag: '{}' });
        await handlePlanUpdate(ctx);
        expect(client.updatePlan).toHaveBeenCalledWith(50, expect.objectContaining({}));
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50'], dataFlag: '{"name":"x"}', dryRun: true });
        await handlePlanUpdate(ctx);
        expect(client.updatePlan).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'plan update', planId: 50 }));
    });

    it('rejects non-string name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50'], dataFlag: '{"name":42}' });
        await expect(handlePlanUpdate(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when plan_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['bad'], dataFlag: '{}' });
        await expect(handlePlanUpdate(ctx)).rejects.toThrow(/plan_id/);
    });
});

// ── plan add-entry ───────────────────────────────────────────────────────

describe('handlePlanAddEntry', () => {
    it('calls client.addPlanEntry with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50'],
            dataFlag: '{"suite_id":1,"include_all":true}',
        });
        await handlePlanAddEntry(ctx);
        expect(client.addPlanEntry).toHaveBeenCalledWith(
            50,
            expect.objectContaining({ suite_id: 1, include_all: true }),
        );
        expect(out).toHaveBeenCalledWith({ id: 'abc-uuid', suite_id: 1, name: 'e' });
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50'],
            dataFlag: '{"suite_id":1}',
            dryRun: true,
        });
        await handlePlanAddEntry(ctx);
        expect(client.addPlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'plan add-entry', planId: 50 }),
        );
    });

    it('rejects body missing required suite_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50'], dataFlag: '{"name":"e"}' });
        await expect(handlePlanAddEntry(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50'] });
        await expect(handlePlanAddEntry(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects when plan_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-1'], dataFlag: '{"suite_id":1}' });
        await expect(handlePlanAddEntry(ctx)).rejects.toThrow(/plan_id/);
    });
});
