import { TestRailClientCore } from '../client-core.js';
import type { Attachment, UploadFileInput } from '../types.js';
import { AttachmentSchema } from '../schemas.js';
import { validateId, validateEntryId, validateAttachmentId } from '../validation.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { listOf, unwrapList } from './list.js';
import { createPaginatedListExecutor } from './paginated-list.js';
import { withMultipartUpload } from '../upload-lifetime.js';

/**
 * Optional pagination parameters. TestRail documents these parameters for
 * case-, run-, and plan-scoped attachment lists. The test-scoped method keeps
 * its historical support for these options, even though the current upstream
 * documentation does not include them.
 */
export interface GetAttachmentsOptions {
    /** Maximum number of attachments to return (TestRail's server default is 250). */
    limit?: number;
    /** Pagination offset (TestRail's server default is 0). */
    offset?: number;
}

export type GetAllAttachmentsOptions = PaginatedRequestOptions;

type AttachmentPaginationArgs =
    | { readonly operation: 'get_attachments_for_case'; readonly caseId: number }
    | { readonly operation: 'get_attachments_for_run'; readonly runId: number }
    | { readonly operation: 'get_attachments_for_plan'; readonly planId: number }
    | { readonly operation: 'get_attachments_for_test'; readonly testId: number };

export const ATTACHMENTS_PAGINATION = createPaginatedListExecutor<
    AttachmentPaginationArgs,
    GetAttachmentsOptions,
    GetAllAttachmentsOptions,
    Attachment
>({
    operations: [
        'get_attachments_for_case',
        'get_attachments_for_plan',
        'get_attachments_for_run',
        { operation: 'get_attachments_for_test', registered: false },
    ],
    collectionKey: 'attachments',
    itemSchema: AttachmentSchema,
    response: 'envelope',
    requestControls: true,
    prepare: (args) => {
        switch (args.operation) {
            case 'get_attachments_for_case':
                validateId(args.caseId, 'caseId');
                return { operation: args.operation, pathParameters: [args.caseId] };
            case 'get_attachments_for_run':
                validateId(args.runId, 'runId');
                return { operation: args.operation, pathParameters: [args.runId] };
            case 'get_attachments_for_plan':
                validateId(args.planId, 'planId');
                return { operation: args.operation, pathParameters: [args.planId] };
            case 'get_attachments_for_test':
                validateId(args.testId, 'testId');
                return { operation: args.operation, pathParameters: [args.testId] };
        }
    },
});

