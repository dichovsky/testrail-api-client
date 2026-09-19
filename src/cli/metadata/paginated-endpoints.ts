import type { ActionEndpoint } from '../metadata.js';

/**
 * The pagination contract for every endpoint that has one.
 *
 * TestRail's own documentation of these 24 endpoints lives in
 * `docs/testrail-endpoints.json`, which stays hand-curated because it records
 * what the API documents rather than what this client implements. This table is
 * the runtime half of that fact; the `pagination registry` block in
 * `tests/generate-mapping.test.ts` holds the two sides equal.
 *
 * It exists so an `ActionSpec` no longer restates the contract. Each entry used
 * to carry a `pagination` field copied from the JSON, and gate E in the mapping
 * generator re-read both files to confirm the copies matched — a check that
 * could only run at generation time, and only reported by printing.
 */
export interface PaginationContract {
    /** Standard object envelope, or the outer-array envelope used by case history. */
    readonly response: 'envelope' | 'nested-envelope';
    /** Whether TestRail documents caller-controlled page parameters. */
    readonly requestControls: boolean;
    /** Response property holding the endpoint's entities. */
    readonly collectionKey: string;
}

export const PAGINATED_ENDPOINTS = {
    'GET get_attachments_for_case/{case_id}': {
        response: 'envelope',
        requestControls: true,
        collectionKey: 'attachments',
    },
    'GET get_attachments_for_plan/{plan_id}': {
        response: 'envelope',
        requestControls: true,
        collectionKey: 'attachments',
    },
    'GET get_attachments_for_run/{run_id}': {
        response: 'envelope',
        requestControls: true,
        collectionKey: 'attachments',
    },
    'GET get_bdds/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'bdd' },
    'GET get_cases/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'cases' },
    'GET get_history_for_case/{case_id}': {
        response: 'nested-envelope',
        requestControls: true,
        collectionKey: 'history',
    },
    'GET get_datasets/{project_id}': { response: 'envelope', requestControls: false, collectionKey: 'datasets' },
    'GET get_groups': { response: 'envelope', requestControls: false, collectionKey: 'groups' },
    'GET get_labels/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'labels' },
    'GET get_milestones/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'milestones' },
    'GET get_plans/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'plans' },
    'GET get_projects': { response: 'envelope', requestControls: true, collectionKey: 'projects' },
    'GET get_results/{test_id}': { response: 'envelope', requestControls: true, collectionKey: 'results' },
    'GET get_results_for_case/{run_id}/{case_id}': {
        response: 'envelope',
        requestControls: true,
        collectionKey: 'results',
    },
    'GET get_results_for_run/{run_id}': { response: 'envelope', requestControls: true, collectionKey: 'results' },
    'GET get_roles': { response: 'envelope', requestControls: false, collectionKey: 'roles' },
    'GET get_runs/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'runs' },
    'GET get_sections/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'sections' },
    'GET get_shared_step_history/{shared_step_id}': {
        response: 'envelope',
        requestControls: false,
        collectionKey: 'step_history',
    },
    'GET get_shared_steps/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'shared_steps' },
    'GET get_case_statuses': { response: 'envelope', requestControls: false, collectionKey: 'case_statuses' },
    'GET get_suites/{project_id}': { response: 'envelope', requestControls: true, collectionKey: 'suites' },
    'GET get_tests/{run_id}': { response: 'envelope', requestControls: true, collectionKey: 'tests' },
    'GET get_variables/{project_id}': { response: 'envelope', requestControls: false, collectionKey: 'variables' },
} as const satisfies Record<string, PaginationContract>;

/** Every endpoint TestRail paginates. */
export type PaginatedEndpoint = keyof typeof PAGINATED_ENDPOINTS;

/**
 * The contract for an endpoint, or `undefined` when it is not paginated.
 *
 * Takes the endpoint string an `ActionSpec` already carries, so a CLI action
 * cannot declare a pagination shape that disagrees with the endpoint it calls —
 * the disagreement is no longer spellable.
 */
export function paginationFor(apiEndpoint: string): PaginationContract | undefined {
    return (PAGINATED_ENDPOINTS as Record<string, PaginationContract | undefined>)[apiEndpoint];
}

/** Compile-time assertion helper: `Assert<false>` is an error. */
type Assert<T extends true> = T;

/**
 * Every paginated endpoint is reachable from at least one CLI command.
 *
 * This is what replaced gate E's endpoint-to-ACTIONS direction. It depends on
 * `ActionEndpoint` being a union of string literals; if that widens to `string`
 * this passes while checking nothing, which is why
 * `_ActionEndpointsAreLiterals` in `src/cli/metadata.ts` exists and must not be
 * deleted.
 */
export type _PaginatedEndpointsAreSurfaced = Assert<
    Exclude<PaginatedEndpoint, ActionEndpoint> extends never ? true : false
>;
