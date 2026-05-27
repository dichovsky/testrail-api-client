/**
 * Tests for the agent-instruction generator: `AGENTS.md`. The renderer
 * uses `scripts/rules-content.mjs` so the tests cover both the pure
 * renderer and the committed output (drift gates run via the script at
 * `pretest` time).
 *
 * Focus: determinism (re-rendering the same input is byte-identical) and
 * structural invariants (agents.md self-references).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ACTIONS } from '../src/cli/metadata.js';
import { renderAgentsMd, resourceList } from '../scripts/rules-content.js';

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
    it('AGENTS.md matches generator output', () => {
        const committed = readFileSync(path.join(root, 'AGENTS.md'), 'utf-8');
        expect(committed).toBe(`${renderAgentsMd(ACTIONS)}\n`);
    });
});
