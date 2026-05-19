import type { Handler } from './handler-context.js';
import { handleProjectGet, handleProjectList } from './handlers/project.js';
import { handleSuiteGet, handleSuiteList } from './handlers/suite.js';
import { handleCaseGet, handleCaseList, handleCaseHistory } from './handlers/case.js';
import {
    handleCaseAdd,
    handleCaseUpdate,
    handleCaseUpdateBulk,
    handleCaseDelete,
    handleCaseDeleteBulk,
    handleCaseCopyToSection,
    handleCaseMoveToSection,
} from './handlers/case-write.js';
import { handleRunGet, handleRunList } from './handlers/run.js';
import { handleRunAdd, handleRunUpdate, handleRunClose, handleRunDelete } from './handlers/run-write.js';
import { handleResultList } from './handlers/result.js';
import { handleResultAdd, handleResultAddBulk, handleResultAddBulkByTest } from './handlers/result-write.js';
import { handleMilestoneGet, handleMilestoneList } from './handlers/milestone.js';
import { handleUserGet, handleUserList } from './handlers/user.js';
import { handlePlanGet, handlePlanList } from './handlers/plan.js';
import {
    handlePlanAdd,
    handlePlanUpdate,
    handlePlanAddEntry,
    handlePlanAddRunToEntry,
    handlePlanUpdateEntry,
    handlePlanUpdateRunInEntry,
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
import { handleSharedStepGet, handleSharedStepList, handleSharedStepHistory } from './handlers/shared-step.js';
import { handleCaseStatusList } from './handlers/case-status.js';
import { handleBddGet, handleBddAdd } from './handlers/bdd.js';
import { handleCaseFieldAdd } from './handlers/case-field-write.js';
import {
    handleSectionAdd,
    handleSectionDelete,
    handleSectionMove,
    handleSectionUpdate,
} from './handlers/section-write.js';
import { handleProjectAdd, handleProjectDelete, handleProjectUpdate } from './handlers/project-write.js';
import { handleSuiteAdd, handleSuiteDelete, handleSuiteUpdate } from './handlers/suite-write.js';
import { handleMilestoneAdd, handleMilestoneDelete, handleMilestoneUpdate } from './handlers/milestone-write.js';

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
    'case:update': handleCaseUpdate,
    'case:update-bulk': handleCaseUpdateBulk,
    'case:delete': handleCaseDelete,
    'case:delete-bulk': handleCaseDeleteBulk,
    'case:copy-to-section': handleCaseCopyToSection,
    'case:move-to-section': handleCaseMoveToSection,
    'run:get': handleRunGet,
    'run:list': handleRunList,
    'run:add': handleRunAdd,
    'run:update': handleRunUpdate,
    'run:close': handleRunClose,
    'run:delete': handleRunDelete,
    'result:list': handleResultList,
    'result:add': handleResultAdd,
    'result:add-bulk': handleResultAddBulk,
    'result:add-bulk-by-test': handleResultAddBulkByTest,
    'milestone:get': handleMilestoneGet,
    'milestone:list': handleMilestoneList,
    'milestone:add': handleMilestoneAdd,
    'milestone:update': handleMilestoneUpdate,
    'milestone:delete': handleMilestoneDelete,
    'user:get': handleUserGet,
    'user:list': handleUserList,
    'plan:get': handlePlanGet,
    'plan:list': handlePlanList,
    'plan:add': handlePlanAdd,
    'plan:update': handlePlanUpdate,
    'plan:add-entry': handlePlanAddEntry,
    'plan:add-run-to-entry': handlePlanAddRunToEntry,
    'plan:update-entry': handlePlanUpdateEntry,
    'plan:update-run-in-entry': handlePlanUpdateRunInEntry,
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
    'case-status:list': handleCaseStatusList,
    'bdd:get': handleBddGet,
    'bdd:add': handleBddAdd,
    'case-field:add': handleCaseFieldAdd,
    'section:get': handleSectionGet,
    'section:list': handleSectionList,
    'section:add': handleSectionAdd,
    'section:update': handleSectionUpdate,
    'section:delete': handleSectionDelete,
    'section:move': handleSectionMove,
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
