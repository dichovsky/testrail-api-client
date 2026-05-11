import { TestRailClientCore } from '../client-core.js';
import type { Attachment } from '../types.js';
import { z } from 'zod';
import { AttachmentSchema } from '../schemas.js';

export class AttachmentModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getAttachmentsForCase(caseId: number): Promise<Attachment[]> {
        this.client.validateId(caseId, 'caseId');
        const raw = await this.client.request<unknown>('GET', `get_attachments_for_case/${caseId}`);
        return (
            this.client.parse<{ attachments?: Attachment[] }>(
                z.object({ attachments: z.array(AttachmentSchema).optional() }),
                raw,
            ).attachments ?? []
        );
    }

    async getAttachmentsForRun(runId: number): Promise<Attachment[]> {
        this.client.validateId(runId, 'runId');
        const raw = await this.client.request<unknown>('GET', `get_attachments_for_run/${runId}`);
        return (
            this.client.parse<{ attachments?: Attachment[] }>(
                z.object({ attachments: z.array(AttachmentSchema).optional() }),
                raw,
            ).attachments ?? []
        );
    }

    async getAttachmentsForTest(testId: number): Promise<Attachment[]> {
        this.client.validateId(testId, 'testId');
        const raw = await this.client.request<unknown>('GET', `get_attachments_for_test/${testId}`);
        return (
            this.client.parse<{ attachments?: Attachment[] }>(
                z.object({ attachments: z.array(AttachmentSchema).optional() }),
                raw,
            ).attachments ?? []
        );
    }

    async getAttachmentsForPlan(planId: number): Promise<Attachment[]> {
        this.client.validateId(planId, 'planId');
        const raw = await this.client.request<unknown>('GET', `get_attachments_for_plan/${planId}`);
        return (
            this.client.parse<{ attachments?: Attachment[] }>(
                z.object({ attachments: z.array(AttachmentSchema).optional() }),
                raw,
            ).attachments ?? []
        );
    }

    async getAttachmentsForPlanEntry(planId: number, entryId: number): Promise<Attachment[]> {
        this.client.validateId(planId, 'planId');
        this.client.validateId(entryId, 'entryId');
        const raw = await this.client.request<unknown>('GET', `get_attachments_for_plan_entry/${planId}/${entryId}`);
        return (
            this.client.parse<{ attachments?: Attachment[] }>(
                z.object({ attachments: z.array(AttachmentSchema).optional() }),
                raw,
            ).attachments ?? []
        );
    }

    async getAttachment(attachmentId: number): Promise<ArrayBuffer> {
        this.client.validateId(attachmentId, 'attachmentId');
        return this.client.requestBinary(`get_attachment/${attachmentId}`);
    }

    async addAttachmentToCase(
        caseId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(caseId, 'caseId');
        return this.client.requestMultipart<Attachment>(`add_attachment_to_case/${caseId}`, file, filename);
    }

    async addAttachmentToResult(
        resultId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(resultId, 'resultId');
        return this.client.requestMultipart<Attachment>(`add_attachment_to_result/${resultId}`, file, filename);
    }

    async addAttachmentToRun(
        runId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(runId, 'runId');
        return this.client.requestMultipart<Attachment>(`add_attachment_to_run/${runId}`, file, filename);
    }

    async addAttachmentToPlan(
        planId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Attachment> {
        this.client.validateId(planId, 'planId');
        return this.client.requestMultipart<Attachment>(`add_attachment_to_plan/${planId}`, file, filename);
    }

    async addAttachmentToPlanEntry(
        planId: number,
        entryId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
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

    async deleteAttachment(attachmentId: number): Promise<void> {
        this.client.validateId(attachmentId, 'attachmentId');
        await this.client.request<void>('POST', `delete_attachment/${attachmentId}`);
    }
}
