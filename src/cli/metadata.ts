import type { z } from 'zod';
import {
    AddCasePayloadSchema,
    UpdateCasePayloadSchema,
    AddRunPayloadSchema,
    AddResultPayloadSchema,
    AddResultsForCasesPayloadSchema,
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
    /** Zod schema for the request body. `undefined` for read actions and for
     *  no-body POSTs like `run close`. */
    bodySchema?: z.ZodTypeAny;
    /** True for write actions (POST / payload-bearing). Affects skill recipes,
     *  generator output, and `--dry-run` applicability. */
    isWrite: boolean;
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
];

/** Look up the spec for a resource:action pair, or return undefined. */
export function getActionSpec(resource: string, action: string): ActionSpec | undefined {
    return ACTIONS.find((a) => a.resource === resource && a.action === action);
}
