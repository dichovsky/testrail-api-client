import { TestRailClientCore } from '../client-core.js';
import type { Section, AddSectionPayload, UpdateSectionPayload } from '../types.js';
import { SectionSchema } from '../schemas.js';
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

    async deleteSection(sectionId: number): Promise<void> {
        this.client.validateId(sectionId, 'sectionId');
        await this.client.request<void>('POST', `delete_section/${sectionId}`);
    }
}
