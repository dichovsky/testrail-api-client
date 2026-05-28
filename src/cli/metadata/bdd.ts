import type { ActionSpec } from './types.js';

/**
 * `bdd` actions in their original relative order:
 *   [0] get — read (UTF-8 text download to --out)
 *   [1] add — write (file input)
 *
 * `bdd get` returns Gherkin .feature text (not JSON); written to --out as
 * UTF-8. `bdd add` reuses the multipart upload path of attachments.
 */
export const bddActions: readonly ActionSpec[] = [
    {
        resource: 'bdd',
        action: 'get',
        summary: "Download a case's BDD (Gherkin .feature) content to --out <path>",
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_bdd/{case_id}',
        fileOutput: true,
        outputKind: 'text',
        isWrite: false,
    },
    {
        resource: 'bdd',
        action: 'add',
        summary: 'Upload a .feature file as the BDD content for a case',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST add_bdd/{case_id}',
        fileInput: true,
        isWrite: true,
    },
];
