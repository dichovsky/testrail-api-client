/**
 * Unit tests for the mapping-generator helpers (scripts/mapping-renderer.ts).
 *
 * The pure helpers (schema validation, path normalization, tag parsing,
 * cell renderers, document assembly) are exercised here. The full integration
 * (script invocation + AST crawl + gates B/C + filesystem write/check) is
 * exercised in CI by the `Run API mapping drift check` step
 * (`.github/workflows/ci.yml`), which runs `npm run mapping:check` and fails
 * the build if the committed `docs/API-MAPPING.md` is out of date.
 */
import { describe, expect, it } from 'vitest';
import {
    EndpointsArraySchema,
    EndpointSchema,
    normalizePathForMatch,
    parseSkillRecipes,
    parseTestrailTag,
    renderClientCell,
    renderCliCell,
    renderDocument,
    renderEndpointCell,
    renderResourceSection,
    renderSkillCell,
    renderSummaryTable,
    slugifyHeading,
    validateGates,
    type ActionEntry,
    type CallSite,
    type GroupedResource,
    type SkillRecipe,
} from '../scripts/mapping-renderer.js';

type Recipe = SkillRecipe;
type RecipeMap = Map<string, Recipe>;

type EndpointEntry = { method: string; path: string };

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
        if (!result.success && result.error !== undefined) {
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
    it('preserves snake_case paths and placeholders unchanged', () => {
        expect(normalizePathForMatch('get_case/{case_id}')).toBe('get_case/{case_id}');
    });

    it('strips TestRail query suffixes after &', () => {
        expect(normalizePathForMatch('get_users&project_id=5')).toBe('get_users');
        expect(normalizePathForMatch('get_user_by_email&email=foo@bar')).toBe('get_user_by_email');
    });

    it('handles paths with no placeholders or query strings', () => {
        expect(normalizePathForMatch('get_statuses')).toBe('get_statuses');
    });

    it('is idempotent (applying twice yields the same result)', () => {
        const out = normalizePathForMatch('get_users&limit=10');
        expect(normalizePathForMatch(out)).toBe(out);
    });
});

