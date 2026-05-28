import { AddSectionPayloadSchema, UpdateSectionPayloadSchema, MoveSectionPayloadSchema } from '../../schemas.js';
import { handleSectionGet, handleSectionList } from '../handlers/section.js';
import {
    handleSectionAdd,
    handleSectionDelete,
    handleSectionMove,
    handleSectionUpdate,
} from '../handlers/section-write.js';
import type { ActionSpec } from './types.js';

/**
 * `section` actions in their original relative order:
 *   [0] get    — read
 *   [1] list   — read
 *   [2] add    — write
 *   [3] update — write
 *   [4] move   — write (TestRail 6.5.2+)
 *   [5] delete — write (destructive)
 */
export const sectionActions: readonly ActionSpec[] = [
    {
        resource: 'section',
        action: 'get',
        summary: 'Fetch a single section by ID',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        apiEndpoint: 'GET get_section/{section_id}',
        isWrite: false,
        handler: handleSectionGet,
    },
    {
        resource: 'section',
        action: 'list',
        summary: 'List sections in a project (optionally filtered by suite; paginated)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_sections/{project_id}',
        isWrite: false,
        handler: handleSectionList,
    },
    {
        resource: 'section',
        action: 'add',
        summary: 'Create a new section in a project (suite_id required for multi-suite-mode projects)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_section/{project_id}',
        bodySchema: AddSectionPayloadSchema,
        helpExample: `--data '{"name":"...","suite_id":1}'`,
        isWrite: true,
        handler: handleSectionAdd,
    },
    {
        resource: 'section',
        action: 'update',
        summary: 'Update an existing section (partial fields)',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        apiEndpoint: 'POST update_section/{section_id}',
        bodySchema: UpdateSectionPayloadSchema,
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handleSectionUpdate,
    },
    {
        resource: 'section',
        action: 'move',
        summary: 'Move a section to a new parent and/or position (TestRail 6.5.2+)',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        apiEndpoint: 'POST move_section/{section_id}',
        bodySchema: MoveSectionPayloadSchema,
        helpExample: `--data '{"parent_id":null,"after_id":42}'`,
        isWrite: true,
        handler: handleSectionMove,
    },
    {
        resource: 'section',
        action: 'delete',
        summary:
            'Delete a section (recursively removes subsections and cases; requires --yes; --soft for server-side preview)',
        pathParams: [{ name: 'section_id', description: 'TestRail section ID' }],
        apiEndpoint: 'POST delete_section/{section_id}',
        isWrite: true,
        destructive: true,
        handler: handleSectionDelete,
    },
];
