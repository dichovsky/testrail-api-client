/**
 * Unit tests for the mapping-generator helpers (scripts/mapping-renderer.mjs).
 *
 * The pure helpers (schema validation, path normalization, CLI heuristic,
 * cell renderers, document assembly) are exercised here. The full integration
 * (script invocation + AST crawl + filesystem) is covered by the
 * `npm run mapping` smoke run in CI; once Phase 2 lands, `mapping:check` will
 * gate drift between source and generated output.
 */
import { describe, expect, it } from 'vitest';
// scripts/ is outside the tsconfig include for src/; the .mjs has no .d.ts.
// Single-line import so the @ts-expect-error directive applies to the line
// that emits TS7016 (the import statement itself).
// @ts-expect-error -- importing a .mjs script module not covered by tsc
import * as renderer from '../scripts/mapping-renderer.mjs';

const {
    EndpointsArraySchema,
    EndpointSchema,
    guessCliCommand,
    normalizePathForMatch,
    renderClientCell,
    renderCliCell,
    renderDocument,
    renderEndpointCell,
    renderResourceSection,
    renderSkillCell,
    renderSummaryTable,
} = renderer as {
    EndpointsArraySchema: {
        safeParse: (input: unknown) => { success: boolean; error?: { issues: { message: string }[] }; data?: unknown };
        parse: (input: unknown) => unknown;
    };
    EndpointSchema: { parse: (input: unknown) => unknown };
    guessCliCommand: (op: string, set: Set<string>) => string | null;
    normalizePathForMatch: (raw: string) => string;
    renderClientCell: (
        match: { moduleFile: string; methodName: string; line: number } | null,
        rootPrefix: string,
    ) => string;
    renderCliCell: (cliKey: string | null) => string;
    renderDocument: (grouped: { resource: string; rows: unknown[] }[], rootPrefix: string) => string;
    renderEndpointCell: (ep: { method: string; path: string; docUrl?: string }) => string;
    renderResourceSection: (resource: string, rows: unknown[], rootPrefix: string) => string;
    renderSkillCell: (cliKey: string | null) => string;
    renderSummaryTable: (grouped: { resource: string; rows: { match: unknown; cliKey: unknown }[] }[]) => string;
};

describe('EndpointSchema', () => {
    const VALID = {
        resource: 'Cases',
        operation: 'get_case',
        method: 'GET',
        path: 'get_case/{case_id}',
        summary: 'Fetch a case.',
    };

    it('accepts a well-formed entry', () => {
        expect(() => EndpointSchema.parse(VALID)).not.toThrow();
    });

    it('accepts an optional docUrl when valid', () => {
        expect(() => EndpointSchema.parse({ ...VALID, docUrl: 'https://example.com/docs' })).not.toThrow();
    });

    it('rejects non-GET-or-POST methods', () => {
        expect(() => EndpointSchema.parse({ ...VALID, method: 'PUT' })).toThrow();
        expect(() => EndpointSchema.parse({ ...VALID, method: 'DELETE' })).toThrow();
    });

    it('rejects camelCase operation names', () => {
        expect(() => EndpointSchema.parse({ ...VALID, operation: 'getCase' })).toThrow();
    });

    it('rejects paths with leading slash or non-snake-case params', () => {
        expect(() => EndpointSchema.parse({ ...VALID, path: '/get_case/{case_id}' })).toThrow();
        expect(() => EndpointSchema.parse({ ...VALID, path: 'get_case/{caseId}' })).toThrow();
    });

    it('rejects empty resource and summary', () => {
        expect(() => EndpointSchema.parse({ ...VALID, resource: '' })).toThrow();
        expect(() => EndpointSchema.parse({ ...VALID, summary: '' })).toThrow();
    });

    it('rejects malformed docUrl', () => {
        expect(() => EndpointSchema.parse({ ...VALID, docUrl: 'not-a-url' })).toThrow();
    });
});

