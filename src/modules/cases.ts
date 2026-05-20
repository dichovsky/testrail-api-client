import { TestRailClientCore } from '../client-core.js';
import { TestRailApiError } from '../errors.js';
import type { Case, GetCasesOptions, HistoryEntry, SoftDeleteOptions } from '../types.js';
import type {
    AddCasePayload,
    AddCasesBulkPayload,
    UpdateCasePayload,
    UpdateCasesPayload,
    DeleteCasesPayload,
    CopyCasesToSectionPayload,
    MoveCasesToSectionPayload,
    SoftDeletePreview,
} from '../schemas.js';
import { CaseSchema, HistoryEntrySchema, SoftDeletePreviewSchema } from '../schemas.js';
import { z } from 'zod';

export interface GetHistoryForCaseOptions {
    /** Maximum number of history entries to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

/** @deprecated Use {@link SoftDeleteOptions} from `../types.js` — kept as an
 *  alias for back-compat. */
export type DeleteCasesOptions = SoftDeleteOptions;

/** @deprecated Use {@link SoftDeletePreview} (re-exported from the package
 *  root) — kept as an alias for back-compat. */
export type DeleteCasesPreview = SoftDeletePreview;

export class CaseModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_case/{case_id} */
    async getCase(caseId: number): Promise<Case> {
        this.client.validateId(caseId, 'caseId');
        return this.client.requestParsed<Case>('GET', `get_case/${caseId}`, CaseSchema);
    }

    /** @testrail GET get_cases/{project_id} */
    async getCases(projectId: number, options?: GetCasesOptions): Promise<Case[]> {
        this.client.validateId(projectId, 'projectId');
        const {
            suiteId,
            sectionId,
            typeId,
            priorityId,
            templateId,
            milestoneId,
            createdAfter,
            createdBefore,
            updatedAfter,
            updatedBefore,
            limit,
            offset,
        } = options ?? {};
        if (suiteId !== undefined) this.client.validateId(suiteId, 'suiteId');
        if (sectionId !== undefined) this.client.validateId(sectionId, 'sectionId');
        if (typeId !== undefined) this.client.validateId(typeId, 'typeId');
        if (priorityId !== undefined) this.client.validateId(priorityId, 'priorityId');
        if (templateId !== undefined) this.client.validateId(templateId, 'templateId');
        if (milestoneId !== undefined) this.client.validateId(milestoneId, 'milestoneId');
        this.client.validatePaginationParams(limit, offset);
        const endpoint = this.client.buildEndpoint(`get_cases/${projectId}`, {
            suite_id: suiteId,
            section_id: sectionId,
            type_id: typeId,
            priority_id: priorityId,
            template_id: templateId,
            milestone_id: milestoneId,
            created_after: createdAfter,
            created_before: createdBefore,
            updated_after: updatedAfter,
            updated_before: updatedBefore,
            limit,
            offset,
        });
        return (
            (
                await this.client.requestParsed<{ cases?: Case[] }>(
                    'GET',
                    endpoint,
                    z.object({ cases: z.array(CaseSchema).optional() }),
                )
            ).cases ?? []
        );
    }

    /** @testrail POST add_case/{section_id} */
    async addCase(sectionId: number, payload: AddCasePayload): Promise<Case> {
        this.client.validateId(sectionId, 'sectionId');
        return this.client.requestParsed<Case>('POST', `add_case/${sectionId}`, CaseSchema, payload);
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
     * @testrail POST add_cases/{section_id}
     */
    async addCases(sectionId: number, payload: AddCasesBulkPayload): Promise<Case[]> {
        this.client.validateId(sectionId, 'sectionId');
        try {
            return await this.client.requestParsed<Case[]>(
                'POST',
                `add_cases/${sectionId}`,
                z.array(CaseSchema),
                payload,
            );
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
        this.client.validateId(caseId, 'caseId');
        return this.client.requestParsed<Case>('POST', `update_case/${caseId}`, CaseSchema, payload);
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
        this.client.validateId(caseId, 'caseId');
        const endpoint = this.client.buildEndpoint(`delete_case/${caseId}`, {
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>('POST', endpoint);
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw);
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
     * @testrail POST update_cases/{suite_id}
     */
    async updateCases(suiteId: number, payload: UpdateCasesPayload): Promise<Case[]> {
        this.client.validateId(suiteId, 'suiteId');
        return this.client.requestParsed<Case[]>('POST', `update_cases/${suiteId}`, z.array(CaseSchema), payload);
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
        this.client.validateId(suiteId, 'suiteId');
        this.client.validateId(projectId, 'projectId');
        const endpoint = this.client.buildEndpoint(`delete_cases/${suiteId}`, {
            project_id: projectId,
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>('POST', endpoint, payload);
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw);
        }
    }

    /**
     * Copy cases into a target section (creates new case copies). Returns
     * the array of newly created cases.
     * @testrail POST copy_cases_to_section/{section_id}
     */
    async copyCasesToSection(sectionId: number, payload: CopyCasesToSectionPayload): Promise<Case[]> {
        this.client.validateId(sectionId, 'sectionId');
        return this.client.requestParsed<Case[]>(
            'POST',
            `copy_cases_to_section/${sectionId}`,
            z.array(CaseSchema),
            payload,
        );
    }

    /**
     * Move cases into a target section. `payload.suite_id` is required even
     * for same-suite moves (TestRail uses it to resolve the destination
     * section across suites). Path-only `section_id` — NOT in the body.
     * Returns no body.
     * @testrail POST move_cases_to_section/{section_id}
     */
    async moveCasesToSection(sectionId: number, payload: MoveCasesToSectionPayload): Promise<void> {
        this.client.validateId(sectionId, 'sectionId');
        await this.client.request<void>('POST', `move_cases_to_section/${sectionId}`, payload);
    }

    /** @testrail GET get_history_for_case/{case_id} */
    async getHistoryForCase(caseId: number, options?: GetHistoryForCaseOptions): Promise<HistoryEntry[]> {
        this.client.validateId(caseId, 'caseId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_history_for_case/${caseId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.requestParsed<{ history?: HistoryEntry[] }>(
                    'GET',
                    endpoint,
                    z.object({ history: z.array(HistoryEntrySchema).optional() }),
                )
            ).history ?? []
        );
    }
}
