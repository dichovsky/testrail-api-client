import type { ActionSpec } from './metadata/types.js';

import { projectActions } from './metadata/projects.js';
import { suiteActions } from './metadata/suites.js';
import { caseActions } from './metadata/cases.js';
import { runActions } from './metadata/runs.js';
import { testActions } from './metadata/tests.js';
import { resultActions } from './metadata/results.js';
import { milestoneActions } from './metadata/milestones.js';
import { userActions } from './metadata/users.js';
import { planActions } from './metadata/plans.js';
import { sectionActions } from './metadata/sections.js';
import { sharedStepActions } from './metadata/sharedSteps.js';
import { reportActions } from './metadata/reports.js';
import { caseStatusActions } from './metadata/caseStatuses.js';
import { caseFieldActions } from './metadata/caseFields.js';
import { resultFieldActions } from './metadata/resultFields.js';
import { statusActions } from './metadata/statuses.js';
import { templateActions } from './metadata/templates.js';
import { roleActions } from './metadata/roles.js';
import { priorityActions } from './metadata/priorities.js';
import { caseTypeActions } from './metadata/caseTypes.js';
import { attachmentActions } from './metadata/attachments.js';
import { bddActions } from './metadata/bdd.js';
import { variableActions } from './metadata/variables.js';
import { groupActions } from './metadata/groups.js';
import { datasetActions } from './metadata/datasets.js';
import { configurationActions } from './metadata/configurations.js';
import { configurationGroupActions } from './metadata/configurationGroups.js';
import { labelActions } from './metadata/labels.js';

export type { ActionSpec, PathParam } from './metadata/types.js';

/**
 * Declarative spec for every resource:action exposed by the CLI.
 *
 * Single source of truth shared by:
 * - PR 3 tests: assert both directions of the metadata↔dispatch
 *   correspondence — every `ACTIONS` entry must have a registered handler
 *   in `dispatch.ts` HANDLERS, and every HANDLERS key must have an
 *   `ACTIONS` entry. Catches drift in either direction.
 * - PR 4 skill generator: renders the `<!-- GENERATED:command-table -->` and
 *   `<!-- GENERATED:payload-schemas -->` regions of `skill/SKILL.md` from
 *   this array.
 * - PR 5 API-mapping generator (`scripts/generate-mapping.js`): reads the
 *   `apiEndpoint` field from each entry to produce `docs/API-MAPPING.md`'s
 *   CLI column. Cross-validates that each `apiEndpoint` matches a
 *   `@testrail` JSDoc tag on a method in `src/modules/*.ts`.
 *
 * Adding a new action requires touching exactly two places: the handler in
 * `src/cli/handlers/`, and an entry in the appropriate per-resource module
 * under `src/cli/metadata/`. The dispatcher, the skill, and the mapping
 * table stay accurate automatically.
 *
 * **Order preservation.** This array is composed from per-resource modules
 * via explicit slicing so the published `ACTIONS` order matches the
 * pre-PR-B layout byte-for-byte. Renderers (skill command table,
 * AGENTS.md destructive list) iterate this array in declaration order, so
 * any reordering would force a `--check` drift across multiple generated
 * artifacts. Each slice comment indicates the original logical section.
 */
