import { TestRailClientCore } from '../client-core.js';
import type { Section, SoftDeleteOptions } from '../types.js';
import type { AddSectionPayload, MoveSectionPayload, SoftDeletePreview, UpdateSectionPayload } from '../schemas.js';
import { SectionSchema, SoftDeletePreviewSchema } from '../schemas.js';
import { validateId } from '../validation.js';
import { buildEndpoint } from '../url.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export interface GetSectionsOptions {
    suiteId?: number;
    limit?: number;
    offset?: number;
}

export type GetAllSectionsOptions = Omit<GetSectionsOptions, 'limit' | 'offset'> & PaginatedRequestOptions;

export const SECTIONS_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetSectionsOptions,
    GetAllSectionsOptions,
    Section
>({
    operations: ['get_sections'],
    collectionKey: 'sections',
    itemSchema: SectionSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }, options) => {
        validateId(projectId, 'projectId');
        const { suiteId } = options ?? {};
        if (suiteId !== undefined) validateId(suiteId, 'suiteId');
        return {
            operation: 'get_sections',
            pathParameters: [projectId],
            query: { suite_id: suiteId },
        };
    },
});

export class SectionModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_section/{section_id} */
    async getSection(sectionId: number): Promise<Section> {
        validateId(sectionId, 'sectionId');
        return this.client.request<Section>({
            method: 'GET',
            endpoint: `get_section/${sectionId}`,
            schema: SectionSchema,
        });
    }

    /** @testrail GET get_sections/{project_id} */
    async getSections(projectId: number, options?: GetSectionsOptions): Promise<Section[]> {
        return SECTIONS_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getSectionsPage(projectId: number, options?: GetSectionsOptions): Promise<Page<Section>> {
        return SECTIONS_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Get every section under the configured pagination safety bounds. */
    async getAllSections(projectId: number, options?: GetAllSectionsOptions): Promise<Section[]> {
        return SECTIONS_PAGINATION.all(this.client, { projectId }, options);
    }

    /** @testrail POST add_section/{project_id} */
    async addSection(projectId: number, payload: AddSectionPayload): Promise<Section> {
        validateId(projectId, 'projectId');
        return this.client.request<Section>({
            method: 'POST',
            endpoint: `add_section/${projectId}`,
            schema: SectionSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_section/{section_id} */
    async updateSection(sectionId: number, payload: UpdateSectionPayload): Promise<Section> {
        validateId(sectionId, 'sectionId');
        return this.client.request<Section>({
            method: 'POST',
            endpoint: `update_section/${sectionId}`,
            schema: SectionSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /**
     * Delete a section (recursively removes all subsections and cases). Pass
     * `{ soft: true }` for TestRail's server-side preview (`soft=1`) — the
     * API call still happens but nothing is deleted; TestRail returns counts
     * of affected sections, cases, and tests. TestRail 6.5+ for soft-mode.
     *
     * @testrail POST delete_section/{section_id}
     */
    async deleteSection(sectionId: number, options: SoftDeleteOptions & { soft: true }): Promise<SoftDeletePreview>;
    async deleteSection(sectionId: number, options?: SoftDeleteOptions & { soft?: false }): Promise<void>;
    // General overload: dynamic boolean `soft` → union return.
    async deleteSection(sectionId: number, options: SoftDeleteOptions): Promise<void | SoftDeletePreview>;
    async deleteSection(sectionId: number, options?: SoftDeleteOptions): Promise<void | SoftDeletePreview> {
        validateId(sectionId, 'sectionId');
        const endpoint = buildEndpoint(`delete_section/${sectionId}`, {
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
     *
     * @testrail POST move_section/{section_id}
     */
    async moveSection(sectionId: number, payload: MoveSectionPayload): Promise<void> {
        validateId(sectionId, 'sectionId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `move_section/${sectionId}`,
            body: { kind: 'json', data: payload },
        });
    }
}
