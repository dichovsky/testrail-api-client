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
// Ambient module typing for *.mjs test imports is provided by
// tests/skill-renderer-mjs.d.ts.
import {
    renderCommandTable,
    renderPayloadSchemaReference,
    renderPayloadSchemas,
    replaceSection,
    schemaNameFor,
} from '../scripts/skill-renderer.mjs';

interface ActionFixture {
    resource: string;
    action: string;
    summary: string;
    pathParams: { name: string; description: string }[];
    isWrite: boolean;
    bodySchema?: unknown;
    fileInput?: boolean;
    fileOutput?: boolean;
    outputKind?: 'binary' | 'text';
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
        expect(out).toContain('| Cmd | Mode | Args | Input |');
        expect(out).toContain('| --- | --- | --- | --- |');
    });

    it('renders a read action with compact mode and input labels', () => {
        const out = renderCommandTable([READ_FIXTURE]) as string;
        expect(out).toContain('| `project get` | R | <project_id> | - |');
    });

    it('renders a write action with mode W and its schema name', () => {
        const out = renderCommandTable([WRITE_FIXTURE]) as string;
        expect(out).toContain('| `case add` | W | <section_id> | AddCasePayloadSchema |');
    });

    it('renders a no-body write action as none input', () => {
        const out = renderCommandTable([NO_BODY_WRITE_FIXTURE]) as string;
        expect(out).toContain('| `run close` | W | <run_id> | none |');
    });

    it('emits "-" for actions with no path params', () => {
        const listFixture: ActionFixture = { ...READ_FIXTURE, action: 'list', pathParams: [] };
        const out = renderCommandTable([listFixture]) as string;
        expect(out).toContain('| `project list` | R | - | - |');
    });

    it('renders a file-input action as file input', () => {
        const fixture: ActionFixture = {
            resource: 'attachment',
            action: 'add-to-case',
            summary: 'Upload',
            pathParams: [{ name: 'case_id', description: 'id' }],
            isWrite: true,
            fileInput: true,
        };
        const out = renderCommandTable([fixture]) as string;
        expect(out).toContain('| `attachment add-to-case` | W | <case_id> | file |');
    });

    it('renders a file-output action as out:binary input', () => {
        const fixture: ActionFixture = {
            resource: 'attachment',
            action: 'get',
            summary: 'Download',
            pathParams: [{ name: 'attachment_id', description: 'id' }],
            isWrite: false,
            fileOutput: true,
        };
        const out = renderCommandTable([fixture]) as string;
        expect(out).toContain('| `attachment get` | R | <attachment_id> | out:binary |');
    });

    it('renders a text file-output action as out:text input', () => {
        const fixture: ActionFixture = {
            resource: 'bdd',
            action: 'get',
            summary: 'Download Gherkin',
            pathParams: [{ name: 'case_id', description: 'id' }],
            isWrite: false,
            fileOutput: true,
            outputKind: 'text',
        };
        const out = renderCommandTable([fixture]) as string;
        expect(out).toContain('| `bdd get` | R | <case_id> | out:text |');
    });

    it('defaults `outputKind` to binary when omitted (back-compat)', () => {
        const fixture: ActionFixture = {
            resource: 'attachment',
            action: 'get',
            summary: 'Download',
            pathParams: [{ name: 'attachment_id', description: 'id' }],
            isWrite: false,
            fileOutput: true,
        };
        const out = renderCommandTable([fixture]) as string;
        expect(out).toContain('out:binary');
        expect(out).not.toContain('out:text');
    });

    it('renders a destructive no-body action with mode D and none+yes input', () => {
        const fixture: ActionFixture = {
            resource: 'attachment',
            action: 'delete',
            summary: 'Delete',
            pathParams: [{ name: 'attachment_id', description: 'id' }],
            isWrite: true,
            destructive: true,
        };
        const out = renderCommandTable([fixture]) as string;
        expect(out).toContain('| `attachment delete` | D | <attachment_id> | none+yes |');
    });
});

describe('payload schema rendering', () => {
    it('renders a compact yaml index with reference anchors', () => {
        const out = renderPayloadSchemas([WRITE_FIXTURE]) as string;
        expect(out).toContain('```yaml');
        expect(out).toContain('schemas:');
        expect(out).toContain('s: AddCasePayloadSchema');
        expect(out).toContain('a: "case add"');
        expect(out).toContain('ref: "./reference/payload-schemas.yaml#addcasepayloadschema"');
    });

    it('renders a full reference yaml payload map', () => {
        const out = renderPayloadSchemaReference([WRITE_FIXTURE]) as string;
        expect(out).toContain('# Generated by scripts/generate-skill.js. Do not edit by hand.');
        expect(out).toContain('schemas:');
        expect(out).toContain('AddCasePayloadSchema:');
        expect(out).toContain('action: "case add"');
        expect(out).toContain('req:');
        expect(out).toContain('- "title:unknown"');
        expect(out).toContain('opt: []');
    });

    it('merges duplicate schema names into one reference entry', () => {
        const baseSchemaFixture: ActionFixture = {
            ...WRITE_FIXTURE,
            resource: 'result',
            action: 'add',
        };
        const duplicateSchemaFixture: ActionFixture = {
            ...WRITE_FIXTURE,
            resource: 'result',
            action: 'add-by-test',
        };
        const out = renderPayloadSchemaReference([baseSchemaFixture, duplicateSchemaFixture]) as string;
        expect(out.match(/AddResultPayloadSchema:/g)?.length).toBe(1);
        expect(out).toContain('action: ["result add", "result add-by-test"]');
    });
});

describe('schemaNameFor', () => {
    it('maps known write actions to their schema name', () => {
        expect(schemaNameFor({ resource: 'case', action: 'add' })).toBe('AddCasePayloadSchema');
        expect(schemaNameFor({ resource: 'result', action: 'add-bulk' })).toBe('AddResultsForCasesPayloadSchema');
        expect(schemaNameFor({ resource: 'result', action: 'add-bulk-by-test' })).toBe('AddResultsPayloadSchema');
        expect(schemaNameFor({ resource: 'result', action: 'add-by-test' })).toBe('AddResultPayloadSchema');
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
