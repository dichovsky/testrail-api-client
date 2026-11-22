import { z } from 'zod';
import { TestRailClientCore } from '../client-core.js';
import { TestRailApiError, TestRailValidationError } from '../errors.js';
import { validateId, validateIdList, validateTimestamp } from '../validation.js';
import { buildEndpoint } from '../url.js';
import type { Case, GetCasesOptions, HistoryEntry, SoftDeleteOptions } from '../types.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
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
import { listOf, unwrapList } from './list.js';
import { createPaginatedListExecutor } from './paginated-list.js';
import { serializeIdFilter } from '../utils.js';

export interface GetHistoryForCaseOptions {
    /** Maximum number of history entries to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export interface GetAllCasesOptions extends Omit<GetCasesOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}

export type GetAllHistoryForCaseOptions = PaginatedRequestOptions;

export const CASES_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetCasesOptions,
    GetAllCasesOptions,
    Case
>({
    operations: ['get_cases'],
    collectionKey: 'cases',
    itemSchema: CaseSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }, options) => {
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
        } = options ?? {};
        if (suiteId !== undefined) validateId(suiteId, 'suiteId');
        if (sectionId !== undefined) validateId(sectionId, 'sectionId');
        validateTimestamp(createdAfter, 'createdAfter');
        validateTimestamp(createdBefore, 'createdBefore');
        validateTimestamp(updatedAfter, 'updatedAfter');
        validateTimestamp(updatedBefore, 'updatedBefore');
        return {
            operation: 'get_cases',
            pathParameters: [projectId],
            query: {
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
            },
        };
    },
});

export const CASE_HISTORY_PAGINATION = createPaginatedListExecutor<
    { readonly caseId: number },
    GetHistoryForCaseOptions,
    GetAllHistoryForCaseOptions,
    HistoryEntry
>({
    operations: ['get_history_for_case'],
    collectionKey: 'history',
    itemSchema: HistoryEntrySchema,
    response: 'nested-envelope',
    requestControls: true,
    prepare: ({ caseId }) => {
        validateId(caseId, 'caseId');
        return { operation: 'get_history_for_case', pathParameters: [caseId] };
    },
});

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
        return CASES_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Fetch one normalized cases page and keep the TestRail pagination metadata. */
    async getCasesPage(projectId: number, options?: GetCasesOptions): Promise<Page<Case>> {
        return CASES_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Fetch all cases pages. Explicit aggregate safety limits apply. */
    async getAllCases(projectId: number, options?: GetAllCasesOptions): Promise<Case[]> {
        return CASES_PAGINATION.all(this.client, { projectId }, options);
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
     * Bulk-create cases in a section with one request. The payload is an
     * array of `AddCasePayload` objects (one per case). Returns the array of
     * newly created cases.
     *
     * @throws {TestRailApiError} When a successful response has an unrecognized
     * shape. The write outcome is indeterminate, and callers must not retry the
     * write blindly.
     *
     * @testrail POST add_cases/{section_id}
     */
    async addCases(sectionId: number, payload: AddCasesBulkPayload): Promise<Case[]> {
        validateId(sectionId, 'sectionId');
        if (!Array.isArray(payload) || payload.length === 0) {
            throw new TestRailValidationError('cases must contain at least one case');
        }
        // Wire shape (confirmed by live probe 2026-06-21): the request body must be
        // `{ cases: [...] }` — a bare array is rejected with 400 "Field :cases is a
        // required field." — and the success response wraps the created cases as
        // `{ cases: [...] }` (NOT `{ added_cases }`).
        //
        // The response goes through `listOf`/`unwrapList` like every other list
        // read, and here the reason is sharper than tolerance: this is a *write*.
        // An envelope-only schema meeting a drifted body could resolve `[]` while
        // cases were created server-side. Because the write may already have
        // happened, a body matching neither supported shape must fail closed.
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
     * Delete a single case. Pass `{ soft: true }` to request the TestRail
     * server-side preview (`soft=1`). The client still sends the request, but
     * TestRail deletes no data and returns counts of affected entities. Soft
     * mode is different from a client-side `--dry-run`, which stops before any
     * request. Soft mode requires TestRail 6.5 or later.
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
        const soft = options?.soft === true;
        const endpoint = buildEndpoint(`delete_case/${caseId}`, {
            ...(soft && { soft: 1 }),
        });
        const result = await this.client.request<SoftDeletePreview>({
            method: 'POST',
            endpoint,
            ...(soft && { schema: SoftDeletePreviewSchema }),
        });
        if (soft) return result;
    }

    /**
     * Bulk-update many cases with the same field values in one request.
     * `payload.case_ids` identifies the target cases. TestRail applies all
     * other fields equally to each listed case. TestRail returns the array of
     * updated cases.
     *
     * Note: The TestRail online documentation shows `suite_id` as optional in
     * single-suite mode. In practice, `suite_id` is required even in
     * single-suite mode. The Python reference client documents this
     * difference. In single-suite mode, pass the only suite that you have.
     *
     * @throws {TestRailApiError} When a successful response has an unrecognized
     * shape. The write outcome is indeterminate, and callers must not retry the
     * write blindly.
     *
     * @testrail POST update_cases/{suite_id}
     */
    async updateCases(suiteId: number, payload: UpdateCasesPayload): Promise<Case[]> {
        validateId(suiteId, 'suiteId');
        validateIdList(payload.case_ids, 'caseIds');
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
     * Bulk-delete cases. The TestRail URL takes `suite_id` in the path and
     * `project_id` (required) as a query parameter. `options.soft=true`
     * adds `soft=1`. This parameter requests a server-side preview that
     * returns affected-test counts and deletes no data. The request body
     * contains the case IDs.
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
        validateIdList(payload.case_ids, 'caseIds');
        const soft = options?.soft === true;
        const endpoint = buildEndpoint(`delete_cases/${suiteId}`, {
            project_id: projectId,
            ...(soft && { soft: 1 }),
        });
        const result = await this.client.request<SoftDeletePreview>({
            method: 'POST',
            endpoint,
            body: { kind: 'json', data: payload },
            ...(soft && { schema: SoftDeletePreviewSchema }),
        });
        if (soft) return result;
    }

    /**
     * Copy cases into a target section. TestRail creates new copies of the
     * cases. On success, TestRail returns HTTP 200 with an **empty body**
     * (confirmed by live probe 2026-06-21). Thus, the method resolves to
     * `void`. The method does NOT return the created copies. Older docs and
     * JSDoc incorrectly say that it does.
     * @testrail POST copy_cases_to_section/{section_id}
     */
    async copyCasesToSection(sectionId: number, payload: CopyCasesToSectionPayload): Promise<void> {
        validateId(sectionId, 'sectionId');
        validateIdList(payload.case_ids, 'caseIds');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `copy_cases_to_section/${sectionId}`,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Move cases into a target section. `payload.suite_id` is required even
     * for same-suite moves. TestRail uses `suite_id` to resolve the
     * destination section across suites. `section_id` is only a path
     * parameter. It is NOT in the body. Returns no body.
     * @testrail POST move_cases_to_section/{section_id}
     */
    async moveCasesToSection(sectionId: number, payload: MoveCasesToSectionPayload): Promise<void> {
        validateId(sectionId, 'sectionId');
        validateIdList(payload.case_ids, 'caseIds');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `move_cases_to_section/${sectionId}`,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail GET get_history_for_case/{case_id} */
    async getHistoryForCase(caseId: number, options?: GetHistoryForCaseOptions): Promise<HistoryEntry[]> {
        return CASE_HISTORY_PAGINATION.items(this.client, { caseId }, options);
    }

    /** Fetch one normalized case-history page, including its nested envelope variant. */
    async getHistoryForCasePage(caseId: number, options?: GetHistoryForCaseOptions): Promise<Page<HistoryEntry>> {
        return CASE_HISTORY_PAGINATION.page(this.client, { caseId }, options);
    }

    /** Fetch all case-history pages. Explicit aggregate safety limits apply. */
    async getAllHistoryForCase(caseId: number, options?: GetAllHistoryForCaseOptions): Promise<HistoryEntry[]> {
        return CASE_HISTORY_PAGINATION.all(this.client, { caseId }, options);
    }
}
