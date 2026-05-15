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
import {
    handleCaseAdd,
    handleCaseUpdate,
    handleCaseUpdateBulk,
    handleCaseDeleteBulk,
    handleCaseCopyToSection,
    handleCaseMoveToSection,
} from '../src/cli/handlers/case-write.js';
import { handleRunAdd, handleRunClose } from '../src/cli/handlers/run-write.js';
import { handleResultAdd, handleResultAddBulk, handleResultAddBulkByTest } from '../src/cli/handlers/result-write.js';
import { handlePlanAdd, handlePlanUpdate, handlePlanAddEntry } from '../src/cli/handlers/plan-write.js';
import { handleSectionMove } from '../src/cli/handlers/section-write.js';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';

interface MockedClient {
    addCase: ReturnType<typeof vi.fn>;
    updateCase: ReturnType<typeof vi.fn>;
    updateCases: ReturnType<typeof vi.fn>;
    deleteCases: ReturnType<typeof vi.fn>;
    copyCasesToSection: ReturnType<typeof vi.fn>;
    moveCasesToSection: ReturnType<typeof vi.fn>;
    moveSection: ReturnType<typeof vi.fn>;
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
        updateCases: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
        deleteCases: vi.fn().mockResolvedValue(undefined),
        copyCasesToSection: vi.fn().mockResolvedValue([{ id: 11 }, { id: 12 }]),
        moveCasesToSection: vi.fn().mockResolvedValue(undefined),
        moveSection: vi.fn().mockResolvedValue(undefined),
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
    projectId?: string;
    soft?: boolean;
    confirmDestructive?: boolean;
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
            ...(overrides.projectId !== undefined && { projectId: overrides.projectId }),
            ...(overrides.soft === true && { soft: true }),
        },
        bodyInput: overrides.dataFlag !== undefined ? { dataFlag: overrides.dataFlag } : {},
        dryRun: overrides.dryRun ?? false,
        force: false,
        confirmDestructive: overrides.confirmDestructive ?? false,
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

// ── case update-bulk ──────────────────────────────────────────────────────

describe('handleCaseUpdateBulk', () => {
    it('calls client.updateCases with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['5'],
            dataFlag: '{"case_ids":[1,2],"priority_id":3}',
        });
        await handleCaseUpdateBulk(ctx);
        expect(client.updateCases).toHaveBeenCalledWith(
            5,
            expect.objectContaining({ case_ids: [1, 2], priority_id: 3 }),
        );
        expect(out).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });

    it('rejects body missing case_ids', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['5'], dataFlag: '{"priority_id":3}' });
        await expect(handleCaseUpdateBulk(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects non-positive suite_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{"case_ids":[1]}' });
        await expect(handleCaseUpdateBulk(ctx)).rejects.toThrow(/suite_id/);
    });

    it('dry-run does not call client and emits preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['5'],
            dataFlag: '{"case_ids":[1]}',
            dryRun: true,
        });
        await handleCaseUpdateBulk(ctx);
        expect(client.updateCases).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'case update-bulk', suiteId: 5 }),
        );
    });
});

// ── case delete-bulk ──────────────────────────────────────────────────────

describe('handleCaseDeleteBulk', () => {
    it('calls client.deleteCases with suite_id, project_id, and parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['5'],
            projectId: '9',
            confirmDestructive: true,
            dataFlag: '{"case_ids":[1,2]}',
        });
        await handleCaseDeleteBulk(ctx);
        expect(client.deleteCases).toHaveBeenCalledWith(5, 9, { case_ids: [1, 2] }, { soft: false });
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
    });

    it('passes soft=true when ctx.args.soft is set', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['5'],
            projectId: '9',
            confirmDestructive: true,
            soft: true,
            dataFlag: '{"case_ids":[1]}',
        });
        await handleCaseDeleteBulk(ctx);
        expect(client.deleteCases).toHaveBeenCalledWith(5, 9, { case_ids: [1] }, { soft: true });
    });

    it('rejects without --yes', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['5'],
            projectId: '9',
            dataFlag: '{"case_ids":[1]}',
        });
        await expect(handleCaseDeleteBulk(ctx)).rejects.toThrow(/--yes to confirm/);
    });

    it('rejects when --project-id is missing', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['5'],
            confirmDestructive: true,
            dataFlag: '{"case_ids":[1]}',
        });
        await expect(handleCaseDeleteBulk(ctx)).rejects.toThrow(/--project-id/);
    });

    it('rejects body missing case_ids', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['5'],
            projectId: '9',
            confirmDestructive: true,
            dataFlag: '{}',
        });
        await expect(handleCaseDeleteBulk(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects non-positive suite_id before checking --yes', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['0'],
            projectId: '9',
            confirmDestructive: true,
            dataFlag: '{"case_ids":[1]}',
        });
        await expect(handleCaseDeleteBulk(ctx)).rejects.toThrow(/suite_id/);
    });

    it('rejects non-positive --project-id', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['5'],
            projectId: '0',
            confirmDestructive: true,
            dataFlag: '{"case_ids":[1]}',
        });
        await expect(handleCaseDeleteBulk(ctx)).rejects.toThrow(/--project-id/);
    });

    it('dry-run wins over --yes: no API call, preview marks destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['5'],
            projectId: '9',
            confirmDestructive: true,
            soft: true,
            dryRun: true,
            dataFlag: '{"case_ids":[1]}',
        });
        await handleCaseDeleteBulk(ctx);
        expect(client.deleteCases).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'case delete-bulk',
                suiteId: 5,
                projectId: 9,
                soft: true,
                destructive: true,
            }),
        );
    });
});

