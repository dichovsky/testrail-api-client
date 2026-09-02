import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { EndpointsArraySchema } from '../scripts/mapping-renderer.js';
import type { TestRailClientCore } from '../src/client-core.js';
import type { PaginatedRequestOptions } from '../src/pagination.js';
import { ATTACHMENTS_PAGINATION } from '../src/modules/attachments.js';
import { BDDS_PAGINATION } from '../src/modules/bdd.js';
import { CASE_HISTORY_PAGINATION, CASES_PAGINATION } from '../src/modules/cases.js';
import { DATASETS_PAGINATION } from '../src/modules/datasets.js';
import { LABELS_PAGINATION } from '../src/modules/labels.js';
import { CASE_STATUSES_PAGINATION, ROLES_PAGINATION } from '../src/modules/metadata.js';
import { MILESTONES_PAGINATION } from '../src/modules/milestones.js';
import { PLANS_PAGINATION } from '../src/modules/plans.js';
import { PROJECTS_PAGINATION } from '../src/modules/projects.js';
import { RESULTS_PAGINATION } from '../src/modules/results.js';
import { RUNS_PAGINATION } from '../src/modules/runs.js';
import { SECTIONS_PAGINATION } from '../src/modules/sections.js';
import { SHARED_STEP_HISTORY_PAGINATION, SHARED_STEPS_PAGINATION } from '../src/modules/sharedSteps.js';
import { SUITES_PAGINATION } from '../src/modules/suites.js';
import { TESTS_PAGINATION } from '../src/modules/tests.js';
import { GROUPS_PAGINATION } from '../src/modules/users.js';
import { VARIABLES_PAGINATION } from '../src/modules/variables.js';
import { createPaginatedListExecutor } from '../src/modules/paginated-list.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGINATION_EXECUTORS = [
    ATTACHMENTS_PAGINATION,
    BDDS_PAGINATION,
    CASES_PAGINATION,
    CASE_HISTORY_PAGINATION,
    DATASETS_PAGINATION,
    GROUPS_PAGINATION,
    LABELS_PAGINATION,
    MILESTONES_PAGINATION,
    PLANS_PAGINATION,
    PROJECTS_PAGINATION,
    RESULTS_PAGINATION,
    ROLES_PAGINATION,
    RUNS_PAGINATION,
    SECTIONS_PAGINATION,
    SHARED_STEPS_PAGINATION,
    SHARED_STEP_HISTORY_PAGINATION,
    CASE_STATUSES_PAGINATION,
    SUITES_PAGINATION,
    TESTS_PAGINATION,
    VARIABLES_PAGINATION,
] as const;

describe('pagination descriptor inventory', () => {
    it('binds every documented paginated endpoint to exactly one typed executor registration', () => {
        const endpoints = EndpointsArraySchema.parse(
            JSON.parse(readFileSync(join(ROOT, 'docs', 'testrail-endpoints.json'), 'utf8')),
        );
        const expected = endpoints
            .flatMap((endpoint) =>
                endpoint.pagination === undefined
                    ? []
                    : [
                          {
                              operation: endpoint.operation,
                              response: endpoint.pagination.response,
                              requestControls: endpoint.pagination.requestControls,
                              collectionKey: endpoint.pagination.collectionKey,
                          },
                      ],
            )
            .sort((left, right) => left.operation.localeCompare(right.operation));
        const actual = PAGINATION_EXECUTORS.flatMap((executor) => executor.registrations).sort((left, right) =>
            left.operation.localeCompare(right.operation),
        );

        expect(expected).toHaveLength(24);
        expect(actual).toHaveLength(expected.length);
        expect(new Set(actual.map(({ operation }) => operation)).size).toBe(actual.length);
        expect(actual).toEqual(expected);
    });

    it('rejects a prepared transport operation that was not declared by the descriptor', async () => {
        interface ReadOptions {
            readonly limit?: number;
            readonly offset?: number;
        }

        const executor = createPaginatedListExecutor<undefined, ReadOptions, PaginatedRequestOptions, unknown>({
            operations: ['get_expected'],
            collectionKey: 'items',
            itemSchema: z.unknown(),
            response: 'envelope',
            requestControls: true,
            prepare: () => ({ operation: 'get_unexpected' }),
        });
        const request = vi.fn();

        await expect(executor.items({ request } as unknown as TestRailClientCore, undefined)).rejects.toThrow(
            'Pagination descriptor selected undeclared operation "get_unexpected"',
        );
        expect(request).not.toHaveBeenCalled();
    });

    it('builds a root operation path when the descriptor has no path parameters', async () => {
        interface RootReadOptions {
            readonly limit?: number;
            readonly offset?: number;
        }

        const executor = createPaginatedListExecutor<undefined, RootReadOptions, PaginatedRequestOptions, unknown>({
            operations: ['get_root_items'],
            collectionKey: 'items',
            itemSchema: z.unknown(),
            response: 'envelope',
            requestControls: true,
            prepare: () => ({ operation: 'get_root_items' }),
        });
        const request = vi.fn().mockResolvedValue({ items: [] });

        await expect(executor.items({ request } as unknown as TestRailClientCore, undefined)).resolves.toEqual([]);
        expect(request).toHaveBeenCalledWith(expect.objectContaining({ endpoint: 'get_root_items' }));
    });
});
