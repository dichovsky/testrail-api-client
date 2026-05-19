/**
 * Snapshot tests for hand-written recipes in `skill/SKILL.md`.
 *
 * The generator only rewrites the sentinel-delimited
 * `<!-- GENERATED:* -->` regions; hand-written recipes (with
 * `<!-- recipe-for: ... -->` tags) live in prose. These tests pin the
 * recipe code blocks and tag bindings so an accidental rename of a CLI
 * command or a copy-paste during a future recipe edit shows up as a diff
 * rather than a silent drift past gate C2 (which only checks that every
 * tagged `resource:action` exists in ACTIONS, not that the recipe content
 * itself is still accurate).
 *
 * If you intentionally rewrite a recipe, update the snapshot with
 * `vitest -u`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = join(HERE, '..', 'skill', 'SKILL.md');

/** Slice the markdown subsection starting at the first occurrence of
 *  `headingNeedle` (which is expected to fall inside an `### ` heading)
 *  and ending at the next `### ` heading; if none follows, falls back to
 *  the next `## ` heading; if neither is found, runs to end of file.
 *  Pure substring search — no regex DSL — so changes to surrounding markup
 *  don't accidentally widen the slice. */
function extractSection(md: string, headingNeedle: string): string {
    const start = md.indexOf(headingNeedle);
    if (start === -1) throw new Error(`Heading not found: ${headingNeedle}`);
    const after = md.indexOf('\n### ', start + headingNeedle.length);
    const end = after === -1 ? md.indexOf('\n## ', start + headingNeedle.length) : after;
    return md.slice(start, end === -1 ? undefined : end).trimEnd();
}

