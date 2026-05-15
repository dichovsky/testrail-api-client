import type { z } from 'zod';
import {
    AddCasePayloadSchema,
    UpdateCasePayloadSchema,
    UpdateCasesPayloadSchema,
    DeleteCasesPayloadSchema,
    CopyCasesToSectionPayloadSchema,
    MoveCasesToSectionPayloadSchema,
    MoveSectionPayloadSchema,
    AddRunPayloadSchema,
    AddResultPayloadSchema,
    AddResultsForCasesPayloadSchema,
    AddResultsPayloadSchema,
    AddPlanPayloadSchema,
    UpdatePlanPayloadSchema,
    AddPlanEntryPayloadSchema,
} from '../schemas.js';

/**
 * Declarative spec for every resource:action exposed by the CLI.
 *
 * Single source of truth shared by:
 * - PR 3 tests: assert both directions of the metadata↔dispatch
 *   correspondence — every `ACTIONS` entry must have a registered handler
 *   in `dispatch.ts` HANDLERS, and every HANDLERS key must have an
 *   `ACTIONS` entry. Catches drift in either direction.
 * - PR 4 skill generator: renders the `<!-- GENERATED:command-table -->` and
 *   `<!-- GENERATED:payload-schemas -->` regions of `skill/SKILL.md` from
 *   this array.
 *
 * Adding a new action requires touching exactly two places: the handler in
 * `src/cli/handlers/`, and an entry here. The dispatcher and the skill stay
 * accurate automatically.
 */

export interface PathParam {
    name: string;
    description: string;
}

export interface ActionSpec {
    resource: string;
    action: string;
    summary: string;
    pathParams: readonly PathParam[];
    /** Zod schema for the request body. `undefined` for read actions, for
     *  no-body POSTs like `run close`, and for file-input write actions
     *  (which take `--file <path>` instead of a JSON body). */
    bodySchema?: z.ZodTypeAny;
    /** True for actions that take a binary file via `--file <path>` instead
     *  of a JSON body. Skill generator branches on this to emit file-upload
     *  recipes; mutually exclusive with `bodySchema`. */
    fileInput?: boolean;
    /** True for actions that emit binary output via `--out <path>` instead
     *  of JSON to stdout. Currently only `attachment get` (download). */
    fileOutput?: boolean;
    /** True for write actions (POST / payload-bearing). Affects skill recipes,
     *  generator output, and `--dry-run` applicability. */
    isWrite: boolean;
    /** True for destructive actions that require `--yes` to execute. */
    destructive?: boolean;
}

