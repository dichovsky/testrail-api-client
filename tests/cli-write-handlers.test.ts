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
    handleCaseAddBulk,
    handleCaseDelete,
    handleCaseUpdate,
    handleCaseUpdateBulk,
    handleCaseDeleteBulk,
    handleCaseCopyToSection,
    handleCaseMoveToSection,
} from '../src/cli/handlers/case-write.js';
import { handleCaseFieldAdd } from '../src/cli/handlers/case-field-write.js';
import { handleRunAdd, handleRunUpdate, handleRunClose, handleRunDelete } from '../src/cli/handlers/run-write.js';
import {
    handleResultAdd,
    handleResultAddBulk,
    handleResultAddBulkByTest,
    handleResultAddByTest,
} from '../src/cli/handlers/result-write.js';
import {
    handlePlanAdd,
    handlePlanUpdate,
    handlePlanAddEntry,
    handlePlanAddRunToEntry,
    handlePlanUpdateEntry,
    handlePlanUpdateRunInEntry,
    handlePlanClose,
    handlePlanDelete,
    handlePlanDeleteEntry,
    handlePlanDeleteRunFromEntry,
} from '../src/cli/handlers/plan-write.js';
import {
    handleSectionAdd,
    handleSectionDelete,
    handleSectionMove,
    handleSectionUpdate,
} from '../src/cli/handlers/section-write.js';
import { handleProjectAdd, handleProjectDelete, handleProjectUpdate } from '../src/cli/handlers/project-write.js';
import { handleSuiteAdd, handleSuiteDelete, handleSuiteUpdate } from '../src/cli/handlers/suite-write.js';
import {
    handleMilestoneAdd,
    handleMilestoneDelete,
    handleMilestoneUpdate,
} from '../src/cli/handlers/milestone-write.js';
import { handleVariableAdd, handleVariableDelete, handleVariableUpdate } from '../src/cli/handlers/variable-write.js';
import { handleGroupAdd, handleGroupDelete, handleGroupUpdate } from '../src/cli/handlers/group-write.js';
import { handleDatasetAdd, handleDatasetDelete, handleDatasetUpdate } from '../src/cli/handlers/dataset-write.js';
import {
    handleSharedStepAdd,
    handleSharedStepUpdate,
    handleSharedStepDelete,
} from '../src/cli/handlers/shared-step-write.js';
import {
    handleConfigurationGroupAdd,
    handleConfigurationGroupUpdate,
    handleConfigurationGroupDelete,
    handleConfigurationAdd,
    handleConfigurationUpdate,
    handleConfigurationDelete,
} from '../src/cli/handlers/configuration-write.js';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';

interface MockedClient {
    addCase: ReturnType<typeof vi.fn>;
    addCases: ReturnType<typeof vi.fn>;
    updateCase: ReturnType<typeof vi.fn>;
    updateCases: ReturnType<typeof vi.fn>;
    deleteCase: ReturnType<typeof vi.fn>;
    deleteCases: ReturnType<typeof vi.fn>;
    copyCasesToSection: ReturnType<typeof vi.fn>;
    moveCasesToSection: ReturnType<typeof vi.fn>;
    addCaseField: ReturnType<typeof vi.fn>;
    moveSection: ReturnType<typeof vi.fn>;
    addRun: ReturnType<typeof vi.fn>;
    updateRun: ReturnType<typeof vi.fn>;
    closeRun: ReturnType<typeof vi.fn>;
    deleteRun: ReturnType<typeof vi.fn>;
    addResult: ReturnType<typeof vi.fn>;
    addResultForCase: ReturnType<typeof vi.fn>;
    addResultsForCases: ReturnType<typeof vi.fn>;
    addResults: ReturnType<typeof vi.fn>;
    addPlan: ReturnType<typeof vi.fn>;
    updatePlan: ReturnType<typeof vi.fn>;
    addPlanEntry: ReturnType<typeof vi.fn>;
    addRunToPlanEntry: ReturnType<typeof vi.fn>;
    updatePlanEntry: ReturnType<typeof vi.fn>;
    updateRunInPlanEntry: ReturnType<typeof vi.fn>;
    closePlan: ReturnType<typeof vi.fn>;
    deletePlan: ReturnType<typeof vi.fn>;
    deletePlanEntry: ReturnType<typeof vi.fn>;
    deleteRunFromPlanEntry: ReturnType<typeof vi.fn>;
    addProject: ReturnType<typeof vi.fn>;
    updateProject: ReturnType<typeof vi.fn>;
    deleteProject: ReturnType<typeof vi.fn>;
    addSuite: ReturnType<typeof vi.fn>;
    updateSuite: ReturnType<typeof vi.fn>;
    deleteSuite: ReturnType<typeof vi.fn>;
    addSection: ReturnType<typeof vi.fn>;
    updateSection: ReturnType<typeof vi.fn>;
    deleteSection: ReturnType<typeof vi.fn>;
    addMilestone: ReturnType<typeof vi.fn>;
    updateMilestone: ReturnType<typeof vi.fn>;
    deleteMilestone: ReturnType<typeof vi.fn>;
    addVariable: ReturnType<typeof vi.fn>;
    updateVariable: ReturnType<typeof vi.fn>;
    deleteVariable: ReturnType<typeof vi.fn>;
    addGroup: ReturnType<typeof vi.fn>;
    updateGroup: ReturnType<typeof vi.fn>;
    deleteGroup: ReturnType<typeof vi.fn>;
    addDataset: ReturnType<typeof vi.fn>;
    updateDataset: ReturnType<typeof vi.fn>;
    deleteDataset: ReturnType<typeof vi.fn>;
    addSharedStep: ReturnType<typeof vi.fn>;
    updateSharedStep: ReturnType<typeof vi.fn>;
    deleteSharedStep: ReturnType<typeof vi.fn>;
    addConfigurationGroup: ReturnType<typeof vi.fn>;
    updateConfigurationGroup: ReturnType<typeof vi.fn>;
    deleteConfigurationGroup: ReturnType<typeof vi.fn>;
    addConfiguration: ReturnType<typeof vi.fn>;
    updateConfiguration: ReturnType<typeof vi.fn>;
    deleteConfiguration: ReturnType<typeof vi.fn>;
}

function buildClient(): MockedClient {
    return {
        addCase: vi.fn().mockResolvedValue({ id: 1, title: 'created' }),
        addCases: vi.fn().mockResolvedValue([
            { id: 1, title: 'a' },
            { id: 2, title: 'b' },
        ]),
        updateCase: vi.fn().mockResolvedValue({ id: 1, title: 'updated' }),
        updateCases: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
        deleteCase: vi.fn().mockResolvedValue(undefined),
        deleteCases: vi.fn().mockResolvedValue(undefined),
        copyCasesToSection: vi.fn().mockResolvedValue([{ id: 11 }, { id: 12 }]),
        moveCasesToSection: vi.fn().mockResolvedValue(undefined),
        addCaseField: vi.fn().mockResolvedValue({ id: 99, name: 'preconds', label: 'Preconditions' }),
        moveSection: vi.fn().mockResolvedValue(undefined),
        addRun: vi.fn().mockResolvedValue({ id: 10, name: 'r' }),
        updateRun: vi.fn().mockResolvedValue({ id: 10, name: 'r2' }),
        closeRun: vi.fn().mockResolvedValue({ id: 10, name: 'r', is_completed: true }),
        deleteRun: vi.fn().mockResolvedValue(undefined),
        addResult: vi.fn().mockResolvedValue({ id: 100, status_id: 1 }),
        addResultForCase: vi.fn().mockResolvedValue({ id: 100, status_id: 1 }),
        addResultsForCases: vi.fn().mockResolvedValue([{ id: 100 }, { id: 101 }]),
        addResults: vi.fn().mockResolvedValue([{ id: 200 }, { id: 201 }]),
        addPlan: vi.fn().mockResolvedValue({ id: 50, name: 'p' }),
        updatePlan: vi.fn().mockResolvedValue({ id: 50, name: 'p2' }),
        addPlanEntry: vi.fn().mockResolvedValue({ id: 'abc-uuid', suite_id: 1, name: 'e' }),
        addRunToPlanEntry: vi.fn().mockResolvedValue({ id: 77, suite_id: 1, name: 'r-in-entry' }),
        updatePlanEntry: vi.fn().mockResolvedValue({ id: 'abc-uuid', suite_id: 1, name: 'updated' }),
        updateRunInPlanEntry: vi.fn().mockResolvedValue({ id: 77, suite_id: 1, name: 'updated-run' }),
        closePlan: vi.fn().mockResolvedValue({ id: 50, name: 'p', is_completed: true }),
        deletePlan: vi.fn().mockResolvedValue(undefined),
        deletePlanEntry: vi.fn().mockResolvedValue(undefined),
        deleteRunFromPlanEntry: vi.fn().mockResolvedValue(undefined),
        addProject: vi.fn().mockResolvedValue({ id: 7, name: 'New', suite_mode: 1, url: 'u' }),
        updateProject: vi.fn().mockResolvedValue({ id: 7, name: 'Renamed', suite_mode: 1, url: 'u' }),
        deleteProject: vi.fn().mockResolvedValue(undefined),
        addSuite: vi.fn().mockResolvedValue({ id: 22, name: 'S', project_id: 7, url: 'u' }),
        updateSuite: vi.fn().mockResolvedValue({ id: 22, name: 'S2', project_id: 7, url: 'u' }),
        deleteSuite: vi.fn().mockResolvedValue(undefined),
        addSection: vi.fn().mockResolvedValue({ id: 33, name: 'Sec', suite_id: 22, display_order: 1, depth: 0 }),
        updateSection: vi.fn().mockResolvedValue({ id: 33, name: 'Sec2', suite_id: 22, display_order: 1, depth: 0 }),
        deleteSection: vi.fn().mockResolvedValue(undefined),
        addMilestone: vi.fn().mockResolvedValue({ id: 44, name: 'M', is_completed: false, project_id: 7, url: 'u' }),
        updateMilestone: vi.fn().mockResolvedValue({ id: 44, name: 'M', is_completed: true, project_id: 7, url: 'u' }),
        deleteMilestone: vi.fn().mockResolvedValue(undefined),
        addVariable: vi.fn().mockResolvedValue({ id: 55, name: 'env' }),
        updateVariable: vi.fn().mockResolvedValue({ id: 55, name: 'region' }),
        deleteVariable: vi.fn().mockResolvedValue(undefined),
        addGroup: vi.fn().mockResolvedValue({ id: 77, name: 'QA Group', user_ids: [1, 2] }),
        updateGroup: vi.fn().mockResolvedValue({ id: 77, name: 'QA Group Renamed', user_ids: [1, 2] }),
        deleteGroup: vi.fn().mockResolvedValue(undefined),
        addDataset: vi.fn().mockResolvedValue({ id: 77, name: 'Staging matrix', project_id: 7 }),
        updateDataset: vi.fn().mockResolvedValue({ id: 77, name: 'Production matrix', project_id: 7 }),
        deleteDataset: vi.fn().mockResolvedValue(undefined),
        addSharedStep: vi.fn().mockResolvedValue({ id: 55, title: 'Login Steps', project_id: 1 }),
        updateSharedStep: vi.fn().mockResolvedValue({ id: 55, title: 'Login Steps (v2)', project_id: 1 }),
        deleteSharedStep: vi.fn().mockResolvedValue(undefined),
        addConfigurationGroup: vi.fn().mockResolvedValue({ id: 55, name: 'Browsers', project_id: 7, configs: [] }),
        updateConfigurationGroup: vi
            .fn()
            .mockResolvedValue({ id: 55, name: 'Desktop Browsers', project_id: 7, configs: [] }),
        deleteConfigurationGroup: vi.fn().mockResolvedValue(undefined),
        addConfiguration: vi.fn().mockResolvedValue({ id: 66, name: 'Chrome', group_id: 55 }),
        updateConfiguration: vi.fn().mockResolvedValue({ id: 66, name: 'Chrome (stable)', group_id: 55 }),
        deleteConfiguration: vi.fn().mockResolvedValue(undefined),
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

// ── case add-bulk ─────────────────────────────────────────────────────────

describe('handleCaseAddBulk', () => {
    it('calls client.addCases with the parsed array payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['12'],
            dataFlag: '[{"title":"A"},{"title":"B"}]',
        });
        await handleCaseAddBulk(ctx);
        expect(client.addCases).toHaveBeenCalledWith(12, [{ title: 'A' }, { title: 'B' }]);
        expect(out).toHaveBeenCalled();
    });

    it('dry-run does not call the client and emits a preview with the array count', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['12'],
            dataFlag: '[{"title":"A"},{"title":"B"},{"title":"C"}]',
            dryRun: true,
        });
        await handleCaseAddBulk(ctx);
        expect(client.addCases).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'case add-bulk',
                sectionId: 12,
                count: 3,
            }),
        );
    });

    it('rejects a non-array body (object instead of array)', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['12'],
            dataFlag: '{"title":"A"}',
        });
        await expect(handleCaseAddBulk(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects an empty array (TestRail returns 400 — fail-fast at the CLI boundary)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['12'], dataFlag: '[]' });
        await expect(handleCaseAddBulk(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects an array item that fails Zod validation', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['12'],
            dataFlag: '[{"title":"ok"},{"title":123}]',
        });
        await expect(handleCaseAddBulk(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['12'] });
        await expect(handleCaseAddBulk(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects when section_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '[{"title":"x"}]' });
        await expect(handleCaseAddBulk(ctx)).rejects.toThrow(/section_id/);
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

    it('passes soft=true and surfaces preview counts when ctx.args.soft is set', async () => {
        const client = buildClient();
        // Soft preview returns affected-test counts from TestRail.
        client.deleteCases.mockResolvedValueOnce({ affected_tests: 7 });
        const { ctx, out } = buildCtx(client, {
            pathParams: ['5'],
            projectId: '9',
            confirmDestructive: true,
            soft: true,
            dataFlag: '{"case_ids":[1]}',
        });
        await handleCaseDeleteBulk(ctx);
        expect(client.deleteCases).toHaveBeenCalledWith(5, 9, { case_ids: [1] }, { soft: true });
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                soft: true,
                deleted: false,
                preview: { affected_tests: 7 },
            }),
        );
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

