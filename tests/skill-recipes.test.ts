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

/** Slice the markdown subsection that begins at the heading containing
 *  `headingNeedle` and ends at the next `### ` heading (or end of file).
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
