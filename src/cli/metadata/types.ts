import type { z } from 'zod';
import type { ActionSpecFlagName } from '../flags.js';
import type { Handler } from '../handler-context.js';

/**
 * Type definitions for CLI action metadata, consumed by the dispatcher,
 * skill generator, and API-mapping drift gates. The concrete `ACTIONS`
 * array (one entry per `resource:action`) is composed in
 * `src/cli/metadata.ts` from the per-resource modules in this directory.
 */

export interface PathParam {
    name: string;
    description: string;
}

export interface ActionFlagSpec {
    /** Catalogued argv spelling. */
    readonly name: ActionSpecFlagName;
    /** Reject the action before auth when this flag is absent or empty. */
    readonly required?: boolean;
}

export interface ActionSpec {
    resource: string;
    action: string;
    summary: string;
    pathParams: readonly PathParam[];
    /** The handler function invoked when this `resource:action` is dispatched.
     *  Binding the handler directly on the spec promotes `ACTIONS` to the
     *  single source of truth: `dispatch.ts` derives its action map by
     *  iterating `ACTIONS`, so a metadata entry without a handler is a
     *  TypeScript error rather than a runtime drift bug caught by tests. */
    handler: Handler;
    /**
     * Action-specific inputs and requiredness. The compiler limits entries to
     * catalogued action flags. Structural capabilities still admit companion
     * flags as a group (for example `fileInput` admits optional `--filename`),
     * while a genuinely required member such as `--file` is declared here.
     */
    flags?: readonly ActionFlagSpec[];
    /** TestRail endpoint this CLI action calls, in the form `'METHOD path'`
     *  (e.g., `'POST add_case/{section_id}'`). Must agree with the
     *  `@testrail` JSDoc tag on the linked client method in
     *  `src/modules/*.ts`. The API-mapping generator validates both
     *  directions (no orphan ActionSpec referencing a non-existent endpoint,
     *  no missing endpoints when the JSON says the CLI covers it). */
    apiEndpoint: string;
    /**
     * Preserve `--limit` / `--offset` in the default item-array mode when an
     * endpoint accepts those query controls but does not expose a stable
     * envelope contract for `--page` / `--all`. This is intentionally
     * separate from the endpoint's own pagination contract, which lives in
     * `paginated-endpoints.ts` and is keyed by `apiEndpoint`.
     */
    itemsRequestControls?: boolean;
    /**
     * This action reads the same endpoint repeatedly within one invocation, so
     * its client must not serve those reads from the GET cache.
     *
     * The cache is keyed per endpoint with a 5-minute default TTL, longer than
     * any polling interval the CLI accepts. Leaving it on made `run watch`
     * issue exactly one upstream request and then replay that snapshot until
     * the process was killed — the run could complete without the watcher ever
     * noticing (issue #281). A one-shot action is unaffected either way, so
     * this stays opt-in rather than disabling the cache for the whole CLI.
     */
    polls?: boolean;
    /** Zod schema for the request body. `undefined` for read actions, for
     *  no-body POSTs like `run close`, and for file-input write actions
     *  (which take `--file <path>` instead of a JSON body). */
    bodySchema?: z.ZodTypeAny;
    /** Optional concrete usage hint rendered in `--help` for body-bearing
     *  writes. When set, replaces the generic
     *  `--data '{...}' | --data-file <path> | stdin` placeholder with a
     *  hand-crafted example (e.g., `--data '{"title":"..."}'`) plus any
     *  trailing note (e.g., `(TestRail 7.5+)`). When omitted, the generic
     *  placeholder is used. Affects HELP only — not the skill generator or
     *  drift gates. */
    helpExample?: string;
    /** True for actions that take a binary file via `--file <path>` instead
     *  of a JSON body. Skill generator branches on this to emit file-upload
     *  recipes; mutually exclusive with `bodySchema`. */
    fileInput?: boolean;
    /** True for actions that emit non-JSON output via `--out <path>` instead
     *  of JSON to stdout. `attachment get` (binary download) and `bdd get`
     *  (UTF-8 text) both use this. The on-the-wire encoding is signalled by
     *  `outputKind`. */
    fileOutput?: boolean;
    /** Encoding of the bytes written to `--out <path>` when `fileOutput` is
     *  true. `'binary'` (default) for opaque blobs like attachment downloads;
     *  `'text'` for UTF-8 payloads like `bdd get` (Gherkin `.feature`). Drives
     *  the body-label rendered in skill/SKILL.md so users see an accurate
     *  description instead of a hard-coded `(binary)` suffix. */
    outputKind?: 'binary' | 'text';
    /** True for write actions (POST / payload-bearing). Affects skill recipes,
     *  generator output, and `--dry-run` applicability. */
    isWrite: boolean;
    /** True for destructive actions that require `--yes` to execute. */
    destructive?: boolean;
    /**
     * TestRail's server-side preview behavior for destructive actions.
     * Defaults to `reject`; only endpoints with a documented server-side
     * preview opt into `optional`.
     */
    softMode?: 'optional' | 'reject';
    /** Opt-out flag for the bidirectional Gate C2 check. When `true`, the
     *  mapping generator skips the "every ACTIONS entry needs ≥1
     *  `<!-- recipe-for: resource:action -->` binding in skill/SKILL.md"
     *  enforcement for this entry.
     *
     *  Use sparingly — only for genuinely niche admin/reference endpoints
     *  that don't warrant a numbered skill recipe (the command-table fallback
     *  in SKILL.md still covers them). The default (no flag) is to require a
     *  recipe so PR #114 / PR #118-style silent recipe drops are impossible. */
    skillRecipeExempt?: boolean;
}

/**
 * Declare a group of CLI actions, preserving their `apiEndpoint` strings as
 * literal types while leaving every other field at its declared width.
 *
 * `as const satisfies readonly ActionSpec[]` would also preserve the endpoint
 * literals, but it preserves *everything* — which forces consumers reading an
 * optional field off the union to narrow against every member that omits it,
 * and makes the compiler spell all 134 entries' full shapes into the emitted
 * declarations. The endpoint strings are the only projection anything needs.
 */
export function defineActions<const E extends string>(
    actions: readonly (ActionSpec & { readonly apiEndpoint: E })[],
): readonly (ActionSpec & { readonly apiEndpoint: E })[] {
    return actions;
}