// ── case-field add ────────────────────────────────────────────────────────

describe('handleCaseFieldAdd', () => {
    const validBody = JSON.stringify({
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

    it('calls client.addCaseField with parsed payload and outputs result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { dataFlag: validBody });
        await handleCaseFieldAdd(ctx);
        expect(client.addCaseField).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'String', name: 'preconds', label: 'Preconditions' }),
        );
        expect(out).toHaveBeenCalledWith({ id: 99, name: 'preconds', label: 'Preconditions' });
    });

    it('dry-run does not call client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { dataFlag: validBody, dryRun: true });
        await handleCaseFieldAdd(ctx);
        expect(client.addCaseField).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'case-field add' }));
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), {});
        await expect(handleCaseFieldAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required `type`', async () => {
        const { ctx } = buildCtx(buildClient(), {
            dataFlag: '{"name":"x","label":"X","configs":[]}',
        });
        await expect(handleCaseFieldAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body missing required `name`', async () => {
        const { ctx } = buildCtx(buildClient(), {
            dataFlag: '{"type":"String","label":"X","configs":[]}',
        });
        await expect(handleCaseFieldAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body missing required `configs`', async () => {
        const { ctx } = buildCtx(buildClient(), {
            dataFlag: '{"type":"String","name":"x","label":"X"}',
        });
        await expect(handleCaseFieldAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects malformed configs[] item (missing context)', async () => {
        const { ctx } = buildCtx(buildClient(), {
            dataFlag:
                '{"type":"String","name":"x","label":"X","configs":[{"options":{"is_required":false,"default_value":""}}]}',
        });
        await expect(handleCaseFieldAdd(ctx)).rejects.toThrow(/validation failed/);
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

// ── run update ────────────────────────────────────────────────────────────

describe('handleRunUpdate', () => {
    it('calls client.updateRun with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['10'], dataFlag: '{"name":"renamed"}' });
        await handleRunUpdate(ctx);
        expect(client.updateRun).toHaveBeenCalledWith(10, expect.objectContaining({ name: 'renamed' }));
        expect(out).toHaveBeenCalledWith({ id: 10, name: 'r2' });
    });

    it('accepts an empty body (all fields optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['10'], dataFlag: '{}' });
        await handleRunUpdate(ctx);
        expect(client.updateRun).toHaveBeenCalledWith(10, expect.any(Object));
    });

    it('dry-run does not call client and emits payload + source=data (--data channel)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['10'], dataFlag: '{"name":"x"}', dryRun: true });
        await handleRunUpdate(ctx);
        expect(client.updateRun).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'run update',
            runId: 10,
            payload: { name: 'x' },
            source: 'data',
        });
    });

    it('rejects non-string name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['10'], dataFlag: '{"name":42}' });
        await expect(handleRunUpdate(ctx)).rejects.toThrow(/validation failed/);
    });

    it('throws when no body source is provided', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['10'] }); // no dataFlag
        await expect(handleRunUpdate(ctx)).rejects.toThrow();
    });

    it('rejects when run_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['bad'], dataFlag: '{}' });
        await expect(handleRunUpdate(ctx)).rejects.toThrow(/run_id/);
    });

    it('rejects when run_id is zero', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{}' });
        await expect(handleRunUpdate(ctx)).rejects.toThrow(/run_id/);
    });

    it('rejects when run_id is negative', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-1'], dataFlag: '{}' });
        await expect(handleRunUpdate(ctx)).rejects.toThrow(/run_id/);
    });
});

// ── run close ─────────────────────────────────────────────────────────────

describe('handleRunClose', () => {
    it('calls client.closeRun with the parsed run_id (no body needed) when --yes is passed', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['10'], confirmDestructive: true });
        await handleRunClose(ctx);
        expect(client.closeRun).toHaveBeenCalledWith(10);
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ is_completed: true }));
    });

    it('rejects non-positive run_id before checking --yes', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'] });
        await expect(handleRunClose(ctx)).rejects.toThrow(/run_id/);
    });

    it('rejects without --yes (destructive: closing a run is irreversible)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['10'] });
        await expect(handleRunClose(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.closeRun).not.toHaveBeenCalled();
    });

    it('dry-run does not call the client and marks preview destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['10'], dryRun: true });
        await handleRunClose(ctx);
        expect(client.closeRun).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'run close', runId: 10, destructive: true }),
        );
    });

    it('dry-run wins over --yes: no API call, preview still marks destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['10'], dryRun: true, confirmDestructive: true });
        await handleRunClose(ctx);
        expect(client.closeRun).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'run close', runId: 10, destructive: true }),
        );
    });

    it('ignores any body provided for run close (no body required)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['10'],
            dataFlag: '{"ignored":true}',
            confirmDestructive: true,
        });
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

// ── result add-by-test ────────────────────────────────────────────────────

describe('handleResultAddByTest', () => {
    it('calls client.addResult with the test_id and parsed body', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], dataFlag: '{"status_id":1}' });
        await handleResultAddByTest(ctx);
        expect(client.addResult).toHaveBeenCalledWith(42, expect.objectContaining({ status_id: 1 }));
        expect(out).toHaveBeenCalled();
    });

    it('rejects when test_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{"status_id":1}' });
        await expect(handleResultAddByTest(ctx)).rejects.toThrow();
    });

    it('rejects body missing required status_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['42'], dataFlag: '{"comment":"no status"}' });
        await expect(handleResultAddByTest(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when body is absent', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['42'] });
        await expect(handleResultAddByTest(ctx)).rejects.toThrow(/Body required/);
    });

    it('dry-run does not call client and includes testId + payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], dataFlag: '{"status_id":5}', dryRun: true });
        await handleResultAddByTest(ctx);
        expect(client.addResult).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'result add-by-test', testId: 42 }),
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

// ── plan add-run-to-entry ────────────────────────────────────────────────

