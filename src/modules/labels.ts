import { TestRailClientCore } from '../client-core.js';
import { LabelSchema } from '../schemas.js';
import type { Label, UpdateLabelPayload } from '../schemas.js';
import { validateId } from '../validation.js';
import { listOf, unwrapList } from './list.js';

/**
 * Stand-alone TestRail Labels API (2025). Label *reads* embedded in case/test
 * responses are handled by `LabelEmbeddedSchema`; this module manages the label
 * definitions themselves. TestRail exposes no `add_label` / `delete_label` REST
 * endpoint (label create/delete is trcli-only), so this module is get/list/
 * update only — the documented public surface.
 */
export class LabelModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_label/{label_id} */
    async getLabel(labelId: number): Promise<Label> {
        validateId(labelId, 'labelId');
        return this.client.request<Label>({
            method: 'GET',
            endpoint: `get_label/${labelId}`,
            schema: LabelSchema,
        });
    }

    /** @testrail GET get_labels/{project_id} */
    async getLabels(projectId: number): Promise<Label[]> {
        validateId(projectId, 'projectId');
        // `get_labels` documents the `{ offset, limit, size, _links, labels: [...] }`
        // pagination wrapper, but the docs are not a reliable guide to which shape a
        // given server sends — see the `listOf` docblock in `./list.js` for the full
        // rationale. Accept both; `unwrapList` normalizes.
        const raw = await this.client.request<Label[] | { labels?: Label[] }>({
            method: 'GET',
            endpoint: `get_labels/${projectId}`,
            schema: listOf('labels', LabelSchema),
        });
        return unwrapList<Label>('labels', raw);
    }

    /** @testrail POST update_label/{label_id} */
    async updateLabel(labelId: number, payload: UpdateLabelPayload): Promise<Label> {
        validateId(labelId, 'labelId');
        return this.client.request<Label>({
            method: 'POST',
            endpoint: `update_label/${labelId}`,
            schema: LabelSchema,
            body: { kind: 'json', data: payload },
        });
    }
}
