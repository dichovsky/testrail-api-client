import { AddSectionPayloadSchema, MoveSectionPayloadSchema, UpdateSectionPayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleSectionAdd = createWriteHandler({
    action: 'section add',
    pathParams: ['project_id'],
    bodySchema: AddSectionPayloadSchema,
    call: (client, [projectId], body) => client.addSection(projectId, body),
});

export const handleSectionUpdate = createWriteHandler({
    action: 'section update',
    pathParams: ['section_id'],
    bodySchema: UpdateSectionPayloadSchema,
    call: (client, [sectionId], body) => client.updateSection(sectionId, body),
});

/**
 * Move a section to a new parent and/or position (TestRail 6.5.2+). `null` is
 * meaningful in the body — it explicitly moves to root / top — and reaches the
 * API as `null`, not elided. The endpoint returns no body, so success emits a
 * minimal confirmation envelope.
 */
export const handleSectionMove = createWriteHandler({
    action: 'section move',
    pathParams: ['section_id'],
    bodySchema: MoveSectionPayloadSchema,
    call: (client, [sectionId], body) => client.moveSection(sectionId, body),
    formatOutput: ([sectionId]) => ({ sectionId, moved: true }),
});

/**
 * Destructive: deletes a section (recursively removes all subsections and
 * cases). `--soft` invokes TestRail's server-side preview (`soft=1`).
 */
export const handleSectionDelete = createDestructiveHandler({
    action: 'section delete',
    pathParams: ['section_id'],
    softMode: 'optional',
    call: (client, [sectionId], _entry, soft) => client.deleteSection(sectionId, { soft }),
});
