import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt, IdParseError } from '../ids.js';

export async function handleUserGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'user id');
    ctx.out(await ctx.client.getUser(id));
}

export async function handleUserList(ctx: HandlerContext): Promise<void> {
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(await ctx.client.getUsers(limit, offset));
}

/**
 * `user get-by-email --email <addr>` — look up a single user by email.
 *
 * The `--email` flag is shared with the auth resolver (which consumes the
 * same value for the HTTP Basic credential); reusing the flag keeps the
 * KNOWN_FLAGS surface minimal. The handler only enforces non-empty here
 * (TestRail-side `EMAIL_REGEX` in `src/modules/users.ts` rejects malformed
 * addresses with `TestRailValidationError` before any network call, so
 * format validation isn't duplicated at the CLI boundary).
 *
 * Extra positional args are rejected fail-fast with `IdParseError` for
 * parity with the rest of the CLI's arg-parse failures.
 */
export async function handleUserGetByEmail(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `user get-by-email takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Use --email <addr>. Run --help for usage.`,
        );
    }
    const email = ctx.args.email;
    if (email === undefined || email.trim() === '') {
        throw new IdParseError('user get-by-email requires --email <addr> (non-empty).');
    }
    ctx.out(await ctx.client.getUserByEmail(email));
}

/**
 * `user get-current` — fetch the user identified by the auth credential
 * (TestRail 6.6+). Takes no positional args; extras are rejected
 * fail-fast with `IdParseError` (same shape as `status list` / other
 * zero-arg metadata reads).
 */
export async function handleUserGetCurrent(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `user get-current takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.getCurrentUser());
}
