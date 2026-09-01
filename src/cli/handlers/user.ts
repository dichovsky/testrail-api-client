import type { HandlerContext } from '../handler-context.js';
import { parseId, IdParseError } from '../ids.js';
import { parseOptionalId } from '../filters.js';

export async function handleUserGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'user id');
    ctx.out(await ctx.client.users.getUser(id));
}

export async function handleUserList(ctx: HandlerContext): Promise<void> {
    const projectId = parseOptionalId(ctx.args.projectId, '--project-id');
    ctx.out(await ctx.client.users.getUsers(projectId));
}

/**
 * `user get-by-email --user-email <addr>` — look up a single user by email.
 * The lookup flag is deliberately distinct from the authentication `--email`
 * so an administrator can retrieve another user's record.
 * The client-side `EMAIL_REGEX` check in `src/modules/users.ts` rejects
 * malformed addresses with `TestRailValidationError` before any network
 * call, so format validation isn't duplicated at the CLI boundary. The
 * trimmed value is passed to `getUserByEmail()` so a trailing whitespace
 * typo in `--email` does not slip past the strict regex.
 *
 * Extra positional args are rejected fail-fast with `IdParseError` for
 * parity with the rest of the CLI's arg-parse failures.
 */
export async function handleUserGetByEmail(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `user get-by-email takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Use --user-email <addr>. Run --help for usage.`,
        );
    }
    const email = ctx.args.userEmail;
    if (email === undefined || email.trim() === '') {
        throw new IdParseError('user get-by-email requires --user-email <addr> (non-empty).');
    }
    ctx.out(await ctx.client.users.getUserByEmail(email.trim()));
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
    ctx.out(await ctx.client.users.getCurrentUser());
}