// ── case copy-to-section ──────────────────────────────────────────────────

describe('handleCaseCopyToSection', () => {
    it('calls client.copyCasesToSection with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"case_ids":[10,11]}' });
        await handleCaseCopyToSection(ctx);
        expect(client.copyCasesToSection).toHaveBeenCalledWith(7, { case_ids: [10, 11] });
        expect(out).toHaveBeenCalledWith([{ id: 11 }, { id: 12 }]);
    });

    it('rejects body missing case_ids', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{}' });
        await expect(handleCaseCopyToSection(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects non-positive section_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{"case_ids":[1]}' });
        await expect(handleCaseCopyToSection(ctx)).rejects.toThrow(/section_id/);
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['7'],
            dataFlag: '{"case_ids":[1]}',
            dryRun: true,
        });
        await handleCaseCopyToSection(ctx);
        expect(client.copyCasesToSection).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'case copy-to-section', sectionId: 7 }),
        );
    });
});

// ── case move-to-section ──────────────────────────────────────────────────

describe('handleCaseMoveToSection', () => {
    it('calls client.moveCasesToSection with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['7'],
            dataFlag: '{"case_ids":[1,2],"suite_id":3}',
        });
        await handleCaseMoveToSection(ctx);
        expect(client.moveCasesToSection).toHaveBeenCalledWith(7, { case_ids: [1, 2], suite_id: 3 });
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ moved: true }));
    });

    it('rejects body missing suite_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{"case_ids":[1]}' });
        await expect(handleCaseMoveToSection(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects non-positive section_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-1'], dataFlag: '{"case_ids":[1],"suite_id":2}' });
        await expect(handleCaseMoveToSection(ctx)).rejects.toThrow(/section_id/);
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['7'],
            dataFlag: '{"case_ids":[1],"suite_id":2}',
            dryRun: true,
        });
        await handleCaseMoveToSection(ctx);
        expect(client.moveCasesToSection).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'case move-to-section', sectionId: 7 }),
        );
    });
});

// ── section move ─────────────────────────────────────────────────────────

describe('handleSectionMove', () => {
    it('calls client.moveSection with parsed payload (parent_id=null preserved)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['5'],
            dataFlag: '{"parent_id":null,"after_id":42}',
        });
        await handleSectionMove(ctx);
        // null must reach the client method as null (explicit "move to root"),
        // NOT be elided to undefined.
        expect(client.moveSection).toHaveBeenCalledWith(5, { parent_id: null, after_id: 42 });
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ sectionId: 5, moved: true }));
    });

    it('accepts an empty body (both fields optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['5'], dataFlag: '{}' });
        await handleSectionMove(ctx);
        expect(client.moveSection).toHaveBeenCalledWith(5, {});
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['5'] });
        await expect(handleSectionMove(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body with parent_id as string (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['5'], dataFlag: '{"parent_id":"3"}' });
        await expect(handleSectionMove(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects non-positive section_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{"parent_id":null}' });
        await expect(handleSectionMove(ctx)).rejects.toThrow(/section_id/);
    });

    it('dry-run does not call client and emits preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['5'],
            dataFlag: '{"after_id":null}',
            dryRun: true,
        });
        await handleSectionMove(ctx);
        expect(client.moveSection).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'section move', sectionId: 5 }),
        );
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