describe('handlePlanAddRunToEntry', () => {
    it('calls client.addRunToPlanEntry with planId, entryId, and parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50', 'abc-def-uuid'],
            dataFlag: '{"config_ids":[1,2],"include_all":true}',
        });
        await handlePlanAddRunToEntry(ctx);
        expect(client.addRunToPlanEntry).toHaveBeenCalledWith(
            50,
            'abc-def-uuid',
            expect.objectContaining({ config_ids: [1, 2], include_all: true }),
        );
        expect(out).toHaveBeenCalledWith({ id: 77, suite_id: 1, name: 'r-in-entry' });
    });

    it('passes through custom_* fields (Zod passthrough)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['50', 'abc-def-uuid'],
            dataFlag: '{"config_ids":[1],"custom_label":"xyz"}',
        });
        await handlePlanAddRunToEntry(ctx);
        expect(client.addRunToPlanEntry).toHaveBeenCalledWith(
            50,
            'abc-def-uuid',
            expect.objectContaining({ config_ids: [1], custom_label: 'xyz' }),
        );
    });

    it('dry-run does not call the client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50', 'abc-def-uuid'],
            dataFlag: '{"config_ids":[1]}',
            dryRun: true,
        });
        await handlePlanAddRunToEntry(ctx);
        expect(client.addRunToPlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'plan add-run-to-entry',
                planId: 50,
                entryId: 'abc-def-uuid',
            }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50', 'abc-def-uuid'] });
        await expect(handlePlanAddRunToEntry(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required config_ids', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['50', 'abc-def-uuid'],
            dataFlag: '{"include_all":true}',
        });
        await expect(handlePlanAddRunToEntry(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when plan_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['0', 'abc-def-uuid'],
            dataFlag: '{"config_ids":[1]}',
        });
        await expect(handlePlanAddRunToEntry(ctx)).rejects.toThrow(/plan_id/);
    });

    it('rejects when entry_id is missing (undefined)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50'], dataFlag: '{"config_ids":[1]}' });
        await expect(handlePlanAddRunToEntry(ctx)).rejects.toThrow(/entry_id/);
    });

    it('rejects when entry_id is empty string', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50', ''], dataFlag: '{"config_ids":[1]}' });
        await expect(handlePlanAddRunToEntry(ctx)).rejects.toThrow(/entry_id/);
    });

    it('rejects when entry_id is whitespace-only', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50', '   '], dataFlag: '{"config_ids":[1]}' });
        await expect(handlePlanAddRunToEntry(ctx)).rejects.toThrow(/entry_id/);
    });
});

// ── plan update-entry ────────────────────────────────────────────────────

describe('handlePlanUpdateEntry', () => {
    it('calls client.updatePlanEntry with planId, entryId, and parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50', 'abc-def-uuid'],
            dataFlag: '{"name":"renamed","include_all":false}',
        });
        await handlePlanUpdateEntry(ctx);
        expect(client.updatePlanEntry).toHaveBeenCalledWith(
            50,
            'abc-def-uuid',
            expect.objectContaining({ name: 'renamed', include_all: false }),
        );
        expect(out).toHaveBeenCalledWith({ id: 'abc-uuid', suite_id: 1, name: 'updated' });
    });

    it('accepts an empty body (all fields optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['50', 'abc-def-uuid'], dataFlag: '{}' });
        await handlePlanUpdateEntry(ctx);
        expect(client.updatePlanEntry).toHaveBeenCalledWith(50, 'abc-def-uuid', expect.any(Object));
    });

    it('passes through custom_* fields (Zod passthrough)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['50', 'abc-def-uuid'],
            dataFlag: '{"custom_field":42}',
        });
        await handlePlanUpdateEntry(ctx);
        expect(client.updatePlanEntry).toHaveBeenCalledWith(
            50,
            'abc-def-uuid',
            expect.objectContaining({ custom_field: 42 }),
        );
    });

    it('dry-run does not call the client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50', 'abc-def-uuid'],
            dataFlag: '{"name":"x"}',
            dryRun: true,
        });
        await handlePlanUpdateEntry(ctx);
        expect(client.updatePlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'plan update-entry',
                planId: 50,
                entryId: 'abc-def-uuid',
            }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50', 'abc-def-uuid'] });
        await expect(handlePlanUpdateEntry(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body with wrong field type', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['50', 'abc-def-uuid'],
            dataFlag: '{"name":42}',
        });
        await expect(handlePlanUpdateEntry(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when plan_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['bad', 'abc-def-uuid'], dataFlag: '{}' });
        await expect(handlePlanUpdateEntry(ctx)).rejects.toThrow(/plan_id/);
    });

    it('rejects when entry_id is empty', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50', ''], dataFlag: '{}' });
        await expect(handlePlanUpdateEntry(ctx)).rejects.toThrow(/entry_id/);
    });
});

// ── plan update-run-in-entry ─────────────────────────────────────────────

describe('handlePlanUpdateRunInEntry', () => {
    it('calls client.updateRunInPlanEntry with runId and parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['77'],
            dataFlag: '{"description":"new","include_all":false,"case_ids":[1,2]}',
        });
        await handlePlanUpdateRunInEntry(ctx);
        expect(client.updateRunInPlanEntry).toHaveBeenCalledWith(
            77,
            expect.objectContaining({ description: 'new', include_all: false, case_ids: [1, 2] }),
        );
        expect(out).toHaveBeenCalledWith({ id: 77, suite_id: 1, name: 'updated-run' });
    });

    it('accepts an empty body (all fields optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['77'], dataFlag: '{}' });
        await handlePlanUpdateRunInEntry(ctx);
        expect(client.updateRunInPlanEntry).toHaveBeenCalledWith(77, expect.any(Object));
    });

    it('passes through custom_* fields (Zod passthrough)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['77'],
            dataFlag: '{"description":"d","custom_extra":"v"}',
        });
        await handlePlanUpdateRunInEntry(ctx);
        expect(client.updateRunInPlanEntry).toHaveBeenCalledWith(
            77,
            expect.objectContaining({ description: 'd', custom_extra: 'v' }),
        );
    });

    it('dry-run does not call the client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['77'],
            dataFlag: '{"description":"x"}',
            dryRun: true,
        });
        await handlePlanUpdateRunInEntry(ctx);
        expect(client.updateRunInPlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'plan update-run-in-entry',
                runId: 77,
            }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['77'] });
        await expect(handlePlanUpdateRunInEntry(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body with wrong field type', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['77'], dataFlag: '{"description":42}' });
        await expect(handlePlanUpdateRunInEntry(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when run_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-1'], dataFlag: '{}' });
        await expect(handlePlanUpdateRunInEntry(ctx)).rejects.toThrow(/run_id/);
    });

    // Note on boundary inputs: `1e2` and `0x1` are *valid* JS positive
    // integers per `Number()` (100 and 1 respectively); the existing
    // `parseId()` accepts them intentionally. The cases below cover only
    // inputs that should be rejected: non-positive, non-integer, non-numeric,
    // and empty.
    it.each([
        ['0', '0'],
        ['-1', '-1'],
        ['1.5', '1.5'],
        ['abc', 'abc'],
        ['empty', ''],
    ])('rejects run_id boundary input (%s)', async (_label, raw) => {
        const { ctx } = buildCtx(buildClient(), { pathParams: [raw], dataFlag: '{}' });
        await expect(handlePlanUpdateRunInEntry(ctx)).rejects.toThrow(/run_id/);
    });
});

// ── plan add-run-to-entry / update-entry numeric ID boundaries ────────────

describe('plan-entry handlers — numeric ID boundary inputs', () => {
    it.each([
        ['0', '0'],
        ['-1', '-1'],
        ['1.5', '1.5'],
        ['abc', 'abc'],
        ['empty', ''],
    ])('plan add-run-to-entry: rejects plan_id=%s', async (_label, raw) => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: [raw, 'abc-def-uuid'],
            dataFlag: '{"config_ids":[1]}',
        });
        await expect(handlePlanAddRunToEntry(ctx)).rejects.toThrow(/plan_id/);
    });

    it.each([
        ['0', '0'],
        ['-1', '-1'],
        ['1.5', '1.5'],
        ['abc', 'abc'],
        ['empty', ''],
    ])('plan update-entry: rejects plan_id=%s', async (_label, raw) => {
        const { ctx } = buildCtx(buildClient(), { pathParams: [raw, 'abc-def-uuid'], dataFlag: '{}' });
        await expect(handlePlanUpdateEntry(ctx)).rejects.toThrow(/plan_id/);
    });
});
// ── plan close ───────────────────────────────────────────────────────────
// `plan close` is destructive (irreversible — TestRail has no `open_plan`).
// Mirrors the `run close` precedent: --yes gates; --dry-run wins over --yes;
// no body is ever consulted; non-positive plan_id rejects before --yes check.

describe('handlePlanClose', () => {
    it('calls client.closePlan with the parsed plan_id when --yes is passed', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50'], confirmDestructive: true });
        await handlePlanClose(ctx);
        expect(client.closePlan).toHaveBeenCalledWith(50);
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ is_completed: true }));
    });

    it('rejects without --yes (destructive: irreversible)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['50'] });
        await expect(handlePlanClose(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.closePlan).not.toHaveBeenCalled();
    });

    it('dry-run does not call the client and marks preview destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50'], dryRun: true });
        await handlePlanClose(ctx);
        expect(client.closePlan).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'plan close', planId: 50, destructive: true }),
        );
    });

    it('dry-run wins over --yes: no API call, preview still marks destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50'], dryRun: true, confirmDestructive: true });
        await handlePlanClose(ctx);
        expect(client.closePlan).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'plan close', planId: 50, destructive: true }),
        );
    });

    it('ignores any body provided for plan close (no body required)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['50'],
            dataFlag: '{"ignored":true}',
            confirmDestructive: true,
        });
        await handlePlanClose(ctx);
        expect(client.closePlan).toHaveBeenCalledWith(50);
    });

    // Note: "1e2" (→ 100) and "0x1" (→ 1) are coerced to valid positive
    // integers by Number() and pass parseId. The CLI's parseId boundary is
    // limited to non-integers, non-positives, and empty strings.
    it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])(
        'rejects non-positive-integer plan_id (%s) before checking --yes',
        async (raw) => {
            const { ctx } = buildCtx(buildClient(), { pathParams: [raw] });
            await expect(handlePlanClose(ctx)).rejects.toThrow(/plan_id/);
        },
    );

    it('rejects --soft (TestRail does not support soft on close_plan)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['50'], soft: true, confirmDestructive: true });
        await expect(handlePlanClose(ctx)).rejects.toThrow(/plan close does not support --soft/);
        expect(client.closePlan).not.toHaveBeenCalled();
    });
});