describe('EndpointsArraySchema', () => {
    const make = (path: string, operation = 'op') => ({
        resource: 'Cases',
        operation,
        method: 'GET' as const,
        path,
        summary: 'x',
    });

    it('rejects duplicate (method, path) pairs', () => {
        const dup = [make('get_case/{case_id}'), make('get_case/{case_id}', 'op2')];
        const result = EndpointsArraySchema.safeParse(dup);
        expect(result.success).toBe(false);
        if (!result.success && result.error) {
            const dupIssue = result.error.issues.find((i: { message: string }) => /Duplicate endpoint/.test(i.message));
            expect(dupIssue).toBeDefined();
        }
    });

    it('accepts distinct paths under the same resource', () => {
        const items = [make('get_case/{case_id}', 'get_case'), make('get_cases/{project_id}', 'get_cases')];
        expect(() => EndpointsArraySchema.parse(items)).not.toThrow();
    });
});

describe('normalizePathForMatch', () => {
    it('collapses ${expr} placeholders to {}', () => {
        expect(normalizePathForMatch('get_case/${caseId}')).toBe('get_case/{}');
    });

    it('collapses {name} placeholders to {}', () => {
        expect(normalizePathForMatch('get_case/{case_id}')).toBe('get_case/{}');
    });

    it('treats ${expr} and {name} as the same shape (so TS source and JSON match)', () => {
        expect(normalizePathForMatch('delete_plan_entry/${planId}/${entryId}')).toBe(
            normalizePathForMatch('delete_plan_entry/{plan_id}/{entry_id}'),
        );
    });

    it('strips TestRail query suffixes after &', () => {
        expect(normalizePathForMatch('get_users&project_id=${pid}')).toBe('get_users');
        expect(normalizePathForMatch('get_user_by_email&email=foo@bar')).toBe('get_user_by_email');
    });

    it('handles paths with no placeholders or query strings', () => {
        expect(normalizePathForMatch('get_statuses')).toBe('get_statuses');
    });
});

describe('guessCliCommand', () => {
    const set = new Set(['case:get', 'case:list', 'attachment:add-to-case', 'project:add']);

    it('returns the resource:action key when the heuristic map matches AND the CLI exposes it', () => {
        expect(guessCliCommand('get_case', set)).toBe('case:get');
        expect(guessCliCommand('add_attachment_to_case', set)).toBe('attachment:add-to-case');
    });

    it('returns null when the heuristic map matches but the CLI does not expose it', () => {
        expect(guessCliCommand('delete_case', set)).toBeNull();
    });

    it('returns null for operations not in the heuristic map at all', () => {
        expect(guessCliCommand('get_statuses', set)).toBeNull();
        expect(guessCliCommand('made_up_op', set)).toBeNull();
    });
});

