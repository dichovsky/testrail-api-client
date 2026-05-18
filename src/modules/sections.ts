import { TestRailClientCore } from '../client-core.js';
import type { Section, SoftDeleteOptions } from '../types.js';
import type { AddSectionPayload, MoveSectionPayload, SoftDeletePreview, UpdateSectionPayload } from '../schemas.js';
import { SectionSchema, SoftDeletePreviewSchema } from '../schemas.js';
import { z } from 'zod';

export class SectionModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getSection(sectionId: number): Promise<Section> {
        this.client.validateId(sectionId, 'sectionId');
        return this.client.parse<Section>(
            SectionSchema,
            await this.client.request<unknown>('GET', `get_section/${sectionId}`),
        );
    }

    async getSections(
        projectId: number,
        options?: { suiteId?: number; limit?: number; offset?: number },
    ): Promise<Section[]> {
        this.client.validateId(projectId, 'projectId');
        const { suiteId, limit, offset } = options ?? {};
        if (suiteId !== undefined) {
            this.client.validateId(suiteId, 'suiteId');
        }
        this.client.validatePaginationParams(limit, offset);
        const endpoint = this.client.buildEndpoint(`get_sections/${projectId}`, { suite_id: suiteId, limit, offset });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ sections?: Section[] }>(z.object({ sections: z.array(SectionSchema).optional() }), raw)
                .sections ?? []
        );
    }

    async addSection(projectId: number, payload: AddSectionPayload): Promise<Section> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Section>(
            SectionSchema,
            await this.client.request<unknown>('POST', `add_section/${projectId}`, payload),
        );
    }

    async updateSection(sectionId: number, payload: UpdateSectionPayload): Promise<Section> {
        this.client.validateId(sectionId, 'sectionId');
        return this.client.parse<Section>(
            SectionSchema,
            await this.client.request<unknown>('POST', `update_section/${sectionId}`, payload),
        );
    }

    /**
     * Delete a section (recursively removes all subsections and cases). Pass
     * `{ soft: true }` for TestRail's server-side preview (`soft=1`) — the
     * API call still happens but nothing is deleted; TestRail returns counts
     * of affected sections, cases, and tests. TestRail 6.5+ for soft-mode.
     */
    async deleteSection(sectionId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteSection(sectionId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    async deleteSection(sectionId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        this.client.validateId(sectionId, 'sectionId');
        const endpoint = this.client.buildEndpoint(`delete_section/${sectionId}`, {
            ...(options?.soft === true && { soft: 1 }),
        });
        const raw = await this.client.request<unknown>('POST', endpoint);
        if (options?.soft === true) {
            return this.client.parse<SoftDeletePreview>(SoftDeletePreviewSchema, raw);
        }
    }

    /**
     * Move a section to a new parent and/or position (TestRail 6.5.2+).
     *
     * Both payload fields are independently optional AND nullable:
     *   - `parent_id: null` moves the section to root (top-level under suite)
     *   - `after_id: null` moves the section to the top of its container
     *   - omitting a field leaves that axis unchanged
     *
     * The endpoint returns no body in older TestRail versions and the updated
     * section in newer ones; we default to `void` and recommend a follow-up
     * `getSection(sectionId)` when callers need the post-move state.
     */
    async moveSection(sectionId: number, payload: MoveSectionPayload): Promise<void> {
        this.client.validateId(sectionId, 'sectionId');
        await this.client.request<void>('POST', `move_section/${sectionId}`, payload);
    }
}