export class AttachmentModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_attachments_for_case/{case_id} */
    async getAttachmentsForCase(caseId: number, options?: GetAttachmentsOptions): Promise<Attachment[]> {
        return ATTACHMENTS_PAGINATION.items(this.client, { operation: 'get_attachments_for_case', caseId }, options);
    }

    /** Fetch one normalized case-attachment page. */
    async getAttachmentsForCasePage(caseId: number, options?: GetAttachmentsOptions): Promise<Page<Attachment>> {
        return ATTACHMENTS_PAGINATION.page(this.client, { operation: 'get_attachments_for_case', caseId }, options);
    }

    /** Fetch all case-attachment pages. Explicit aggregate safety limits apply. */
    async getAllAttachmentsForCase(caseId: number, options?: GetAllAttachmentsOptions): Promise<Attachment[]> {
        return ATTACHMENTS_PAGINATION.all(this.client, { operation: 'get_attachments_for_case', caseId }, options);
    }

    /** @testrail GET get_attachments_for_run/{run_id} */
    async getAttachmentsForRun(runId: number, options?: GetAttachmentsOptions): Promise<Attachment[]> {
        return ATTACHMENTS_PAGINATION.items(this.client, { operation: 'get_attachments_for_run', runId }, options);
    }

    /** Fetch one normalized run-attachment page. */
    async getAttachmentsForRunPage(runId: number, options?: GetAttachmentsOptions): Promise<Page<Attachment>> {
        return ATTACHMENTS_PAGINATION.page(this.client, { operation: 'get_attachments_for_run', runId }, options);
    }

    /** Fetch all run-attachment pages. Explicit aggregate safety limits apply. */
    async getAllAttachmentsForRun(runId: number, options?: GetAllAttachmentsOptions): Promise<Attachment[]> {
        return ATTACHMENTS_PAGINATION.all(this.client, { operation: 'get_attachments_for_run', runId }, options);
    }

    /** @testrail GET get_attachments_for_test/{test_id} */
    async getAttachmentsForTest(testId: number, options?: GetAttachmentsOptions): Promise<Attachment[]> {
        return ATTACHMENTS_PAGINATION.items(this.client, { operation: 'get_attachments_for_test', testId }, options);
    }

    /** @testrail GET get_attachments_for_plan/{plan_id} */
    async getAttachmentsForPlan(planId: number, options?: GetAttachmentsOptions): Promise<Attachment[]> {
        return ATTACHMENTS_PAGINATION.items(this.client, { operation: 'get_attachments_for_plan', planId }, options);
    }

    /** Fetch one normalized plan-attachment page. */
    async getAttachmentsForPlanPage(planId: number, options?: GetAttachmentsOptions): Promise<Page<Attachment>> {
        return ATTACHMENTS_PAGINATION.page(this.client, { operation: 'get_attachments_for_plan', planId }, options);
    }

    /** Fetch all plan-attachment pages. Explicit aggregate safety limits apply. */
    async getAllAttachmentsForPlan(planId: number, options?: GetAllAttachmentsOptions): Promise<Attachment[]> {
        return ATTACHMENTS_PAGINATION.all(this.client, { operation: 'get_attachments_for_plan', planId }, options);
    }

    /**
     * `entryId` is the GUID of the test plan entry (for example
     * `"3933d74b-…"`), as `getPlan(...).entries[].id` returns it. It is NOT a
     * numeric ID. The `{plan_id}/{entry_id}` path matches the plan-entry
     * endpoints (`updatePlanEntry`, `deletePlanEntry`). TestRail rejects a
     * numeric `entry_id` for this endpoint with HTTP 400 "Field :entry_id is
     * not a valid test plan entry". The TestRail Attachments documentation
     * incorrectly gives its type as `integer`.
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
            schema: listOf('attachments', AttachmentSchema),
        });
        return unwrapList('attachments', raw);
    }

    /** @testrail GET get_attachment/{attachment_id} */
    async getAttachment(attachmentId: number | string): Promise<ArrayBuffer> {
        validateAttachmentId(attachmentId);
        return this.client.request<ArrayBuffer>({
            method: 'GET',
            endpoint: `get_attachment/${attachmentId}`,
            responseKind: 'binary',
        });
    }

    /** @testrail POST add_attachment_to_case/{case_id} */
    async addAttachmentToCase(caseId: number, file: UploadFileInput, filename: string): Promise<Attachment> {
        return withMultipartUpload({ kind: 'multipart', file, filename }, (body) => {
            validateId(caseId, 'caseId');
            return this.client.request<Attachment>({
                method: 'POST',
                endpoint: `add_attachment_to_case/${caseId}`,
                body,
            });
        });
    }

    /** @testrail POST add_attachment_to_result/{result_id} */
    async addAttachmentToResult(resultId: number, file: UploadFileInput, filename: string): Promise<Attachment> {
        return withMultipartUpload({ kind: 'multipart', file, filename }, (body) => {
            validateId(resultId, 'resultId');
            return this.client.request<Attachment>({
                method: 'POST',
                endpoint: `add_attachment_to_result/${resultId}`,
                body,
            });
        });
    }

    /** @testrail POST add_attachment_to_run/{run_id} */
    async addAttachmentToRun(runId: number, file: UploadFileInput, filename: string): Promise<Attachment> {
        return withMultipartUpload({ kind: 'multipart', file, filename }, (body) => {
            validateId(runId, 'runId');
            return this.client.request<Attachment>({
                method: 'POST',
                endpoint: `add_attachment_to_run/${runId}`,
                body,
            });
        });
    }

    /** @testrail POST add_attachment_to_plan/{plan_id} */
    async addAttachmentToPlan(planId: number, file: UploadFileInput, filename: string): Promise<Attachment> {
        return withMultipartUpload({ kind: 'multipart', file, filename }, (body) => {
            validateId(planId, 'planId');
            return this.client.request<Attachment>({
                method: 'POST',
                endpoint: `add_attachment_to_plan/${planId}`,
                body,
            });
        });
    }

    /**
     * `entryId` is the GUID of the test plan entry (see {@link getAttachmentsForPlanEntry}),
     * not a numeric ID. TestRail rejects a numeric value with HTTP 400.
     *
     * @testrail POST add_attachment_to_plan_entry/{plan_id}/{entry_id}
     */
    async addAttachmentToPlanEntry(
        planId: number,
        entryId: string,
        file: UploadFileInput,
        filename: string,
    ): Promise<Attachment> {
        return withMultipartUpload({ kind: 'multipart', file, filename }, (body) => {
            validateId(planId, 'planId');
            validateEntryId(entryId);
            return this.client.request<Attachment>({
                method: 'POST',
                endpoint: `add_attachment_to_plan_entry/${planId}/${entryId}`,
                body,
            });
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
