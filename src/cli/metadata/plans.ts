import {
    AddPlanPayloadSchema,
    UpdatePlanPayloadSchema,
    AddPlanEntryPayloadSchema,
    AddRunToPlanEntryPayloadSchema,
    UpdatePlanEntryPayloadSchema,
    UpdateRunInPlanEntryPayloadSchema,
} from '../../schemas.js';
import { handlePlanGet, handlePlanList } from '../handlers/plan.js';
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
} from '../handlers/plan-write.js';
import type { ActionSpec } from './types.js';

/**
 * `plan` actions in their original relative order:
 *   [0]  get                    — read
 *   [1]  list                   — read
 *   [2]  add                    — write
 *   [3]  update                 — write
 *   [4]  add-entry              — write
 *   [5]  add-run-to-entry       — write
 *   [6]  update-entry           — write
 *   [7]  update-run-in-entry    — write
 *   [8]  close                  — write (destructive)
 *   [9]  delete                 — write (destructive)
 *   [10] delete-entry           — write (destructive)
 *   [11] delete-run-from-entry  — write (destructive)
 */
export const planActions: readonly ActionSpec[] = [
    {
        resource: 'plan',
        action: 'get',
        summary: 'Fetch a single test plan by ID',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'GET get_plan/{plan_id}',
        isWrite: false,
        handler: handlePlanGet,
    },
    {
        resource: 'plan',
        action: 'list',
        summary: 'List plans in a project (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_plans/{project_id}',
        isWrite: false,
        handler: handlePlanList,
    },
    {
        resource: 'plan',
        action: 'add',
        summary: 'Create a new test plan in a project (optionally with nested entries)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_plan/{project_id}',
        bodySchema: AddPlanPayloadSchema,
        helpExample: `--data '{"name":"...","entries":[{"suite_id":1}]}'`,
        isWrite: true,
        handler: handlePlanAdd,
    },
    {
        resource: 'plan',
        action: 'update',
        summary: 'Update an existing test plan (partial fields)',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST update_plan/{plan_id}',
        bodySchema: UpdatePlanPayloadSchema,
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handlePlanUpdate,
    },
    {
        resource: 'plan',
        action: 'add-entry',
        summary: 'Add an entry (suite + optional runs) to an existing test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST add_plan_entry/{plan_id}',
        bodySchema: AddPlanEntryPayloadSchema,
        helpExample: `--data '{"suite_id":1,"include_all":true}'`,
        isWrite: true,
        handler: handlePlanAddEntry,
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
        helpExample: `--data '{"config_ids":[1,2]}'`,
        isWrite: true,
        handler: handlePlanAddRunToEntry,
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
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handlePlanUpdateEntry,
    },
    {
        resource: 'plan',
        action: 'update-run-in-entry',
        summary: 'Update a single config-specific run inside a plan entry (description/assignee/case selection only)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST update_run_in_plan_entry/{run_id}',
        bodySchema: UpdateRunInPlanEntryPayloadSchema,
        helpExample: `--data '{"description":"..."}'`,
        isWrite: true,
        handler: handlePlanUpdateRunInEntry,
    },
    {
        resource: 'plan',
        action: 'close',
        summary: 'Close a test plan permanently — irreversible (no body; requires --yes)',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST close_plan/{plan_id}',
        isWrite: true,
        destructive: true,
        helpExample: '(no body; irreversible)',
        handler: handlePlanClose,
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
        helpExample: '(no body; --soft NOT supported by TestRail)',
        handler: handlePlanDelete,
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
        helpExample: '(no body; entry_id is a UUID string; --soft NOT supported)',
        handler: handlePlanDeleteEntry,
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
        helpExample: '(no body; --soft NOT supported)',
        handler: handlePlanDeleteRunFromEntry,
    },
];