// ── plan delete ──────────────────────────────────────────────────────────
// TestRail does NOT support `?soft=1` on `delete_plan`. The handler therefore
// has no `--soft` branch; only --yes and --dry-run gates.

describe('handlePlanDelete', () => {
    it('calls client.deletePlan with the parsed plan_id when --yes is passed', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50'], confirmDestructive: true });
        await handlePlanDelete(ctx);
        expect(client.deletePlan).toHaveBeenCalledWith(50);
        expect(out).toHaveBeenCalledWith({ planId: 50, deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['50'] });
        await expect(handlePlanDelete(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deletePlan).not.toHaveBeenCalled();
    });

    it('dry-run does not call the client and marks preview destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50'], dryRun: true });
        await handlePlanDelete(ctx);
        expect(client.deletePlan).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'plan delete', planId: 50, destructive: true }),
        );
    });

    it('dry-run wins over --yes: no API call', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50'], dryRun: true, confirmDestructive: true });
        await handlePlanDelete(ctx);
        expect(client.deletePlan).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'plan delete', planId: 50, destructive: true }),
        );
    });

    // Note: "1e2" (→ 100) and "0x1" (→ 1) are coerced to valid positive
    // integers by Number() and pass parseId. The CLI's parseId boundary is
    // limited to non-integers, non-positives, and empty strings.
    it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])(
        'rejects non-positive-integer plan_id (%s) before checking --yes',
        async (raw) => {
            const { ctx } = buildCtx(buildClient(), { pathParams: [raw] });
            await expect(handlePlanDelete(ctx)).rejects.toThrow(/plan_id/);
        },
    );

    it('rejects --soft (TestRail does not support soft on delete_plan)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['50'], soft: true, confirmDestructive: true });
        await expect(handlePlanDelete(ctx)).rejects.toThrow(/plan delete does not support --soft/);
        expect(client.deletePlan).not.toHaveBeenCalled();
    });
});

// ── plan delete-entry ────────────────────────────────────────────────────
// entry_id is a UUID-style STRING, not a number — validated with the
// non-empty-string rule (mirrors `validateEntryId` on the client core).

describe('handlePlanDeleteEntry', () => {
    it('calls client.deletePlanEntry with parsed plan_id and entry_id', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50', 'abc-def-uuid'],
            confirmDestructive: true,
        });
        await handlePlanDeleteEntry(ctx);
        expect(client.deletePlanEntry).toHaveBeenCalledWith(50, 'abc-def-uuid');
        expect(out).toHaveBeenCalledWith({ planId: 50, entryId: 'abc-def-uuid', deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['50', 'abc-uuid'] });
        await expect(handlePlanDeleteEntry(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deletePlanEntry).not.toHaveBeenCalled();
    });

    it('dry-run does not call the client and marks preview destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['50', 'abc-uuid'], dryRun: true });
        await handlePlanDeleteEntry(ctx);
        expect(client.deletePlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'plan delete-entry',
                planId: 50,
                entryId: 'abc-uuid',
                destructive: true,
            }),
        );
    });

    it('dry-run wins over --yes: no API call', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50', 'abc-uuid'],
            dryRun: true,
            confirmDestructive: true,
        });
        await handlePlanDeleteEntry(ctx);
        expect(client.deletePlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'plan delete-entry', destructive: true }),
        );
    });

    // Note: "1e2" (→ 100) and "0x1" (→ 1) are coerced to valid positive
    // integers by Number() and pass parseId. The CLI's parseId boundary is
    // limited to non-integers, non-positives, and empty strings.
    it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])('rejects non-positive-integer plan_id (%s)', async (raw) => {
        const { ctx } = buildCtx(buildClient(), { pathParams: [raw, 'abc-uuid'] });
        await expect(handlePlanDeleteEntry(ctx)).rejects.toThrow(/plan_id/);
    });

    it('rejects missing entry_id (undefined positional)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50'], confirmDestructive: true });
        await expect(handlePlanDeleteEntry(ctx)).rejects.toThrow(/entry_id/);
    });

    it('rejects empty-string entry_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50', ''], confirmDestructive: true });
        await expect(handlePlanDeleteEntry(ctx)).rejects.toThrow(/entry_id/);
    });

    it('rejects whitespace-only entry_id', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['50', '   '], confirmDestructive: true });
        await expect(handlePlanDeleteEntry(ctx)).rejects.toThrow(/entry_id/);
    });

    it('trims whitespace from entry_id before calling the client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['50', '  abc-uuid  '],
            confirmDestructive: true,
        });
        await handlePlanDeleteEntry(ctx);
        expect(client.deletePlanEntry).toHaveBeenCalledWith(50, 'abc-uuid');
        expect(out).toHaveBeenCalledWith({ planId: 50, entryId: 'abc-uuid', deleted: true });
    });

    it('rejects --soft (TestRail does not support soft on delete_plan_entry)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['50', 'abc-uuid'],
            soft: true,
            confirmDestructive: true,
        });
        await expect(handlePlanDeleteEntry(ctx)).rejects.toThrow(/plan delete-entry does not support --soft/);
        expect(client.deletePlanEntry).not.toHaveBeenCalled();
    });
});

// ── plan delete-run-from-entry ───────────────────────────────────────────
// Takes only run_id (numeric). Entry/plan lookup is server-side.

describe('handlePlanDeleteRunFromEntry', () => {
    it('calls client.deleteRunFromPlanEntry with the parsed run_id when --yes is passed', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], confirmDestructive: true });
        await handlePlanDeleteRunFromEntry(ctx);
        expect(client.deleteRunFromPlanEntry).toHaveBeenCalledWith(42);
        expect(out).toHaveBeenCalledWith({ runId: 42, deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handlePlanDeleteRunFromEntry(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deleteRunFromPlanEntry).not.toHaveBeenCalled();
    });

    it('dry-run does not call the client and marks preview destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], dryRun: true });
        await handlePlanDeleteRunFromEntry(ctx);
        expect(client.deleteRunFromPlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'plan delete-run-from-entry',
                runId: 42,
                destructive: true,
            }),
        );
    });

    it('dry-run wins over --yes: no API call', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], dryRun: true, confirmDestructive: true });
        await handlePlanDeleteRunFromEntry(ctx);
        expect(client.deleteRunFromPlanEntry).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'plan delete-run-from-entry', destructive: true }),
        );
    });

    // Note: "1e2" (→ 100) and "0x1" (→ 1) are coerced to valid positive
    // integers by Number() and pass parseId. The CLI's parseId boundary is
    // limited to non-integers, non-positives, and empty strings.
    it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])(
        'rejects non-positive-integer run_id (%s) before checking --yes',
        async (raw) => {
            const { ctx } = buildCtx(buildClient(), { pathParams: [raw] });
            await expect(handlePlanDeleteRunFromEntry(ctx)).rejects.toThrow(/run_id/);
        },
    );

    it('rejects --soft (TestRail does not support soft on delete_run_from_plan_entry)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'], soft: true, confirmDestructive: true });
        await expect(handlePlanDeleteRunFromEntry(ctx)).rejects.toThrow(
            /plan delete-run-from-entry does not support --soft/,
        );
        expect(client.deleteRunFromPlanEntry).not.toHaveBeenCalled();
    });
});

// ── project add ──────────────────────────────────────────────────────────

describe('handleProjectAdd', () => {
    it('calls client.addProject with parsed payload (no path params)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { dataFlag: '{"name":"New","suite_mode":1}' });
        await handleProjectAdd(ctx);
        expect(client.addProject).toHaveBeenCalledWith(expect.objectContaining({ name: 'New', suite_mode: 1 }));
        expect(out).toHaveBeenCalledWith({ id: 7, name: 'New', suite_mode: 1, url: 'u' });
    });

    it('dry-run does not call client and emits preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { dataFlag: '{"name":"New"}', dryRun: true });
        await handleProjectAdd(ctx);
        expect(client.addProject).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'project add' }));
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), {});
        await expect(handleProjectAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { dataFlag: '{"suite_mode":1}' });
        await expect(handleProjectAdd(ctx)).rejects.toThrow(/validation failed/);
    });
});

// ── project update ────────────────────────────────────────────────────────

describe('handleProjectUpdate', () => {
    it('calls client.updateProject with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"Renamed"}' });
        await handleProjectUpdate(ctx);
        expect(client.updateProject).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Renamed' }));
        expect(out).toHaveBeenCalled();
    });

    it('accepts an empty body (all fields optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['7'], dataFlag: '{}' });
        await handleProjectUpdate(ctx);
        expect(client.updateProject).toHaveBeenCalledWith(7, expect.any(Object));
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"x"}', dryRun: true });
        await handleProjectUpdate(ctx);
        expect(client.updateProject).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'project update', projectId: 7 }),
        );
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{}' });
        await expect(handleProjectUpdate(ctx)).rejects.toThrow(/project_id/);
    });
});

// ── suite add ────────────────────────────────────────────────────────────

describe('handleSuiteAdd', () => {
    it('calls client.addSuite with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"S"}' });
        await handleSuiteAdd(ctx);
        expect(client.addSuite).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'S' }));
        expect(out).toHaveBeenCalled();
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"S"}', dryRun: true });
        await handleSuiteAdd(ctx);
        expect(client.addSuite).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, action: 'suite add', projectId: 7 }));
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'] });
        await expect(handleSuiteAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{"description":"oops"}' });
        await expect(handleSuiteAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{"name":"S"}' });
        await expect(handleSuiteAdd(ctx)).rejects.toThrow(/project_id/);
    });
});

// ── suite update ────────────────────────────────────────────────────────

describe('handleSuiteUpdate', () => {
    it('calls client.updateSuite with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['22'], dataFlag: '{"name":"S2"}' });
        await handleSuiteUpdate(ctx);
        expect(client.updateSuite).toHaveBeenCalledWith(22, expect.objectContaining({ name: 'S2' }));
        expect(out).toHaveBeenCalled();
    });

    it('accepts an empty body (all fields optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['22'], dataFlag: '{}' });
        await handleSuiteUpdate(ctx);
        expect(client.updateSuite).toHaveBeenCalledWith(22, expect.any(Object));
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['22'], dataFlag: '{"name":"x"}', dryRun: true });
        await handleSuiteUpdate(ctx);
        expect(client.updateSuite).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'suite update', suiteId: 22 }),
        );
    });

    it('rejects when suite_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['bad'], dataFlag: '{}' });
        await expect(handleSuiteUpdate(ctx)).rejects.toThrow(/suite_id/);
    });
});

