import { TestRailClientCore } from '../client-core.js';
import { LabelSchema } from '../schemas.js';
import type { Label, UpdateLabelPayload } from '../schemas.js';
import { validateId } from '../validation.js';
import { z } from 'zod';

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
        // `get_labels` is a TestRail bulk-API endpoint: it returns the
        // `{ offset, limit, size, _links, labels: [...] }` pagination wrapper
        // (standard for every bulk endpoint since TestRail 6.7), never a bare
        // array. Parse the wrapper (not `z.array(LabelSchema)`, which rejects
        // the object) and return `labels ?? []`. `.nullish()` accepts both an
        // omitted key and `null` for an empty list. Mirrors `variables.getVariables()`.
        return (
            (
                await this.client.request<{ labels?: Label[] }>({
                    method: 'GET',
                    endpoint: `get_labels/${projectId}`,
                    schema: z.object({ labels: z.array(LabelSchema).nullish() }),
                })
            ).labels ?? []
        );
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
