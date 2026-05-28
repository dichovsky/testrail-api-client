import type { Handler } from './handler-context.js';
import { ACTIONS } from './metadata.js';
import type { ActionSpec } from './metadata/types.js';

/**
 * Single source of truth: every supported resource:action mapped to its handler.
 *
 * PR-C promoted `ACTIONS` to the registry. Each `ActionSpec` carries its own
 * `handler` reference, so the dispatch map is derived from the metadata array
 * at module load. Adding an action is a one-line change to the relevant
 * `src/cli/metadata/{resource}.ts` entry — no parallel registry to keep in sync
 * and no test required to enforce correspondence (the TypeScript compiler does).
 *
 * Insertion order matches `ACTIONS`, which preserves the canonical display
 * order used by error messages (`get` before `list`, etc.).
 */
const HANDLERS: Record<string, Handler> = Object.fromEntries(
    ACTIONS.map((a) => [`${a.resource}:${a.action}`, a.handler]),
);

const RESOURCES: Record<string, readonly string[]> = (() => {
    const grouped: Record<string, string[]> = {};
    for (const { resource, action } of ACTIONS) {
        (grouped[resource] ??= []).push(action);
    }
    return grouped;
})();

export type DispatchResult = { ok: true; handler: Handler } | { ok: false; error: string };

/**
 * Returns every registered `resource:action` key. Used by the
 * metadata↔dispatch consistency tests to catch handlers added without a
 * matching metadata entry — the inverse of the metadata-first check.
 */
export function getRegisteredActions(): readonly string[] {
    return Object.keys(HANDLERS);
}

/**
 * Environment-variable name for the destructive-ops gate.
 *
 * Set to exactly `'1'` (no other value is accepted) to unlock destructive
 * actions. Required in addition to the per-invocation `--yes` flag — both
 * must be satisfied for a destructive call to reach the API.
 *
 * The strict `'1'` comparison is deliberate: accepting `'true'` / `'yes'` /
 * `'on'` would surface as an audit-trail ambiguity (which value did CI
 * actually set?). One canonical token keeps `set | unset | wrong-value`
 * unambiguous in `printenv` output and CI definitions.
 */
export const DESTRUCTIVE_ENV_VAR = 'TESTRAIL_ALLOW_DESTRUCTIVE';

/**
 * Strict token accepted for `TESTRAIL_ALLOW_DESTRUCTIVE`. Any other value
 * (including `'true'`, `'yes'`, `'on'`, `'1 '` with whitespace) is rejected.
 */
export const DESTRUCTIVE_ENV_ALLOW_VALUE = '1';

export type EnvGateResult = { ok: true } | { ok: false; error: string };

/**
 * Defense-in-depth gate for destructive CLI actions.
 *
 * Runs in the dispatcher (not in individual handlers) so a handler added
 * without an `if (!confirmDestructive)` check still cannot escape this
 * gate. The check fires only when:
 *   - The resolved `ActionSpec` has `destructive: true`, AND
 *   - `--dry-run` is NOT set (preview is non-destructive by definition).
 *
 * The env var must be exactly the string `'1'`. This complements the
 * existing `--yes` flag — both gates must clear before a destructive call
 * reaches the API. Dry-run bypasses this guard so CI users can still
 * `--dry-run --yes` a destructive command without setting the env var
 * (preview hits no API).
 *
 * Returns `{ ok: true }` when the gate clears (action non-destructive, or
 * dry-run, or env var correctly set). Returns `{ ok: false, error }` with
 * a directive message otherwise. The caller (CLI entry point) maps the
 * error to exit code 2 (distinct from the generic exit code 1 for other
 * argv / auth / handler failures) so CI can distinguish "destructive
 * action blocked by missing env var" from "wrong flag / bad JSON / 4xx".
 */
export function checkDestructiveEnvGate(
    spec: ActionSpec | undefined,
    env: Readonly<Record<string, string | undefined>>,
    dryRun: boolean,
): EnvGateResult {
    if (spec?.destructive !== true) {
        return { ok: true };
    }
    if (dryRun) {
        return { ok: true };
    }
    if (env[DESTRUCTIVE_ENV_VAR] === DESTRUCTIVE_ENV_ALLOW_VALUE) {
        return { ok: true };
    }
    return {
        ok: false,
        error:
            `Destructive action '${spec.resource} ${spec.action}' requires ` +
            `${DESTRUCTIVE_ENV_VAR}=${DESTRUCTIVE_ENV_ALLOW_VALUE} environment variable. ` +
            `This is in addition to the --yes flag. ` +
            `Set the env var (export ${DESTRUCTIVE_ENV_VAR}=${DESTRUCTIVE_ENV_ALLOW_VALUE}) ` +
            `to unlock destructive operations, or pass --dry-run to preview without an API call.`,
    };
}

export type PathParamCountResult = { ok: true } | { ok: false; error: string };

/**
 * Validates that the number of positional path params supplied on the CLI
 * matches the count declared in the ActionSpec.
 *
 * Returns `{ ok: true }` when the spec is absent (defensive no-op — the
 * caller handles the unknown-action case) or counts match. Returns
 * `{ ok: false, error }` with a usage hint when too many or too few params
 * are given.
 */
export function checkPathParamCount(spec: ActionSpec | undefined, pathParams: readonly string[]): PathParamCountResult {
    if (spec === undefined) return { ok: true };
    const expected = spec.pathParams.length;
    const actual = pathParams.length;
    if (actual === expected) return { ok: true };
    const paramNames = spec.pathParams.map((p) => `<${p.name}>`).join(' ');
    const usage = paramNames
        ? `testrail ${spec.resource} ${spec.action} ${paramNames}`
        : `testrail ${spec.resource} ${spec.action}`;
    if (actual < expected) {
        return {
            ok: false,
            error:
                `'${spec.resource} ${spec.action}' requires ${expected} path parameter(s) ` +
                `(got ${actual}). Usage: ${usage}`,
        };
    }
    return {
        ok: false,
        error:
            `'${spec.resource} ${spec.action}' takes ${expected} path parameter(s) ` +
            `(got ${actual}, extra: ${pathParams
                .slice(expected)
                .map((p) => JSON.stringify(p))
                .join(', ')}). ` +
            `Usage: ${usage}`,
    };
}

export function dispatch(resource: string, action: string): DispatchResult {
    // Look the handler up directly first. HANDLERS keys are `${resource}:${action}`
    // — the colon means a key can never collide with an Object.prototype member
    // (`toString`, `__proto__`, …), so no `hasOwn` guard is needed here, and a
    // hit is the common success path.
    const handler = HANDLERS[`${resource}:${action}`];
    if (handler !== undefined) {
        return { ok: true, handler };
    }

    // Miss: disambiguate the error. An unknown resource lists the valid
    // resources; a known resource with a bad action lists that resource's
    // actions. `Object.hasOwn` distinguishes the two (and guards against
    // prototype keys reaching the resource check).
    if (!Object.hasOwn(RESOURCES, resource)) {
        return {
            ok: false,
            error: `Unknown resource '${resource}'. Use: ${Object.keys(RESOURCES).join(', ')}`,
        };
    }
    const actions = ACTIONS.filter((a) => a.resource === resource).map((a) => a.action);
    return {
        ok: false,
        error: `Unknown action '${action}' for ${resource}. Use: ${actions.join(', ')}`,
    };
}
