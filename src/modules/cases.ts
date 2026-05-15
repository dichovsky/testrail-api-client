import { TestRailClientCore } from '../client-core.js';
import type { Case, GetCasesOptions, HistoryEntry } from '../types.js';
import type {
    AddCasePayload,
    UpdateCasePayload,
    UpdateCasesPayload,
    DeleteCasesPayload,
    CopyCasesToSectionPayload,
    MoveCasesToSectionPayload,
} from '../schemas.js';
import { CaseSchema, HistoryEntrySchema } from '../schemas.js';
import { z } from 'zod';

export interface GetHistoryForCaseOptions {
    /** Maximum number of history entries to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export interface DeleteCasesOptions {
    /** When true, TestRail returns the count of affected tests without
     *  actually deleting (server-side preview). Distinct from a client-side
     *  `--dry-run`: `soft=1` does hit the API. */
    soft?: boolean;
}

export class CaseModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getCase(caseId: number): Promise<Case> {
        this.client.validateId(caseId, 'caseId');
        return this.client.parse<Case>(CaseSchema, await this.client.request<unknown>('GET', `get_case/${caseId}`));
    }

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
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ cases?: Case[] }>(z.object({ cases: z.array(CaseSchema).optional() }), raw).cases ?? []
        );
    }

    async addCase(sectionId: number, payload: AddCasePayload): Promise<Case> {
        this.client.validateId(sectionId, 'sectionId');
        return this.client.parse<Case>(
            CaseSchema,
            await this.client.request<unknown>('POST', `add_case/${sectionId}`, payload),
        );
    }

    async updateCase(caseId: number, payload: UpdateCasePayload): Promise<Case> {
        this.client.validateId(caseId, 'caseId');
        return this.client.parse<Case>(
            CaseSchema,
            await this.client.request<unknown>('POST', `update_case/${caseId}`, payload),
        );
    }

    async deleteCase(caseId: number): Promise<void> {
        this.client.validateId(caseId, 'caseId');
        await this.client.request<void>('POST', `delete_case/${caseId}`);
    }

    /**
     * Bulk-update many cases with the same field values in one API call. The
     * payload's `case_ids` is the targets; all other fields are applied
     * uniformly to every listed case. TestRail returns the array of updated
     * cases.
     *
     * Note: TestRail's online docs claim `suite_id` is single-suite-mode
     * optional. In practice it is required even in single-suite mode (the
     * Python reference client documents this caveat) — pass the only suite
     * you have.
     */
    async updateCases(suiteId: number, payload: UpdateCasesPayload): Promise<Case[]> {
        this.client.validateId(suiteId, 'suiteId');
        const raw = await this.client.request<unknown>('POST', `update_cases/${suiteId}`, payload);
        return this.client.parse<Case[]>(z.array(CaseSchema), raw);
    }

    /**
     * Bulk-delete cases. TestRail's URL takes `suite_id` in the path and
     * `project_id` (required) as a query parameter. `options.soft=true`
     * adds `soft=1` — a server-side preview that returns affected-test
     * counts without deleting. The body carries the case IDs.
     */
    async deleteCases(
        suiteId: number,
        projectId: number,
        payload: DeleteCasesPayload,
        options?: DeleteCasesOptions,
    ): Promise<void> {
        this.client.validateId(suiteId, 'suiteId');
        this.client.validateId(projectId, 'projectId');
        const endpoint = this.client.buildEndpoint(`delete_cases/${suiteId}`, {
            project_id: projectId,
            ...(options?.soft === true && { soft: 1 }),
        });
        await this.client.request<void>('POST', endpoint, payload);
    }

    /**
     * Copy cases into a target section (creates new case copies). Returns
     * the array of newly created cases.
     */
    async copyCasesToSection(sectionId: number, payload: CopyCasesToSectionPayload): Promise<Case[]> {
        this.client.validateId(sectionId, 'sectionId');
        const raw = await this.client.request<unknown>('POST', `copy_cases_to_section/${sectionId}`, payload);
        return this.client.parse<Case[]>(z.array(CaseSchema), raw);
    }

    /**
     * Move cases into a target section. `payload.suite_id` is required even
     * for same-suite moves (TestRail uses it to resolve the destination
     * section across suites). Path-only `section_id` — NOT in the body.
     * Returns no body.
     */
    async moveCasesToSection(sectionId: number, payload: MoveCasesToSectionPayload): Promise<void> {
        this.client.validateId(sectionId, 'sectionId');
        await this.client.request<void>('POST', `move_cases_to_section/${sectionId}`, payload);
    }

    async getHistoryForCase(caseId: number, options?: GetHistoryForCaseOptions): Promise<HistoryEntry[]> {
        this.client.validateId(caseId, 'caseId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_history_for_case/${caseId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ history?: HistoryEntry[] }>(
                z.object({ history: z.array(HistoryEntrySchema).optional() }),
                raw,
            ).history ?? []
        );
    }
}
