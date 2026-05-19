/**
 * Unit tests for read handlers in src/cli/handlers/*.ts.
 *
 * Each handler is tested in isolation with a mocked TestRailClient (no
 * subprocess, no real HTTP). Coverage per handler:
 *   - happy path: valid path params + (optional) flags → client method
 *     called with the exact expected args; the result is emitted to `out`
 *   - missing required positional → IdParseError thrown before any
 *     client call (caught by main() and translated to exit 1)
 *   - invalid path-param ids (0, -1, 1.5, abc, '', 1e2, 0x1) → IdParseError
 *
 * Read handlers do not consume a body, so the body-source / dry-run paths
 * exercised by `cli-write-handlers.test.ts` are intentionally out of scope.
 */
import { describe, it, expect, vi } from 'vitest';
import { handleSectionGet, handleSectionList } from '../src/cli/handlers/section.js';
import { IdParseError } from '../src/cli/ids.js';
import type { TestRailClient } from '../src/client.js';
import type { HandlerContext } from '../src/cli/handler-context.js';

interface MockedClient {
    getSection: ReturnType<typeof vi.fn>;
    getSections: ReturnType<typeof vi.fn>;
}

function buildClient(): MockedClient {
    return {
        getSection: vi.fn().mockResolvedValue({
            id: 1,
            suite_id: 1,
            name: 'Sec',
            display_order: 1,
            depth: 0,
        }),
        getSections: vi.fn().mockResolvedValue([{ id: 1, suite_id: 1, name: 'Sec', display_order: 1, depth: 0 }]),
    };
}

interface CtxOverrides {
    pathParams?: string[];
    suiteId?: string;
    limit?: string;
    offset?: string;
}

function buildCtx(
    client: MockedClient,
    overrides: CtxOverrides = {},
): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const ctx: HandlerContext = {
        client: client as unknown as TestRailClient,
        args: {
            pathParams: overrides.pathParams ?? [],
            ...(overrides.suiteId !== undefined && { suiteId: overrides.suiteId }),
            ...(overrides.limit !== undefined && { limit: overrides.limit }),
            ...(overrides.offset !== undefined && { offset: overrides.offset }),
        },
        bodyInput: {},
        dryRun: false,
        force: false,
        confirmDestructive: false,
        out,
    };
    return { ctx, out };
}

// ── handleSectionGet ──────────────────────────────────────────────────────

describe('handleSectionGet', () => {
    it('calls client.getSection with the parsed id and emits the result', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['7'] });
        await handleSectionGet(ctx);
        expect(client.getSection).toHaveBeenCalledTimes(1);
        expect(client.getSection).toHaveBeenCalledWith(7);
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Sec' }));
    });

    it.each([
        ['missing id', undefined],
        ['empty id', ''],
        ['non-integer id', 'abc'],
        ['zero', '0'],
        ['negative', '-1'],
        ['float', '1.5'],
        ['scientific notation', '1e2'],
        ['hex', '0x1'],
    ])('rejects %s before any client call', async (_label, raw) => {
        const client = buildClient();
        const pathParams = raw === undefined ? [] : [raw];
        const { ctx } = buildCtx(client, { pathParams });
        await expect(handleSectionGet(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getSection).not.toHaveBeenCalled();
    });
});

// ── handleSectionList ─────────────────────────────────────────────────────

describe('handleSectionList', () => {
    it('calls client.getSections with the parsed project id and no options when none are provided', async () => {
        const client = buildClient();
        const { ctx, out } = buildCtx(client, { pathParams: ['3'] });
        await handleSectionList(ctx);
        expect(client.getSections).toHaveBeenCalledTimes(1);
        expect(client.getSections).toHaveBeenCalledWith(3, {});
        expect(out).toHaveBeenCalledTimes(1);
    });

    it('passes parsed --suite-id through to client.getSections', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], suiteId: '9' });
        await handleSectionList(ctx);
        expect(client.getSections).toHaveBeenCalledWith(3, { suiteId: 9 });
    });

    it('passes parsed --limit and --offset through to client.getSections', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], limit: '5', offset: '10' });
        await handleSectionList(ctx);
        expect(client.getSections).toHaveBeenCalledWith(3, { limit: 5, offset: 10 });
    });

    it('combines --suite-id and pagination into one options object', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], suiteId: '9', limit: '5', offset: '10' });
        await handleSectionList(ctx);
        expect(client.getSections).toHaveBeenCalledWith(3, { suiteId: 9, limit: 5, offset: 10 });
    });

    it.each([
        ['missing project_id', undefined],
        ['empty project_id', ''],
        ['non-integer project_id', 'abc'],
        ['zero', '0'],
        ['negative', '-1'],
        ['float', '1.5'],
        ['scientific notation', '1e2'],
        ['hex', '0x1'],
    ])('rejects %s before any client call', async (_label, raw) => {
        const client = buildClient();
        const pathParams = raw === undefined ? [] : [raw];
        const { ctx } = buildCtx(client, { pathParams });
        await expect(handleSectionList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getSections).not.toHaveBeenCalled();
    });

    it('rejects non-integer --suite-id before calling the client', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], suiteId: 'abc' });
        await expect(handleSectionList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getSections).not.toHaveBeenCalled();
    });

    it('rejects --suite-id=0 (positive-integer gate)', async () => {
        const client = buildClient();
        const { ctx } = buildCtx(client, { pathParams: ['3'], suiteId: '0' });
        await expect(handleSectionList(ctx)).rejects.toBeInstanceOf(IdParseError);
        expect(client.getSections).not.toHaveBeenCalled();
    });
});