describe('parseTestrailTag', () => {
    it('parses a GET tag with path params', () => {
        expect(parseTestrailTag('GET get_case/{case_id}')).toEqual({
            method: 'GET',
            path: 'get_case/{case_id}',
        });
    });

    it('parses a POST tag with multiple path params', () => {
        expect(parseTestrailTag('POST add_attachment_to_plan_entry/{plan_id}/{entry_id}')).toEqual({
            method: 'POST',
            path: 'add_attachment_to_plan_entry/{plan_id}/{entry_id}',
        });
    });

    it('parses a tag with no path params', () => {
        expect(parseTestrailTag('GET get_statuses')).toEqual({ method: 'GET', path: 'get_statuses' });
    });

    it('trims surrounding whitespace', () => {
        expect(parseTestrailTag('  POST add_case/{section_id}  ')).toEqual({
            method: 'POST',
            path: 'add_case/{section_id}',
        });
    });

    it('returns null for unsupported HTTP methods', () => {
        expect(parseTestrailTag('PUT update_case/{case_id}')).toBeNull();
        expect(parseTestrailTag('DELETE delete_case/{case_id}')).toBeNull();
    });

    it('returns null for malformed input (missing method, missing path, extra tokens)', () => {
        expect(parseTestrailTag('get_case/{case_id}')).toBeNull();
        expect(parseTestrailTag('GET')).toBeNull();
        expect(parseTestrailTag('GET get_case extra_token')).toBeNull();
        expect(parseTestrailTag('')).toBeNull();
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

    it('renders client cell with ../ prefix so links resolve from docs/ to repo root', () => {
        const match = { moduleFile: '/repo/src/modules/cases.ts', methodName: 'getCase', line: 42 };
        expect(renderClientCell(match, '/repo/')).toBe('[`getCase`](../src/modules/cases.ts#L42)');
    });

    it('renders client cell as em-dash when no match', () => {
        expect(renderClientCell(null, '/repo/')).toBe('—');
    });

    it('renders CLI cell with space (not colon) so the docs read like an invocation', () => {
        expect(renderCliCell('case:get')).toBe('`case get`');
        expect(renderCliCell(null)).toBe('—');
    });

    it('renders skill cell as command-table fallback when CLI is bound but no recipe tag exists', () => {
        expect(renderSkillCell('case:get')).toBe('[command-table](../skill/SKILL.md#command-surface)');
        expect(renderSkillCell('case:get', new Map())).toBe('[command-table](../skill/SKILL.md#command-surface)');
        expect(renderSkillCell(null)).toBe('—');
    });

    it('renders skill cell as a recipe link when the CLI key has a recipe-for tag', () => {
        const recipes: RecipeMap = new Map([
            ['case:get', { number: 5, title: 'Fetch a case', anchor: '5-fetch-a-case' }],
        ]);
        expect(renderSkillCell('case:get', recipes)).toBe('[recipe #5](../skill/SKILL.md#5-fetch-a-case)');
    });

    it('renders skill cell as em-dash when no CLI binding, regardless of recipes map', () => {
        const recipes: RecipeMap = new Map([['case:get', { number: 1, title: 'x', anchor: 'x' }]]);
        expect(renderSkillCell(null, recipes)).toBe('—');
    });
});

describe('slugifyHeading', () => {
    it('lowercases, strips punctuation, and hyphenates spaces (GitHub-compatible)', () => {
        expect(slugifyHeading('1. Smoke-test auth & connectivity')).toBe('1-smoke-test-auth--connectivity');
    });

    it('preserves existing hyphens and digits', () => {
        expect(slugifyHeading('22. Create a plan with nested entries (matrix testing in one call)')).toBe(
            '22-create-a-plan-with-nested-entries-matrix-testing-in-one-call',
        );
    });

    it('handles simple headings', () => {
        expect(slugifyHeading('Fetch a project')).toBe('fetch-a-project');
    });
});

describe('parseSkillRecipes', () => {
    it('returns an empty map when no recipe-for tags are present', () => {
        const src = `## Recipes\n\n### 1. Just a heading\n\nNo tag.\n`;
        const recipes = parseSkillRecipes(src);
        expect(recipes.size).toBe(0);
    });

    it('maps a single resource:action to the immediately-preceding numbered recipe', () => {
        const src = [
            '## Recipes',
            '',
            '### 1. Fetch a case',
            '',
            '<!-- recipe-for: case:get -->',
            '',
            '```bash',
            'testrail case get 5',
            '```',
        ].join('\n');
        const recipes = parseSkillRecipes(src);
        const r = recipes.get('case:get');
        expect(r).toBeDefined();
        expect(r?.number).toBe(1);
        expect(r?.title).toBe('Fetch a case');
        expect(r?.anchor).toBe('1-fetch-a-case');
    });

    it('handles multi-action recipe-for tags (comma-separated, one recipe per action)', () => {
        const src = [
            '### 15. Attach a screenshot to a result',
            '',
            '<!-- recipe-for: result:add, attachment:add-to-result -->',
            '',
        ].join('\n');
        const recipes = parseSkillRecipes(src);
        expect(recipes.get('result:add')?.number).toBe(15);
        expect(recipes.get('attachment:add-to-result')?.number).toBe(15);
    });

    it('keeps the first recipe for a given key when duplicates exist (matches generator behavior)', () => {
        const src = [
            '### 5. First',
            '',
            '<!-- recipe-for: case:get -->',
            '',
            '### 8. Second',
            '',
            '<!-- recipe-for: case:get -->',
            '',
        ].join('\n');
        const recipes = parseSkillRecipes(src);
        expect(recipes.get('case:get')?.number).toBe(5);
    });

    it('skips tags inside GENERATED regions', () => {
        const src = [
            '### 1. Real recipe',
            '',
            '<!-- recipe-for: case:get -->',
            '',
            '<!-- GENERATED:command-table -->',
            '### 99. Fake heading inside generated block',
            '',
            '<!-- recipe-for: should:not-be-picked-up -->',
            '<!-- /GENERATED:command-table -->',
            '',
        ].join('\n');
        const recipes = parseSkillRecipes(src);
        expect(recipes.get('case:get')?.number).toBe(1);
        expect(recipes.has('should:not-be-picked-up')).toBe(false);
    });

    it('ignores standalone recipe-for tags that have no preceding numbered heading', () => {
        const src = [
            '# Top of file',
            '',
            '<!-- recipe-for: orphan:action -->',
            '',
            '## Some unnumbered section',
            '',
        ].join('\n');
        const recipes = parseSkillRecipes(src);
        expect(recipes.has('orphan:action')).toBe(false);
    });
});

describe('aggregate renderers', () => {
    const grouped: GroupedResource[] = [
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
                    match: null,
                    cliKey: null,
                },
            ],
        },
    ];

    it('summary totals: skill column counts only rows with a recipe-for tag (not CLI fallback rows)', () => {
        // Without a recipes map, skill column is 0 (Phase 3: only curated recipes count).
        expect(renderSummaryTable(grouped)).toContain('| **Total** | **2** | **1** | **1** | **0** |');
        // With a recipe for case:get, skill column rises to 1.
        const recipes: RecipeMap = new Map([['case:get', { number: 1, title: 'Get a case', anchor: '1-get-a-case' }]]);
        const out = renderSummaryTable(grouped, recipes);
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
        expect(out).toContain('[`getCase`](../src/modules/cases.ts#L35)');
        expect(out).toContain('`case get`');
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
        expect(out).toContain('Generated by scripts/generate-mapping.ts');
        // Phase 2: document calls out the drift gates.
        expect(out).toContain('Drift gates');
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
        const sorted = [...multi].sort((a, b) => a.resource.localeCompare(b.resource));
        const out = renderDocument(sorted, '/repo/');
        const casesIdx = out.indexOf('## Cases');
        const suitesIdx = out.indexOf('## Suites');
        expect(casesIdx).toBeGreaterThan(-1);
        expect(suitesIdx).toBeGreaterThan(casesIdx);
    });
});

