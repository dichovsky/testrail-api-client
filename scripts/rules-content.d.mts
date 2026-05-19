/**
 * Ambient type declarations for `scripts/rules-content.mjs`. Tests in
 * `tests/generate-rules.test.ts` import these renderers via the type-checked
 * code path; the runtime implementation lives in the `.mjs` so it can be
 * `node`-executed by the generator scripts without a build step.
 */

export interface RuleAction {
    readonly resource: string;
    readonly action: string;
    readonly isWrite?: boolean;
    readonly destructive?: boolean;
}

export function resourceList(actions: readonly RuleAction[]): string[];
export function renderRulesBody(actions: readonly RuleAction[]): string;
export function renderCursorMdc(actions: readonly RuleAction[]): string;
export function renderContinueRules(actions: readonly RuleAction[]): string;
export function renderAgentsMd(actions: readonly RuleAction[]): string;
