import type { Handler } from './handler-context.js';
import type { ActionSpec } from './metadata.js';
import { handleProjectGet, handleProjectList } from './handlers/project.js';
import { handleSuiteGet, handleSuiteList } from './handlers/suite.js';
import { handleCaseGet, handleCaseList, handleCaseHistory } from './handlers/case.js';
import {
    handleCaseAdd,
    handleCaseAddBulk,
    handleCaseUpdate,
    handleCaseUpdateBulk,
    handleCaseDelete,
    handleCaseDeleteBulk,
    handleCaseCopyToSection,
    handleCaseMoveToSection,
} from './handlers/case-write.js';
import { handleRunGet, handleRunList } from './handlers/run.js';
import { handleRunAdd, handleRunUpdate, handleRunClose, handleRunDelete } from './handlers/run-write.js';
import { handleRunWatch } from './handlers/run-watch.js';
import { handleTestGet, handleTestList } from './handlers/test.js';
import { handleResultList, handleResultListForCase, handleResultListForTest } from './handlers/result.js';
import {
    handleResultAdd,
    handleResultAddBulk,
    handleResultAddBulkByTest,
    handleResultAddByTest,
} from './handlers/result-write.js';
import { handleMilestoneGet, handleMilestoneList } from './handlers/milestone.js';
import { handleUserGet, handleUserList, handleUserGetByEmail, handleUserGetCurrent } from './handlers/user.js';
import { handleUserAdd, handleUserUpdate } from './handlers/user-write.js';
import { handlePlanGet, handlePlanList } from './handlers/plan.js';
import {
    handlePlanAdd,
    handlePlanUpdate,
    handlePlanAddEntry,
    handlePlanAddRunToEntry,
    handlePlanUpdateEntry,
    handlePlanUpdateRunInEntry,
    handlePlanClose,
    handlePlanDelete,
    handlePlanDeleteEntry,
    handlePlanDeleteRunFromEntry,
} from './handlers/plan-write.js';
import {
    handleAttachmentListForCase,
    handleAttachmentListForRun,
    handleAttachmentListForTest,
    handleAttachmentListForPlan,
    handleAttachmentListForPlanEntry,
    handleAttachmentGet,
} from './handlers/attachment.js';
import {
    handleAttachmentAddToCase,
    handleAttachmentAddToResult,
    handleAttachmentAddToRun,
    handleAttachmentAddToPlan,
    handleAttachmentAddToPlanEntry,
    handleAttachmentDelete,
} from './handlers/attachment-write.js';
import { handleSectionGet, handleSectionList } from './handlers/section.js';
import { handleReportList, handleReportRun } from './handlers/report.js';
import { handleSharedStepGet, handleSharedStepList, handleSharedStepHistory } from './handlers/shared-step.js';
import { handleSharedStepAdd, handleSharedStepUpdate, handleSharedStepDelete } from './handlers/shared-step-write.js';
import { handleCaseStatusList } from './handlers/case-status.js';
import { handleBddGet, handleBddAdd } from './handlers/bdd.js';
import { handleCaseFieldAdd } from './handlers/case-field-write.js';
import { handleCaseFieldList } from './handlers/case-field.js';
import { handleResultFieldList } from './handlers/result-field.js';
import { handleStatusList } from './handlers/status.js';
import { handleTemplateList } from './handlers/template.js';
import { handleRoleList } from './handlers/role.js';
import { handlePriorityList } from './handlers/priority.js';
import { handleCaseTypeList } from './handlers/case-type.js';
import {
    handleSectionAdd,
    handleSectionDelete,
    handleSectionMove,
    handleSectionUpdate,
} from './handlers/section-write.js';
import { handleProjectAdd, handleProjectDelete, handleProjectUpdate } from './handlers/project-write.js';
import { handleSuiteAdd, handleSuiteDelete, handleSuiteUpdate } from './handlers/suite-write.js';
import { handleMilestoneAdd, handleMilestoneDelete, handleMilestoneUpdate } from './handlers/milestone-write.js';
import { handleVariableList } from './handlers/variable.js';
import { handleVariableAdd, handleVariableDelete, handleVariableUpdate } from './handlers/variable-write.js';
import { handleGroupGet, handleGroupList } from './handlers/group.js';
import { handleGroupAdd, handleGroupDelete, handleGroupUpdate } from './handlers/group-write.js';
import { handleDatasetGet, handleDatasetList } from './handlers/dataset.js';
import { handleDatasetAdd, handleDatasetDelete, handleDatasetUpdate } from './handlers/dataset-write.js';
import { handleConfigurationList } from './handlers/configuration.js';
import {
    handleConfigurationGroupAdd,
    handleConfigurationGroupUpdate,
    handleConfigurationGroupDelete,
    handleConfigurationAdd,
    handleConfigurationUpdate,
    handleConfigurationDelete,
} from './handlers/configuration-write.js';

