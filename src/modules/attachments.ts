import { TestRailClientCore } from '../client-core.js';
import type { Attachment } from '../types.js';
import { z } from 'zod';
import { AttachmentSchema } from '../schemas.js';

export class AttachmentModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_attachments_for_case/{case_id} */
    async getAttachmentsForCase(caseId: number): Promise<Attachment[]> {
        this.client.validateId(caseId, 'caseId');
        return (
            (
                await this.client.requestParsed<{ attachments?: Attachment[] }>(
                    'GET',
                    `get_attachments_for_case/${caseId}`,
                    z.object({ attachments: z.array(AttachmentSchema).optional() }),
                )
            ).attachments ?? []
        );
    }

    /** @testrail GET get_attachments_for_run/{run_id} */
    async getAttachmentsForRun(runId: number): Promise<Attachment[]> {
        this.client.validateId(runId, 'runId');
        return (
            (
                await this.client.requestParsed<{ attachments?: Attachment[] }>(
                    'GET',
                    `get_attachments_for_run/${runId}`,
                    z.object({ attachments: z.array(AttachmentSchema).optional() }),
                )
            ).attachments ?? []
        );
    }

    /** @testrail GET get_attachments_for_test/{test_id} */
    async getAttachmentsForTest(testId: number): Promise<Attachment[]> {
        this.client.validateId(testId, 'testId');
        return (
            (
                await this.client.requestParsed<{ attachments?: Attachment[] }>(
                    'GET',
                    `get_attachments_for_test/${testId}`,
                    z.object({ attachments: z.array(AttachmentSchema).optional() }),
                )
            ).attachments ?? []
        );
    }

    /** @testrail GET get_attachments_for_plan/{plan_id} */
    async getAttachmentsForPlan(planId: number): Promise<Attachment[]> {
        this.client.validateId(planId, 'planId');
        return (
            (
                await this.client.requestParsed<{ attachments?: Attachment[] }>(
                    'GET',
                    `get_attachments_for_plan/${planId}`,
                    z.object({ attachments: z.array(AttachmentSchema).optional() }),
                )
            ).attachments ?? []
        );
    }

    /** @testrail GET get_attachments_for_plan_entry/{plan_id}/{entry_id} */
    async getAttachmentsForPlanEntry(planId: number, entryId: number): Promise<Attachment[]> {
        this.client.validateId(planId, 'planId');
        this.client.validateId(entryId, 'entryId');
        return (
            (
                await this.client.requestParsed<{ attachments?: Attachment[] }>(
                    'GET',
                    `get_attachments_for_plan_entry/${planId}/${entryId}`,
                    z.object({ attachments: z.array(AttachmentSchema).optional() }),
                )
            ).attachments ?? []
        );
    }

    /** @testrail GET get_attachment/{attachment_id} */
    async getAttachment(attachmentId: number): Promise<ArrayBuffer> {
        this.client.validateId(attachmentId, 'attachmentId');
        return this.client.requestBinary(`get_attachment/${attachmentId}`);
    }

    /** @testrail POST add_attachment_to_case/{case_id} */
    async addAttachmentToCase(
        caseId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File | { path: string; type?: string },
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(caseId, 'caseId');
        return this.client.requestMultipart<Attachment>(`add_attachment_to_case/${caseId}`, file, filename);
    }

    /** @testrail POST add_attachment_to_result/{result_id} */
    async addAttachmentToResult(
        resultId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File | { path: string; type?: string },
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(resultId, 'resultId');
        return this.client.requestMultipart<Attachment>(`add_attachment_to_result/${resultId}`, file, filename);
    }

    /** @testrail POST add_attachment_to_run/{run_id} */
    async addAttachmentToRun(
        runId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File | { path: string; type?: string },
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(runId, 'runId');
        return this.client.requestMultipart<Attachment>(`add_attachment_to_run/${runId}`, file, filename);
    }

    /** @testrail POST add_attachment_to_plan/{plan_id} */
    async addAttachmentToPlan(
        planId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File | { path: string; type?: string },
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(planId, 'planId');
        return this.client.requestMultipart<Attachment>(`add_attachment_to_plan/${planId}`, file, filename);
    }

    /** @testrail POST add_attachment_to_plan_entry/{plan_id}/{entry_id} */
    async addAttachmentToPlanEntry(
        planId: number,
        entryId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File | { path: string; type?: string },
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(planId, 'planId');
        this.client.validateId(entryId, 'entryId');
        return this.client.requestMultipart<Attachment>(
            `add_attachment_to_plan_entry/${planId}/${entryId}`,
            file,
            filename,
        );
    }

    /** @testrail POST delete_attachment/{attachment_id} */
    async deleteAttachment(attachmentId: number): Promise<void> {
        this.client.validateId(attachmentId, 'attachmentId');
        await this.client.request<void>('POST', `delete_attachment/${attachmentId}`);
    }
}
