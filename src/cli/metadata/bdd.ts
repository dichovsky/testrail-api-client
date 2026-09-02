import { handleBddAdd, handleBddGet, handleBddList, handleBddUpdate } from '../handlers/bdd.js';
import type { ActionSpec } from './types.js';

/**
 * `bdd` actions in their original relative order:
 *   [0] get — read (UTF-8 text download to --out)
 *   [1] list — read (paginated JSON)
 *   [2] add — write (file input; creates under a section)
 *   [3] update — write (file input; replaces a case's BDD)
 *
 * `bdd get` returns Gherkin .feature text (not JSON); written to --out as
 * UTF-8. `bdd add` and `bdd update` reuse the multipart upload path of
 * attachments.
 */
export const bddActions: readonly ActionSpec[] = [
    {
        resource: 'bdd',
        action: 'get',
        summary: "Download a case's BDD (Gherkin .feature) content to --out <path>",
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_bdd/{case_id}',
        fileOutput: true,
        flags: [{ name: 'out', required: true }],
        outputKind: 'text',
        isWrite: false,
        handler: handleBddGet,
    },
    {
        resource: 'bdd',
        action: 'list',
        summary: 'List BDD entries in a project (suite/section/label/refs filters; paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_bdds/{project_id}',
        pagination: { response: 'envelope', requestControls: true, collectionKey: 'bdd' },
        flags: [
            { name: 'project-id', required: true },
            { name: 'suite-id' },
            { name: 'section-id' },
            { name: 'label-id' },
            { name: 'refs' },
        ],
        isWrite: false,
        handler: handleBddList,
    },
    {
        resource: 'bdd',
        action: 'add',
        summary: 'Upload a .feature file to create a BDD case under a section',
        pathParams: [{ name: 'section_id', description: 'Section to create the BDD case under' }],
        apiEndpoint: 'POST add_bdd/{section_id}',
        fileInput: true,
        flags: [{ name: 'file', required: true }],
        isWrite: true,
        handler: handleBddAdd,
    },
    {
        resource: 'bdd',
        action: 'update',
        summary: "Replace an existing case's BDD content with a .feature file",
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST update_bdd/{case_id}',
        fileInput: true,
        flags: [{ name: 'file', required: true }],
        isWrite: true,
        handler: handleBddUpdate,
    },
];