// ── section add ─────────────────────────────────────────────────────────

describe('handleSectionAdd', () => {
    it('calls client.addSection with parsed payload (suite_id passes through for multi-suite)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"Sec","suite_id":22}' });
        await handleSectionAdd(ctx);
        expect(client.addSection).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Sec', suite_id: 22 }));
        expect(out).toHaveBeenCalled();
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"Sec"}', dryRun: true });
        await handleSectionAdd(ctx);
        expect(client.addSection).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'section add', projectId: 7 }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'] });
        await expect(handleSectionAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{"suite_id":22}' });
        await expect(handleSectionAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-1'], dataFlag: '{"name":"Sec"}' });
        await expect(handleSectionAdd(ctx)).rejects.toThrow(/project_id/);
    });
});

// ── section update ──────────────────────────────────────────────────────

describe('handleSectionUpdate', () => {
    it('calls client.updateSection with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['33'], dataFlag: '{"name":"Sec2"}' });
        await handleSectionUpdate(ctx);
        expect(client.updateSection).toHaveBeenCalledWith(33, expect.objectContaining({ name: 'Sec2' }));
        expect(out).toHaveBeenCalled();
    });

    it('accepts an empty body', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['33'], dataFlag: '{}' });
        await handleSectionUpdate(ctx);
        expect(client.updateSection).toHaveBeenCalledWith(33, expect.any(Object));
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['33'], dataFlag: '{"name":"x"}', dryRun: true });
        await handleSectionUpdate(ctx);
        expect(client.updateSection).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'section update', sectionId: 33 }),
        );
    });

    it('rejects when section_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{}' });
        await expect(handleSectionUpdate(ctx)).rejects.toThrow(/section_id/);
    });
});

// ── milestone add ───────────────────────────────────────────────────────

describe('handleMilestoneAdd', () => {
    it('calls client.addMilestone with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['7'],
            dataFlag: '{"name":"M","due_on":1700000000}',
        });
        await handleMilestoneAdd(ctx);
        expect(client.addMilestone).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'M', due_on: 1700000000 }));
        expect(out).toHaveBeenCalled();
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"M"}', dryRun: true });
        await handleMilestoneAdd(ctx);
        expect(client.addMilestone).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'milestone add', projectId: 7 }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'] });
        await expect(handleMilestoneAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{"refs":"R-1"}' });
        await expect(handleMilestoneAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{"name":"M"}' });
        await expect(handleMilestoneAdd(ctx)).rejects.toThrow(/project_id/);
    });
});

// ── milestone update ───────────────────────────────────────────────────

describe('handleMilestoneUpdate', () => {
    it('calls client.updateMilestone with parsed payload (state toggle)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['44'], dataFlag: '{"is_completed":true}' });
        await handleMilestoneUpdate(ctx);
        expect(client.updateMilestone).toHaveBeenCalledWith(44, expect.objectContaining({ is_completed: true }));
        expect(out).toHaveBeenCalled();
    });

    it('accepts an empty body', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['44'], dataFlag: '{}' });
        await handleMilestoneUpdate(ctx);
        expect(client.updateMilestone).toHaveBeenCalledWith(44, expect.any(Object));
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['44'], dataFlag: '{"is_started":true}', dryRun: true });
        await handleMilestoneUpdate(ctx);
        expect(client.updateMilestone).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'milestone update', milestoneId: 44 }),
        );
    });

    it('rejects when milestone_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-2'], dataFlag: '{}' });
        await expect(handleMilestoneUpdate(ctx)).rejects.toThrow(/milestone_id/);
    });
});

// ── Destructive single-entity deletes ─────────────────────────────────────
//
// Six handlers mirroring the locked-in `--yes`/`--dry-run` pattern from
// `attachment delete`, `case delete-bulk`, and `run close`. Four of them
// (case/run/section/suite) additionally accept `--soft` for TestRail's
// server-side preview; milestone/project reject `--soft` explicitly.

describe('handleCaseDelete', () => {
    it('hard-delete: calls client.deleteCase({soft:false}) with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], confirmDestructive: true });
        await handleCaseDelete(ctx);
        expect(client.deleteCase).toHaveBeenCalledWith(42, { soft: false });
        expect(out).toHaveBeenCalledWith({ caseId: 42, soft: false, deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['42'] });
        await expect(handleCaseDelete(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deleteCase).not.toHaveBeenCalled();
    });

    it('dry-run wins over --yes (no API call, preview emits destructive:true)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], confirmDestructive: true, dryRun: true });
        await handleCaseDelete(ctx);
        expect(client.deleteCase).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'case delete',
                caseId: 42,
                soft: false,
                destructive: true,
            }),
        );
    });

    it('soft preview: calls deleteCase({soft:true}) and emits preview block', async () => {
        const client = buildClient();
        client.deleteCase.mockResolvedValueOnce({ affected_tests: 5 });
        const { ctx, out } = buildCtx(client, { pathParams: ['42'], confirmDestructive: true, soft: true });
        await handleCaseDelete(ctx);
        expect(client.deleteCase).toHaveBeenCalledWith(42, { soft: true });
        expect(out).toHaveBeenCalledWith({ caseId: 42, soft: true, deleted: false, preview: { affected_tests: 5 } });
    });

    it('dry-run with --soft emits soft:true preview without API call', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['42'],
            confirmDestructive: true,
            dryRun: true,
            soft: true,
        });
        await handleCaseDelete(ctx);
        expect(client.deleteCase).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'case delete', soft: true, destructive: true }),
        );
    });

    it('rejects when case_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], confirmDestructive: true });
        await expect(handleCaseDelete(ctx)).rejects.toThrow(/case_id/);
    });
});

describe('handleRunDelete', () => {
    it('hard-delete: calls client.deleteRun({soft:false}) with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['17'], confirmDestructive: true });
        await handleRunDelete(ctx);
        expect(client.deleteRun).toHaveBeenCalledWith(17, { soft: false });
        expect(out).toHaveBeenCalledWith({ runId: 17, soft: false, deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['17'] });
        await expect(handleRunDelete(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deleteRun).not.toHaveBeenCalled();
    });

    it('dry-run wins over --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['17'], confirmDestructive: true, dryRun: true });
        await handleRunDelete(ctx);
        expect(client.deleteRun).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'run delete', runId: 17, destructive: true }),
        );
    });

    it('soft preview', async () => {
        const client = buildClient();
        client.deleteRun.mockResolvedValueOnce({ affected_tests: 12 });
        const { ctx, out } = buildCtx(client, { pathParams: ['17'], confirmDestructive: true, soft: true });
        await handleRunDelete(ctx);
        expect(client.deleteRun).toHaveBeenCalledWith(17, { soft: true });
        expect(out).toHaveBeenCalledWith({ runId: 17, soft: true, deleted: false, preview: { affected_tests: 12 } });
    });

    it('rejects when run_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], confirmDestructive: true });
        await expect(handleRunDelete(ctx)).rejects.toThrow(/run_id/);
    });
});

describe('handleSuiteDelete', () => {
    it('hard-delete: calls client.deleteSuite({soft:false}) with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['5'], confirmDestructive: true });
        await handleSuiteDelete(ctx);
        expect(client.deleteSuite).toHaveBeenCalledWith(5, { soft: false });
        expect(out).toHaveBeenCalledWith({ suiteId: 5, soft: false, deleted: true });
    });

    it('rejects without --yes', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['5'] });
        await expect(handleSuiteDelete(ctx)).rejects.toThrow(/--yes to confirm/);
    });

    it('dry-run wins over --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['5'], confirmDestructive: true, dryRun: true });
        await handleSuiteDelete(ctx);
        expect(client.deleteSuite).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'suite delete', suiteId: 5, destructive: true }),
        );
    });

    it('soft preview', async () => {
        const client = buildClient();
        client.deleteSuite.mockResolvedValueOnce({ affected_sections: 8, affected_cases: 99 });
        const { ctx, out } = buildCtx(client, { pathParams: ['5'], confirmDestructive: true, soft: true });
        await handleSuiteDelete(ctx);
        expect(client.deleteSuite).toHaveBeenCalledWith(5, { soft: true });
        expect(out).toHaveBeenCalledWith({
            suiteId: 5,
            soft: true,
            deleted: false,
            preview: { affected_sections: 8, affected_cases: 99 },
        });
    });

    it('rejects when suite_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-1'], confirmDestructive: true });
        await expect(handleSuiteDelete(ctx)).rejects.toThrow(/suite_id/);
    });
});

describe('handleSectionDelete', () => {
    it('hard-delete: calls client.deleteSection({soft:false}) with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['9'], confirmDestructive: true });
        await handleSectionDelete(ctx);
        expect(client.deleteSection).toHaveBeenCalledWith(9, { soft: false });
        expect(out).toHaveBeenCalledWith({ sectionId: 9, soft: false, deleted: true });
    });

    it('rejects without --yes', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['9'] });
        await expect(handleSectionDelete(ctx)).rejects.toThrow(/--yes to confirm/);
    });

    it('dry-run wins over --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['9'], confirmDestructive: true, dryRun: true });
        await handleSectionDelete(ctx);
        expect(client.deleteSection).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'section delete', sectionId: 9, destructive: true }),
        );
    });

    it('soft preview', async () => {
        const client = buildClient();
        client.deleteSection.mockResolvedValueOnce({ affected_cases: 3 });
        const { ctx, out } = buildCtx(client, { pathParams: ['9'], confirmDestructive: true, soft: true });
        await handleSectionDelete(ctx);
        expect(client.deleteSection).toHaveBeenCalledWith(9, { soft: true });
        expect(out).toHaveBeenCalledWith({
            sectionId: 9,
            soft: true,
            deleted: false,
            preview: { affected_cases: 3 },
        });
    });

    it('rejects when section_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['x'], confirmDestructive: true });
        await expect(handleSectionDelete(ctx)).rejects.toThrow(/section_id/);
    });
});

