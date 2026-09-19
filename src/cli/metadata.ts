import type { ActionSpec } from './metadata/types.js';

import { projectReadActions, projectWriteActions } from './metadata/projects.js';
import { suiteReadActions, suiteWriteActions } from './metadata/suites.js';
import { caseReadActions, caseWriteActions } from './metadata/cases.js';
import { runReadActions, runWriteActions } from './metadata/runs.js';
import { testReadActions, testWriteActions } from './metadata/tests.js';
import { resultReadActions, resultWriteActions } from './metadata/results.js';
import { milestoneReadActions, milestoneWriteActions } from './metadata/milestones.js';
import { userReadActions, userWriteActions } from './metadata/users.js';
import { planReadActions, planWriteActions } from './metadata/plans.js';
import { sectionReadActions, sectionWriteActions } from './metadata/sections.js';
import { sharedStepReadActions, sharedStepWriteActions } from './metadata/sharedSteps.js';
import { reportActions } from './metadata/reports.js';
import { caseStatusActions } from './metadata/caseStatuses.js';
import { caseFieldReadActions, caseFieldWriteActions } from './metadata/caseFields.js';
import { resultFieldActions } from './metadata/resultFields.js';
import { statusActions } from './metadata/statuses.js';
import { templateActions } from './metadata/templates.js';
import { roleActions } from './metadata/roles.js';
import { priorityActions } from './metadata/priorities.js';
import { caseTypeActions } from './metadata/caseTypes.js';
import { attachmentReadActions, attachmentWriteActions } from './metadata/attachments.js';
import { bddActions } from './metadata/bdd.js';
import { variableActions } from './metadata/variables.js';
import { groupActions } from './metadata/groups.js';
import { datasetActions } from './metadata/datasets.js';
import { configurationReadActions, configurationWriteActions } from './metadata/configurations.js';
import { configurationGroupActions } from './metadata/configurationGroups.js';
import { labelActions } from './metadata/labels.js';
import { versionActions } from './metadata/versions.js';
import { dynamicFilterFieldActions } from './metadata/dynamicFilterFields.js';

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
 * **Order preservation.** Renderers (skill command table, AGENTS.md
 * destructive list) iterate this array in declaration order, so any reordering
 * forces a `--check` drift across several generated artifacts.
 *
 * That order used to be produced by 29 `.slice(a, b)` calls over per-resource
 * arrays, each with a comment naming the entries it was supposed to cover.
 * Nothing checked the comment against the bounds, and nothing could: `.slice()`
 * on a tuple returns the union of every element regardless of the numbers, so
 * inserting an entry silently shifted every later bound and a wrong bound
 * compiled clean. Each resource now exports its reads and writes separately and
 * the barrel spreads them by name.
 */
export const ACTIONS: readonly ActionSpec[] = [
    // ── Read actions ──────────────────────────────────────────────────────
    ...projectReadActions, // project get, list
    ...suiteReadActions, // suite get, list
    ...caseReadActions, // case get, list, history, titles
    ...runReadActions, // run get, list, watch
    ...testReadActions, // test get, list
    ...resultReadActions, // result list, list-for-test, list-for-case
    ...milestoneReadActions, // milestone get, list
    ...userReadActions, // user get, list, get-by-email, get-current
    ...planReadActions, // plan get, list
    ...sectionReadActions, // section get, list
    // ── Write actions ─────────────────────────────────────────────────────
    ...caseWriteActions, // case add, add-bulk, update, update-bulk, delete, delete-bulk, copy-to-section, move-to-section
    ...runWriteActions, // run add, update, close, delete
    ...testWriteActions, // test update-labels, update-labels-bulk
    ...resultWriteActions, // result add, add-bulk, add-bulk-by-test, add-by-test, edit
    ...planWriteActions, // plan add, update, add-entry, add-run-to-entry, update-entry, update-run-in-entry, close, delete, delete-entry, delete-run-from-entry
    ...sectionWriteActions, // section add, update, move, delete
    // ── Structural-setup write actions ────────────────────────────────────
    // `project`, `suite`, `milestone`, and `user` add/update. Programmatic
    // methods already exist; these expose them via the CLI for agent
    // provisioning workflows. `user add` requires TestRail 7.3+.
    ...projectWriteActions, // project add, update, delete
    ...suiteWriteActions, // suite add, update, delete
    ...milestoneWriteActions, // milestone add, update, delete
    // ── User write actions (TestRail 7.3+) ────────────────────────────────
    ...userWriteActions, // user add, update
    // ── Shared-step read actions ──────────────────────────────────────────
    ...sharedStepReadActions, // shared-step get, list, history
    // ── Report read actions ───────────────────────────────────────────────
    ...reportActions, // report list, run
    // ── Shared-step write actions (TestRail 7.0+) ─────────────────────────
    ...sharedStepWriteActions, // shared-step add, update, delete
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
    ...caseFieldReadActions, // case-field list
    ...resultFieldActions, // result-field list
    ...statusActions, // status list
    ...templateActions, // template list
    ...roleActions, // role list
    ...priorityActions, // priority list
    ...caseTypeActions, // case-type list
    ...versionActions, // version get (TestRail 10.6+)
    ...dynamicFilterFieldActions, // dynamic-filter-field list (TestRail 10.4+)
    // ── Case-field write action ───────────────────────────────────────────
    ...caseFieldWriteActions, // case-field add
    // ── Attachment read actions ───────────────────────────────────────────
    ...attachmentReadActions, // attachment list-for-case, list-for-run, list-for-test, list-for-plan, list-for-plan-entry, get
    // ── Attachment write actions ──────────────────────────────────────────
    // Five file-input uploads, then `attachment delete` (destructive, --yes).
    ...attachmentWriteActions,
    // ── BDD actions (text I/O for `get`, file input for `add`) ────────────
    ...bddActions, // bdd get, list, add, update
    // ── Variable actions (data-driven testing) ────────────────────────────
    ...variableActions, // variable list, add, update, delete
    // ── Group actions (TestRail 7.5+) ─────────────────────────────────────
    ...groupActions, // group get, list, add, update, delete
    // ── Dataset actions (data-driven testing) ─────────────────────────────
    ...datasetActions, // dataset get, list, add, update, delete
    // ── Configuration hierarchy (groups + leaf configs) ───────────────────
    ...configurationReadActions, // configuration list
    ...configurationGroupActions, // configuration-group add, update, delete
    ...configurationWriteActions, // configuration add, update, delete
    // ── Label actions (TestRail Labels API, 2025) ─────────────────────────
    ...labelActions, // label get, list, add, update, delete, delete-bulk
];

