/**
 * Tests for the agent-instruction generators: `.cursor/rules/testrail.mdc`,
 * `.continue/rules/testrail.md`, and `AGENTS.md`. All three share
 * `scripts/rules-content.mjs` so the tests cover both the pure renderers
 * and the committed output (drift gates run via the scripts themselves at
 * `pretest` time).
 *
 * Focus: determinism (re-rendering the same input is byte-identical) and
 * structural invariants (frontmatter for cursor, no frontmatter for
 * continue, agents.md self-references).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ACTIONS } from '../src/cli/metadata.js';
import { renderAgentsMd, renderContinueRules, renderCursorMdc, resourceList } from '../scripts/rules-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

describe('resourceList', () => {
    it('preserves declaration order and dedupes', () => {
        const list = resourceList([
            { resource: 'a', action: 'get' },
            { resource: 'b', action: 'get' },
            { resource: 'a', action: 'list' },
            { resource: 'c', action: 'get' },
        ]);
        expect(list).toEqual(['a', 'b', 'c']);
    });

    it('returns an empty array for empty input', () => {
        expect(resourceList([])).toEqual([]);
    });
});

describe('renderCursorMdc', () => {
    it('emits valid Cursor .mdc frontmatter (description, globs, alwaysApply)', () => {
        const out = renderCursorMdc(ACTIONS);
        expect(out.startsWith('---\n')).toBe(true);
        expect(out).toContain('description:');
        expect(out).toContain('globs:');
        expect(out).toContain('alwaysApply:');
        // Body starts after the closing frontmatter delimiter.
        expect(out).toMatch(/---\n\n# TestRail API client/);
    });

    it('is deterministic (re-render of same input is byte-identical)', () => {
        expect(renderCursorMdc(ACTIONS)).toBe(renderCursorMdc(ACTIONS));
    });

    it('includes a line for every destructive action', () => {
        const out = renderCursorMdc(ACTIONS);
        for (const a of ACTIONS) {
            if (a.destructive === true) {
                expect(out).toContain(`\`${a.resource} ${a.action}\``);
            }
        }
    });
});

describe('renderContinueRules', () => {
    it('has no YAML frontmatter (Continue rules are plain markdown)', () => {
        const out = renderContinueRules(ACTIONS);
        expect(out.startsWith('---')).toBe(false);
        expect(out.startsWith('# TestRail API client')).toBe(true);
    });

    it('is deterministic', () => {
        expect(renderContinueRules(ACTIONS)).toBe(renderContinueRules(ACTIONS));
    });
});

describe('renderAgentsMd', () => {
    it('starts with the AGENTS.md heading and links to agents.md spec', () => {
        const out = renderAgentsMd(ACTIONS);
        expect(out.startsWith('# AGENTS.md')).toBe(true);
        expect(out).toContain('https://agents.md/');
    });

    it('includes the build/verify commands section with every npm script', () => {
        const out = renderAgentsMd(ACTIONS);
        for (const cmd of [
            'npm test',
            'npm run build',
            'npm run lint',
            'npm run codemap',
            'npm run skill',
            'npm run cursor-rules',
            'npm run continue-rules',
            'npm run agents-md',
        ]) {
            expect(out).toContain(cmd);
        }
    });

    it('is deterministic', () => {
        expect(renderAgentsMd(ACTIONS)).toBe(renderAgentsMd(ACTIONS));
    });
});

describe('committed artifacts match generator output', () => {
    // These tests replicate the `--check` drift gates inside the test
    // runner, so a failure surfaces alongside the relevant unit tests
    // instead of only from `npm run pretest`.
    it('.cursor/rules/testrail.mdc matches generator output', () => {
        const committed = readFileSync(path.join(root, '.cursor', 'rules', 'testrail.mdc'), 'utf-8');
        expect(committed).toBe(`${renderCursorMdc(ACTIONS)}\n`);
    });

    it('.continue/rules/testrail.md matches generator output', () => {
        const committed = readFileSync(path.join(root, '.continue', 'rules', 'testrail.md'), 'utf-8');
        expect(committed).toBe(`${renderContinueRules(ACTIONS)}\n`);
    });

    it('AGENTS.md matches generator output', () => {
        const committed = readFileSync(path.join(root, 'AGENTS.md'), 'utf-8');
        expect(committed).toBe(`${renderAgentsMd(ACTIONS)}\n`);
    });
});
