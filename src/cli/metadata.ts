import type { z } from 'zod';
import {
    AddCasePayloadSchema,
    UpdateCasePayloadSchema,
    UpdateCasesPayloadSchema,
    DeleteCasesPayloadSchema,
    CopyCasesToSectionPayloadSchema,
    MoveCasesToSectionPayloadSchema,
    AddCaseFieldPayloadSchema,
    MoveSectionPayloadSchema,
    AddRunPayloadSchema,
    UpdateRunPayloadSchema,
    AddResultPayloadSchema,
    AddResultsForCasesPayloadSchema,
    AddResultsPayloadSchema,
    AddPlanPayloadSchema,
    UpdatePlanPayloadSchema,
    AddPlanEntryPayloadSchema,
    AddRunToPlanEntryPayloadSchema,
    UpdatePlanEntryPayloadSchema,
    UpdateRunInPlanEntryPayloadSchema,
    AddProjectPayloadSchema,
    UpdateProjectPayloadSchema,
    AddSuitePayloadSchema,
    UpdateSuitePayloadSchema,
    AddSectionPayloadSchema,
    UpdateSectionPayloadSchema,
    AddMilestonePayloadSchema,
    UpdateMilestonePayloadSchema,
    AddVariablePayloadSchema,
    UpdateVariablePayloadSchema,
    AddGroupPayloadSchema,
    UpdateGroupPayloadSchema,
    AddSharedStepPayloadSchema,
    UpdateSharedStepPayloadSchema,
    AddConfigurationGroupPayloadSchema,
    UpdateConfigurationGroupPayloadSchema,
    AddConfigurationPayloadSchema,
    UpdateConfigurationPayloadSchema,
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
 * - PR 5 API-mapping generator (`scripts/generate-mapping.js`): reads the
 *   `apiEndpoint` field from each entry to produce `docs/API-MAPPING.md`'s
 *   CLI column. Cross-validates that each `apiEndpoint` matches a
 *   `@testrail` JSDoc tag on a method in `src/modules/*.ts`.
 *
 * Adding a new action requires touching exactly two places: the handler in
 * `src/cli/handlers/`, and an entry here. The dispatcher, the skill, and the
 * mapping table stay accurate automatically.
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
    /** TestRail endpoint this CLI action calls, in the form `'METHOD path'`
     *  (e.g., `'POST add_case/{section_id}'`). Must agree with the
     *  `@testrail` JSDoc tag on the linked client method in
     *  `src/modules/*.ts`. The API-mapping generator validates both
     *  directions (no orphan ActionSpec referencing a non-existent endpoint,
     *  no missing endpoints when the JSON says the CLI covers it). */
    apiEndpoint: string;
    /** Zod schema for the request body. `undefined` for read actions, for
     *  no-body POSTs like `run close`, and for file-input write actions
     *  (which take `--file <path>` instead of a JSON body). */
    bodySchema?: z.ZodTypeAny;
    /** True for actions that take a binary file via `--file <path>` instead
     *  of a JSON body. Skill generator branches on this to emit file-upload
     *  recipes; mutually exclusive with `bodySchema`. */
    fileInput?: boolean;
    /** True for actions that emit non-JSON output via `--out <path>` instead
     *  of JSON to stdout. `attachment get` (binary download) and `bdd get`
     *  (UTF-8 text) both use this. The on-the-wire encoding is signalled by
     *  `outputKind`. */
    fileOutput?: boolean;
    /** Encoding of the bytes written to `--out <path>` when `fileOutput` is
     *  true. `'binary'` (default) for opaque blobs like attachment downloads;
     *  `'text'` for UTF-8 payloads like `bdd get` (Gherkin `.feature`). Drives
     *  the body-label rendered in skill/SKILL.md so users see an accurate
     *  description instead of a hard-coded `(binary)` suffix. */
    outputKind?: 'binary' | 'text';
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
        apiEndpoint: 'GET get_project/{project_id}',
        isWrite: false,
    },
    {
        resource: 'project',
        action: 'list',
        summary: 'List all projects (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_projects',
        isWrite: false,
    },
    {
        resource: 'suite',
        action: 'get',
        summary: 'Fetch a single suite by ID',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'GET get_suite/{suite_id}',
        isWrite: false,
    },
    {
        resource: 'suite',
        action: 'list',
        summary: 'List suites in a project',
        pathParams: [],
        apiEndpoint: 'GET get_suites/{project_id}',
        isWrite: false,
    },
    {
        resource: 'case',
        action: 'get',
        summary: 'Fetch a single test case by ID',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_case/{case_id}',
        isWrite: false,
    },
    {
        resource: 'case',
        action: 'list',
        summary: 'List cases in a project (optionally filtered by suite)',
        pathParams: [],
        apiEndpoint: 'GET get_cases/{project_id}',
        isWrite: false,
    },
    {
        resource: 'case',
        action: 'history',
        summary: 'List edit history for a test case (paginated; TestRail 7.5+)',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_history_for_case/{case_id}',
        isWrite: false,
    },
    {
        resource: 'run',
        action: 'get',
        summary: 'Fetch a single run by ID',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'GET get_run/{run_id}',
        isWrite: false,
    },
    {
        resource: 'run',
        action: 'list',
        summary: 'List runs in a project (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_runs/{project_id}',
        isWrite: false,
    },
    {
        resource: 'test',
        action: 'get',
        summary: 'Fetch a single test (run instance of a case) by ID',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'GET get_test/{test_id}',
        isWrite: false,
    },
    {
        resource: 'test',
        action: 'list',
        summary: 'List tests in a run (optionally filtered by status, paginated)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'GET get_tests/{run_id}',
        isWrite: false,
    },
    {
        resource: 'result',
        action: 'list',
        summary: 'List results for a run (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_results_for_run/{run_id}',
        isWrite: false,
    },
    {
        resource: 'result',
        action: 'list-for-test',
        summary: 'List results for a single test (paginated; --status-id / --defects-filter supported)',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'GET get_results/{test_id}',
        isWrite: false,
    },
    {
        resource: 'result',
        action: 'list-for-case',
        summary: 'List results for a case within a run (paginated; --status-id / --defects-filter supported)',
        pathParams: [
            { name: 'run_id', description: 'TestRail run ID' },
            { name: 'case_id', description: 'TestRail case ID' },
        ],
        apiEndpoint: 'GET get_results_for_case/{run_id}/{case_id}',
        isWrite: false,
    },
    {
        resource: 'milestone',
        action: 'get',
        summary: 'Fetch a single milestone by ID',
        pathParams: [{ name: 'milestone_id', description: 'TestRail milestone ID' }],
        apiEndpoint: 'GET get_milestone/{milestone_id}',
        isWrite: false,
    },
    {
        resource: 'milestone',
        action: 'list',
        summary: 'List milestones in a project (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_milestones/{project_id}',
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'get',
        summary: 'Fetch a single user by ID',
        pathParams: [{ name: 'user_id', description: 'TestRail user ID' }],
        apiEndpoint: 'GET get_user/{user_id}',
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'list',
        summary: 'List users (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_users',
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'get-by-email',
        summary: 'Look up a single user by email address',
        pathParams: [],
        apiEndpoint: 'GET get_user_by_email',
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'get-current',
        summary: 'Fetch the user identified by the auth credential (TestRail 6.6+; no positional args)',
        pathParams: [],
        apiEndpoint: 'GET get_current_user',
        isWrite: false,
    },
    {
        resource: 'plan',
        action: 'get',
        summary: 'Fetch a single test plan by ID',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'GET get_plan/{plan_id}',
        isWrite: false,
    },
    {
        resource: 'plan',
        action: 'list',
        summary: 'List plans in a project (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_plans/{project_id}',
        isWrite: false,
    },
    {
        resource: 'section',
        action: 'get',
        summary: 'Fetch a single section by ID',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        apiEndpoint: 'GET get_section/{section_id}',
        isWrite: false,
    },
    {
        resource: 'section',
        action: 'list',
        summary: 'List sections in a project (optionally filtered by suite; paginated)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_sections/{project_id}',
        isWrite: false,
    },
    // ── Write actions ─────────────────────────────────────────────────────
    {
        resource: 'case',
        action: 'add',
        summary: 'Create a new test case under a section',
        pathParams: [{ name: 'section_id', description: 'Section to create the case under' }],
        apiEndpoint: 'POST add_case/{section_id}',
        bodySchema: AddCasePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'case',
        action: 'update',
        summary: 'Update an existing test case (partial fields)',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST update_case/{case_id}',
        bodySchema: UpdateCasePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'case',
        action: 'update-bulk',
        summary: 'Bulk-update many cases in a suite with the same field values',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'POST update_cases/{suite_id}',
        bodySchema: UpdateCasesPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'case',
        action: 'delete',
        summary:
            'Delete a single test case (requires --yes; --soft for server-side preview that returns affected counts without deleting)',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST delete_case/{case_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'case',
        action: 'delete-bulk',
        summary:
            'Bulk-delete cases in a suite (requires --project-id and --yes; --soft for server-side preview without deletion)',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'POST delete_cases/{suite_id}',
        bodySchema: DeleteCasesPayloadSchema,
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'case',
        action: 'copy-to-section',
        summary: 'Copy cases into a target section (returns the new case copies)',
        pathParams: [{ name: 'section_id', description: 'Destination section ID' }],
        apiEndpoint: 'POST copy_cases_to_section/{section_id}',
        bodySchema: CopyCasesToSectionPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'case',
        action: 'move-to-section',
        summary: 'Move cases into a target section (suite_id required in body)',
        pathParams: [{ name: 'section_id', description: 'Destination section ID' }],
        apiEndpoint: 'POST move_cases_to_section/{section_id}',
        bodySchema: MoveCasesToSectionPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'run',
        action: 'add',
        summary: 'Create a new test run in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_run/{project_id}',
        bodySchema: AddRunPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'run',
        action: 'update',
        summary: 'Update an existing test run (all fields optional)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST update_run/{run_id}',
        bodySchema: UpdateRunPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'run',
        action: 'close',
        summary: 'Close a test run permanently — irreversible (no body; requires --yes)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST close_run/{run_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'run',
        action: 'delete',
        summary:
            'Delete a test run and all associated results (requires --yes; --soft for server-side preview without deletion)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST delete_run/{run_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'result',
        action: 'add',
        summary: 'Record a single result for a case in a run',
        pathParams: [
            { name: 'run_id', description: 'TestRail run ID' },
            { name: 'case_id', description: 'TestRail case ID' },
        ],
        apiEndpoint: 'POST add_result_for_case/{run_id}/{case_id}',
        bodySchema: AddResultPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'result',
        action: 'add-bulk',
        summary: 'Record multiple results for cases in one API call',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST add_results_for_cases/{run_id}',
        bodySchema: AddResultsForCasesPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'result',
        action: 'add-bulk-by-test',
        summary: 'Record multiple results for tests (by test_id) in one API call',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST add_results/{run_id}',
        bodySchema: AddResultsPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'add',
        summary: 'Create a new test plan in a project (optionally with nested entries)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_plan/{project_id}',
        bodySchema: AddPlanPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'update',
        summary: 'Update an existing test plan (partial fields)',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST update_plan/{plan_id}',
        bodySchema: UpdatePlanPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'add-entry',
        summary: 'Add an entry (suite + optional runs) to an existing test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST add_plan_entry/{plan_id}',
        bodySchema: AddPlanEntryPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'add-run-to-entry',
        summary: 'Add a config-specific run to an existing plan entry (config_ids required)',
        pathParams: [
            { name: 'plan_id', description: 'TestRail plan ID' },
            { name: 'entry_id', description: 'TestRail plan entry ID (UUID string)' },
        ],
        apiEndpoint: 'POST add_run_to_plan_entry/{plan_id}/{entry_id}',
        bodySchema: AddRunToPlanEntryPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'update-entry',
        summary: 'Update an existing plan entry (partial fields; applies to every run in the entry)',
        pathParams: [
            { name: 'plan_id', description: 'TestRail plan ID' },
            { name: 'entry_id', description: 'TestRail plan entry ID (UUID string)' },
        ],
        apiEndpoint: 'POST update_plan_entry/{plan_id}/{entry_id}',
        bodySchema: UpdatePlanEntryPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'update-run-in-entry',
        summary: 'Update a single config-specific run inside a plan entry (description/assignee/case selection only)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST update_run_in_plan_entry/{run_id}',
        bodySchema: UpdateRunInPlanEntryPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'plan',
        action: 'close',
        summary: 'Close a test plan permanently — irreversible (no body; requires --yes)',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST close_plan/{plan_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'plan',
        action: 'delete',
        summary:
            'Delete a test plan and all of its entries and runs (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST delete_plan/{plan_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'plan',
        action: 'delete-entry',
        summary:
            'Delete a single plan entry and its runs (requires --yes; --soft NOT supported by TestRail). entry_id is a UUID-style string.',
        pathParams: [
            { name: 'plan_id', description: 'TestRail plan ID' },
            { name: 'entry_id', description: 'TestRail plan entry ID (UUID-style string)' },
        ],
        apiEndpoint: 'POST delete_plan_entry/{plan_id}/{entry_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'plan',
        action: 'delete-run-from-entry',
        summary:
            'Delete a single run from its plan entry, leaving sibling runs intact (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST delete_run_from_plan_entry/{run_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'section',
        action: 'add',
        summary: 'Create a new section in a project (suite_id required for multi-suite-mode projects)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_section/{project_id}',
        bodySchema: AddSectionPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'section',
        action: 'update',
        summary: 'Update an existing section (partial fields)',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        apiEndpoint: 'POST update_section/{section_id}',
        bodySchema: UpdateSectionPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'section',
        action: 'move',
        summary: 'Move a section to a new parent and/or position (TestRail 6.5.2+)',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        apiEndpoint: 'POST move_section/{section_id}',
        bodySchema: MoveSectionPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'section',
        action: 'delete',
        summary:
            'Delete a section (recursively removes subsections and cases; requires --yes; --soft for server-side preview)',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        apiEndpoint: 'POST delete_section/{section_id}',
        isWrite: true,
        destructive: true,
    },
    // ── Structural-setup write actions ────────────────────────────────────
    // `project`, `suite`, and `milestone` add/update. Programmatic methods
    // already exist; these expose them via the CLI for agent provisioning
    // workflows. `user add/update` is intentionally deferred (TestRail 7.3+
    // version gate + password-handling design questions).
    {
        resource: 'project',
        action: 'add',
        summary: 'Create a new project (no path params, payload-only)',
        pathParams: [],
        apiEndpoint: 'POST add_project',
        bodySchema: AddProjectPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'project',
        action: 'update',
        summary: 'Update an existing project (partial fields)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST update_project/{project_id}',
        bodySchema: UpdateProjectPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'project',
        action: 'delete',
        summary:
            'Delete a project and everything inside it (highest blast radius; requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST delete_project/{project_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'suite',
        action: 'add',
        summary: 'Create a new test suite in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_suite/{project_id}',
        bodySchema: AddSuitePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'suite',
        action: 'update',
        summary: 'Update an existing test suite (partial fields)',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'POST update_suite/{suite_id}',
        bodySchema: UpdateSuitePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'suite',
        action: 'delete',
        summary:
            'Delete a suite and everything inside it (sections, cases, runs, plans; requires --yes; --soft for server-side preview)',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'POST delete_suite/{suite_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'milestone',
        action: 'add',
        summary: 'Create a new milestone in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_milestone/{project_id}',
        bodySchema: AddMilestonePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'milestone',
        action: 'update',
        summary: 'Update an existing milestone (partial fields, including is_completed/is_started toggles)',
        pathParams: [{ name: 'milestone_id', description: 'TestRail milestone ID' }],
        apiEndpoint: 'POST update_milestone/{milestone_id}',
        bodySchema: UpdateMilestonePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'milestone',
        action: 'delete',
        summary: 'Delete a milestone (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'milestone_id', description: 'TestRail milestone ID' }],
        apiEndpoint: 'POST delete_milestone/{milestone_id}',
        isWrite: true,
        destructive: true,
    },
    // ── Shared-step read actions ──────────────────────────────────────────
    {
        resource: 'shared-step',
        action: 'get',
        summary: 'Fetch a single shared step by ID',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'GET get_shared_step/{shared_step_id}',
        isWrite: false,
    },
    {
        resource: 'shared-step',
        action: 'list',
        summary: 'List shared steps in a project',
        pathParams: [],
        apiEndpoint: 'GET get_shared_steps/{project_id}',
        isWrite: false,
    },
    {
        resource: 'shared-step',
        action: 'history',
        summary: 'List revision history for a shared step (paginated)',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'GET get_shared_step_history/{shared_step_id}',
        isWrite: false,
    },
    // ── Report read actions ───────────────────────────────────────────────
    {
        resource: 'report',
        action: 'list',
        summary: 'List report templates configured for a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_reports/{project_id}',
        isWrite: false,
    },
    {
        resource: 'report',
        action: 'run',
        summary: 'Execute a report template and return the generated report URLs',
        pathParams: [{ name: 'report_template_id', description: 'TestRail report template ID' }],
        apiEndpoint: 'GET run_report/{report_template_id}',
        isWrite: false,
    },
    // ── Shared-step write actions (TestRail 7.0+) ─────────────────────────
    {
        resource: 'shared-step',
        action: 'add',
        summary: 'Create a new shared step set in a project (TestRail 7.0+)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_shared_step/{project_id}',
        bodySchema: AddSharedStepPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'shared-step',
        action: 'update',
        summary: 'Update an existing shared step set (partial fields; TestRail 7.0+)',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'POST update_shared_step/{shared_step_id}',
        bodySchema: UpdateSharedStepPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'shared-step',
        action: 'delete',
        summary:
            'Delete a shared step set — referencing cases keep their content but lose the step-set link (requires --yes; --soft NOT supported by TestRail; TestRail 7.0+)',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'POST delete_shared_step/{shared_step_id}',
        isWrite: true,
        destructive: true,
    },
    // ── Case-status read action ───────────────────────────────────────────
    {
        resource: 'case-status',
        action: 'list',
        summary: 'List case-level lifecycle statuses (TestRail 7.5+)',
        pathParams: [],
        apiEndpoint: 'GET get_case_statuses',
        isWrite: false,
    },
    // ── Metadata + reference-data read actions ────────────────────────────
    // Instance-level metadata and reference-data getters: case fields,
    // result fields, statuses, templates, roles, priorities, case types.
    // Seven of the eight take no path params (`case-field list`,
    // `case-status list`, `result-field list`, `status list`, `role list`,
    // `priority list`, `case-type list`); their handlers reject extra
    // positional args fail-fast with `IdParseError` so a typo like
    // `testrail status list 5` or `testrail role list 5` surfaces as an
    // error instead of silently ignoring the `5`. `template list` takes a
    // single `project_id`.
    {
        resource: 'case-field',
        action: 'list',
        summary: 'List all custom case fields defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_case_fields',
        isWrite: false,
    },
    {
        resource: 'result-field',
        action: 'list',
        summary: 'List all custom result fields defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_result_fields',
        isWrite: false,
    },
    {
        resource: 'status',
        action: 'list',
        summary: 'List all result statuses defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_statuses',
        isWrite: false,
    },
    {
        resource: 'template',
        action: 'list',
        summary: 'List case templates available in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_templates/{project_id}',
        isWrite: false,
    },
    {
        resource: 'role',
        action: 'list',
        summary: 'List all user roles defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_roles',
        isWrite: false,
    },
    {
        resource: 'priority',
        action: 'list',
        summary: 'List all case priorities defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_priorities',
        isWrite: false,
    },
    {
        resource: 'case-type',
        action: 'list',
        summary: 'List all case types defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_case_types',
        isWrite: false,
    },
    // ── Case-field write action ───────────────────────────────────────────
    {
        resource: 'case-field',
        action: 'add',
        summary: 'Create a custom case field (admin-only); no path params, payload-only',
        pathParams: [],
        apiEndpoint: 'POST add_case_field',
        bodySchema: AddCaseFieldPayloadSchema,
        isWrite: true,
    },
    // ── Attachment read actions ───────────────────────────────────────────
    {
        resource: 'attachment',
        action: 'list-for-case',
        summary: 'List attachments on a test case',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_attachments_for_case/{case_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-run',
        summary: 'List attachments on a test run',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'GET get_attachments_for_run/{run_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-test',
        summary: 'List attachments on a test (run instance of a case)',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'GET get_attachments_for_test/{test_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-plan',
        summary: 'List attachments on a test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'GET get_attachments_for_plan/{plan_id}',
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
        apiEndpoint: 'GET get_attachments_for_plan_entry/{plan_id}/{entry_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'get',
        summary: 'Download an attachment by ID to --out <path>',
        pathParams: [{ name: 'attachment_id', description: 'TestRail attachment ID' }],
        apiEndpoint: 'GET get_attachment/{attachment_id}',
        fileOutput: true,
        isWrite: false,
    },
    // ── Attachment write actions (file input) ─────────────────────────────
    {
        resource: 'attachment',
        action: 'add-to-case',
        summary: 'Upload an attachment to a test case',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST add_attachment_to_case/{case_id}',
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-result',
        summary: 'Upload an attachment to a test result',
        pathParams: [{ name: 'result_id', description: 'TestRail result ID' }],
        apiEndpoint: 'POST add_attachment_to_result/{result_id}',
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-run',
        summary: 'Upload an attachment to a test run',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST add_attachment_to_run/{run_id}',
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-plan',
        summary: 'Upload an attachment to a test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST add_attachment_to_plan/{plan_id}',
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
        apiEndpoint: 'POST add_attachment_to_plan_entry/{plan_id}/{entry_id}',
        fileInput: true,
        isWrite: true,
    },
    // ── Attachment destructive action (requires --yes) ────────────────────
    {
        resource: 'attachment',
        action: 'delete',
        summary: 'Delete an attachment by ID (requires --yes)',
        pathParams: [{ name: 'attachment_id', description: 'TestRail attachment ID' }],
        apiEndpoint: 'POST delete_attachment/{attachment_id}',
        isWrite: true,
        destructive: true,
    },
    // ── BDD actions (text I/O for `get`, file input for `add`) ────────────
    // `bdd get` returns Gherkin `.feature` text (not JSON); written to --out
    // as UTF-8. `bdd add` reuses the multipart upload path of attachments.
    {
        resource: 'bdd',
        action: 'get',
        summary: "Download a case's BDD (Gherkin .feature) content to --out <path>",
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_bdd/{case_id}',
        fileOutput: true,
        outputKind: 'text',
        isWrite: false,
    },
    {
        resource: 'bdd',
        action: 'add',
        summary: 'Upload a .feature file as the BDD content for a case',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST add_bdd/{case_id}',
        fileInput: true,
        isWrite: true,
    },
    // ── Variable actions (data-driven testing) ────────────────────────────
    {
        resource: 'variable',
        action: 'list',
        summary: 'List variables in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_variables/{project_id}',
        isWrite: false,
    },
    {
        resource: 'variable',
        action: 'add',
        summary: 'Create a new variable in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_variable/{project_id}',
        bodySchema: AddVariablePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'variable',
        action: 'update',
        summary: 'Update an existing variable (rename)',
        pathParams: [{ name: 'variable_id', description: 'TestRail variable ID' }],
        apiEndpoint: 'POST update_variable/{variable_id}',
        bodySchema: UpdateVariablePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'variable',
        action: 'delete',
        summary: 'Delete a variable (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'variable_id', description: 'TestRail variable ID' }],
        apiEndpoint: 'POST delete_variable/{variable_id}',
        isWrite: true,
        destructive: true,
    },
    // ── Group actions (TestRail 7.5+) ─────────────────────────────────────
    // User groups are an instance-level resource (not project-scoped). The
    // CRUD shape mirrors `variable`: `add` takes no path param (payload-only),
    // `update`/`delete` take a single `group_id`. Disjoint from
    // `configuration-group` (project-scoped, owns nested configs).
    {
        resource: 'group',
        action: 'get',
        summary: 'Fetch a single user group by ID (TestRail 7.5+)',
        pathParams: [{ name: 'group_id', description: 'TestRail group ID' }],
        apiEndpoint: 'GET get_group/{group_id}',
        isWrite: false,
    },
    {
        resource: 'group',
        action: 'list',
        summary: 'List all user groups on the instance (TestRail 7.5+; no path params)',
        pathParams: [],
        apiEndpoint: 'GET get_groups',
        isWrite: false,
    },
    {
        resource: 'group',
        action: 'add',
        summary: 'Create a new user group (no path params, payload-only; TestRail 7.5+)',
        pathParams: [],
        apiEndpoint: 'POST add_group',
        bodySchema: AddGroupPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'group',
        action: 'update',
        summary: 'Update an existing user group (partial fields; TestRail 7.5+)',
        pathParams: [{ name: 'group_id', description: 'TestRail group ID' }],
        apiEndpoint: 'POST update_group/{group_id}',
        bodySchema: UpdateGroupPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'group',
        action: 'delete',
        summary: 'Delete a user group (requires --yes; --soft NOT supported by TestRail; TestRail 7.5+)',
        pathParams: [{ name: 'group_id', description: 'TestRail group ID' }],
        apiEndpoint: 'POST delete_group/{group_id}',
        isWrite: true,
        destructive: true,
    },
    // ── Configuration hierarchy (groups + leaf configs) ───────────────────
    // TestRail models test-environment matrices as a two-level tree:
    //   project → config_groups[] (e.g. "Browsers") → configs[] (e.g. "Chrome").
    // `get_configs/{project_id}` returns the entire tree in one call; there
    // is no separate "list configs in a group" endpoint upstream. Group and
    // config CRUD are split into two CLI resources because the path-param
    // contract is asymmetric (`<project_id>` for group add, `<config_group_id>`
    // for config add, `<config_id>` for config update/delete).
    {
        resource: 'configuration',
        action: 'list',
        summary: 'List configuration groups (with nested configs) for a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_configs/{project_id}',
        isWrite: false,
    },
    {
        resource: 'configuration-group',
        action: 'add',
        summary: 'Create a new configuration group in a project (e.g. "Browsers")',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_config_group/{project_id}',
        bodySchema: AddConfigurationGroupPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'configuration-group',
        action: 'update',
        summary: 'Update a configuration group (rename)',
        pathParams: [{ name: 'config_group_id', description: 'TestRail config group ID' }],
        apiEndpoint: 'POST update_config_group/{config_group_id}',
        bodySchema: UpdateConfigurationGroupPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'configuration-group',
        action: 'delete',
        summary:
            'Delete a configuration group and every config in it (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'config_group_id', description: 'TestRail config group ID' }],
        apiEndpoint: 'POST delete_config_group/{config_group_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'configuration',
        action: 'add',
        summary: 'Create a new configuration (leaf) inside a configuration group (e.g. "Chrome")',
        pathParams: [{ name: 'config_group_id', description: 'TestRail config group ID' }],
        apiEndpoint: 'POST add_config/{config_group_id}',
        bodySchema: AddConfigurationPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'configuration',
        action: 'update',
        summary: 'Update a single configuration (rename)',
        pathParams: [{ name: 'config_id', description: 'TestRail config ID' }],
        apiEndpoint: 'POST update_config/{config_id}',
        bodySchema: UpdateConfigurationPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'configuration',
        action: 'delete',
        summary: 'Delete a single configuration (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'config_id', description: 'TestRail config ID' }],
        apiEndpoint: 'POST delete_config/{config_id}',
        isWrite: true,
        destructive: true,
    },
];

/** Look up the spec for a resource:action pair, or return undefined. */
export function getActionSpec(resource: string, action: string): ActionSpec | undefined {
    return ACTIONS.find((a) => a.resource === resource && a.action === action);
}
