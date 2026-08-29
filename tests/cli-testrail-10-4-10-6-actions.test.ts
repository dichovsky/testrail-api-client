import { describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';
import { handleDynamicFilterFieldList } from '../src/cli/handlers/dynamic-filter-field.js';
import { handleResultEdit } from '../src/cli/handlers/result-write.js';
import { handleVersionGet } from '../src/cli/handlers/version.js';
import { dynamicFilterFieldActions } from '../src/cli/metadata/dynamicFilterFields.js';
import { resultActions } from '../src/cli/metadata/results.js';
import { versionActions } from '../src/cli/metadata/versions.js';
import { EditResultPayloadSchema } from '../src/schemas.js';

interface ContextOptions {
    pathParams?: readonly string[];
    dataFlag?: string;
    dryRun?: boolean;
}

function makeContext(
    client: object,
    options: ContextOptions = {},
): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const ctx: HandlerContext = {
        client: client as TestRailClient,
        args: { pathParams: options.pathParams ?? [] },
        bodyInput: options.dataFlag === undefined ? {} : { dataFlag: options.dataFlag },
        dryRun: options.dryRun ?? false,
        force: false,
        confirmDestructive: false,
        out,
    };
    return { ctx, out };
}

describe('TestRail 10.4–10.6 CLI actions', () => {
    it('result edit validates the body, calls editResult, and outputs the response', async () => {
        const editResult = vi.fn().mockResolvedValue({ id: 17, comment: 'corrected' });
        const { ctx, out } = makeContext(
            { results: { editResult } },
            { pathParams: ['17'], dataFlag: '{"comment":"corrected"}' },
        );

        await handleResultEdit(ctx);

        expect(editResult).toHaveBeenCalledWith(17, { comment: 'corrected' });
        expect(out).toHaveBeenCalledWith({ id: 17, comment: 'corrected' });
    });

    it('result edit supports dry-run without making a request', async () => {
        const editResult = vi.fn();
        const { ctx, out } = makeContext(
            { results: { editResult } },
            { pathParams: ['17'], dataFlag: '{"defects":"TR-7"}', dryRun: true },
        );

        await handleResultEdit(ctx);

        expect(editResult).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith({
            dryRun: true,
            action: 'result edit',
            resultId: 17,
            payload: { defects: 'TR-7' },
            source: 'data',
        });
    });

    it('result edit rejects invalid payloads before calling the client', async () => {
        const editResult = vi.fn();
        const { ctx } = makeContext(
            { results: { editResult } },
            { pathParams: ['17'], dataFlag: '{"custom_step_results":"invalid"}' },
        );

        await expect(handleResultEdit(ctx)).rejects.toThrow(/validation failed/i);
        expect(editResult).not.toHaveBeenCalled();
    });

    it('version get emits the installed TestRail version and rejects extra arguments', async () => {
        const getVersion = vi.fn().mockResolvedValue({ version: '10.7.0.1021' });
        const { ctx, out } = makeContext({ metadata: { getVersion } });

        await handleVersionGet(ctx);

        expect(getVersion).toHaveBeenCalledOnce();
        expect(out).toHaveBeenCalledWith({ version: '10.7.0.1021' });

        const { ctx: invalidCtx } = makeContext({ metadata: { getVersion } }, { pathParams: ['extra'] });
        await expect(handleVersionGet(invalidCtx)).rejects.toThrow(/takes no positional arguments/);
    });

    it('dynamic-filter-field list parses project_id and outputs the fields', async () => {
        const fields = [{ type_id: 1, system_name: 'status_id', label: 'Status', options: '' }];
        const getDynamicFilterFields = vi.fn().mockResolvedValue(fields);
        const { ctx, out } = makeContext({ metadata: { getDynamicFilterFields } }, { pathParams: ['9'] });

        await handleDynamicFilterFieldList(ctx);

        expect(getDynamicFilterFields).toHaveBeenCalledWith(9);
        expect(out).toHaveBeenCalledWith(fields);

        const { ctx: invalidCtx } = makeContext({ metadata: { getDynamicFilterFields } }, { pathParams: ['zero'] });
        await expect(handleDynamicFilterFieldList(invalidCtx)).rejects.toThrow(/project_id/);
    });

    it('declares metadata that matches the SDK endpoints and payload schema', () => {
        expect(resultActions.at(-1)).toMatchObject({
            resource: 'result',
            action: 'edit',
            apiEndpoint: 'POST edit_result/{result_id}',
            bodySchema: EditResultPayloadSchema,
            isWrite: true,
            handler: handleResultEdit,
        });
        expect(versionActions).toEqual([
            expect.objectContaining({
                resource: 'version',
                action: 'get',
                apiEndpoint: 'GET get_version',
                handler: handleVersionGet,
            }),
        ]);
        expect(dynamicFilterFieldActions).toEqual([
            expect.objectContaining({
                resource: 'dynamic-filter-field',
                action: 'list',
                apiEndpoint: 'GET get_dynamic_filter_fields/{project_id}',
                handler: handleDynamicFilterFieldList,
            }),
        ]);
    });
});
