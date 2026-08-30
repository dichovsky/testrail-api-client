import { z } from 'zod';
import { TestRailClientCore } from '../client-core.js';
import { TestRailApiError, TestRailValidationError } from '../errors.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import type { Case, GetCasesOptions, HistoryEntry, SoftDeleteOptions } from '../types.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { collectAllPages, decodeNestedPage, decodePage } from '../pagination.js';
import type {
    AddCasePayload,
    AddCasesBulkPayload,
    UpdateCasePayload,
    UpdateCasesPayload,
    DeleteCasesPayload,
    CopyCasesToSectionPayload,
    MoveCasesToSectionPayload,
    SoftDeletePreview,
    CaseTitle,
} from '../schemas.js';
import { CaseSchema, CaseTitleSchema, HistoryEntrySchema, SoftDeletePreviewSchema } from '../schemas.js';
import { listOf, listOfNested, pageOf, pageOfNested, unwrapList, unwrapNestedList } from './list.js';
import { snapshotOptionFields, snapshotPaginatedRequestOptions } from './pagination-options.js';
import { serializeIdFilter } from '../utils.js';

export interface GetHistoryForCaseOptions {
    /** Maximum number of history entries to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export interface GetAllCasesOptions extends Omit<GetCasesOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}

export type GetAllHistoryForCaseOptions = PaginatedRequestOptions;

type PageTransportOptions = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

export class CaseModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_case/{case_id} */
    async getCase(caseId: number): Promise<Case> {
        validateId(caseId, 'caseId');
        return this.client.request<Case>({ method: 'GET', endpoint: `get_case/${caseId}`, schema: CaseSchema });
    }

    /**
     * Resolve case IDs to their lightweight `{ id, title }` projections.
     * Requires TestRail 10.5 or later.
     * @testrail GET get_case_titles
     */
    async getCaseTitles(caseIds: readonly number[]): Promise<CaseTitle[]> {
        if (caseIds.length === 0) {
            throw new TestRailValidationError('caseIds must contain at least one positive integer');
        }
        for (const caseId of caseIds) validateId(caseId, 'caseId');
        const endpoint = buildEndpoint('get_case_titles', { case_ids: caseIds.join(',') });
        return this.client.request<CaseTitle[]>({
            method: 'GET',
            endpoint,
            schema: z.array(CaseTitleSchema),
        });
    }

    /** @testrail GET get_cases/{project_id} */
    async getCases(projectId: number, options?: GetCasesOptions): Promise<Case[]> {
        return unwrapList<Case>('cases', await this.requestCasesPage(projectId, options));
    }

    /** Fetch one normalized cases page while preserving TestRail pagination metadata. */
    async getCasesPage(projectId: number, options?: GetCasesOptions): Promise<Page<Case>> {
        return decodePage<Case>('cases', await this.requestCasesPage(projectId, options, { pageProjection: true }));
    }