describe('handleMilestoneDelete', () => {
    it('hard-delete: calls client.deleteMilestone with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'], confirmDestructive: true });
        await handleMilestoneDelete(ctx);
        expect(client.deleteMilestone).toHaveBeenCalledWith(3);
        expect(out).toHaveBeenCalledWith({ milestoneId: 3, deleted: true });
    });

    it('rejects without --yes', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['3'] });
        await expect(handleMilestoneDelete(ctx)).rejects.toThrow(/--yes to confirm/);
    });

    it('dry-run wins over --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'], confirmDestructive: true, dryRun: true });
        await handleMilestoneDelete(ctx);
        expect(client.deleteMilestone).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'milestone delete', milestoneId: 3, destructive: true }),
        );
    });

    it('rejects --soft (TestRail does not support soft on delete_milestone)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['3'], confirmDestructive: true, soft: true });
        await expect(handleMilestoneDelete(ctx)).rejects.toThrow(/milestone delete does not support --soft/);
    });

    it('rejects --soft even in dry-run mode (intent is unambiguous)', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['3'],
            confirmDestructive: true,
            dryRun: true,
            soft: true,
        });
        await expect(handleMilestoneDelete(ctx)).rejects.toThrow(/milestone delete does not support --soft/);
    });

    it('rejects when milestone_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-1'], confirmDestructive: true });
        await expect(handleMilestoneDelete(ctx)).rejects.toThrow(/milestone_id/);
    });
});

describe('handleProjectDelete', () => {
    it('hard-delete: calls client.deleteProject with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['1'], confirmDestructive: true });
        await handleProjectDelete(ctx);
        expect(client.deleteProject).toHaveBeenCalledWith(1);
        expect(out).toHaveBeenCalledWith({ projectId: 1, deleted: true });
    });

    it('rejects without --yes', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['1'] });
        await expect(handleProjectDelete(ctx)).rejects.toThrow(/--yes to confirm/);
    });

    it('dry-run wins over --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['1'], confirmDestructive: true, dryRun: true });
        await handleProjectDelete(ctx);
        expect(client.deleteProject).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'project delete', projectId: 1, destructive: true }),
        );
    });

    it('rejects --soft (TestRail does not support soft on delete_project)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['1'], confirmDestructive: true, soft: true });
        await expect(handleProjectDelete(ctx)).rejects.toThrow(/project delete does not support --soft/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], confirmDestructive: true });
        await expect(handleProjectDelete(ctx)).rejects.toThrow(/project_id/);
    });
});

// ── variable add ──────────────────────────────────────────────────────────

describe('handleVariableAdd', () => {
    it('calls client.addVariable with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"env"}' });
        await handleVariableAdd(ctx);
        expect(client.addVariable).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'env' }));
        expect(out).toHaveBeenCalledWith({ id: 55, name: 'env' });
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"env"}', dryRun: true });
        await handleVariableAdd(ctx);
        expect(client.addVariable).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'variable add', projectId: 7 }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'] });
        await expect(handleVariableAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{}' });
        await expect(handleVariableAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{"name":42}' });
        await expect(handleVariableAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{"name":"env"}' });
        await expect(handleVariableAdd(ctx)).rejects.toThrow(/project_id/);
    });

    it('passes custom_* fields through unchanged (zObject passthrough)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['7'],
            dataFlag: '{"name":"env","custom_team":"qa","custom_priority":3}',
        });
        await handleVariableAdd(ctx);
        expect(client.addVariable).toHaveBeenCalledWith(
            7,
            expect.objectContaining({ name: 'env', custom_team: 'qa', custom_priority: 3 }),
        );
    });
});

// ── shared-step add ───────────────────────────────────────────────────────

describe('handleSharedStepAdd', () => {
    it('calls client.addSharedStep with parsed payload and outputs result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['1'], dataFlag: '{"title":"Login Steps"}' });
        await handleSharedStepAdd(ctx);
        expect(client.addSharedStep).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Login Steps' }));
        expect(out).toHaveBeenCalledWith({ id: 55, title: 'Login Steps', project_id: 1 });
    });

    it('dry-run does not call the client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['1'],
            dataFlag: '{"title":"x"}',
            dryRun: true,
        });
        await handleSharedStepAdd(ctx);
        expect(client.addSharedStep).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'shared-step add', projectId: 1 }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['1'] });
        await expect(handleSharedStepAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body that fails Zod validation (non-string title)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['1'], dataFlag: '{"title":42}' });
        await expect(handleSharedStepAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body missing required title', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['1'], dataFlag: '{}' });
        await expect(handleSharedStepAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{"title":"x"}' });
        await expect(handleSharedStepAdd(ctx)).rejects.toThrow(/project_id/);
    });

    it('passes custom_steps_separated array through', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['1'],
            dataFlag: '{"title":"x","custom_steps_separated":[{"content":"step 1"}]}',
        });
        await handleSharedStepAdd(ctx);
        expect(client.addSharedStep).toHaveBeenCalledWith(
            1,
            expect.objectContaining({
                title: 'x',
                custom_steps_separated: [{ content: 'step 1' }],
            }),
        );
    });
});

// ── variable update ───────────────────────────────────────────────────────

describe('handleVariableUpdate', () => {
    it('calls client.updateVariable with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], dataFlag: '{"name":"region"}' });
        await handleVariableUpdate(ctx);
        expect(client.updateVariable).toHaveBeenCalledWith(55, expect.objectContaining({ name: 'region' }));
        expect(out).toHaveBeenCalled();
    });

    it('accepts an empty body (name optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['55'], dataFlag: '{}' });
        await handleVariableUpdate(ctx);
        expect(client.updateVariable).toHaveBeenCalledWith(55, expect.any(Object));
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], dataFlag: '{"name":"x"}', dryRun: true });
        await handleVariableUpdate(ctx);
        expect(client.updateVariable).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'variable update', variableId: 55 }),
        );
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'], dataFlag: '{"name":1}' });
        await expect(handleVariableUpdate(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when variable_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-2'], dataFlag: '{}' });
        await expect(handleVariableUpdate(ctx)).rejects.toThrow(/variable_id/);
    });
});

// ── variable delete (destructive; --soft NOT supported) ───────────────────

describe('handleVariableDelete', () => {
    it('hard-delete: calls client.deleteVariable with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], confirmDestructive: true });
        await handleVariableDelete(ctx);
        expect(client.deleteVariable).toHaveBeenCalledWith(55);
        expect(out).toHaveBeenCalledWith({ variableId: 55, deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['55'] });
        await expect(handleVariableDelete(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deleteVariable).not.toHaveBeenCalled();
    });

    it('dry-run wins over --yes (no API call, preview emits destructive:true)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], confirmDestructive: true, dryRun: true });
        await handleVariableDelete(ctx);
        expect(client.deleteVariable).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'variable delete', variableId: 55, destructive: true }),
        );
    });

    it('rejects --soft (TestRail does not support soft on delete_variable)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'], confirmDestructive: true, soft: true });
        await expect(handleVariableDelete(ctx)).rejects.toThrow(/variable delete does not support --soft/);
    });

    it('dry-run wins over --soft (preview emitted, --soft never reached)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['55'],
            confirmDestructive: true,
            dryRun: true,
            soft: true,
        });
        await handleVariableDelete(ctx);
        expect(client.deleteVariable).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'variable delete', variableId: 55, destructive: true }),
        );
    });

    it('rejects when variable_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], confirmDestructive: true });
        await expect(handleVariableDelete(ctx)).rejects.toThrow(/variable_id/);
    });
});

// ── shared-step update ────────────────────────────────────────────────────

describe('handleSharedStepUpdate', () => {
    it('calls client.updateSharedStep with parsed payload and outputs result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['55'],
            dataFlag: '{"title":"Login Steps (v2)"}',
        });
        await handleSharedStepUpdate(ctx);
        expect(client.updateSharedStep).toHaveBeenCalledWith(
            55,
            expect.objectContaining({ title: 'Login Steps (v2)' }),
        );
        expect(out).toHaveBeenCalled();
    });

    it('accepts an empty update body ({} is valid for UpdateSharedStepPayload)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['55'], dataFlag: '{}' });
        await handleSharedStepUpdate(ctx);
        expect(client.updateSharedStep).toHaveBeenCalledWith(55, expect.any(Object));
    });

    it('dry-run does not call the client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['55'],
            dataFlag: '{"title":"x"}',
            dryRun: true,
        });
        await handleSharedStepUpdate(ctx);
        expect(client.updateSharedStep).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'shared-step update', sharedStepId: 55 }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'] });
        await expect(handleSharedStepUpdate(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body that fails Zod validation (non-string title)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'], dataFlag: '{"title":42}' });
        await expect(handleSharedStepUpdate(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when shared_step_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{"title":"x"}' });
        await expect(handleSharedStepUpdate(ctx)).rejects.toThrow(/shared_step_id/);
    });

    it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])(
        'rejects non-positive-integer shared_step_id (%s) before touching body',
        async (raw) => {
            const client = buildClient();
            const { ctx } = buildCtx(client, { pathParams: [raw], dataFlag: '{"title":"x"}' });
            await expect(handleSharedStepUpdate(ctx)).rejects.toThrow(/shared_step_id/);
            expect(client.updateSharedStep).not.toHaveBeenCalled();
        },
    );
});

// ── shared-step delete (destructive; no --soft) ──────────────────────────
// TestRail does NOT support `?soft=1` on `delete_shared_step`. The handler
// therefore has no `--soft` branch; only --yes and --dry-run gates.

describe('handleSharedStepDelete', () => {
    it('calls client.deleteSharedStep with the parsed shared_step_id when --yes is passed', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], confirmDestructive: true });
        await handleSharedStepDelete(ctx);
        expect(client.deleteSharedStep).toHaveBeenCalledWith(55);
        expect(out).toHaveBeenCalledWith({ sharedStepId: 55, deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['55'] });
        await expect(handleSharedStepDelete(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deleteSharedStep).not.toHaveBeenCalled();
    });

    it('dry-run does not call the client and marks preview destructive', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], dryRun: true });
        await handleSharedStepDelete(ctx);
        expect(client.deleteSharedStep).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'shared-step delete',
                sharedStepId: 55,
                destructive: true,
            }),
        );
    });

    it('dry-run wins over --yes: no API call', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], dryRun: true, confirmDestructive: true });
        await handleSharedStepDelete(ctx);
        expect(client.deleteSharedStep).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'shared-step delete',
                sharedStepId: 55,
                destructive: true,
            }),
        );
    });

    it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])(
        'rejects non-positive-integer shared_step_id (%s) before checking --yes',
        async (raw) => {
            const { ctx } = buildCtx(buildClient(), { pathParams: [raw] });
            await expect(handleSharedStepDelete(ctx)).rejects.toThrow(/shared_step_id/);
        },
    );

    it('rejects --soft (TestRail does not support soft on delete_shared_step)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['55'], soft: true, confirmDestructive: true });
        await expect(handleSharedStepDelete(ctx)).rejects.toThrow(/shared-step delete does not support --soft/);
        expect(client.deleteSharedStep).not.toHaveBeenCalled();
    });

    it('dry-run wins over --soft: emits preview without API call (no --soft rejection)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['55'],
            dryRun: true,
            soft: true,
            confirmDestructive: true,
        });
        await handleSharedStepDelete(ctx);
        expect(client.deleteSharedStep).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'shared-step delete',
                sharedStepId: 55,
                destructive: true,
            }),
        );
    });
});