/** Look up the spec for a resource:action pair, or return undefined. */
export function getActionSpec(resource: string, action: string): ActionSpec | undefined {
    return ACTIONS.find((a) => a.resource === resource && a.action === action);
}

// ── Endpoint literal types ────────────────────────────────────────────────────

/** The `apiEndpoint` strings a group of actions declares. */
type EndpointsOf<T extends readonly { readonly apiEndpoint: string }[]> = T[number]['apiEndpoint'];

/**
 * Every endpoint the CLI surfaces, as a union of string literals.
 *
 * Built from the per-resource arrays rather than from `ACTIONS`, which is
 * annotated `readonly ActionSpec[]` for its consumers. Inferring a literal
 * tuple for all 134 entries instead made the compiler spell every entry's full
 * shape into `dist/cli/metadata.d.ts` — 2 KB to 105 KB — for a projection that
 * only ever needed the endpoint strings.
 *
 * Only resolves to literals while every per-resource array is written
 * `as const satisfies readonly ActionSpec[]`. Annotating any one of them
 * `: readonly ActionSpec[]` widens this to plain `string` — see the guard
 * below, which exists for exactly that reason.
 */
export type ActionEndpoint =
    | EndpointsOf<typeof projectReadActions>
    | EndpointsOf<typeof projectWriteActions>
    | EndpointsOf<typeof suiteReadActions>
    | EndpointsOf<typeof suiteWriteActions>
    | EndpointsOf<typeof caseReadActions>
    | EndpointsOf<typeof caseWriteActions>
    | EndpointsOf<typeof runReadActions>
    | EndpointsOf<typeof runWriteActions>
    | EndpointsOf<typeof testReadActions>
    | EndpointsOf<typeof testWriteActions>
    | EndpointsOf<typeof resultReadActions>
    | EndpointsOf<typeof resultWriteActions>
    | EndpointsOf<typeof milestoneReadActions>
    | EndpointsOf<typeof milestoneWriteActions>
    | EndpointsOf<typeof userReadActions>
    | EndpointsOf<typeof userWriteActions>
    | EndpointsOf<typeof planReadActions>
    | EndpointsOf<typeof planWriteActions>
    | EndpointsOf<typeof sectionReadActions>
    | EndpointsOf<typeof sectionWriteActions>
    | EndpointsOf<typeof sharedStepReadActions>
    | EndpointsOf<typeof sharedStepWriteActions>
    | EndpointsOf<typeof reportActions>
    | EndpointsOf<typeof caseStatusActions>
    | EndpointsOf<typeof caseFieldReadActions>
    | EndpointsOf<typeof caseFieldWriteActions>
    | EndpointsOf<typeof resultFieldActions>
    | EndpointsOf<typeof statusActions>
    | EndpointsOf<typeof templateActions>
    | EndpointsOf<typeof roleActions>
    | EndpointsOf<typeof priorityActions>
    | EndpointsOf<typeof caseTypeActions>
    | EndpointsOf<typeof attachmentReadActions>
    | EndpointsOf<typeof attachmentWriteActions>
    | EndpointsOf<typeof bddActions>
    | EndpointsOf<typeof variableActions>
    | EndpointsOf<typeof groupActions>
    | EndpointsOf<typeof datasetActions>
    | EndpointsOf<typeof configurationReadActions>
    | EndpointsOf<typeof configurationWriteActions>
    | EndpointsOf<typeof configurationGroupActions>
    | EndpointsOf<typeof labelActions>
    | EndpointsOf<typeof versionActions>
    | EndpointsOf<typeof dynamicFilterFieldActions>;

/** Compile-time assertion helper: `Assert<false>` is an error. */
type Assert<T extends true> = T;

/**
 * DO NOT DELETE THIS WITHOUT READING THIS COMMENT.
 *
 * This alias has no runtime effect and no consumers. Its only job is to be
 * inconvenient: it fails compilation the moment `ActionEndpoint` degrades from
 * a union of literals to `string`.
 *
 * That matters because a widened `ActionEndpoint` does not break anything
 * loudly — it makes `_PaginatedEndpointsAreSurfaced` in
 * `src/cli/metadata/paginated-endpoints.ts` pass while checking nothing
 * (`Exclude<X, string>` is `never` for every `X`). Deleting this line to
 * silence a merge conflict therefore disarms that assertion silently, which is
 * the failure mode this approach trades for gate E's printed error message.
 *
 * If this fires, the fix is to restore `as const satisfies readonly
 * ActionSpec[]` on whichever array in `src/cli/metadata/` lost it — never to
 * delete this.
 */
export type _ActionEndpointsAreLiterals = Assert<[string] extends [ActionEndpoint] ? false : true>;
