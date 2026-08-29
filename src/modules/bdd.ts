import { TestRailClientCore } from '../client-core.js';
import type { Case, UploadFileInput } from '../types.js';
import type { Bdd } from '../schemas.js';
import { BddSchema, CaseSchema } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { collectAllPages, decodePage } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotOptionFields, snapshotPaginatedRequestOptions } from './pagination-options.js';

/** Filters and pagination controls accepted by TestRail 10.5+'s `get_bdds`. */
export interface GetBddsOptions {
    /** Return only BDD cases belonging to this suite. */
    suiteId?: number;
    /** Return only BDD cases belonging to this section. */
    sectionId?: number;
    /** Return only BDD cases carrying one of these label IDs. */
    labelId?: number | readonly number[];
    /**
     * Filter by an external reference. TestRail 10.7+ accepts an array and
     * serializes it as repeated `refs[]` parameters; a string keeps the
     * backwards-compatible single `refs` parameter.
     */
    refs?: string | readonly string[];
    /** Maximum number of BDD entries to return. */
    limit?: number;
    /** Pagination offset. */
    offset?: number;
}

export interface GetAllBddsOptions extends Omit<GetBddsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}

type PageTransportOptions = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

/**
 * BDDs (Behavior-Driven Development / Gherkin `.feature`) endpoints.
 *
 * Unlike every other endpoint in this client, `getBdd` returns raw Gherkin
 * text (`text/plain`), not JSON. It dispatches through `request()` with
 * `responseKind: 'text'`, which mirrors the JSON path's retry / rate-limit /
 * timeout pipeline but swaps the JSON parse step for `response.text()`.
 *
 * `addBdd` and `updateBdd` are thin wrappers over the same multipart pipeline
 * used by `AttachmentModule.addAttachment*`. TestRail returns a `Case` on
 * success. The plural `getBdds` endpoint (TestRail 10.5+) returns JSON and is
 * paginated, unlike the raw-text singular endpoint.
 */
export class BddModule {
    constructor(private readonly client: TestRailClientCore) {}

    /**
     * Fetch a case's BDD content as raw Gherkin text.
     * @returns The `.feature` file body (Gherkin syntax). Empty string if unset.
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
     * Fetch BDD feature content in bulk. TestRail 10.5+.
     * @testrail GET get_bdds/{project_id}
     */
    async getBdds(projectId: number, options?: GetBddsOptions): Promise<Bdd[]> {
        return unwrapList<Bdd>('bdd', await this.requestBddsPage(projectId, options));
    }

    /** Fetch one normalized bulk-BDD page while preserving pagination metadata. */
    async getBddsPage(projectId: number, options?: GetBddsOptions): Promise<Page<Bdd>> {
        return decodePage<Bdd>('bdd', await this.requestBddsPage(projectId, options, { pageProjection: true }));
    }

    /** Fetch every bulk-BDD page under explicit aggregate safety bounds. */
    async getAllBdds(projectId: number, options?: GetAllBddsOptions): Promise<Bdd[]> {
        const filters = snapshotOptionFields(options, ['suiteId', 'sectionId', 'labelId', 'refs']);
        return collectAllPages({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: async ({ offset, limit, bypassCache, remainingTimeMs, deadlineAt }) =>
                decodePage<Bdd>(
                    'bdd',
                    await this.requestBddsPage(
                        projectId,
                        {
                            ...filters,
                            ...(limit !== undefined && { limit }),
                            ...(offset !== undefined && { offset }),
                        },
                        { bypassCache, remainingTimeMs, deadlineAt },
                    ),
                ),
        });
    }

    private async requestBddsPage(
        projectId: number,
        options?: GetBddsOptions,
        transport?: PageTransportOptions,
    ): Promise<unknown> {
        validateId(projectId, 'projectId');
        const { suiteId, sectionId, labelId, refs, limit, offset } = options ?? {};
        if (suiteId !== undefined) validateId(suiteId, 'suiteId');
        if (sectionId !== undefined) validateId(sectionId, 'sectionId');
        if (typeof labelId === 'number') {
            validateId(labelId, 'labelId');
        } else if (labelId !== undefined) {
            labelId.forEach((id, index) => validateId(id, `labelId[${index}]`));
        }
        validatePaginationParams(limit, offset);

        const labelFilter =
            typeof labelId === 'number'
                ? labelId
                : labelId !== undefined && labelId.length > 0
                  ? labelId.join(',')
                  : undefined;
        const refsScalar = typeof refs === 'string' ? refs : undefined;
        const refsArray = refs !== undefined && typeof refs !== 'string' ? refs : undefined;
        const endpoint = buildEndpoint(`get_bdds/${projectId}`, {
            suite_id: suiteId,
            section_id: sectionId,
            label_id: labelFilter,
            refs: refsScalar,
            'refs[]': refsArray,
            limit,
            offset,
        });
        const pageProjection = transport?.pageProjection === true || transport?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('bdd', BddSchema) : listOf('bdd', BddSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(transport?.bypassCache !== undefined && { bypassCache: transport.bypassCache }),
            ...(transport?.remainingTimeMs !== undefined && { remainingTimeMs: transport.remainingTimeMs }),
            ...(transport?.deadlineAt !== undefined && { deadlineAt: transport.deadlineAt }),
        });
    }

    /**
     * Upload a `.feature` file to a section, creating a BDD test case.
     * @testrail POST add_bdd/{section_id}
     */
    async addBdd(sectionId: number, file: UploadFileInput, filename: string): Promise<Case> {
        validateId(sectionId, 'sectionId');
        return this.uploadBdd(`add_bdd/${sectionId}`, file, filename);
    }

    /**
     * Replace an existing case's BDD content with a `.feature` file.
     * @testrail POST update_bdd/{case_id}
     */
    async updateBdd(caseId: number, file: UploadFileInput, filename: string): Promise<Case> {
        validateId(caseId, 'caseId');
        return this.uploadBdd(`update_bdd/${caseId}`, file, filename);
    }

    private async uploadBdd(endpoint: string, file: UploadFileInput, filename: string): Promise<Case> {
        return this.client.parse<Case>(
            CaseSchema,
            await this.client.request<unknown>({
                method: 'POST',
                endpoint,
                body: { kind: 'multipart', file, filename },
                retry: 'none',
            }),
            { method: 'POST', endpoint },
        );
    }
}