// ── configuration-group add/update/delete ─────────────────────────────────

describe('handleConfigurationGroupAdd', () => {
    it('calls client.addConfigurationGroup with parsed payload and emits result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"Browsers"}' });
        await handleConfigurationGroupAdd(ctx);
        expect(client.addConfigurationGroup).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Browsers' }));
        expect(out).toHaveBeenCalledWith({ id: 55, name: 'Browsers', project_id: 7, configs: [] });
    });

    it('dry-run does not call client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['7'],
            dataFlag: '{"name":"Browsers"}',
            dryRun: true,
        });
        await handleConfigurationGroupAdd(ctx);
        expect(client.addConfigurationGroup).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'configuration-group add', projectId: 7 }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'] });
        await expect(handleConfigurationGroupAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body without name (Zod failure)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{}' });
        await expect(handleConfigurationGroupAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{"name":42}' });
        await expect(handleConfigurationGroupAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{"name":"x"}' });
        await expect(handleConfigurationGroupAdd(ctx)).rejects.toThrow(/project_id/);
    });

    it('rejects when project_id is exponential-notation 1e2 (tightened parseId)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['1e2'], dataFlag: '{"name":"x"}' });
        await expect(handleConfigurationGroupAdd(ctx)).rejects.toThrow(/project_id/);
    });
});

describe('handleConfigurationGroupUpdate', () => {
    it('calls client.updateConfigurationGroup with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['55'],
            dataFlag: '{"name":"Desktop Browsers"}',
        });
        await handleConfigurationGroupUpdate(ctx);
        expect(client.updateConfigurationGroup).toHaveBeenCalledWith(
            55,
            expect.objectContaining({ name: 'Desktop Browsers' }),
        );
        expect(out).toHaveBeenCalled();
    });

    it('accepts empty update body ({} is valid)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['55'], dataFlag: '{}' });
        await handleConfigurationGroupUpdate(ctx);
        expect(client.updateConfigurationGroup).toHaveBeenCalledWith(55, expect.any(Object));
    });

    it('dry-run does not call client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['55'],
            dataFlag: '{"name":"x"}',
            dryRun: true,
        });
        await handleConfigurationGroupUpdate(ctx);
        expect(client.updateConfigurationGroup).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'configuration-group update', configGroupId: 55 }),
        );
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'], dataFlag: '{"name":true}' });
        await expect(handleConfigurationGroupUpdate(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when config_group_id is zero', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{}' });
        await expect(handleConfigurationGroupUpdate(ctx)).rejects.toThrow(/config_group_id/);
    });
});

describe('handleConfigurationGroupDelete', () => {
    it('hard-delete: calls client.deleteConfigurationGroup with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], confirmDestructive: true });
        await handleConfigurationGroupDelete(ctx);
        expect(client.deleteConfigurationGroup).toHaveBeenCalledWith(55);
        expect(out).toHaveBeenCalledWith({ configGroupId: 55, deleted: true });
    });

    it('rejects without --yes', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'] });
        await expect(handleConfigurationGroupDelete(ctx)).rejects.toThrow(/--yes to confirm/);
    });

    it('dry-run wins over --yes (no API call; preview marked destructive)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['55'],
            confirmDestructive: true,
            dryRun: true,
        });
        await handleConfigurationGroupDelete(ctx);
        expect(client.deleteConfigurationGroup).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'configuration-group delete',
                configGroupId: 55,
                destructive: true,
            }),
        );
    });

    it('rejects --soft (TestRail does not support soft on delete_config_group)', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['55'],
            confirmDestructive: true,
            soft: true,
        });
        await expect(handleConfigurationGroupDelete(ctx)).rejects.toThrow(
            /configuration-group delete does not support --soft/,
        );
    });

    it('rejects --soft even in dry-run mode (intent is unambiguous)', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['55'],
            confirmDestructive: true,
            dryRun: true,
            soft: true,
        });
        await expect(handleConfigurationGroupDelete(ctx)).rejects.toThrow(
            /configuration-group delete does not support --soft/,
        );
    });

    it('rejects when config_group_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-1'], confirmDestructive: true });
        await expect(handleConfigurationGroupDelete(ctx)).rejects.toThrow(/config_group_id/);
    });
});

// ── configuration add/update/delete ──────────────────────────────────────

describe('handleConfigurationAdd', () => {
    it('calls client.addConfiguration with parsed payload and emits result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['55'], dataFlag: '{"name":"Chrome"}' });
        await handleConfigurationAdd(ctx);
        expect(client.addConfiguration).toHaveBeenCalledWith(55, expect.objectContaining({ name: 'Chrome' }));
        expect(out).toHaveBeenCalledWith({ id: 66, name: 'Chrome', group_id: 55 });
    });

    it('dry-run does not call client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['55'],
            dataFlag: '{"name":"Chrome"}',
            dryRun: true,
        });
        await handleConfigurationAdd(ctx);
        expect(client.addConfiguration).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'configuration add', configGroupId: 55 }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'] });
        await expect(handleConfigurationAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body without name (Zod failure)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'], dataFlag: '{}' });
        await expect(handleConfigurationAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['55'], dataFlag: '{"name":42}' });
        await expect(handleConfigurationAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when config_group_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{"name":"x"}' });
        await expect(handleConfigurationAdd(ctx)).rejects.toThrow(/config_group_id/);
    });
});

describe('handleConfigurationUpdate', () => {
    it('calls client.updateConfiguration with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['66'],
            dataFlag: '{"name":"Chrome (stable)"}',
        });
        await handleConfigurationUpdate(ctx);
        expect(client.updateConfiguration).toHaveBeenCalledWith(
            66,
            expect.objectContaining({ name: 'Chrome (stable)' }),
        );
        expect(out).toHaveBeenCalled();
    });

    it('accepts empty update body ({} is valid)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['66'], dataFlag: '{}' });
        await handleConfigurationUpdate(ctx);
        expect(client.updateConfiguration).toHaveBeenCalledWith(66, expect.any(Object));
    });

    it('dry-run does not call client and emits a preview', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['66'],
            dataFlag: '{"name":"x"}',
            dryRun: true,
        });
        await handleConfigurationUpdate(ctx);
        expect(client.updateConfiguration).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'configuration update', configId: 66 }),
        );
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['66'], dataFlag: '{"name":[]}' });
        await expect(handleConfigurationUpdate(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when config_id is zero', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], dataFlag: '{}' });
        await expect(handleConfigurationUpdate(ctx)).rejects.toThrow(/config_id/);
    });
});

describe('handleConfigurationDelete', () => {
    it('hard-delete: calls client.deleteConfiguration with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['66'], confirmDestructive: true });
        await handleConfigurationDelete(ctx);
        expect(client.deleteConfiguration).toHaveBeenCalledWith(66);
        expect(out).toHaveBeenCalledWith({ configId: 66, deleted: true });
    });

    it('rejects without --yes', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['66'] });
        await expect(handleConfigurationDelete(ctx)).rejects.toThrow(/--yes to confirm/);
    });

    it('dry-run wins over --yes (no API call; preview marked destructive)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['66'],
            confirmDestructive: true,
            dryRun: true,
        });
        await handleConfigurationDelete(ctx);
        expect(client.deleteConfiguration).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'configuration delete',
                configId: 66,
                destructive: true,
            }),
        );
    });

    it('rejects --soft (TestRail does not support soft on delete_config)', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['66'],
            confirmDestructive: true,
            soft: true,
        });
        await expect(handleConfigurationDelete(ctx)).rejects.toThrow(/configuration delete does not support --soft/);
    });

    it('rejects --soft even in dry-run mode (intent is unambiguous)', async () => {
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['66'],
            confirmDestructive: true,
            dryRun: true,
            soft: true,
        });
        await expect(handleConfigurationDelete(ctx)).rejects.toThrow(/configuration delete does not support --soft/);
    });

    it('rejects when config_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['1.5'], confirmDestructive: true });
        await expect(handleConfigurationDelete(ctx)).rejects.toThrow(/config_id/);
    });
});

// ── group add (no path param) ─────────────────────────────────────────────

describe('handleGroupAdd', () => {
    it('calls client.addGroup with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { dataFlag: '{"name":"QA","user_ids":[1,2]}' });
        await handleGroupAdd(ctx);
        expect(client.addGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'QA', user_ids: [1, 2] }));
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ id: 77, name: 'QA Group' }));
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { dataFlag: '{"name":"QA"}', dryRun: true });
        await handleGroupAdd(ctx);
        expect(client.addGroup).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'group add',
                payload: expect.objectContaining({ name: 'QA' }) as unknown,
                source: 'data',
            }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), {});
        await expect(handleGroupAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { dataFlag: '{}' });
        await expect(handleGroupAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { dataFlag: '{"name":42}' });
        await expect(handleGroupAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body with non-array user_ids', async () => {
        const { ctx } = buildCtx(buildClient(), { dataFlag: '{"name":"QA","user_ids":"nope"}' });
        await expect(handleGroupAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects extra positional args (no path param expected)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"QA"}' });
        await expect(handleGroupAdd(ctx)).rejects.toThrow(/no positional arguments/);
        expect(client.addGroup).not.toHaveBeenCalled();
    });

    it('passes custom_* fields through unchanged (zObject passthrough)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            dataFlag: '{"name":"QA","custom_owner":"u","custom_priority":3}',
        });
        await handleGroupAdd(ctx);
        expect(client.addGroup).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'QA', custom_owner: 'u', custom_priority: 3 }),
        );
    });
});

