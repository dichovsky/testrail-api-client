import type { z } from 'zod';
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

export interface ActionSpec {
    resource: string;
    action: string;
    summary: string;
    pathParams: readonly PathParam[];
    /** The handler function invoked when this `resource:action` is dispatched.
     *  Binding the handler directly on the spec promotes `ACTIONS` to the
     *  single source of truth: `dispatch.ts` derives its `HANDLERS` map by
     *  iterating `ACTIONS`, so a metadata entry without a handler is a
     *  TypeScript error rather than a runtime drift bug caught by tests. */
    handler: Handler;
    /** TestRail endpoint this CLI action calls, in the form `'METHOD path'`
     *  (e.g., `'POST add_case/{section_id}'`). Must agree with the
     *  `@testrail` JSDoc tag on the linked client method in
     *  `src/modules/*.ts`. The API-mapping generator validates both
     *  directions (no orphan ActionSpec referencing a non-existent endpoint,
     *  no missing endpoints when the JSON says the CLI covers it). */
    apiEndpoint: string;
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