describe('cell renderers', () => {
    const endpointWithDoc = {
        method: 'GET',
        path: 'get_case/{case_id}',
        docUrl: 'https://example.com/cases',
    };
    const endpointWithoutDoc = { method: 'GET', path: 'get_case/{case_id}' };

    it('renders the endpoint cell with the supplied docUrl when present', () => {
        const cell = renderEndpointCell(endpointWithDoc);
        expect(cell).toBe('[`GET get_case/{case_id}`](https://example.com/cases)');
    });

    it('falls back to the canonical API-reference URL when docUrl is absent', () => {
        const cell = renderEndpointCell(endpointWithoutDoc);
        expect(cell).toMatch(/^\[`GET get_case\/\{case_id\}`\]\(https:\/\/support\.testrail\.com\//);
    });

    it('renders client cell as a relative-link with #L<line> when matched', () => {
        const match = { moduleFile: '/repo/src/modules/cases.ts', methodName: 'getCase', line: 42 };
        expect(renderClientCell(match, '/repo/')).toBe('[`getCase`](src/modules/cases.ts#L42)');
    });

    it('renders client cell as em-dash when no match', () => {
        expect(renderClientCell(null, '/repo/')).toBe('—');
    });

    it('renders CLI cell with space (not colon) so the docs read like an invocation', () => {
        expect(renderCliCell('case:get')).toBe('`case get`');
        expect(renderCliCell(null)).toBe('—');
    });

    it('renders skill cell as command-table link when CLI is bound, em-dash otherwise', () => {
        expect(renderSkillCell('case:get')).toContain('skill/SKILL.md#command-surface');
        expect(renderSkillCell(null)).toBe('—');
    });
});

describe('aggregate renderers', () => {
    const grouped = [
        {
            resource: 'Cases',
            rows: [
                {
                    endpoint: {
                        resource: 'Cases',
                        operation: 'get_case',
                        method: 'GET',
                        path: 'get_case/{case_id}',
                        summary: 'Fetch a case.',
                    },
                    match: { moduleFile: '/repo/src/modules/cases.ts', methodName: 'getCase', line: 35 },
                    cliKey: 'case:get',
                },
                {
                    endpoint: {
                        resource: 'Cases',
                        operation: 'delete_case',
                        method: 'POST',
                        path: 'delete_case/{case_id}',
                        summary: 'Delete a case.',
                    },
                    match: null, // dynamic-endpoint case
                    cliKey: null,
                },
            ],
        },
    ];

    it('summary totals correctly count endpoints/client/CLI/skill', () => {
        const out = renderSummaryTable(grouped);
        // Cases row: 2 endpoints, 1 client-bound, 1 CLI-bound, 1 skill-bound
        expect(out).toContain('| [Cases](#cases) | 2 | 1 | 1 | 1 |');
        expect(out).toContain('| **Total** | **2** | **1** | **1** | **1** |');
    });

    it('resource section emits stable slug anchor', () => {
        const casesRows = grouped[0]?.rows ?? [];
        const out = renderResourceSection('Cases', casesRows, '/repo/');
        expect(out).toContain('## Cases');
        expect(out).toContain('<a id="cases"></a>');
    });

    it('resource section emits one table row per endpoint with em-dashes for gaps', () => {
        const casesRows = grouped[0]?.rows ?? [];
        const out = renderResourceSection('Cases', casesRows, '/repo/');
        expect(out).toContain('[`getCase`](src/modules/cases.ts#L35)');
        expect(out).toContain('`case get`');
        // Second row: client + CLI both missing → two em-dashes in the cells
        const secondRowLine = out.split('\n').find((l: string) => l.includes('delete_case/{case_id}'));
        expect(secondRowLine).toBeDefined();
        const cells = (secondRowLine ?? '').split('|').filter((cell: string) => cell.trim() === '—');
        expect(cells).toHaveLength(3);
    });

    it('document includes header, summary, and per-resource sections', () => {
        const out = renderDocument(grouped, '/repo/');
        expect(out).toContain('# TestRail API Mapping');
        expect(out).toContain('## Summary');
        expect(out).toContain('## Cases');
        expect(out).toContain('Generated by scripts/generate-mapping.js');
    });

    it('document output is deterministic (running twice produces identical bytes)', () => {
        const a = renderDocument(grouped, '/repo/');
        const b = renderDocument(grouped, '/repo/');
        expect(a).toBe(b);
    });

    it('multi-resource grouped output is sorted alphabetically by resource', () => {
        const casesRows = grouped[0]?.rows ?? [];
        const multi = [
            { resource: 'Suites', rows: casesRows },
            { resource: 'Cases', rows: casesRows },
        ];
        // renderDocument iterates in input order, but our generator sorts before passing in.
        // Test the contract by passing pre-sorted input and asserting Cases comes before Suites.
        const sorted = [...multi].sort((a, b) => a.resource.localeCompare(b.resource));
        const out = renderDocument(sorted, '/repo/');
        const casesIdx = out.indexOf('## Cases');
        const suitesIdx = out.indexOf('## Suites');
        expect(casesIdx).toBeGreaterThan(-1);
        expect(suitesIdx).toBeGreaterThan(casesIdx);
    });
});
