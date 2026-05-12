import type { Handler } from './handler-context.js';
import { handleProjectGet, handleProjectList } from './handlers/project.js';
import { handleSuiteGet, handleSuiteList } from './handlers/suite.js';
import { handleCaseGet, handleCaseList } from './handlers/case.js';
import { handleRunGet, handleRunList } from './handlers/run.js';
import { handleResultList } from './handlers/result.js';
import { handleMilestoneGet, handleMilestoneList } from './handlers/milestone.js';
import { handleUserGet, handleUserList } from './handlers/user.js';

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
    'suite:get': handleSuiteGet,
    'suite:list': handleSuiteList,
    'case:get': handleCaseGet,
    'case:list': handleCaseList,
    'run:get': handleRunGet,
    'run:list': handleRunList,
    'result:list': handleResultList,
    'milestone:get': handleMilestoneGet,
    'milestone:list': handleMilestoneList,
    'user:get': handleUserGet,
    'user:list': handleUserList,
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

export function dispatch(resource: string, action: string): DispatchResult {
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
