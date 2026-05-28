/**
 * Barrel re-export of every TestRail API Zod schema and inferred payload type.
 *
 * The implementation lives in per-domain modules under `src/schemas/`. This
 * file exists so internal consumers can continue to import from
 * `'../schemas.js'` unchanged after the PR-B split. Dependency order matters:
 * `common.ts` defines the shared `zObject` helper, `metadata.ts` defines
 * `LabelEmbeddedSchema` (consumed by `cases.ts`), and `runs.ts` defines
 * `RunSchema` (consumed by `plans.ts`). Re-exports below follow that order.
 */
export * from './schemas/common.js';
export * from './schemas/users.js';
export * from './schemas/projects.js';
export * from './schemas/suites.js';
export * from './schemas/metadata.js';
export * from './schemas/sections.js';
export * from './schemas/cases.js';
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