// ── group update ──────────────────────────────────────────────────────────

describe('handleGroupUpdate', () => {
    it('calls client.updateGroup with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], dataFlag: '{"name":"Renamed"}' });
        await handleGroupUpdate(ctx);
        expect(client.updateGroup).toHaveBeenCalledWith(77, expect.objectContaining({ name: 'Renamed' }));
        expect(out).toHaveBeenCalled();
    });

    it('accepts an empty body (all fields optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['77'], dataFlag: '{}' });
        await handleGroupUpdate(ctx);
        expect(client.updateGroup).toHaveBeenCalledWith(77, expect.any(Object));
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['77'] });
        await expect(handleGroupUpdate(ctx)).rejects.toThrow(/Body required/);
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], dataFlag: '{"name":"x"}', dryRun: true });
        await handleGroupUpdate(ctx);
        expect(client.updateGroup).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'group update', groupId: 77 }),
        );
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['77'], dataFlag: '{"name":1}' });
        await expect(handleGroupUpdate(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when group_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-2'], dataFlag: '{}' });
        await expect(handleGroupUpdate(ctx)).rejects.toThrow(/group_id/);
    });

    it.each([['0'], ['-1'], ['1.5'], ['abc'], [''], ['1e2'], ['0x1']])(
        'rejects non-positive-integer group_id (%s) before touching body',
        async (raw) => {
            const client = buildClient();
            const { ctx } = buildCtx(client, { pathParams: [raw], dataFlag: '{"name":"x"}' });
            await expect(handleGroupUpdate(ctx)).rejects.toThrow(/group_id/);
            expect(client.updateGroup).not.toHaveBeenCalled();
        },
    );
});

// ── group delete (destructive; --soft NOT supported) ──────────────────────
// Uses the canonical milestone/project ordering: `parseId → --soft reject
// → --dry-run → --yes`. Per ARCH #9 the codebase has two patterns shipped;
// this PR pins the canonical path deliberately. The behaviour difference
// vs the newer "dry-run first" order: `--soft` reject fires even with
// `--dry-run --yes --soft`, surfacing intent unambiguously instead of
// short-circuiting to a no-op preview.

describe('handleGroupDelete', () => {
    it('hard-delete: calls client.deleteGroup with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], confirmDestructive: true });
        await handleGroupDelete(ctx);
        expect(client.deleteGroup).toHaveBeenCalledWith(77);
        expect(out).toHaveBeenCalledWith({ groupId: 77, deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['77'] });
        await expect(handleGroupDelete(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deleteGroup).not.toHaveBeenCalled();
    });

    it('dry-run wins over --yes (no API call, preview emits destructive:true)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], confirmDestructive: true, dryRun: true });
        await handleGroupDelete(ctx);
        expect(client.deleteGroup).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'group delete', groupId: 77, destructive: true }),
        );
    });

    it('rejects --soft (TestRail does not support soft on delete_group)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['77'], confirmDestructive: true, soft: true });
        await expect(handleGroupDelete(ctx)).rejects.toThrow(/group delete does not support --soft/);
    });

    it('rejects --soft even in dry-run mode (canonical order: --soft check precedes dry-run)', async () => {
        // Canonical milestone/project pattern: `parseId → --soft reject → --dry-run → --yes`.
        // The --soft rejection fires before the dry-run branch, so even
        // `--dry-run --yes --soft` surfaces the intent mismatch instead of
        // silently emitting a preview. Contrasts with the newer "dry-run
        // first" order used by `variable delete` / `shared-step delete` /
        // `plan delete*`; harmonization is tracked as ARCH #9.
        const { ctx } = buildCtx(buildClient(), {
            pathParams: ['77'],
            confirmDestructive: true,
            dryRun: true,
            soft: true,
        });
        await expect(handleGroupDelete(ctx)).rejects.toThrow(/group delete does not support --soft/);
    });

    it('rejects when group_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['0'], confirmDestructive: true });
        await expect(handleGroupDelete(ctx)).rejects.toThrow(/group_id/);
    });
});

// ── dataset add ───────────────────────────────────────────────────────────

describe('handleDatasetAdd', () => {
    it('calls client.addDataset with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'], dataFlag: '{"name":"Staging matrix"}' });
        await handleDatasetAdd(ctx);
        expect(client.addDataset).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Staging matrix' }));
        expect(out).toHaveBeenCalledWith({ id: 77, name: 'Staging matrix', project_id: 7 });
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['7'],
            dataFlag: '{"name":"Staging matrix"}',
            dryRun: true,
        });
        await handleDatasetAdd(ctx);
        expect(client.addDataset).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'dataset add', projectId: 7 }),
        );
    });

    it('rejects missing body', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'] });
        await expect(handleDatasetAdd(ctx)).rejects.toThrow(/Body required/);
    });

    it('rejects body missing required name', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{}' });
        await expect(handleDatasetAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['7'], dataFlag: '{"name":42}' });
        await expect(handleDatasetAdd(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when project_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['abc'], dataFlag: '{"name":"x"}' });
        await expect(handleDatasetAdd(ctx)).rejects.toThrow(/project_id/);
    });

    it('passes custom_* fields through unchanged (zObject passthrough)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, {
            pathParams: ['7'],
            dataFlag: '{"name":"matrix","custom_owner":"qa","custom_priority":2}',
        });
        await handleDatasetAdd(ctx);
        expect(client.addDataset).toHaveBeenCalledWith(
            7,
            expect.objectContaining({ name: 'matrix', custom_owner: 'qa', custom_priority: 2 }),
        );
    });
});

// ── dataset update ────────────────────────────────────────────────────────

describe('handleDatasetUpdate', () => {
    it('calls client.updateDataset with parsed payload', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], dataFlag: '{"name":"Production matrix"}' });
        await handleDatasetUpdate(ctx);
        expect(client.updateDataset).toHaveBeenCalledWith(77, expect.objectContaining({ name: 'Production matrix' }));
        expect(out).toHaveBeenCalled();
    });

    it('accepts an empty body (name optional)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['77'], dataFlag: '{}' });
        await handleDatasetUpdate(ctx);
        expect(client.updateDataset).toHaveBeenCalledWith(77, expect.any(Object));
    });

    it('with no --data defaults the payload to {} and forwards it to the client', async () => {
        // UpdateDatasetPayloadSchema makes every field optional, so the
        // handler synthesizes `{}` rather than rejecting with the generic
        // "Body required" message. Empty `bodyInput` (no dataFlag,
        // dataFileFlag, or readStdin thunk) is the no-body marker.
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['77'] });
        await handleDatasetUpdate(ctx);
        expect(client.updateDataset).toHaveBeenCalledWith(77, {});
    });

    it('dry-run with no --data emits source=default and the empty payload', async () => {
        // Pins the BodySource label introduced for this synthesized-empty
        // case — dry-run output stays self-describing so the agent can tell
        // apart "explicit {}" (source: data) from "no --data, defaulted"
        // (source: default).
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], dryRun: true });
        await handleDatasetUpdate(ctx);
        expect(client.updateDataset).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({
                dryRun: true,
                action: 'dataset update',
                datasetId: 77,
                payload: {},
                source: 'default',
            }),
        );
    });

    it('dry-run does not call client', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], dataFlag: '{"name":"x"}', dryRun: true });
        await handleDatasetUpdate(ctx);
        expect(client.updateDataset).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'dataset update', datasetId: 77 }),
        );
    });

    it('rejects body with non-string name (no coercion)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['77'], dataFlag: '{"name":1}' });
        await expect(handleDatasetUpdate(ctx)).rejects.toThrow(/validation failed/);
    });

    it('rejects when dataset_id is not a positive integer', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['-2'], dataFlag: '{}' });
        await expect(handleDatasetUpdate(ctx)).rejects.toThrow(/dataset_id/);
    });
});

// ── dataset delete (destructive; --soft NOT supported) ────────────────────

describe('handleDatasetDelete', () => {
    it('hard-delete: calls client.deleteDataset with --yes', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], confirmDestructive: true });
        await handleDatasetDelete(ctx);
        expect(client.deleteDataset).toHaveBeenCalledWith(77);
        expect(out).toHaveBeenCalledWith({ datasetId: 77, deleted: true });
    });

    it('rejects without --yes', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['77'] });
        await expect(handleDatasetDelete(ctx)).rejects.toThrow(/--yes to confirm/);
        expect(client.deleteDataset).not.toHaveBeenCalled();
    });

    it('dry-run wins over --yes (no API call, preview emits destructive:true)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['77'], confirmDestructive: true, dryRun: true });
        await handleDatasetDelete(ctx);
        expect(client.deleteDataset).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'dataset delete', datasetId: 77, destructive: true }),
        );
    });

    it('rejects --soft (TestRail does not support soft on delete_dataset)', async () => {
        const { ctx } = buildCtx(buildClient(), { pathParams: ['77'], confirmDestructive: true, soft: true });
        await expect(handleDatasetDelete(ctx)).rejects.toThrow(/dataset delete does not support --soft/);
    });

    it('dry-run wins over --soft (preview emitted, --soft never reached)', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, {
            pathParams: ['77'],
            confirmDestructive: true,
            dryRun: true,
            soft: true,
        });
        await handleDatasetDelete(ctx);
        expect(client.deleteDataset).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(
            expect.objectContaining({ dryRun: true, action: 'dataset delete', datasetId: 77, destructive: true }),
        );
    });

    // Full INVALID_IDS sweep mirrors the cli-read-handlers convention
    // (`INVALID_IDS = ['0', '-1', '1.5', 'abc', '', '1e2', '0x1']`). Pre-fix
    // coverage hit only `'0'` and `''` — extending to the canonical 7
    // values pins parseId's reject contract for every shape an agent might
    // pipe in (scientific notation, hex, fractional, negative).
    it.each([['0'], ['-1'], ['1.5'], ['abc'], [''], ['1e2'], ['0x1']])(
        'rejects non-positive-integer dataset_id (%s) before --yes or --soft is consulted',
        async (raw) => {
            const client = buildClient();
            const { ctx } = buildCtx(client, { pathParams: [raw], confirmDestructive: true });
            await expect(handleDatasetDelete(ctx)).rejects.toThrow(/dataset_id/);
            expect(client.deleteDataset).not.toHaveBeenCalled();
        },
    );
});
