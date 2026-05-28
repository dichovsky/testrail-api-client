/**
 * Unit coverage for defensive branches that were previously only reachable
 * through whole-program paths (and so went uncovered once the write-handler
 * factory shrank the handler surface). These tests exercise them directly —
 * no coverage-ignore comments.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { actionArgvHint, renderSection } from '../src/cli/help.js';
import type { ActionSpec } from '../src/cli/metadata/types.js';
import { resolveBody } from '../src/cli/body.js';

const noopHandler = async (): Promise<void> => {};

function spec(overrides: Partial<ActionSpec>): ActionSpec {
    return {
        resource: 'thing',
        action: 'add',
        summary: 'Add a thing',
        pathParams: [],
        apiEndpoint: 'POST add_thing',
        isWrite: true,
        handler: noopHandler,
        ...overrides,
    };
}

describe('help.actionArgvHint', () => {
    it('falls back to the generic body hint when a body action has no helpExample', () => {
        const hint = actionArgvHint(spec({ bodySchema: z.object({ name: z.string() }) }));
        expect(hint).toBe("--data '{...}' | --data-file <path> | stdin");
    });

    it('prefers an explicit helpExample over the generic hint', () => {
        const hint = actionArgvHint(
            spec({ bodySchema: z.object({ name: z.string() }), helpExample: '--data \'{"name":"x"}\'' }),
        );
        expect(hint).toBe('--data \'{"name":"x"}\'');
    });

    it('emits the destructive note for a no-body destructive action carrying a helpExample', () => {
        const hint = actionArgvHint(
            spec({
                action: 'delete',
                isWrite: true,
                destructive: true,
                helpExample: '(no body; --soft NOT supported)',
            }),
        );
        expect(hint).toBe('--yes (no body; --soft NOT supported)');
    });
});

describe('help.renderSection', () => {
    it('returns an empty string when no action matches the predicate', () => {
        expect(renderSection('Nonexistent:', () => false)).toBe('');
    });

    it('renders a titled block when at least one action matches', () => {
        const out = renderSection('Projects:', (s) => s.resource === 'project' && s.action === 'get');
        expect(out.startsWith('Projects:\n')).toBe(true);
        expect(out).toContain('project');
    });
});

describe('resolveBody error paths', () => {
    it('reports a read failure for a --data-file that does not exist', () => {
        const result = resolveBody(
            { dataFileFlag: '/nonexistent/does-not-exist-xyz.json' },
            z.object({}).passthrough(),
        );
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toMatch(/Cannot read --data-file/);
    });

    it('reports invalid JSON from --data', () => {
        const result = resolveBody({ dataFlag: 'this is not json' }, z.object({}).passthrough());
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toMatch(/Invalid JSON/);
    });
});