    /** Fetch every cases page under explicit aggregate safety bounds. */
    async getAllCases(projectId: number, options?: GetAllCasesOptions): Promise<Case[]> {
        const filters = snapshotOptionFields(options, [
            'suiteId',
            'sectionId',
            'typeId',
            'priorityId',
            'templateId',
            'milestoneId',
            'createdAfter',
            'createdBefore',
            'createdBy',
            'filter',
            'updatedAfter',
            'updatedBefore',
            'updatedBy',
            'labelId',
            'refs',
        ]);
        return collectAllPages({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: async ({ offset, limit, bypassCache, remainingTimeMs, deadlineAt }) =>
                decodePage<Case>(
                    'cases',
                    await this.requestCasesPage(
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

    private async requestCasesPage(
        projectId: number,
        options?: GetCasesOptions,
        transport?: PageTransportOptions,
    ): Promise<unknown> {
        validateId(projectId, 'projectId');
        const {
            suiteId,
            sectionId,
            typeId,
            priorityId,
            templateId,
            milestoneId,
            createdAfter,
            createdBefore,
            createdBy,
            filter,
            updatedAfter,
            updatedBefore,
            updatedBy,
            labelId,
            refs,
            limit,
            offset,
        } = options ?? {};
        if (suiteId !== undefined) validateId(suiteId, 'suiteId');
        if (sectionId !== undefined) validateId(sectionId, 'sectionId');
        validatePaginationParams(limit, offset);
        const endpoint = buildEndpoint(`get_cases/${projectId}`, {
            suite_id: suiteId,
            section_id: sectionId,
            type_id: serializeIdFilter(typeId, 'typeId'),
            priority_id: serializeIdFilter(priorityId, 'priorityId'),
            template_id: serializeIdFilter(templateId, 'templateId'),
            milestone_id: serializeIdFilter(milestoneId, 'milestoneId'),
            created_after: createdAfter,
            created_before: createdBefore,
            created_by: serializeIdFilter(createdBy, 'createdBy'),
            filter,
            updated_after: updatedAfter,
            updated_before: updatedBefore,
            updated_by: serializeIdFilter(updatedBy, 'updatedBy'),
            label_id: serializeIdFilter(labelId, 'labelId'),
            refs: typeof refs === 'string' ? refs : undefined,
            'refs[]': Array.isArray(refs) ? refs : undefined,
            limit,
            offset,
        });
        // Bimodal across server versions: the `{ offset, limit, size, _links,
        // cases: [...] }` envelope requires TestRail 6.7+ (the version gate on
        // `limit`/`offset` in the get_cases docs); older servers return a bare
        // array. This package declares no minimum server version, so accept
        // both — same defence as `suites.getSuites()`.
        // SPEC #1.5 — `{ cases: null }` is a valid empty wrapper, hence `.nullable()`.
        const pageProjection = transport?.pageProjection === true || transport?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('cases', CaseSchema) : listOf('cases', CaseSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(transport?.bypassCache !== undefined && { bypassCache: transport.bypassCache }),
            ...(transport?.remainingTimeMs !== undefined && { remainingTimeMs: transport.remainingTimeMs }),
            ...(transport?.deadlineAt !== undefined && { deadlineAt: transport.deadlineAt }),
        });
    }

    /** @testrail POST add_case/{section_id} */
    async addCase(sectionId: number, payload: AddCasePayload): Promise<Case> {
        validateId(sectionId, 'sectionId');
        return this.client.request<Case>({
            method: 'POST',
            endpoint: `add_case/${sectionId}`,
            schema: CaseSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Bulk-create cases under a section in one API call. The payload is an
     * array of `AddCasePayload` objects (one per case). Returns the array of
     * newly created cases.
     *
     * **Server version gate:** TestRail 7.5+ is required — older instances
     * return 400 / 404 with messages like `"Invalid uri"` because the
     * endpoint does not exist. When that shape is detected the error is
     * rethrown as a clearer `TestRailApiError(status, 'TestRail server >= 7.5
     * required for add_cases bulk endpoint', <original response>)` so callers
     * can tell "your TestRail is too old" from "your payload is malformed".
     *
     * @throws {TestRailApiError} When a successful response has an unrecognized
     * shape; the write outcome is indeterminate and must not be retried blindly.
     *
     * @testrail POST add_cases/{section_id}
     */
    async addCases(sectionId: number, payload: AddCasesBulkPayload): Promise<Case[]> {
        validateId(sectionId, 'sectionId');
        try {
            // Wire shape (confirmed by live probe 2026-06-21): the request body must be
            // `{ cases: [...] }` — a bare array is rejected with 400 "Field :cases is a
            // required field." — and the success response wraps the created cases as
            // `{ cases: [...] }` (NOT `{ added_cases }`).
            //
            // The response goes through `listOf`/`unwrapList` like every other list
            // read, and here the reason is sharper than tolerance: this is a *write*.
            // An envelope-only schema meeting a drifted body (the wrapper-vs-bare
            // drift #248 proved for six read endpoints) parses to the raw body, whose
            // `.cases` is undefined, so the call resolves `[]` while the cases were
            // created server-side. A caller that reads "0 created" and retries
            // duplicates them. Accepting both shapes removes the largest slice of that
            // risk. Because the write may already have happened, a body matching
            // neither must fail closed instead of returning a value that invites a
            // retry; `request()` remains advisory for every other response.
            const responseSchema = listOf('cases', CaseSchema);
            const raw = await this.client.request<unknown>({
                method: 'POST',
                endpoint: `add_cases/${sectionId}`,
                schema: responseSchema,
                body: { kind: 'json', data: { cases: payload } },
            });
            const parsed = responseSchema.safeParse(raw);
            if (!parsed.success) {
                throw new TestRailApiError(
                    200,
                    'add_cases succeeded but returned an unrecognized response; write outcome is indeterminate',
                    raw,
                );
            }
            return unwrapList<Case>('cases', parsed.data);
        } catch (e: unknown) {
            if (e instanceof TestRailApiError && (e.status === 400 || e.status === 404)) {
                const responseStr = typeof e.response === 'string' ? e.response : JSON.stringify(e.response ?? '');
                // TestRail < 7.5 returns 404 with "Invalid uri" (the
                // endpoint simply doesn't exist) or 400 with "No route".
                // Deliberately exclude "Field .* is not a valid field" — that
                // error can occur on TestRail >= 7.5 for a genuinely invalid
                // payload field and must not be misclassified as a version
                // mismatch. Only match true endpoint-absent indicators.
                // The reclassified error embeds the version notice in
                // `statusText` (NOT response) so it lands in `error.message`
                // — callers commonly inspect `.message`, and the original
                // server response is preserved verbatim in `response` for
                // programmatic inspection.
                if (/Invalid uri|No route/i.test(responseStr)) {
                    throw new TestRailApiError(
                        e.status,
                        'TestRail server >= 7.5 required for add_cases bulk endpoint',
                        e.response,
                    );
                }
            }
            throw e;
        }
    }

    /** @testrail POST update_case/{case_id} */
    async updateCase(caseId: number, payload: UpdateCasePayload): Promise<Case> {
        validateId(caseId, 'caseId');
        return this.client.request<Case>({
            method: 'POST',
            endpoint: `update_case/${caseId}`,
            schema: CaseSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Delete a single case. Pass `{ soft: true }` to invoke TestRail's
     * server-side preview (`soft=1`) — the API call still happens but
     * nothing is deleted and TestRail returns counts of affected entities.
     * Distinct from a client-side `--dry-run` which short-circuits before
     * any request. TestRail 6.5+ for soft-mode.
     *
     * @testrail POST delete_case/{case_id}
     */
    async deleteCase(caseId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteCase(caseId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload for callers passing a `SoftDeleteOptions` variable
    // where `soft` is computed at runtime (boolean). The literal-true /
    // literal-false overloads above give precise return types when the
    // flag is statically known; this third public overload accepts the
    // dynamic case and returns the union, matching the implementation.
    async deleteCase(caseId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteCase(caseId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        validateId(caseId, 'caseId');
        const endpoint = buildEndpoint(`delete_case/${caseId}`, {
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>({ method: 'POST', endpoint });
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw, {
                method: 'POST',
                endpoint,
            });
        }
    }

    /**
     * Bulk-update many cases with the same field values in one API call.
     * `payload.case_ids` identifies the targets; all other fields are applied
     * uniformly to every listed case. TestRail returns the array of updated
     * cases.
     *
     * Note: TestRail's online docs claim `suite_id` is single-suite-mode
     * optional. In practice it is required even in single-suite mode (the
     * Python reference client documents this caveat) — pass the only suite
     * you have.
     *
     * @throws {TestRailApiError} When a successful response has an unrecognized
     * shape; the write outcome is indeterminate and must not be retried blindly.
     *
     * @testrail POST update_cases/{suite_id}
     */
    async updateCases(suiteId: number, payload: UpdateCasesPayload): Promise<Case[]> {
        validateId(suiteId, 'suiteId');
        // Wire shape (confirmed by live probe 2026-06-21): the success response wraps the
        // updated cases as `{ updated_cases: [...] }`, not a bare array. Routed through
        // `listOf`/`unwrapList` for the same reason as `addCases` above — on a bulk
        // write, silently resolving `[]` because the response shape drifted reports
        // "nothing updated" for work the server actually did.
        const responseSchema = listOf('updated_cases', CaseSchema);
        const raw = await this.client.request<unknown>({
            method: 'POST',
            endpoint: `update_cases/${suiteId}`,
            schema: responseSchema,
            body: { kind: 'json', data: payload },
        });
        const parsed = responseSchema.safeParse(raw);
        if (!parsed.success) {
            throw new TestRailApiError(
                200,
                'update_cases succeeded but returned an unrecognized response; write outcome is indeterminate',
                raw,
            );
        }
        return unwrapList<Case>('updated_cases', parsed.data);
    }

    /**
     * Bulk-delete cases. TestRail's URL takes `suite_id` in the path and
     * `project_id` (required) as a query parameter. `options.soft=true`
     * adds `soft=1` — a server-side preview that returns affected-test
     * counts without deleting. The body carries the case IDs.
     *
     * @testrail POST delete_cases/{suite_id}
     */
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options: SoftDeleteOptions & { soft: true },
    ): Promise<SoftDeletePreview>;
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options?: SoftDeleteOptions & { soft?: false },
    ): Promise<void>;
    // General overload for dynamic `soft` (see deleteCase above).
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options: SoftDeleteOptions,
    ): Promise<void | SoftDeletePreview>;
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options?: SoftDeleteOptions,
    ): Promise<void | SoftDeletePreview> {
        validateId(suiteId, 'suiteId');
        validateId(projectId, 'projectId');
        const endpoint = buildEndpoint(`delete_cases/${suiteId}`, {
            project_id: projectId,
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>({
            method: 'POST',
            endpoint,
            body: { kind: 'json', data: payload },
        });
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw, {
                method: 'POST',
                endpoint,
            });
        }
    }

    /**
     * Copy cases into a target section (creates new case copies). TestRail
     * returns HTTP 200 with an **empty body** on success (confirmed by live
     * probe 2026-06-21), so this resolves to `void` — it does NOT return the
     * created copies, despite older docs/JSDoc claiming otherwise.
     * @testrail POST copy_cases_to_section/{section_id}
     */
    async copyCasesToSection(sectionId: number, payload: CopyCasesToSectionPayload): Promise<void> {
        validateId(sectionId, 'sectionId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `copy_cases_to_section/${sectionId}`,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Move cases into a target section. `payload.suite_id` is required even
     * for same-suite moves (TestRail uses it to resolve the destination
     * section across suites). Path-only `section_id` — NOT in the body.
     * Returns no body.
     * @testrail POST move_cases_to_section/{section_id}
     */
    async moveCasesToSection(sectionId: number, payload: MoveCasesToSectionPayload): Promise<void> {
        validateId(sectionId, 'sectionId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `move_cases_to_section/${sectionId}`,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail GET get_history_for_case/{case_id} */
    async getHistoryForCase(caseId: number, options?: GetHistoryForCaseOptions): Promise<HistoryEntry[]> {
        return unwrapNestedList<HistoryEntry>('history', await this.requestHistoryForCasePage(caseId, options));
    }

    /** Fetch one normalized case-history page, including its nested envelope variant. */
    async getHistoryForCasePage(caseId: number, options?: GetHistoryForCaseOptions): Promise<Page<HistoryEntry>> {
        return decodeNestedPage<HistoryEntry>(
            'history',
            await this.requestHistoryForCasePage(caseId, options, { pageProjection: true }),
        );
    }

    /** Fetch all case-history pages under explicit aggregate safety bounds. */
    async getAllHistoryForCase(caseId: number, options?: GetAllHistoryForCaseOptions): Promise<HistoryEntry[]> {
        return collectAllPages({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: async ({ offset, limit, bypassCache, remainingTimeMs, deadlineAt }) =>
                decodeNestedPage<HistoryEntry>(
                    'history',
                    await this.requestHistoryForCasePage(
                        caseId,
                        {
                            ...(limit !== undefined && { limit }),
                            ...(offset !== undefined && { offset }),
                        },
                        { bypassCache, remainingTimeMs, deadlineAt },
                    ),
                ),
        });
    }

    private async requestHistoryForCasePage(
        caseId: number,
        options?: GetHistoryForCaseOptions,
        transport?: PageTransportOptions,
    ): Promise<unknown> {
        validateId(caseId, 'caseId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_history_for_case/${caseId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        // Three shapes, all attested: the twin endpoint `get_shared_step_history`
        // documents a `{ step_history }` wrapper yet returns a bare array on live
        // Cloud (fixed in #248), while this endpoint's own documented example
        // nests the pagination object inside an outer array —
        // `[{ offset, limit, size, _links, history: [...] }]`. `listOf` alone
        // rejected that third form, so the raw outer array came back and
        // `unwrapList` handed the caller the envelope itself as `result[0]`,
        // typed `HistoryEntry` but with no `id`/`user_id`. SPEC #1.5 —
        // `{ history: null }` is a valid empty wrapper.
        const pageProjection = transport?.pageProjection === true || transport?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection
                ? pageOfNested('history', HistoryEntrySchema)
                : listOfNested('history', HistoryEntrySchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(transport?.bypassCache !== undefined && { bypassCache: transport.bypassCache }),
            ...(transport?.remainingTimeMs !== undefined && { remainingTimeMs: transport.remainingTimeMs }),
            ...(transport?.deadlineAt !== undefined && { deadlineAt: transport.deadlineAt }),
        });
    }
}
