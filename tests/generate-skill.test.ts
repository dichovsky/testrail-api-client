/**
 * Unit tests for the skill-generator helpers (scripts/skill-renderer.mjs).
 *
 * Focus is on the sentinel-replacement behavior (the part most likely to
 * drift) and a smoke check on the table renderer. The full integration
 * (script invocation + dist/ import) is exercised in CI by the
 * `skill:check` npm-script which runs `git diff --exit-code skill/SKILL.md`
 * after regeneration.
 */
import { describe, it, expect } from 'vitest';
// scripts/ is outside the typecheck rootDir (src/), so we import the
// JavaScript module directly. The tsconfig excludes tests/, so this is fine
// for the test build path.
// @ts-expect-error -- importing a .mjs script module not covered by tsc
import { renderCommandTable, replaceSection, schemaNameFor } from '../scripts/skill-renderer.mjs';

interface ActionFixture {
    resource: string;
    action: string;
    summary: string;
    pathParams: { name: string; description: string }[];
    isWrite: boolean;
    bodySchema?: unknown;
    fileInput?: boolean;
    fileOutput?: boolean;
    destructive?: boolean;
}

const READ_FIXTURE: ActionFixture = {
    resource: 'project',
    action: 'get',
    summary: 'Fetch a single project by ID',
    pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
    isWrite: false,
};

const WRITE_FIXTURE: ActionFixture = {
    resource: 'case',
    action: 'add',
    summary: 'Create a new test case under a section',
    pathParams: [{ name: 'section_id', description: 'Section to create the case under' }],
    isWrite: true,
    bodySchema: { _zod: { def: { shape: { title: {} } } } },
};

const NO_BODY_WRITE_FIXTURE: ActionFixture = {
    resource: 'run',
    action: 'close',
    summary: 'Close a test run (no body)',
    pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
    isWrite: true,
};

describe('renderCommandTable', () => {
    it('emits the markdown header and separator rows', () => {
        const out = renderCommandTable([READ_FIXTURE]) as string;
        expect(out).toContain('| Resource | Action | Path args | Body | Description |');
        expect(out).toContain('| --- | --- | --- | --- | --- |');
    });

    it('renders a read action with "—" for body and path arg in backticks', () => {
        const out = renderCommandTable([READ_FIXTURE]) as string;
        expect(out).toContain('| project | get | `<project_id>` | — |');
    });

    it('renders a write action with its schema name', () => {
        const out = renderCommandTable([WRITE_FIXTURE]) as string;
        expect(out).toContain('`AddCasePayloadSchema`');
    });

    it('renders a no-body write action with "— (no body)"', () => {
        const out = renderCommandTable([NO_BODY_WRITE_FIXTURE]) as string;
        expect(out).toContain('— (no body)');
    });

    it('emits "—" for actions with no path params', () => {
        const listFixture: ActionFixture = { ...READ_FIXTURE, action: 'list', pathParams: [] };
        const out = renderCommandTable([listFixture]) as string;
        expect(out).toContain('| project | list | — | — |');
    });

    it('renders a file-input action with `--file <path>` in the body column', () => {
        const fixture: ActionFixture = {
            resource: 'attachment',
            action: 'add-to-case',
            summary: 'Upload',
            pathParams: [{ name: 'case_id', description: 'id' }],
            isWrite: true,
            fileInput: true,
        };
        const out = renderCommandTable([fixture]) as string;
        expect(out).toContain('`--file <path>`');
    });

    it('renders a file-output action with `--out <path> (binary)` in the body column', () => {
        const fixture: ActionFixture = {
            resource: 'attachment',
            action: 'get',
            summary: 'Download',
            pathParams: [{ name: 'attachment_id', description: 'id' }],
            isWrite: false,
            fileOutput: true,
        };
        const out = renderCommandTable([fixture]) as string;
        expect(out).toContain('`--out <path>` (binary)');
    });

    it('renders a destructive no-body action with the --yes hint', () => {
        const fixture: ActionFixture = {
            resource: 'attachment',
            action: 'delete',
            summary: 'Delete',
            pathParams: [{ name: 'attachment_id', description: 'id' }],
            isWrite: true,
            destructive: true,
        };
        const out = renderCommandTable([fixture]) as string;
        expect(out).toContain('requires `--yes`');
    });
});

