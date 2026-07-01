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
    replaceFrontmatterVersion,
    replaceSection,
    schemaNameFor,
} from '../scripts/skill-renderer.js';

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
        const out = renderCommandTable([READ_FIXTURE]);
        expect(out).toContain('| Cmd | Mode | Args | Input |');
        expect(out).toContain('| --- | --- | --- | --- |');
    });

    it('renders a read action with compact mode and input labels', () => {
        const out = renderCommandTable([READ_FIXTURE]);
        expect(out).toContain('| `project get` | R | `<project_id>` | - |');
    });

    it('renders a write action with mode W and its schema name', () => {
        const out = renderCommandTable([WRITE_FIXTURE]);
        expect(out).toContain('| `case add` | W | `<section_id>` | AddCasePayloadSchema |');
    });

    it('renders a no-body write action as none input', () => {
        const out = renderCommandTable([NO_BODY_WRITE_FIXTURE]);
        expect(out).toContain('| `run close` | W | `<run_id>` | none |');
    });

    it('emits "-" for actions with no path params', () => {
        const listFixture: ActionFixture = { ...READ_FIXTURE, action: 'list', pathParams: [] };
        const out = renderCommandTable([listFixture]);
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
        const out = renderCommandTable([fixture]);
        expect(out).toContain('| `attachment add-to-case` | W | `<case_id>` | file |');
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
        const out = renderCommandTable([fixture]);
        expect(out).toContain('| `attachment get` | R | `<attachment_id>` | out:binary |');
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
        const out = renderCommandTable([fixture]);
        expect(out).toContain('| `bdd get` | R | `<case_id>` | out:text |');
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
        const out = renderCommandTable([fixture]);
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
        const out = renderCommandTable([fixture]);
        expect(out).toContain('| `attachment delete` | D | `<attachment_id>` | none+yes |');
    });
});

describe('payload schema rendering', () => {
    it('renders a compact yaml index with reference anchors', () => {
        const out = renderPayloadSchemas([WRITE_FIXTURE]);
        expect(out).toContain('```yaml');
        expect(out).toContain('schemas:');
        expect(out).toContain('s: AddCasePayloadSchema');
        expect(out).toContain('a: "case add"');
        expect(out).toContain('ref: "./reference/payload-schemas.yaml#addcasepayloadschema"');
    });

    it('renders a full reference yaml payload map', () => {
        const out = renderPayloadSchemaReference([WRITE_FIXTURE]);
        expect(out).toContain('# Generated by scripts/generate-skill.ts. Do not edit by hand.');
        expect(out).toContain('schemas:');
        expect(out).toContain('AddCasePayloadSchema:');
        expect(out).toContain('actions: ["case add"]');
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
        const out = renderPayloadSchemaReference([baseSchemaFixture, duplicateSchemaFixture]);
        expect(out.match(/AddResultPayloadSchema:/g)?.length).toBe(1);
        expect(out).toContain('actions: ["result add", "result add-by-test"]');
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
        const result = replaceSection(SAMPLE, 'foo', 'NEW');
        expect(result).toContain('NEW');
        expect(result).not.toContain('OLD CONTENT');
        expect(result).toContain('prefix');
        expect(result).toContain('suffix');
        expect(result).toContain('<!-- GENERATED:foo -->');
        expect(result).toContain('<!-- /GENERATED:foo -->');
    });

    it('is idempotent — replacing twice with the same value yields identical output', () => {
        const once = replaceSection(SAMPLE, 'foo', 'NEW');
        const twice = replaceSection(once, 'foo', 'NEW');
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

describe('replaceFrontmatterVersion', () => {
    const FRONTMATTER_SAMPLE = `---
name: testrail-cli
description: Some description
version: 2.1.0
license: MIT
homepage: https://example.com
---

# body
Some body content.
`;

    it('replaces the version value and leaves the rest of the content byte-identical', () => {
        const result = replaceFrontmatterVersion(FRONTMATTER_SAMPLE, '5.2.0');
        const expected = FRONTMATTER_SAMPLE.replace('version: 2.1.0', 'version: 5.2.0');
        expect(result).toBe(expected);
    });

    it('handles CRLF line endings without throwing and without introducing mixed EOLs', () => {
        // A Windows checkout without `core.autocrlf=input` configured can
        // produce CRLF line endings; delimiter/version-line matching must
        // tolerate a trailing \r, and the replaced line must keep its own
        // \r rather than silently becoming the only LF-only line in the file.
        const crlfSample = FRONTMATTER_SAMPLE.replace(/\n/g, '\r\n');
        const result = replaceFrontmatterVersion(crlfSample, '5.2.0');
        const expected = crlfSample.replace('version: 2.1.0\r', 'version: 5.2.0\r');
        expect(result).toBe(expected);
    });

    it('throws when the frontmatter delimiters are missing', () => {
        const content = 'name: testrail-cli\nversion: 2.1.0\n';
        expect(() => {
            replaceFrontmatterVersion(content, '5.2.0');
        }).toThrow(/delimiters/);
    });

    it('throws when only one frontmatter delimiter is present', () => {
        const content = '---\nname: testrail-cli\nversion: 2.1.0\n';
        expect(() => {
            replaceFrontmatterVersion(content, '5.2.0');
        }).toThrow(/delimiters/);
    });

    it('throws when the frontmatter delimiters are present but not at the start of the file', () => {
        const content = 'not frontmatter\n---\nname: testrail-cli\nversion: 2.1.0\n---\n\n# body\n';
        expect(() => {
            replaceFrontmatterVersion(content, '5.2.0');
        }).toThrow(/first line/);
    });

    it('throws when frontmatter is present but has no version line', () => {
        const content = '---\nname: testrail-cli\ndescription: no version here\n---\n\n# body\n';
        expect(() => {
            replaceFrontmatterVersion(content, '5.2.0');
        }).toThrow(/version/);
    });
});
