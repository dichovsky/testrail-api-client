import type { Handler } from './handler-context.js';
import { handleProjectGet, handleProjectList } from './handlers/project.js';
import { handleSuiteGet, handleSuiteList } from './handlers/suite.js';
import { handleCaseGet, handleCaseList } from './handlers/case.js';
import { handleRunGet, handleRunList } from './handlers/run.js';
import { handleResultList } from './handlers/result.js';
import { handleMilestoneGet, handleMilestoneList } from './handlers/milestone.js';
import { handleUserGet, handleUserList } from './handlers/user.js';

const RESOURCES: Record<string, readonly string[]> = {
    project: ['get', 'list'],
    suite: ['get', 'list'],
    case: ['get', 'list'],
    run: ['get', 'list'],
    result: ['list'],
    milestone: ['get', 'list'],
    user: ['get', 'list'],
};

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
