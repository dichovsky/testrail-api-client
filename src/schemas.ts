/**
 * Re-exports all TestRail API Zod schemas and inferred payload types (barrel
 * file).
 *
 * The implementation is in per-domain modules under `src/schemas/`. This
 * file lets internal consumers continue to import from `'../schemas.js'`
 * without change after the PR-B split. The re-export order is important,
 * because of these dependencies:
 *
 * - `common.ts` defines the shared `zObject` helper.
 * - `metadata.ts` defines `LabelEmbeddedSchema`, which `cases.ts` uses.
 * - `runs.ts` defines `RunSchema`, which `plans.ts` uses.
 *
 * The re-exports below follow that order.
 */
export * from './schemas/common.js';
export * from './schemas/users.js';
export * from './schemas/projects.js';
export * from './schemas/suites.js';
export * from './schemas/metadata.js';
export * from './schemas/labels.js';
export * from './schemas/sections.js';
export * from './schemas/cases.js';
export * from './schemas/bdd.js';
export * from './schemas/runs.js';
export * from './schemas/plans.js';
export * from './schemas/tests.js';
export * from './schemas/results.js';
export * from './schemas/milestones.js';
export * from './schemas/configurations.js';
export * from './schemas/attachments.js';
export * from './schemas/sharedSteps.js';
export * from './schemas/variables.js';
export * from './schemas/datasets.js';
export * from './schemas/reports.js';