describe('schemaNameFor', () => {
    it('maps known write actions to their schema name', () => {
        expect(schemaNameFor({ resource: 'case', action: 'add' })).toBe('AddCasePayloadSchema');
        expect(schemaNameFor({ resource: 'result', action: 'add-bulk' })).toBe('AddResultsForCasesPayloadSchema');
        expect(schemaNameFor({ resource: 'result', action: 'add-bulk-by-test' })).toBe('AddResultsPayloadSchema');
        expect(schemaNameFor({ resource: 'plan', action: 'add' })).toBe('AddPlanPayloadSchema');
        expect(schemaNameFor({ resource: 'plan', action: 'update' })).toBe('UpdatePlanPayloadSchema');
        expect(schemaNameFor({ resource: 'plan', action: 'add-entry' })).toBe('AddPlanEntryPayloadSchema');
    });

    it('returns "(body)" for unmapped actions', () => {
        expect(schemaNameFor({ resource: 'webhook', action: 'fire' })).toBe('(body)');
    });

    // Drift guard: every ACTIONS entry that carries a bodySchema (i.e., the
    // skill generator will render a schema heading for it) must be in the
    // SCHEMA_NAMES map. Without this check, a contributor adding a write
    // action without updating skill-renderer.mjs would silently ship a skill
    // with "(body)" instead of the schema name (the regression Copilot
    // flagged on PR #60).
    it('covers every bodySchema-bearing ActionSpec in metadata.ts', async () => {
        const { ACTIONS } = await import('../src/cli/metadata.js');
        const missing = ACTIONS.filter((a) => a.bodySchema !== undefined).filter((a) => schemaNameFor(a) === '(body)');
        expect(
            missing,
            `Add schema-name entries in scripts/skill-renderer.mjs for: ${missing
                .map((a) => `${a.resource}:${a.action}`)
                .join(', ')}`,
        ).toEqual([]);
    });
});

describe('replaceSection', () => {
    const SAMPLE = `prefix
<!-- GENERATED:foo -->
OLD CONTENT
<!-- /GENERATED:foo -->
suffix`;

    it('replaces content between matching sentinels', () => {
        const result = replaceSection(SAMPLE, 'foo', 'NEW') as string;
        expect(result).toContain('NEW');
        expect(result).not.toContain('OLD CONTENT');
        expect(result).toContain('prefix');
        expect(result).toContain('suffix');
        expect(result).toContain('<!-- GENERATED:foo -->');
        expect(result).toContain('<!-- /GENERATED:foo -->');
    });

    it('is idempotent — replacing twice with the same value yields identical output', () => {
        const once = replaceSection(SAMPLE, 'foo', 'NEW') as string;
        const twice = replaceSection(once, 'foo', 'NEW') as string;
        expect(twice).toBe(once);
    });

    it('throws when the open sentinel is missing', () => {
        const content = 'just text with <!-- /GENERATED:foo --> only the close';
        expect(() => {
            replaceSection(content, 'foo', 'X');
        }).toThrow(/not found/);
    });

    it('throws when the close sentinel is missing', () => {
        const content = '<!-- GENERATED:foo --> only the open';
        expect(() => {
            replaceSection(content, 'foo', 'X');
        }).toThrow(/not found/);
    });

    it('throws when sentinels are in the wrong order', () => {
        const content = '<!-- /GENERATED:foo --> closer first\n<!-- GENERATED:foo -->';
        expect(() => {
            replaceSection(content, 'foo', 'X');
        }).toThrow(/wrong order/);
    });
});