describe('skill/SKILL.md — Results pipeline recipe', () => {
    const md = readFileSync(SKILL_PATH, 'utf-8');

    it('binds the recipe to result:list-for-test via recipe-for tag', () => {
        const section = extractSection(md, 'Results pipeline');
        expect(section).toContain('<!-- recipe-for: result:list-for-test -->');
    });

    it('binds the recipe to result:list-for-case via recipe-for tag', () => {
        const section = extractSection(md, 'Results pipeline');
        expect(section).toContain('<!-- recipe-for: result:list-for-case -->');
    });

    it('matches the pinned snapshot for the per-test invocation example', () => {
        const section = extractSection(md, 'Results pipeline');
        // Pin the exact one-liner so renaming the flag or the command
        // surfaces as a diff. The 4242 / status-id sample is the canonical
        // happy-path example in the prose.
        expect(section).toContain('testrail result list-for-test 4242 --limit 50 --status-id 1,5');
    });

    it('matches the pinned snapshot for the per-case-in-run invocation example', () => {
        const section = extractSection(md, 'Results pipeline');
        expect(section).toContain(
            'testrail result list-for-case 100 87 --limit 1 --status-id 5 --defects-filter JIRA-1234',
        );
    });

    it('matches the pinned snapshot for the whole-run fallback example', () => {
        const section = extractSection(md, 'Results pipeline');
        expect(section).toContain('testrail result list --run-id 100 --limit 100 --offset 0');
    });

    it('enumerates the 4-option decision tree', () => {
        const section = extractSection(md, 'Results pipeline');
        // Decision tree headings (numbered) — all four bullets must be present
        // so a future copy-paste that drops one surfaces as a failure.
        expect(section).toMatch(/1\.\s+\*\*You have a `test_id`\*\*/);
        expect(section).toMatch(/2\.\s+\*\*You have a `run_id` and `case_id` but no `test_id`\*\*/);
        expect(section).toMatch(/3\.\s+\*\*You want every result in the run\*\*/);
        expect(section).toMatch(/4\.\s+\*\*You're writing, not reading\*\*/);
    });
});

describe('skill/SKILL.md — Plan entries lifecycle recipe', () => {
    const md = readFileSync(SKILL_PATH, 'utf-8');

    // gate C2 (`npm run mapping:check`) already enforces that the tags
    // resolve to ActionSpec entries, but it does NOT enforce that the
    // four tags stay grouped under the same heading — if someone splits
    // them across separate recipes the binding semantics change without
    // gate C2 noticing. Pin the grouping explicitly.
    it('groups all four plan destructive recipe-for tags under the same heading', () => {
        const section = extractSection(md, 'Plan entries lifecycle');
        expect(section).toContain('<!-- recipe-for: plan:close -->');
        expect(section).toContain('<!-- recipe-for: plan:delete -->');
        expect(section).toContain('<!-- recipe-for: plan:delete-entry -->');
        expect(section).toContain('<!-- recipe-for: plan:delete-run-from-entry -->');
    });

    it('pins the cascade-order narration (run → entry → plan)', () => {
        const section = extractSection(md, 'Plan entries lifecycle');
        expect(section).toContain('cascade order (run → entry → plan)');
    });

    it('pins the delete-cascade example commands in order', () => {
        const section = extractSection(md, 'Plan entries lifecycle');
        // Order matters: narrowest first, widest last. Snapshot the three
        // canonical command lines so a re-order surfaces as a diff.
        expect(section).toContain('testrail plan delete-run-from-entry "$NEW_RUN_ID" --yes');
        expect(section).toContain('testrail plan delete-entry "$PLAN_ID" "$ENTRY_ID" --yes');
        expect(section).toContain('testrail plan close "$PLAN_ID" --yes');
        // delete preview-then-commit dyad
        expect(section).toContain('testrail plan delete "$PLAN_ID" --yes --dry-run');
    });

    it('warns that close is irreversible (no open_plan) and delete has no --soft', () => {
        const section = extractSection(md, 'Plan entries lifecycle');
        expect(section).toContain('irreversible');
        expect(section).toContain('open_plan');
        expect(section).toContain('does NOT support');
    });
});

describe('skill/SKILL.md — Bulk case delete recipe', () => {
    const md = readFileSync(SKILL_PATH, 'utf-8');

    it('binds the recipe to case:delete-bulk via recipe-for tag', () => {
        const section = extractSection(md, 'Bulk case delete');
        expect(section).toContain('<!-- recipe-for: case:delete-bulk -->');
    });

    it('documents the three independent safety layers (dry-run, soft, yes)', () => {
        const section = extractSection(md, 'Bulk case delete');
        // The safety-layer table is the load-bearing reference. Pin each row's
        // first column so a relabel (e.g. dropping `--soft` to a footnote)
        // surfaces as a diff rather than silently weakening the recipe.
        expect(section).toContain('`--dry-run`');
        expect(section).toContain('`--soft`');
        expect(section).toContain('`--yes`');
        // Side classification — client vs server — is the key insight.
        expect(section).toContain('client');
        expect(section).toContain('server');
    });

    it('pins the recommended preview-then-commit workflow commands', () => {
        const section = extractSection(md, 'Bulk case delete');
        // The two-step workflow is the headline takeaway. Snapshot both
        // canonical invocations so a future rewrite that drops the
        // server-side preview step shows up as a diff. Case IDs are
        // passed via --data '{"case_ids":[…]}'; there is no --case-ids
        // flag (the CLI rejects unknown flags).
        expect(section).toContain('--soft --yes \\\n    --data \'{"case_ids":[101,102,103]}\'');
        expect(section).toContain('--yes \\\n    --data \'{"case_ids":[101,102,103]}\'');
    });

    it('documents the flag-interaction matrix: dry-run wins, soft preview, real delete', () => {
        const section = extractSection(md, 'Bulk case delete');
        // (a) --dry-run --yes --soft → no API call, preview marker
        expect(section).toContain('--yes --dry-run --soft');
        // (b) --soft --yes (no --dry-run) → server preview, deleted: false
        expect(section).toContain('"deleted": false');
        // (c) --yes (real delete) → deleted: true
        expect(section).toContain('"deleted": true');
        // (d) no --yes → exit 1 with the destructive-gate message
        expect(section).toContain('Destructive action; pass --yes to confirm.');
    });

    it('warns that there is no client-side recovery, points to TestRail audit log', () => {
        const section = extractSection(md, 'Bulk case delete');
        expect(section).toContain('No client-side recovery');
        expect(section).toContain('audit log');
    });

    it('mentions CI/automation usage and recommends soft as the rehearsal step', () => {
        const section = extractSection(md, 'Bulk case delete');
        expect(section).toContain('CI/automation');
        expect(section).toContain('rehearsal');
    });
});

describe('skill/SKILL.md — Configuration groups & configs hierarchy recipe', () => {
    const md = readFileSync(SKILL_PATH, 'utf-8');

    // gate C2 already enforces that the tags resolve to ActionSpec entries,
    // but it does NOT enforce that all five tags stay grouped under the
    // same heading. Splitting them across separate recipes would change
    // binding semantics without gate C2 noticing. Pin the grouping
    // explicitly (mirrors the Plan entries lifecycle recipe pattern).
    it('groups all five configuration recipe-for tags under the same heading', () => {
        const section = extractSection(md, 'Configuration groups & configs hierarchy');
        expect(section).toContain('<!-- recipe-for: configuration:list -->');
        expect(section).toContain('<!-- recipe-for: configuration-group:add -->');
        expect(section).toContain('<!-- recipe-for: configuration-group:delete -->');
        expect(section).toContain('<!-- recipe-for: configuration:add -->');
        expect(section).toContain('<!-- recipe-for: configuration:delete -->');
    });

    it('pins the two-level hierarchy narration (project → groups → configs)', () => {
        const section = extractSection(md, 'Configuration groups & configs hierarchy');
        // The ASCII tree is the load-bearing diagram; pinning the parent
        // and the leaf node names surfaces any reorder of the explanation.
        expect(section).toContain('config_group');
        expect(section).toContain('config (leaf)');
    });

    it('pins the lifecycle commands in walkthrough order', () => {
        const section = extractSection(md, 'Configuration groups & configs hierarchy');
        // Order: create group → add configs → list → update config →
        // update group → delete config → delete group. A reorder would
        // change the "parent-after-child" cascade semantics the recipe
        // is teaching.
        expect(section).toContain('testrail configuration-group add 5');
        expect(section).toContain('testrail configuration add "$GROUP_ID"');
        expect(section).toContain('testrail configuration list 5');
        expect(section).toContain('testrail configuration update "$CHROME_ID"');
        expect(section).toContain('testrail configuration-group update "$GROUP_ID"');
        expect(section).toContain('testrail configuration delete "$FIREFOX_ID" --yes');
        expect(section).toContain('testrail configuration-group delete "$GROUP_ID" --yes');
    });

    it('warns that both deletes are destructive with no --soft preview', () => {
        const section = extractSection(md, 'Configuration groups & configs hierarchy');
        expect(section).toContain('destructive');
        expect(section).toContain('does NOT support `soft=1`');
    });
});

describe('skill/SKILL.md — Shared step propagation + history audit recipe', () => {
    const md = readFileSync(SKILL_PATH, 'utf-8');

    // gate C2 already enforces that the tags resolve to ActionSpec entries,
    // but it does NOT enforce that all four tags stay grouped under the
    // same heading. Splitting them across separate recipes would change
    // binding semantics without gate C2 noticing. Pin the grouping
    // explicitly (mirrors the Plan entries lifecycle and Configuration
    // hierarchy recipe patterns).
    it('groups all four shared-step recipe-for tags under the same heading', () => {
        const section = extractSection(md, 'Shared step propagation + history audit');
        expect(section).toContain('<!-- recipe-for: shared-step:add -->');
        expect(section).toContain('<!-- recipe-for: shared-step:update -->');
        expect(section).toContain('<!-- recipe-for: shared-step:delete -->');
        expect(section).toContain('<!-- recipe-for: shared-step:history -->');
    });

    it('pins the propagation-is-server-side narration (load-bearing insight)', () => {
        const section = extractSection(md, 'Shared step propagation + history audit');
        // The headline takeaway: a single update fan-outs to every case
        // that references the step. If a rewrite weakens this language,
        // future agents lose the blast-radius warning.
        expect(section).toContain('every case that references it');
        expect(section).toContain('Propagation is immediate and server-side');
    });

    it('pins the lifecycle commands in walkthrough order', () => {
        const section = extractSection(md, 'Shared step propagation + history audit');
        // Order: add (project-scoped) → reference from case → history
        // (pre-mutation audit) → update → history (post-mutation verify)
        // → delete (--dry-run preview, then --yes commit). A reorder
        // would change the "audit-before-mutate" cascade the recipe is
        // teaching.
        expect(section).toContain('testrail shared-step add 5 --data');
        expect(section).toContain('testrail case add "$SECTION_ID" --data');
        expect(section).toContain('testrail shared-step history "$SHARED_STEP_ID" --limit 50');
        expect(section).toContain('testrail shared-step update "$SHARED_STEP_ID" --data');
        expect(section).toContain('testrail shared-step history "$SHARED_STEP_ID" --limit 1');
        expect(section).toContain('testrail shared-step delete "$SHARED_STEP_ID" --yes --dry-run');
        expect(section).toContain('testrail shared-step delete "$SHARED_STEP_ID" --yes');
    });

    it('pins the case-side shared_step_id reference shape', () => {
        const section = extractSection(md, 'Shared step propagation + history audit');
        // The reference contract — a step entry with `shared_step_id`
        // inside a case's `custom_steps_separated` — is the only way
        // the propagation graph gets built. Pin both the JSON key and
        // the prose claim so a future rewrite that drops the example
        // surfaces as a diff.
        expect(section).toContain('custom_steps_separated');
        expect(section).toContain('shared_step_id');
        expect(section).toContain('{\\"shared_step_id\\": $SHARED_STEP_ID}');
    });

    it('warns that delete does NOT cascade to referencing test cases', () => {
        const section = extractSection(md, 'Shared step propagation + history audit');
        // The cascade-semantics clarification (cases lose the reference
        // but the case row survives) is the critical safety note —
        // pin both halves so a future rewrite cannot accidentally
        // imply the cases get deleted.
        expect(section).toContain('Delete does NOT cascade');
        expect(section).toContain('not** deleted');
        expect(section).toContain('lose the reference');
    });

    it('warns that delete is destructive with --yes gate and no --soft preview', () => {
        const section = extractSection(md, 'Shared step propagation + history audit');
        // Mirrors milestone/plan delete safety pattern. Pin the three
        // load-bearing claims: --yes gates, no upstream --soft,
        // --dry-run wins over --yes.
        expect(section).toContain('gated by `--yes`');
        expect(section).toContain('no `--soft` server-side preview');
        expect(section).toContain('`--dry-run` wins');
        expect(section).toContain('over `--yes`');
    });

    it('recommends history audit before any update or delete', () => {
        const section = extractSection(md, 'Shared step propagation + history audit');
        expect(section).toContain('Audit BEFORE you mutate');
        expect(section).toContain('Audit before every mutation');
        expect(section).toContain('blast radius');
    });

    it('documents that there is no bulk reference lookup upstream', () => {
        const section = extractSection(md, 'Shared step propagation + history audit');
        // Important "TestRail does not give you this" gotcha so agents
        // do not waste budget hunting for an endpoint that does not
        // exist. The jq-walk workaround is the only way.
        expect(section).toContain('No bulk reference lookup upstream');
        expect(section).toContain('case list');
    });
});