describe('validateGates — gates B, C, C2', () => {
    // Reusable, well-formed fixtures: one endpoint, one client call site, one
    // ActionSpec, one recipe — all bound. Tests perturb a single field to
    // exercise each gate in isolation.
    const HAPPY_ENDPOINT: EndpointEntry = { method: 'GET', path: 'get_case/{case_id}' };
    const HAPPY_CALL_SITE: CallSite = {
        moduleFile: '/repo/src/modules/cases.ts',
        methodName: 'getCase',
        method: 'GET',
        path: 'get_case/{case_id}',
        line: 42,
    };
    const HAPPY_ACTION: ActionEntry = {
        resource: 'case',
        action: 'get',
        apiEndpoint: 'GET get_case/{case_id}',
    };
    const HAPPY_RECIPE: RecipeMap = new Map([
        ['case:get', { number: 1, title: 'Fetch a case', anchor: '1-fetch-a-case' }],
    ]);

    it('returns an empty error list when every binding is consistent', () => {
        const errors = validateGates({
            callSites: [HAPPY_CALL_SITE],
            actions: [HAPPY_ACTION],
            endpoints: [HAPPY_ENDPOINT],
            recipes: HAPPY_RECIPE,
            rootPrefix: '/repo/',
        });
        expect(errors).toEqual([]);
    });

    describe('gate B (call-site → JSON inventory)', () => {
        it('flags a `@testrail` tag pointing at an endpoint not in the JSON', () => {
            const stray: CallSite = { ...HAPPY_CALL_SITE, path: 'nonexistent_endpoint' };
            const errors = validateGates({
                callSites: [stray],
                actions: [],
                endpoints: [HAPPY_ENDPOINT],
                recipes: new Map(),
                rootPrefix: '/repo/',
            });
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('[gate B]');
            expect(errors[0]).toContain('nonexistent_endpoint');
            // Strips rootPrefix from the file path.
            expect(errors[0]).toContain('src/modules/cases.ts:42');
            expect(errors[0]).not.toContain('/repo/src/modules/cases.ts');
        });

        it('keeps the absolute file path when rootPrefix is empty (default)', () => {
            const stray: CallSite = { ...HAPPY_CALL_SITE, path: 'nonexistent_endpoint' };
            const errors = validateGates({
                callSites: [stray],
                actions: [],
                endpoints: [HAPPY_ENDPOINT],
                recipes: new Map(),
            });
            expect(errors[0]).toContain('/repo/src/modules/cases.ts:42');
        });
    });

    describe('gate C (ActionSpec → @testrail tag)', () => {
        it('flags an ActionSpec whose apiEndpoint has no matching call site', () => {
            const orphanAction: ActionEntry = { ...HAPPY_ACTION, apiEndpoint: 'GET ghost_endpoint' };
            const errors = validateGates({
                callSites: [HAPPY_CALL_SITE],
                actions: [orphanAction],
                endpoints: [HAPPY_ENDPOINT, { method: 'GET', path: 'ghost_endpoint' }],
                recipes: HAPPY_RECIPE,
                rootPrefix: '/repo/',
            });
            const gateC = errors.filter((e) => e.includes('[gate C]') && !e.includes('[gate C2'));
            expect(gateC).toHaveLength(1);
            expect(gateC[0]).toContain('case:get');
            expect(gateC[0]).toContain('GET ghost_endpoint');
        });

        it('flags a malformed apiEndpoint string', () => {
            const malformed: ActionEntry = { ...HAPPY_ACTION, apiEndpoint: 'PATCH not-real' };
            const errors = validateGates({
                callSites: [HAPPY_CALL_SITE],
                actions: [malformed],
                endpoints: [HAPPY_ENDPOINT],
                recipes: HAPPY_RECIPE,
                rootPrefix: '/repo/',
            });
            const gateC = errors.filter((e) => e.includes('[gate C]') && !e.includes('[gate C2'));
            expect(gateC).toHaveLength(1);
            expect(gateC[0]).toContain('malformed apiEndpoint');
        });
    });

    describe('gate C2 forward (recipe-for → ACTIONS)', () => {
        it('flags a recipe-for tag pointing at a non-existent ACTIONS entry', () => {
            const orphanRecipes: RecipeMap = new Map([
                ['case:get', { number: 1, title: 'Fetch a case', anchor: '1-fetch-a-case' }],
                ['ghost:action', { number: 2, title: 'Phantom recipe', anchor: '2-phantom-recipe' }],
            ]);
            const errors = validateGates({
                callSites: [HAPPY_CALL_SITE],
                actions: [HAPPY_ACTION],
                endpoints: [HAPPY_ENDPOINT],
                recipes: orphanRecipes,
                rootPrefix: '/repo/',
            });
            const fwd = errors.filter((e) => e.includes('[gate C2 forward]'));
            expect(fwd).toHaveLength(1);
            expect(fwd[0]).toContain('recipe #2');
            expect(fwd[0]).toContain('Phantom recipe');
            expect(fwd[0]).toContain('ghost:action');
        });
    });

    describe('gate C2 reverse (ACTIONS → recipe-for)', () => {
        it('flags an ACTIONS entry that has no matching recipe-for binding', () => {
            const errors = validateGates({
                callSites: [HAPPY_CALL_SITE],
                actions: [HAPPY_ACTION],
                endpoints: [HAPPY_ENDPOINT],
                recipes: new Map(),
                rootPrefix: '/repo/',
            });
            const rev = errors.filter((e) => e.includes('[gate C2 reverse]'));
            expect(rev).toHaveLength(1);
            expect(rev[0]).toContain('case:get');
            // The error must tell the dev exactly how to fix it.
            expect(rev[0]).toContain('skill/SKILL.md');
            expect(rev[0]).toContain('skillRecipeExempt: true');
            // The error must include the literal tag so dev can copy/paste.
            expect(rev[0]).toContain('<!-- recipe-for: case:get -->');
        });

        it('honors the skillRecipeExempt opt-out flag', () => {
            const exempt: ActionEntry = { ...HAPPY_ACTION, skillRecipeExempt: true };
            const errors = validateGates({
                callSites: [HAPPY_CALL_SITE],
                actions: [exempt],
                endpoints: [HAPPY_ENDPOINT],
                recipes: new Map(),
                rootPrefix: '/repo/',
            });
            expect(errors.filter((e) => e.includes('[gate C2 reverse]'))).toEqual([]);
        });

        it('skillRecipeExempt: false is treated like the default (recipe required)', () => {
            const notExempt: ActionEntry = { ...HAPPY_ACTION, skillRecipeExempt: false };
            const errors = validateGates({
                callSites: [HAPPY_CALL_SITE],
                actions: [notExempt],
                endpoints: [HAPPY_ENDPOINT],
                recipes: new Map(),
                rootPrefix: '/repo/',
            });
            expect(errors.filter((e) => e.includes('[gate C2 reverse]'))).toHaveLength(1);
        });

        it('matches resource:action keys case-sensitively (no false negative on case mismatch)', () => {
            // ACTIONS uses lowercase resource/action; a recipe-for tag with
            // different case must NOT silently satisfy the reverse check.
            const upperCaseRecipe: RecipeMap = new Map([
                ['Case:Get', { number: 1, title: 'Fetch a case', anchor: '1-fetch-a-case' }],
            ]);
            const errors = validateGates({
                callSites: [HAPPY_CALL_SITE],
                actions: [HAPPY_ACTION],
                endpoints: [HAPPY_ENDPOINT],
                recipes: upperCaseRecipe,
                rootPrefix: '/repo/',
            });
            // Reverse: case:get has no binding (Case:Get doesn't match).
            const rev = errors.filter((e) => e.includes('[gate C2 reverse]'));
            expect(rev).toHaveLength(1);
            // Forward: Case:Get points at no ACTIONS entry.
            const fwd = errors.filter((e) => e.includes('[gate C2 forward]'));
            expect(fwd).toHaveLength(1);
        });

        it('reports multiple missing-recipe failures in one pass (does not bail on first)', () => {
            const action2: ActionEntry = { resource: 'run', action: 'get', apiEndpoint: 'GET get_run/{run_id}' };
            const endpoint2: EndpointEntry = { method: 'GET', path: 'get_run/{run_id}' };
            const callSite2: CallSite = {
                moduleFile: '/repo/src/modules/runs.ts',
                methodName: 'getRun',
                method: 'GET',
                path: 'get_run/{run_id}',
                line: 10,
            };
            const errors = validateGates({
                callSites: [HAPPY_CALL_SITE, callSite2],
                actions: [HAPPY_ACTION, action2],
                endpoints: [HAPPY_ENDPOINT, endpoint2],
                recipes: new Map(),
                rootPrefix: '/repo/',
            });
            const rev = errors.filter((e) => e.includes('[gate C2 reverse]'));
            expect(rev).toHaveLength(2);
            expect(rev.some((e) => e.includes('case:get'))).toBe(true);
            expect(rev.some((e) => e.includes('run:get'))).toBe(true);
        });
    });
});