/**
 * Single source of truth: every supported resource:action mapped to its handler.
 * Adding an action is a one-line change here — no parallel registry to keep in
 * sync. `dispatch()` derives both the known-resources list and the
 * known-actions-per-resource list from this map's keys, so error wording stays
 * accurate even as the map evolves.
 *
 * Keys are inserted in the canonical display order (`get` before `list`, etc.);
 * JavaScript object iteration order is insertion-order-preserving for string
 * keys, which keeps error messages stable.
 */
const HANDLERS: Record<string, Handler> = {
    'project:get': handleProjectGet,
    'project:list': handleProjectList,
    'project:add': handleProjectAdd,
    'project:update': handleProjectUpdate,
    'project:delete': handleProjectDelete,
    'suite:get': handleSuiteGet,
    'suite:list': handleSuiteList,
    'suite:add': handleSuiteAdd,
    'suite:update': handleSuiteUpdate,
    'suite:delete': handleSuiteDelete,
    'case:get': handleCaseGet,
    'case:list': handleCaseList,
    'case:history': handleCaseHistory,
    'case:add': handleCaseAdd,
    'case:add-bulk': handleCaseAddBulk,
    'case:update': handleCaseUpdate,
    'case:update-bulk': handleCaseUpdateBulk,
    'case:delete': handleCaseDelete,
    'case:delete-bulk': handleCaseDeleteBulk,
    'case:copy-to-section': handleCaseCopyToSection,
    'case:move-to-section': handleCaseMoveToSection,
    'run:get': handleRunGet,
    'run:list': handleRunList,
    'run:watch': handleRunWatch,
    'run:add': handleRunAdd,
    'run:update': handleRunUpdate,
    'run:close': handleRunClose,
    'run:delete': handleRunDelete,
    'test:get': handleTestGet,
    'test:list': handleTestList,
    'result:list': handleResultList,
    'result:list-for-test': handleResultListForTest,
    'result:list-for-case': handleResultListForCase,
    'result:add': handleResultAdd,
    'result:add-bulk': handleResultAddBulk,
    'result:add-bulk-by-test': handleResultAddBulkByTest,
    'result:add-by-test': handleResultAddByTest,
    'milestone:get': handleMilestoneGet,
    'milestone:list': handleMilestoneList,
    'milestone:add': handleMilestoneAdd,
    'milestone:update': handleMilestoneUpdate,
    'milestone:delete': handleMilestoneDelete,
    'user:get': handleUserGet,
    'user:list': handleUserList,
    'user:get-by-email': handleUserGetByEmail,
    'user:get-current': handleUserGetCurrent,
    'user:add': handleUserAdd,
    'user:update': handleUserUpdate,
    'plan:get': handlePlanGet,
    'plan:list': handlePlanList,
    'plan:add': handlePlanAdd,
    'plan:update': handlePlanUpdate,
    'plan:add-entry': handlePlanAddEntry,
    'plan:add-run-to-entry': handlePlanAddRunToEntry,
    'plan:update-entry': handlePlanUpdateEntry,
    'plan:update-run-in-entry': handlePlanUpdateRunInEntry,
    'plan:close': handlePlanClose,
    'plan:delete': handlePlanDelete,
    'plan:delete-entry': handlePlanDeleteEntry,
    'plan:delete-run-from-entry': handlePlanDeleteRunFromEntry,
    'attachment:list-for-case': handleAttachmentListForCase,
    'attachment:list-for-run': handleAttachmentListForRun,
    'attachment:list-for-test': handleAttachmentListForTest,
    'attachment:list-for-plan': handleAttachmentListForPlan,
    'attachment:list-for-plan-entry': handleAttachmentListForPlanEntry,
    'attachment:get': handleAttachmentGet,
    'attachment:add-to-case': handleAttachmentAddToCase,
    'attachment:add-to-result': handleAttachmentAddToResult,
    'attachment:add-to-run': handleAttachmentAddToRun,
    'attachment:add-to-plan': handleAttachmentAddToPlan,
    'attachment:add-to-plan-entry': handleAttachmentAddToPlanEntry,
    'attachment:delete': handleAttachmentDelete,
    'shared-step:get': handleSharedStepGet,
    'shared-step:list': handleSharedStepList,
    'shared-step:history': handleSharedStepHistory,
    'shared-step:add': handleSharedStepAdd,
    'shared-step:update': handleSharedStepUpdate,
    'shared-step:delete': handleSharedStepDelete,
    'case-status:list': handleCaseStatusList,
    'bdd:get': handleBddGet,
    'bdd:add': handleBddAdd,
    'case-field:list': handleCaseFieldList,
    'case-field:add': handleCaseFieldAdd,
    'result-field:list': handleResultFieldList,
    'status:list': handleStatusList,
    'template:list': handleTemplateList,
    'role:list': handleRoleList,
    'priority:list': handlePriorityList,
    'case-type:list': handleCaseTypeList,
    'section:get': handleSectionGet,
    'section:list': handleSectionList,
    'section:add': handleSectionAdd,
    'section:update': handleSectionUpdate,
    'section:delete': handleSectionDelete,
    'section:move': handleSectionMove,
    'report:list': handleReportList,
    'report:run': handleReportRun,
    'variable:list': handleVariableList,
    'variable:add': handleVariableAdd,
    'variable:update': handleVariableUpdate,
    'variable:delete': handleVariableDelete,
    'group:get': handleGroupGet,
    'group:list': handleGroupList,
    'group:add': handleGroupAdd,
    'group:update': handleGroupUpdate,
    'group:delete': handleGroupDelete,
    'dataset:get': handleDatasetGet,
    'dataset:list': handleDatasetList,
    'dataset:add': handleDatasetAdd,
    'dataset:update': handleDatasetUpdate,
    'dataset:delete': handleDatasetDelete,
    'configuration:list': handleConfigurationList,
    'configuration:add': handleConfigurationAdd,
    'configuration:update': handleConfigurationUpdate,
    'configuration:delete': handleConfigurationDelete,
    'configuration-group:add': handleConfigurationGroupAdd,
    'configuration-group:update': handleConfigurationGroupUpdate,
    'configuration-group:delete': handleConfigurationGroupDelete,
};

