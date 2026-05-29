import { TestRailClientCore } from '../client-core.js';
import type { Case, UploadFileInput } from '../types.js';
import { CaseSchema } from '../schemas.js';
import { validateId } from '../validation.js';

/**
 * BDDs (Behavior-Driven Development / Gherkin `.feature`) endpoints — TestRail 7.5+.
 *
 * Unlike every other endpoint in this client, `getBdd` returns raw Gherkin
 * text (`text/plain`), not JSON. It dispatches through `request()` with
 * `responseKind: 'text'`, which mirrors the JSON path's retry / rate-limit /
 * timeout pipeline but swaps the JSON parse step for `response.text()`.
 *
 * `addBdd` is a thin wrapper over the same multipart pipeline used by
 * `AttachmentModule.addAttachment*`. TestRail returns the updated `Case` on
 * success (the BDD content becomes part of the case body).
 */
export class BddModule {
    constructor(private readonly client: TestRailClientCore) {}

    /**
     * Fetch a case's BDD content as raw Gherkin text.
     * @returns The `.feature` file body (Gherkin syntax). Empty string if unset.
     * @testrail GET get_bdd/{case_id}
     */
    async getBdd(caseId: number): Promise<string> {
        validateId(caseId, 'caseId');
        return this.client.request<string>({
            method: 'GET',
            endpoint: `get_bdd/${caseId}`,
            responseKind: 'text',
        });
    }

    /**
     * Upload a `.feature` file to a case as its BDD content. Returns the
     * updated `Case` object reflecting the newly attached BDD.
     * @testrail POST add_bdd/{case_id}
     */
    async addBdd(caseId: number, file: UploadFileInput, filename: string): Promise<Case> {
        validateId(caseId, 'caseId');
        return this.client.parse<Case>(
            CaseSchema,
            await this.client.request<unknown>({
                method: 'POST',
                endpoint: `add_bdd/${caseId}`,
                body: { kind: 'multipart', file, filename },
                retry: 'none',
            }),
        );
    }
}
