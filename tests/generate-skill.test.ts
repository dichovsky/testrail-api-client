/**
 * Unit tests for the skill-generator helpers (scripts/skill-renderer.ts).
 *
 * Focus is on the sentinel-replacement behavior (the part most likely to
 * drift), option-registry completeness, and table renderers. Check mode is
 * also invoked against the committed artifacts without writing them.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { CLI_OPTION_DOCUMENTATION, CLI_OPTIONS, type ActionSpecFlagName } from '../src/cli/flags.js';
import {
    findStaleSkillArtifacts,
    renderCliOptionReference,
    renderCommandTable,
    renderPayloadSchemaReference,
    renderPayloadSchemas,
    replaceFrontmatterVersion,
    replaceSection,
    schemaNameFor,
} from '../scripts/skill-renderer.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

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
    flags?: { name: ActionSpecFlagName; required?: boolean }[];
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

const BULK_WRITE_FIXTURE: ActionFixture = {
    resource: 'case',
    action: 'add-bulk',
    summary: 'Create multiple test cases under a section',
    pathParams: [{ name: 'section_id', description: 'Section to create the cases under' }],
    isWrite: true,
    bodySchema: z.array(
        z.object({
            title: z.string(),
            priority_id: z.number().optional(),
        }),
    ),
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

    it('renders required action flags from the ActionSpec in the args column', () => {
        const listFixture: ActionFixture = {
            ...READ_FIXTURE,
            resource: 'case',
            action: 'list',
            pathParams: [],
            flags: [{ name: 'project-id', required: true }, { name: 'run-id' }],
        };
        const out = renderCommandTable([listFixture]);
        expect(out).toContain('| `case list` | R | `--project-id <id>` | - |');
        expect(out).not.toContain('--run-id');
    });

    it('escapes pipes in required flag usages inside the command table', () => {
        const fixture: ActionFixture = {
            resource: 'attachment',
            action: 'add-to-case',
            summary: 'Upload',
            pathParams: [{ name: 'case_id', description: 'id' }],
            isWrite: true,
            fileInput: true,
            flags: [{ name: 'file', required: true }],
        };

        expect(renderCommandTable([fixture])).toContain(
            '| `attachment add-to-case` | W | `<case_id>` `--file <path\\|->` | file |',
        );
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

describe('CLI option documentation', () => {
    it('has exactly one documentation entry for every parser-recognized option', () => {
        expect(Object.keys(CLI_OPTION_DOCUMENTATION)).toEqual(Object.keys(CLI_OPTIONS));
    });

    it('tracks the TestRail 10.7 option additions and excludes the removed no-op flag', () => {
        expect(Object.keys(CLI_OPTION_DOCUMENTATION)).toEqual(
            expect.arrayContaining(['is-started', 'with-data', 'keep-in-cases', 'user-email']),
        );
        expect(CLI_OPTION_DOCUMENTATION).not.toHaveProperty('case-id');
    });

    it('documents a value placeholder for strings and none for boolean switches', () => {
        for (const [name, option] of Object.entries(CLI_OPTIONS)) {
            const documentation = CLI_OPTION_DOCUMENTATION[name as keyof typeof CLI_OPTION_DOCUMENTATION];
            if (option.type === 'string') {
                expect(documentation.value, `--${name} needs a value placeholder`).toMatch(/^<.+>$/);
            } else {
                expect(documentation.value, `--${name} is boolean and must not show a value`).toBeUndefined();
            }
        }
    });

    it('renders every live option into the agent-facing reference', () => {
        const out = renderCliOptionReference(CLI_OPTION_DOCUMENTATION);
        for (const name of Object.keys(CLI_OPTIONS)) {
            expect(out, `--${name} missing from option reference`).toContain(`\`--${name}`);
        }
    });

    it('escapes table separators and flattens newlines in registry text', () => {
        const out = renderCliOptionReference({
            format: {
                value: '<json|yaml>',
                scope: 'read|write',
                description: 'line one\nline two',
            },
        });
        expect(out).toContain('`--format <json\\|yaml>`');
        expect(out).toContain('| read\\|write | line one line two |');
    });

    it('keeps the committed generated option section in sync', () => {
        const committed = readFileSync(resolve(REPO_ROOT, 'skill/SKILL.md'), 'utf8');
        const expected = renderCliOptionReference(CLI_OPTION_DOCUMENTATION);
        expect(committed).toContain(
            `<!-- GENERATED:option-reference -->\n${expected}\n<!-- /GENERATED:option-reference -->`,
        );
    });

    it('check mode compares both committed artifacts without regenerating first', () => {
        const output = execFileSync(
            process.execPath,
            ['--import', 'tsx', resolve(REPO_ROOT, 'scripts/generate-skill.ts'), '--check'],
            { cwd: REPO_ROOT, encoding: 'utf8' },
        );
        expect(output).toContain('Skill artifacts are up to date.');

        const pkg = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
            scripts?: Record<string, string>;
        };
        expect(pkg.scripts?.['skill:check']).toBe('tsx scripts/generate-skill.ts --check');
    });
});

describe('skill artifact drift detection', () => {
    it('reports each stale or missing generated artifact independently', () => {
        expect(
            findStaleSkillArtifacts({
                committedSkill: 'old skill',
                generatedSkill: 'new skill',
                generatedPayloadReference: 'new payload',
            }),
        ).toEqual(['skill/SKILL.md', 'skill/reference/payload-schemas.yaml']);

        expect(
            findStaleSkillArtifacts({
                committedSkill: 'same',
                generatedSkill: 'same',
                committedPayloadReference: 'old payload',
                generatedPayloadReference: 'new payload',
            }),
        ).toEqual(['skill/reference/payload-schemas.yaml']);
    });

    it('returns no paths only when both committed artifacts match', () => {
        expect(
            findStaleSkillArtifacts({
                committedSkill: 'skill',
                generatedSkill: 'skill',
                committedPayloadReference: 'payload',
                generatedPayloadReference: 'payload',
            }),
        ).toEqual([]);
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

    it('renders element fields for a top-level array payload in the compact index', () => {
        const out = renderPayloadSchemas([BULK_WRITE_FIXTURE]);
        expect(out).toContain('s: AddCasesBulkPayloadSchema');
        expect(out).toContain('container: array');
        expect(out).toContain('item_req: [title]');
        expect(out).toContain('item_opt: 1');
        expect(out).not.toContain(', req: [title]');
        expect(out).not.toContain('schema_shape_unavailable');
    });

    it('renders element fields for a top-level array payload in the reference map', () => {
        const out = renderPayloadSchemaReference([BULK_WRITE_FIXTURE]);
        expect(out).toContain('AddCasesBulkPayloadSchema:');
        expect(out).toContain('container: array');
        expect(out).toContain('item_req:');
        expect(out).toContain('item_opt:');
        expect(out).toContain('- "title:string"');
        expect(out).toContain('- "priority_id:number"');
        expect(out).not.toContain('schema_shape_unavailable');
    });

    it('preserves record value types for agent-facing payload guidance', () => {
        const datasetFixture: ActionFixture = {
            resource: 'dataset',
            action: 'add',
            summary: 'Create a dataset',
            pathParams: [{ name: 'project_id', description: 'project' }],
            isWrite: true,
            bodySchema: z.object({
                name: z.string(),
                variables: z.record(z.string(), z.string()).optional(),
            }),
        };
        expect(renderPayloadSchemaReference([datasetFixture])).toContain('- "variables:Record<string, string>"');
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
        expect(schemaNameFor({ resource: 'result', action: 'edit' })).toBe('EditResultPayloadSchema');
        expect(schemaNameFor({ resource: 'plan', action: 'add' })).toBe('AddPlanPayloadSchema');
        expect(schemaNameFor({ resource: 'plan', action: 'update' })).toBe('UpdatePlanPayloadSchema');
        expect(schemaNameFor({ resource: 'plan', action: 'add-entry' })).toBe('AddPlanEntryPayloadSchema');
        expect(schemaNameFor({ resource: 'label', action: 'add' })).toBe('AddLabelPayloadSchema');
        expect(schemaNameFor({ resource: 'label', action: 'delete-bulk' })).toBe('DeleteLabelsPayloadSchema');
    });

    it('returns "(body)" for unmapped actions', () => {
        expect(schemaNameFor({ resource: 'webhook', action: 'fire' })).toBe('(body)');
    });

    // Drift guard: every ACTIONS entry that carries a bodySchema (i.e., the
    // skill generator will render a schema heading for it) must be in the
    // SCHEMA_NAMES map. Without this check, a contributor adding a write
    // action without updating skill-renderer.ts would silently ship a skill
    // with "(body)" instead of the schema name (the regression Copilot
    // flagged on PR #60).
    it('covers every bodySchema-bearing ActionSpec in metadata.ts', async () => {
        const { ACTIONS } = await import('../src/cli/metadata.js');
        const missing = ACTIONS.filter((a) => a.bodySchema !== undefined).filter((a) => schemaNameFor(a) === '(body)');
        expect(
            missing,
            `Add schema-name entries in scripts/skill-renderer.ts for: ${missing
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