export const ACTIONS: readonly ActionSpec[] = [
    // ── Read actions ──────────────────────────────────────────────────────
    ...projectActions.slice(0, 2), // project get, list
    ...suiteActions.slice(0, 2), // suite get, list
    ...caseActions.slice(0, 3), // case get, list, history
    ...runActions.slice(0, 3), // run get, list, watch
    ...testActions.slice(0, 2), // test get, list
    ...resultActions.slice(0, 3), // result list, list-for-test, list-for-case
    ...milestoneActions.slice(0, 2), // milestone get, list
    ...userActions.slice(0, 4), // user get, list, get-by-email, get-current
    ...planActions.slice(0, 2), // plan get, list
    ...sectionActions.slice(0, 2), // section get, list
    // ── Write actions ─────────────────────────────────────────────────────
    ...caseActions.slice(3, 11), // case add, add-bulk, update, update-bulk, delete, delete-bulk, copy-to-section, move-to-section
    ...runActions.slice(3, 7), // run add, update, close, delete
    ...testActions.slice(2, 4), // test update-labels, update-labels-bulk
    ...resultActions.slice(3, 7), // result add, add-bulk, add-bulk-by-test, add-by-test
    ...planActions.slice(2, 12), // plan add, update, add-entry, add-run-to-entry, update-entry, update-run-in-entry, close, delete, delete-entry, delete-run-from-entry
    ...sectionActions.slice(2, 6), // section add, update, move, delete
    // ── Structural-setup write actions ────────────────────────────────────
    // `project`, `suite`, `milestone`, and `user` add/update. Programmatic
    // methods already exist; these expose them via the CLI for agent
    // provisioning workflows. `user add` requires TestRail 7.3+.
    ...projectActions.slice(2, 5), // project add, update, delete
    ...suiteActions.slice(2, 5), // suite add, update, delete
    ...milestoneActions.slice(2, 5), // milestone add, update, delete
    // ── User write actions (TestRail 7.3+) ────────────────────────────────
    ...userActions.slice(4, 6), // user add, update
    // ── Shared-step read actions ──────────────────────────────────────────
    ...sharedStepActions.slice(0, 3), // shared-step get, list, history
    // ── Report read actions ───────────────────────────────────────────────
    ...reportActions, // report list, run
    // ── Shared-step write actions (TestRail 7.0+) ─────────────────────────
    ...sharedStepActions.slice(3, 6), // shared-step add, update, delete
    // ── Case-status read action ───────────────────────────────────────────
    ...caseStatusActions, // case-status list
    // ── Metadata + reference-data read actions ────────────────────────────
    // Instance-level metadata and reference-data getters: case fields,
    // result fields, statuses, templates, roles, priorities, case types.
    // Seven of the eight take no path params (`case-field list`,
    // `case-status list`, `result-field list`, `status list`, `role list`,
    // `priority list`, `case-type list`); their handlers reject extra
    // positional args fail-fast with `IdParseError` so a typo like
    // `testrail status list 5` or `testrail role list 5` surfaces as an
    // error instead of silently ignoring the `5`. `template list` takes a
    // single `project_id`.
    ...caseFieldActions.slice(0, 1), // case-field list
    ...resultFieldActions, // result-field list
    ...statusActions, // status list
    ...templateActions, // template list
    ...roleActions, // role list
    ...priorityActions, // priority list
    ...caseTypeActions, // case-type list
    // ── Case-field write action ───────────────────────────────────────────
    ...caseFieldActions.slice(1, 2), // case-field add
    // ── Attachment read actions ───────────────────────────────────────────
    ...attachmentActions.slice(0, 6), // attachment list-for-case, list-for-run, list-for-test, list-for-plan, list-for-plan-entry, get
    // ── Attachment write actions (file input) ─────────────────────────────
    ...attachmentActions.slice(6, 11), // attachment add-to-case, add-to-result, add-to-run, add-to-plan, add-to-plan-entry
    // ── Attachment destructive action (requires --yes) ────────────────────
    ...attachmentActions.slice(11, 12), // attachment delete
    // ── BDD actions (text I/O for `get`, file input for `add`) ────────────
    ...bddActions, // bdd get, add
    // ── Variable actions (data-driven testing) ────────────────────────────
    ...variableActions, // variable list, add, update, delete
    // ── Group actions (TestRail 7.5+) ─────────────────────────────────────
    ...groupActions, // group get, list, add, update, delete
    // ── Dataset actions (data-driven testing) ─────────────────────────────
    ...datasetActions, // dataset get, list, add, update, delete
    // ── Configuration hierarchy (groups + leaf configs) ───────────────────
    ...configurationActions.slice(0, 1), // configuration list
    ...configurationGroupActions, // configuration-group add, update, delete
    ...configurationActions.slice(1, 4), // configuration add, update, delete
    // ── Label actions (TestRail Labels API, 2025) ─────────────────────────
    ...labelActions, // label get, list, update
];

/** Look up the spec for a resource:action pair, or return undefined. */
export function getActionSpec(resource: string, action: string): ActionSpec | undefined {
    return ACTIONS.find((a) => a.resource === resource && a.action === action);
}
