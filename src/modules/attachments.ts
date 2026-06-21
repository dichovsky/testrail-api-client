import { TestRailClientCore } from '../client-core.js';
import type { Attachment, UploadFileInput } from '../types.js';
import { z } from 'zod';
import { AttachmentSchema } from '../schemas.js';
import { validateId, validateEntryId, validateAttachmentId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';

/**
 * Optional pagination params shared by `getAttachmentsForCase`,
 * `getAttachmentsForRun`, and `getAttachmentsForTest`. TestRail's
 * `get_attachments_for_*` endpoints accept `limit`/`offset` query params
 * (default page size 250). Plan-scoped endpoints (`get_attachments_for_plan`,
 * `get_attachments_for_plan_entry`) intentionally don't accept these — they
 * return every attachment under the plan tree.
 */
export interface GetAttachmentsOptions {
    /** Maximum number of attachments to return (TestRail's server default is 250). */
    limit?: number;
    /** Pagination offset (TestRail's server default is 0). */
    offset?: number;
}

export class AttachmentModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_attachments_for_case/{case_id} */
    async getAttachmentsForCase(caseId: number, options?: GetAttachmentsOptions): Promise<Attachment[]> {
        validateId(caseId, 'caseId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_attachments_for_case/${caseId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<Attachment[] | { attachments?: Attachment[] | null }>({
            method: 'GET',
            endpoint,
            // Live-instance audit: get_attachments_for_test (and _plan_entry) return a
            // BARE top-level array; case/run/plan return the { attachments } wrapper.
            // SPEC #1.5 — the wrapper may also carry `{ attachments: null }`. Accept
            // both shapes (mirrors getSharedSteps) and unwrap.
            schema: z.union([
                z.array(AttachmentSchema),
                z.object({ attachments: z.array(AttachmentSchema).nullish() }),
            ]),
        });
        return Array.isArray(raw) ? raw : (raw.attachments ?? []);
    }

    /** @testrail GET get_attachments_for_run/{run_id} */
    async getAttachmentsForRun(runId: number, options?: GetAttachmentsOptions): Promise<Attachment[]> {
        validateId(runId, 'runId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_attachments_for_run/${runId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<Attachment[] | { attachments?: Attachment[] | null }>({
            method: 'GET',
            endpoint,
            // Live-instance audit: get_attachments_for_test (and _plan_entry) return a
            // BARE top-level array; case/run/plan return the { attachments } wrapper.
            // SPEC #1.5 — the wrapper may also carry `{ attachments: null }`. Accept
            // both shapes (mirrors getSharedSteps) and unwrap.
            schema: z.union([
                z.array(AttachmentSchema),
                z.object({ attachments: z.array(AttachmentSchema).nullish() }),
            ]),
        });
        return Array.isArray(raw) ? raw : (raw.attachments ?? []);
    }

    /** @testrail GET get_attachments_for_test/{test_id} */
    async getAttachmentsForTest(testId: number, options?: GetAttachmentsOptions): Promise<Attachment[]> {
        validateId(testId, 'testId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_attachments_for_test/${testId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<Attachment[] | { attachments?: Attachment[] | null }>({
            method: 'GET',
            endpoint,
            // Live-instance audit: get_attachments_for_test (and _plan_entry) return a
            // BARE top-level array; case/run/plan return the { attachments } wrapper.
            // SPEC #1.5 — the wrapper may also carry `{ attachments: null }`. Accept
            // both shapes (mirrors getSharedSteps) and unwrap.
            schema: z.union([
                z.array(AttachmentSchema),
                z.object({ attachments: z.array(AttachmentSchema).nullish() }),
            ]),
        });
        return Array.isArray(raw) ? raw : (raw.attachments ?? []);
    }

    /** @testrail GET get_attachments_for_plan/{plan_id} */
    async getAttachmentsForPlan(planId: number): Promise<Attachment[]> {
        validateId(planId, 'planId');
        const raw = await this.client.request<Attachment[] | { attachments?: Attachment[] | null }>({
            method: 'GET',
            endpoint: `get_attachments_for_plan/${planId}`,
            // Live-instance audit: accept both the bare top-level array and the
            // { attachments } wrapper (mirrors getSharedSteps) and unwrap.
            schema: z.union([
                z.array(AttachmentSchema),
                z.object({ attachments: z.array(AttachmentSchema).nullish() }),
            ]),
        });
        return Array.isArray(raw) ? raw : (raw.attachments ?? []);
    }

    /**
     * `entryId` is the test plan entry's GUID (e.g. `"3933d74b-…"`), as
     * returned by `getPlan(...).entries[].id` — NOT a numeric ID. The
     * `{plan_id}/{entry_id}` path matches the plan-entry endpoints
     * (`updatePlanEntry`, `deletePlanEntry`); TestRail rejects a numeric
     * `entry_id` here with HTTP 400 "Field :entry_id is not a valid test
     * plan entry". (TestRail's Attachments doc mislabels it `integer`.)
     *
     * @testrail GET get_attachments_for_plan_entry/{plan_id}/{entry_id}
     */
    async getAttachmentsForPlanEntry(planId: number, entryId: string): Promise<Attachment[]> {
        validateId(planId, 'planId');
        validateEntryId(entryId);
        const raw = await this.client.request<Attachment[] | { attachments?: Attachment[] | null }>({
            method: 'GET',
            endpoint: `get_attachments_for_plan_entry/${planId}/${entryId}`,
            // Live-instance audit: get_attachments_for_plan_entry returns a BARE
            // top-level array; accept both shapes (mirrors getSharedSteps) and unwrap.
            schema: z.union([
                z.array(AttachmentSchema),
                z.object({ attachments: z.array(AttachmentSchema).nullish() }),
            ]),
        });
        return Array.isArray(raw) ? raw : (raw.attachments ?? []);
    }

    /** @testrail GET get_attachment/{attachment_id} */
    async getAttachment(attachmentId: number | string): Promise<ArrayBuffer> {
        validateAttachmentId(attachmentId);
        return this.client.request<ArrayBuffer>({
            method: 'GET',
            endpoint: `get_attachment/${attachmentId}`,
            responseKind: 'binary',
            retry: 'binaryGet',
        });
    }

    /** @testrail POST add_attachment_to_case/{case_id} */
    async addAttachmentToCase(caseId: number, file: UploadFileInput, filename: string): Promise<Attachment> {
        validateId(caseId, 'caseId');
        return this.client.request<Attachment>({
            method: 'POST',
            endpoint: `add_attachment_to_case/${caseId}`,
            body: { kind: 'multipart', file, filename },
            retry: 'none',
        });
    }

    /** @testrail POST add_attachment_to_result/{result_id} */
    async addAttachmentToResult(resultId: number, file: UploadFileInput, filename: string): Promise<Attachment> {
        validateId(resultId, 'resultId');
        return this.client.request<Attachment>({
            method: 'POST',
            endpoint: `add_attachment_to_result/${resultId}`,
            body: { kind: 'multipart', file, filename },
            retry: 'none',
        });
    }

    /** @testrail POST add_attachment_to_run/{run_id} */
    async addAttachmentToRun(runId: number, file: UploadFileInput, filename: string): Promise<Attachment> {
        validateId(runId, 'runId');
        return this.client.request<Attachment>({
            method: 'POST',
            endpoint: `add_attachment_to_run/${runId}`,
            body: { kind: 'multipart', file, filename },
            retry: 'none',
        });
    }

    /** @testrail POST add_attachment_to_plan/{plan_id} */
    async addAttachmentToPlan(planId: number, file: UploadFileInput, filename: string): Promise<Attachment> {
        validateId(planId, 'planId');
        return this.client.request<Attachment>({
            method: 'POST',
            endpoint: `add_attachment_to_plan/${planId}`,
            body: { kind: 'multipart', file, filename },
            retry: 'none',
        });
    }

    /**
     * `entryId` is the test plan entry's GUID (see {@link getAttachmentsForPlanEntry}),
     * not a numeric ID; a numeric value is rejected by TestRail with HTTP 400.
     *
     * @testrail POST add_attachment_to_plan_entry/{plan_id}/{entry_id}
     */
    async addAttachmentToPlanEntry(
        planId: number,
        entryId: string,
        file: UploadFileInput,
        filename: string,
    ): Promise<Attachment> {
        validateId(planId, 'planId');
        validateEntryId(entryId);
        return this.client.request<Attachment>({
            method: 'POST',
            endpoint: `add_attachment_to_plan_entry/${planId}/${entryId}`,
            body: { kind: 'multipart', file, filename },
            retry: 'none',
        });
    }

    /** @testrail POST delete_attachment/{attachment_id} */
    async deleteAttachment(attachmentId: number | string): Promise<void> {
        validateAttachmentId(attachmentId);
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_attachment/${attachmentId}`,
        });
    }
}
