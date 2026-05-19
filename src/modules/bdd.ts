import { TestRailClientCore } from '../client-core.js';
import type { Case } from '../types.js';
import { CaseSchema } from '../schemas.js';

/**
 * BDDs (Behavior-Driven Development / Gherkin `.feature`) endpoints — TestRail 7.5+.
 *
 * Unlike every other endpoint in this client, `getBdd` returns raw Gherkin
 * text (`text/plain`), not JSON. It goes through `requestText()` on the core,
 * which mirrors `request<T>()`'s retry / rate-limit / timeout pipeline but
 * swaps the JSON parse step for `response.text()`.
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
        this.client.validateId(caseId, 'caseId');
        return this.client.requestText('GET', `get_bdd/${caseId}`);
    }

    /**
     * Upload a `.feature` file to a case as its BDD content. Returns the
     * updated `Case` object reflecting the newly attached BDD.
     * @testrail POST add_bdd/{case_id}
     */
    async addBdd(
        caseId: number,
        file: globalThis.Blob | Uint8Array | globalThis.File,
        filename: string,
    ): Promise<Case> {
        this.client.validateId(caseId, 'caseId');
        return this.client.parse<Case>(
            CaseSchema,
            await this.client.requestMultipart<unknown>(`add_bdd/${caseId}`, file, filename),
        );
    }
}
