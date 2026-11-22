import { TestRailClientCore } from '../client-core.js';
import type { Case, UploadFileInput } from '../types.js';
import type { Bdd } from '../schemas.js';
import { BddSchema, CaseSchema } from '../schemas.js';
import { validateId } from '../validation.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { serializeIdFilter } from '../utils.js';
import { createPaginatedListExecutor } from './paginated-list.js';
import { withMultipartUpload } from '../upload-lifetime.js';

/** Filters and pagination controls that the TestRail 10.5+ `get_bdds` endpoint accepts. */
export interface GetBddsOptions {
    /** Return only BDD cases in this suite. */
    suiteId?: number;
    /** Return only BDD cases in this section. */
    sectionId?: number;
    /** Return only BDD cases that have one of these label IDs. */
    labelId?: number | readonly number[];
    /**
     * Filter by an external reference. TestRail 10.7+ accepts an array. The
     * client serializes an array as repeated `refs[]` parameters. A string
     * keeps the backwards-compatible single `refs` parameter.
     */
    refs?: string | readonly string[];
    /** Maximum number of BDD entries to return. */
    limit?: number;
    /** Pagination offset. */
    offset?: number;
}

export interface GetAllBddsOptions extends Omit<GetBddsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}

export const BDDS_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetBddsOptions,
    GetAllBddsOptions,
    Bdd
>({
    operations: ['get_bdds'],
    collectionKey: 'bdd',
    itemSchema: BddSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }, options) => {
        validateId(projectId, 'projectId');
        const { suiteId, sectionId, labelId, refs } = options ?? {};
        if (suiteId !== undefined) validateId(suiteId, 'suiteId');
        if (sectionId !== undefined) validateId(sectionId, 'sectionId');
        return {
            operation: 'get_bdds',
            pathParameters: [projectId],
            query: {
                suite_id: suiteId,
                section_id: sectionId,
                label_id: serializeIdFilter(labelId, 'labelId'),
                refs: typeof refs === 'string' ? refs : undefined,
                'refs[]': Array.isArray(refs) ? refs : undefined,
            },
        };
    },
});

/**
 * The BDDs (Behavior-Driven Development / Gherkin `.feature`) endpoints.
 *
 * Unlike all other endpoints in this client, `getBdd` returns raw Gherkin
 * text (`text/plain`), not JSON. The method dispatches through `request()`
 * with `responseKind: 'text'`. This request uses the same retry, rate-limit,
 * and timeout pipeline as the JSON path, but replaces the JSON parse step with
 * `response.text()`.
 *
 * `addBdd` and `updateBdd` are thin wrappers over the same multipart pipeline
 * that `AttachmentModule.addAttachment*` uses. TestRail returns a `Case` on
 * success. The plural `getBdds` endpoint (TestRail 10.5+) returns JSON and is
 * paginated, unlike the raw-text singular endpoint.
 */
export class BddModule {
    constructor(private readonly client: TestRailClientCore) {}

    /**
     * Fetch a case's BDD content as raw Gherkin text.
     * @returns The `.feature` file body (Gherkin syntax), or an empty string if the case has no BDD content.
     * @testrail GET get_bdd/{case_id}
     */
    async getBdd(caseId: number): Promise<string> {
        validateId(caseId, 'caseId');
        return this.client.request<string>({
            method: 'GET',
            endpoint: `get_bdd/${caseId}`,
            responseKind: 'text',
        });
    }

    /**
     * Fetch BDD feature content in bulk. Requires TestRail 10.5 or later.
     * @testrail GET get_bdds/{project_id}
     */
    async getBdds(projectId: number, options?: GetBddsOptions): Promise<Bdd[]> {
        return BDDS_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Fetch one normalized bulk-BDD page and keep its pagination metadata. */
    async getBddsPage(projectId: number, options?: GetBddsOptions): Promise<Page<Bdd>> {
        return BDDS_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Fetch all bulk-BDD pages. Explicit aggregate safety limits apply. */
    async getAllBdds(projectId: number, options?: GetAllBddsOptions): Promise<Bdd[]> {
        return BDDS_PAGINATION.all(this.client, { projectId }, options);
    }

    /**
     * Upload a `.feature` file to a section. The upload creates a BDD test case.
     * @testrail POST add_bdd/{section_id}
     */
    async addBdd(sectionId: number, file: UploadFileInput, filename: string): Promise<Case> {
        return withMultipartUpload({ kind: 'multipart', file, filename }, (body) => {
            validateId(sectionId, 'sectionId');
            return this.client.request<Case>({
                method: 'POST',
                endpoint: `add_bdd/${sectionId}`,
                body,
                schema: CaseSchema,
            });
        });
    }

    /**
     * Replace an existing case's BDD content with a `.feature` file.
     * @testrail POST update_bdd/{case_id}
     */
    async updateBdd(caseId: number, file: UploadFileInput, filename: string): Promise<Case> {
        return withMultipartUpload({ kind: 'multipart', file, filename }, (body) => {
            validateId(caseId, 'caseId');
            return this.client.request<Case>({
                method: 'POST',
                endpoint: `update_bdd/${caseId}`,
                body,
                schema: CaseSchema,
            });
        });
    }
}
