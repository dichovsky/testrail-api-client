import { readFileSync } from 'node:fs';
import { describe, it, expect, expectTypeOf } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailLicenseError, TestRailValidationError } from '../src/index.js';
import type {
    AttachmentModule,
    BddModule,
    CaseModule,
    ConfigurationModule,
    DatasetModule,
    KnownResponse,
    LabelModule,
    MetadataModule,
    MilestoneModule,
    PlanModule,
    Project,
    ProjectModule,
    ReportModule,
    RequestBody,
    RequestIntent,
    RequestSpec,
    ResultModule,
    RunModule,
    SectionModule,
    SharedStepModule,
    SuiteModule,
    TestModule,
    UsersModule,
    VariableModule,
} from '../src/index.js';
import * as root from '../src/index.js';
import * as schemas from '../src/schemas.js';

describe('Index exports', () => {
    it('should export TestRailClient', () => {
        expect(TestRailClient).toBeDefined();
    });

    it('should create a functional TestRailClient instance', () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.net',
            email: 'test@example.com',
            apiKey: 'test-key',
        });
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(TestRailClient);
        expect(client.metadata).toBeDefined();
    });

    it('should expose all 19 domain modules as the single access path', () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.net',
            email: 'test@example.com',
            apiKey: 'test-key',
        });
        const modules = [
            'projects',
            'suites',
            'sections',
            'cases',
            'plans',
            'runs',
            'tests',
            'results',
            'milestones',
            'users',
            'metadata',
            'configurations',
            'attachments',
            'bdd',
            'sharedSteps',
            'variables',
            'datasets',
            'reports',
            'labels',
        ] as const;
        // The class JSDoc ships in the .d.ts; it must name every module field.
        const source = readFileSync(new URL('../src/client.ts', import.meta.url), 'utf8');
        const classDoc = /\/\*\*\n \* TestRail API Client[\s\S]*?\*\//.exec(source)?.[0] ?? '';
        for (const name of modules) {
            expect(client[name], `client.${name} should be defined`).toBeDefined();
            expect(classDoc, `TestRailClient JSDoc should name \`${name}\``).toContain(`\`${name}\``);
        }
        // v5.0.0: the flat facade is gone — endpoint methods live only on the
        // module fields, never directly on the client.
        const flat = client as unknown as Record<string, unknown>;
        expect(flat['getProject']).toBeUndefined();
        expect(flat['addRun']).toBeUndefined();
        expect(flat['addResultForCase']).toBeUndefined();
        expect(typeof client.projects.getProject).toBe('function');
        expect(typeof client.runs.addRun).toBe('function');
        expect(typeof client.results.addResultForCase).toBe('function');
    });

    it('withTimeout() rebinds every domain module (parity with the constructor list)', () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.net',
            email: 'test@example.com',
            apiKey: 'test-key',
        });
        const isModule = (v: unknown): boolean =>
            typeof v === 'object' && v?.constructor?.name.endsWith('Module') === true;
        const moduleKeys = (c: TestRailClient): string[] =>
            Object.keys(c).filter((k) => isModule((c as unknown as Record<string, unknown>)[k]));

        const view = client.withTimeout(1000);
        // Same set of module fields — guards against adding a module to the
        // constructor but forgetting to rebind it in withTimeout().
        expect(moduleKeys(view).sort()).toEqual(moduleKeys(client).sort());
        // Each is a fresh instance bound to the view, not the root's instance.
        for (const key of moduleKeys(client)) {
            const rec = (obj: TestRailClient): Record<string, unknown> => obj as unknown as Record<string, unknown>;
            expect(rec(view)[key]).toBeDefined();
            expect(rec(view)[key]).not.toBe(rec(client)[key]);
        }
    });

    it('re-exports every schema of src/schemas.ts from the package root', () => {
        const missing = Object.keys(schemas).filter((name) => name.endsWith('Schema') && !(name in root));
        expect(missing).toEqual([]);
    });

    it('exports every type a declaration-emitting consumer has to name (npm-packaging#1)', () => {
        // `export const projects = client.projects` in a consumer built with
        // `declaration: true` fails with TS2883 unless the package root exports
        // the inferred type. Type-only exports do not exist at runtime, so the
        // names are read from the source.
        const indexSource = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
        const exportedTypes = new Set(
            Array.from(indexSource.matchAll(/^export type \{([^}]*)\}/gm), (match) => match[1] ?? '')
                .flatMap((names) => names.split(','))
                .map((name) => name.trim()),
        );
        const clientSource = readFileSync(new URL('../src/client.ts', import.meta.url), 'utf8');
        const moduleClasses = Array.from(
            clientSource.matchAll(/^ {4}public readonly \w+: (\w+Module);$/gm),
            (match) => match[1] ?? '',
        );
        expect(moduleClasses).toHaveLength(19);
        const required = [...moduleClasses, 'KnownResponse', 'RequestSpec', 'RequestBody', 'RequestIntent'];
        expect(required.filter((name) => !exportedTypes.has(name))).toEqual([]);

        // Compile-time witnesses: `npm run typecheck` fails when a name stops resolving.
        interface ModuleTypes {
            projects: ProjectModule;
            suites: SuiteModule;
            sections: SectionModule;
            cases: CaseModule;
            plans: PlanModule;
            runs: RunModule;
            tests: TestModule;
            results: ResultModule;
            milestones: MilestoneModule;
            users: UsersModule;
            metadata: MetadataModule;
            configurations: ConfigurationModule;
            attachments: AttachmentModule;
            bdd: BddModule;
            sharedSteps: SharedStepModule;
            variables: VariableModule;
            datasets: DatasetModule;
            reports: ReportModule;
            labels: LabelModule;
        }
        expectTypeOf<{ [K in keyof ModuleTypes]: TestRailClient[K] }>().toEqualTypeOf<ModuleTypes>();
        expectTypeOf<KnownResponse<typeof schemas.ProjectSchema>>().toEqualTypeOf<Project>();
        expectTypeOf<Parameters<TestRailClient['request']>[0]>().toEqualTypeOf<RequestSpec<unknown>>();
        expectTypeOf<NonNullable<RequestSpec<unknown>['body']>>().toEqualTypeOf<RequestBody>();
        expectTypeOf<NonNullable<RequestSpec<unknown>['intent']>>().toEqualTypeOf<RequestIntent>();
    });

    it('should export and create TestRailApiError instances', () => {
        expect(TestRailApiError).toBeDefined();
        expect(typeof TestRailApiError).toBe('function');

        const error = new TestRailApiError(404, 'Not Found', 'Response body');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TestRailApiError);
        // The message now includes status and statusText due to the refactor
        expect(error.message).toContain('404');
        expect(error.message).toContain('Not Found');
        expect(error.name).toBe('TestRailApiError');
    });

    it('should export and create TestRailValidationError instances', () => {
        expect(TestRailValidationError).toBeDefined();
        expect(typeof TestRailValidationError).toBe('function');

        const error = new TestRailValidationError('Config error');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TestRailValidationError);
        // The message now includes a prefix due to the refactor
        expect(error.message).toContain('Config error');
        expect(error.name).toBe('TestRailValidationError');
    });

    it('should export and create TestRailLicenseError instances (subclass of TestRailApiError)', () => {
        expect(TestRailLicenseError).toBeDefined();
        expect(typeof TestRailLicenseError).toBe('function');

        const error = new TestRailLicenseError(403, 'Forbidden', '{"error":"Not an Enterprise license/subscription."}');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TestRailApiError);
        expect(error).toBeInstanceOf(TestRailLicenseError);
        expect(error.status).toBe(403);
        expect(error.name).toBe('TestRailLicenseError');
    });

    it('should export error classes with proper inheritance', () => {
        const apiError = new TestRailApiError(500, 'Internal Server Error');
        const configError = new TestRailValidationError('Config Error');

        expect(apiError instanceof Error).toBe(true);
        expect(configError instanceof Error).toBe(true);
        expect(apiError.name).toBe('TestRailApiError');
        expect(configError.name).toBe('TestRailValidationError');
    });
});