export const ACTIONS: readonly ActionSpec[] = [
    // ── Read actions ──────────────────────────────────────────────────────
    {
        resource: 'project',
        action: 'get',
        summary: 'Fetch a single project by ID',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        isWrite: false,
    },
    {
        resource: 'project',
        action: 'list',
        summary: 'List all projects (paginated)',
        pathParams: [],
        isWrite: false,
    },
    {
        resource: 'suite',
        action: 'get',
        summary: 'Fetch a single suite by ID',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        isWrite: false,
    },
    {
        resource: 'suite',
        action: 'list',
        summary: 'List suites in a project',
        pathParams: [],
        isWrite: false,
    },
    {
        resource: 'case',
        action: 'get',
        summary: 'Fetch a single test case by ID',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        isWrite: false,
    },
    {
        resource: 'case',
        action: 'list',
        summary: 'List cases in a project (optionally filtered by suite)',
        pathParams: [],
        isWrite: false,
    },
    {
        resource: 'case',
        action: 'history',
        summary: 'List edit history for a test case (paginated; TestRail 7.5+)',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        isWrite: false,
    },
    {
        resource: 'run',
        action: 'get',
        summary: 'Fetch a single run by ID',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        isWrite: false,
    },
    {
        resource: 'run',
        action: 'list',
        summary: 'List runs in a project (paginated)',
        pathParams: [],
        isWrite: false,
    },
    {
        resource: 'result',
        action: 'list',
        summary: 'List results for a run (paginated)',
        pathParams: [],
        isWrite: false,
    },
    {
        resource: 'milestone',
        action: 'get',
        summary: 'Fetch a single milestone by ID',
        pathParams: [{ name: 'milestone_id', description: 'TestRail milestone ID' }],
        isWrite: false,
    },
    {
        resource: 'milestone',
        action: 'list',
        summary: 'List milestones in a project (paginated)',
        pathParams: [],
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'get',
        summary: 'Fetch a single user by ID',
        pathParams: [{ name: 'user_id', description: 'TestRail user ID' }],
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'list',
        summary: 'List users (paginated)',
        pathParams: [],
        isWrite: false,
    },
    {
        resource: 'plan',
        action: 'get',
        summary: 'Fetch a single test plan by ID',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        isWrite: false,
    },
    {
        resource: 'plan',
        action: 'list',
        summary: 'List plans in a project (paginated)',
        pathParams: [],
        isWrite: false,
    },
    // ── Write actions ─────────────────────────────────────────────────────
    {
        resource: 'case',
        action: 'add',
        summary: 'Create a new test case under a section',
        pathParams: [{ name: 'section_id', description: 'Section to create the case under' }],
        bodySchema: AddCasePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'case',
        action: 'update',
        summary: 'Update an existing test case (partial fields)',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        bodySchema: UpdateCasePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'case',
        action: 'update-bulk',
        summary: 'Bulk-update many cases in a suite with the same field values',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        bodySchema: UpdateCasesPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'case',
        action: 'delete-bulk',
        summary:
            'Bulk-delete cases in a suite (requires --project-id and --yes; --soft for server-side preview without deletion)',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        bodySchema: DeleteCasesPayloadSchema,
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'case',
        action: 'copy-to-section',
        summary: 'Copy cases into a target section (returns the new case copies)',
        pathParams: [{ name: 'section_id', description: 'Destination section ID' }],
        bodySchema: CopyCasesToSectionPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'case',
        action: 'move-to-section',
        summary: 'Move cases into a target section (suite_id required in body)',
        pathParams: [{ name: 'section_id', description: 'Destination section ID' }],
        bodySchema: MoveCasesToSectionPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'run',
        action: 'add',
        summary: 'Create a new test run in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        bodySchema: AddRunPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'run',
        action: 'close',
        summary: 'Close a test run (no body)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        isWrite: true,
    },
    {
        resource: 'result',
        action: 'add',
        summary: 'Record a single result for a case in a run',
        pathParams: [
            { name: 'run_id', description: 'TestRail run ID' },
            { name: 'case_id', description: 'TestRail case ID' },
        ],
        bodySchema: AddResultPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'result',
        action: 'add-bulk',
        summary: 'Record multiple results for cases in one API call',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        bodySchema: AddResultsForCasesPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'result',
        action: 'add-bulk-by-test',
        summary: 'Record multiple results for tests (by test_id) in one API call',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        bodySchema: AddResultsPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'add',
        summary: 'Create a new test plan in a project (optionally with nested entries)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        bodySchema: AddPlanPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'update',
        summary: 'Update an existing test plan (partial fields)',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        bodySchema: UpdatePlanPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'add-entry',
        summary: 'Add an entry (suite + optional runs) to an existing test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        bodySchema: AddPlanEntryPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'section',
        action: 'move',
        summary: 'Move a section to a new parent and/or position (TestRail 6.5.2+)',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        bodySchema: MoveSectionPayloadSchema,
        isWrite: true,
    },
    // ── Shared-step read actions ──────────────────────────────────────────
    {
        resource: 'shared-step',
        action: 'get',
        summary: 'Fetch a single shared step by ID',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        isWrite: false,
    },
    {
        resource: 'shared-step',
        action: 'list',
        summary: 'List shared steps in a project',
        pathParams: [],
        isWrite: false,
    },
    {
        resource: 'shared-step',
        action: 'history',
        summary: 'List revision history for a shared step (paginated)',
        pathParams: [{ name: 'shared_update_id', description: 'TestRail shared update (revision) ID' }],
        isWrite: false,
    },
    // ── Case-status read action ───────────────────────────────────────────
    {
        resource: 'case-status',
        action: 'list',
        summary: 'List case-level lifecycle statuses (TestRail 7.5+)',
        pathParams: [],
        isWrite: false,
    },
    // ── Attachment read actions ───────────────────────────────────────────
    {
        resource: 'attachment',
        action: 'list-for-case',
        summary: 'List attachments on a test case',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-run',
        summary: 'List attachments on a test run',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-test',
        summary: 'List attachments on a test (run instance of a case)',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-plan',
        summary: 'List attachments on a test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-plan-entry',
        summary: 'List attachments on a plan entry',
        pathParams: [
            { name: 'plan_id', description: 'TestRail plan ID' },
            { name: 'entry_id', description: 'TestRail plan entry ID' },
        ],
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'get',
        summary: 'Download an attachment by ID to --out <path>',
        pathParams: [{ name: 'attachment_id', description: 'TestRail attachment ID' }],
        fileOutput: true,
        isWrite: false,
    },
    // ── Attachment write actions (file input) ─────────────────────────────
    {
        resource: 'attachment',
        action: 'add-to-case',
        summary: 'Upload an attachment to a test case',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-result',
        summary: 'Upload an attachment to a test result',
        pathParams: [{ name: 'result_id', description: 'TestRail result ID' }],
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-run',
        summary: 'Upload an attachment to a test run',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-plan',
        summary: 'Upload an attachment to a test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-plan-entry',
        summary: 'Upload an attachment to a plan entry',
        pathParams: [
            { name: 'plan_id', description: 'TestRail plan ID' },
            { name: 'entry_id', description: 'TestRail plan entry ID' },
        ],
        fileInput: true,
        isWrite: true,
    },
    // ── Attachment destructive action (requires --yes) ────────────────────
    {
        resource: 'attachment',
        action: 'delete',
        summary: 'Delete an attachment by ID (requires --yes)',
        pathParams: [{ name: 'attachment_id', description: 'TestRail attachment ID' }],
        isWrite: true,
        destructive: true,
    },
];

/** Look up the spec for a resource:action pair, or return undefined. */
export function getActionSpec(resource: string, action: string): ActionSpec | undefined {
    return ACTIONS.find((a) => a.resource === resource && a.action === action);
}