const RESOURCES: Record<string, readonly string[]> = (() => {
    const grouped: Record<string, string[]> = {};
    for (const key of Object.keys(HANDLERS)) {
        const [resource, action] = key.split(':');
        if (resource === undefined || action === undefined) continue;
        const existing = grouped[resource];
        if (existing === undefined) {
            grouped[resource] = [action];
        } else {
            existing.push(action);
        }
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
    // Guard against Object.prototype-key access (`toString`, `__proto__`,
    // `constructor`, `valueOf`, etc.). `RESOURCES` is a plain object
    // literal, so an unguarded `RESOURCES[resource]` would resolve those
    // keys to inherited prototype methods (functions, not arrays), which
    // then crashes the subsequent `actions.includes(...)` call.
    // `Object.hasOwn` (Node 16.9+) returns true only for own properties,
    // never for inherited ones — the canonical guard for this pattern.
    // (The `HANDLERS` lookup below uses a `${resource}:${action}` key,
    // which always contains a `:` and so cannot collide with any
    // Object.prototype key — no guard needed there.)
    if (!Object.hasOwn(RESOURCES, resource)) {
        return {
            ok: false,
            error: `Unknown resource '${resource}'. Use: ${Object.keys(RESOURCES).join(', ')}`,
        };
    }
    const actions = RESOURCES[resource];
    if (actions === undefined) {
        return {
            ok: false,
            error: `Unknown resource '${resource}'. Use: ${Object.keys(RESOURCES).join(', ')}`,
        };
    }
    if (!actions.includes(action)) {
        return {
            ok: false,
            error: `Unknown action '${action}' for ${resource}. Use: ${actions.join(', ')}`,
        };
    }
    const handler = HANDLERS[`${resource}:${action}`];
    if (handler === undefined) {
        return { ok: false, error: `No handler registered for ${resource}:${action}` };
    }
    return { ok: true, handler };
}
