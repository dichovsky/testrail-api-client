import type { HandlerContext } from '../handler-context.js';
import { IdParseError } from '../ids.js';
import { resolveBody } from '../body.js';
import { UpdateTestLabelsPayloadSchema, UpdateTestsLabelsPayloadSchema } from '../../schemas.js';
import { createWriteHandler } from '../write-handler-factory.js';

/**
 * `test update-labels <test_id>` — set the labels on a single test. Label-only
 * mutation (NOT a general test update); the body is `{"labels":[...]}` where
 * each element is an existing label ID or title.
 */
export const handleTestUpdate = createWriteHandler({
    action: 'test update-labels',
    pathParams: ['test_id'],
    bodySchema: UpdateTestLabelsPayloadSchema,
    call: (client, [testId], body) => client.tests.updateTest(testId, body),
});

/**
 * `test update-labels-bulk` — apply the SAME labels to many tests at once.
 * Hand-written (not factory-built) because `update_tests` takes no path param:
 * the tests are identified entirely by `test_ids` in the JSON body. Mirrors the
 * `group add` body-only precedent — the dispatcher's path-param-count check
 * covers the CLI path, but this guard also protects direct callers.
 */
export async function handleTestUpdateBulk(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `test update-labels-bulk takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    const body = resolveBody(ctx.bodyInput, UpdateTestsLabelsPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'test update-labels-bulk',
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.tests.updateTests(body.payload));
}
