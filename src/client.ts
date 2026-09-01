import { TestRailClientCore } from './client-core.js';
import { ProjectModule } from './modules/projects.js';
import { SuiteModule } from './modules/suites.js';
import { SectionModule } from './modules/sections.js';
import { CaseModule } from './modules/cases.js';
import { PlanModule } from './modules/plans.js';
import { RunModule } from './modules/runs.js';
import { TestModule } from './modules/tests.js';
import { ResultModule } from './modules/results.js';
import { MilestoneModule } from './modules/milestones.js';
import { UsersModule } from './modules/users.js';
import { MetadataModule } from './modules/metadata.js';
import { ConfigurationModule } from './modules/configurations.js';
import { AttachmentModule } from './modules/attachments.js';
import { BddModule } from './modules/bdd.js';
import { SharedStepModule } from './modules/sharedSteps.js';
import { VariableModule } from './modules/variables.js';
import { DatasetModule } from './modules/datasets.js';
import { ReportModule } from './modules/reports.js';
import { LabelModule } from './modules/labels.js';

export { TestRailApiError, TestRailLicenseError, TestRailPaginationError, TestRailValidationError } from './errors.js';

/** Strips `readonly` so `withTimeout` can rebind the module fields on a view. */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type ModuleBindings = {
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
};

const createModuleBindings = (client: TestRailClientCore): ModuleBindings => ({
    projects: new ProjectModule(client),
    suites: new SuiteModule(client),
    sections: new SectionModule(client),
    cases: new CaseModule(client),
    plans: new PlanModule(client),
    runs: new RunModule(client),
    tests: new TestModule(client),
    results: new ResultModule(client),
    milestones: new MilestoneModule(client),
    users: new UsersModule(client),
    metadata: new MetadataModule(client),
    configurations: new ConfigurationModule(client),
    attachments: new AttachmentModule(client),
    bdd: new BddModule(client),
    sharedSteps: new SharedStepModule(client),
    variables: new VariableModule(client),
    datasets: new DatasetModule(client),
    reports: new ReportModule(client),
    labels: new LabelModule(client),
});

function rebindModules(target: Mutable<TestRailClient>, client: TestRailClientCore): void {
    const modules = createModuleBindings(client);
    target.projects = modules.projects;
    target.suites = modules.suites;
    target.sections = modules.sections;
    target.cases = modules.cases;
    target.plans = modules.plans;
    target.runs = modules.runs;
    target.tests = modules.tests;
    target.results = modules.results;
    target.milestones = modules.milestones;
    target.users = modules.users;
    target.metadata = modules.metadata;
    target.configurations = modules.configurations;
    target.attachments = modules.attachments;
    target.bdd = modules.bdd;
    target.sharedSteps = modules.sharedSteps;
    target.variables = modules.variables;
    target.datasets = modules.datasets;
    target.reports = modules.reports;
    target.labels = modules.labels;
}

/**
 * TestRail API Client
 *
 * Type-safe client covering Projects, Suites, Sections, Cases, Plans, Runs,
 * Tests, Results, Milestones, Users, Statuses, and Priorities. Each domain is
 * reached through its `public readonly` module field — e.g.
 * `client.projects.getProject(1)`, `client.runs.addRun(2, payload)`. The
 * modules are the single access path; there is no flat facade.
 *
 * Extends {@link TestRailClientCore} for HTTP pipeline, caching, rate limiting, and retry.
 */
export class TestRailClient extends TestRailClientCore {
    // ── Domain modules ────────────────────────────────────────────────────────
    public readonly projects: ProjectModule;
    public readonly suites: SuiteModule;
    public readonly sections: SectionModule;
    public readonly cases: CaseModule;
    public readonly plans: PlanModule;
    public readonly runs: RunModule;
    public readonly tests: TestModule;
    public readonly results: ResultModule;
    public readonly milestones: MilestoneModule;
    public readonly users: UsersModule;
    public readonly metadata: MetadataModule;
    public readonly configurations: ConfigurationModule;
    public readonly attachments: AttachmentModule;
    public readonly bdd: BddModule;
    public readonly sharedSteps: SharedStepModule;
    public readonly variables: VariableModule;
    public readonly datasets: DatasetModule;
    public readonly reports: ReportModule;
    public readonly labels: LabelModule;

    constructor(...args: ConstructorParameters<typeof TestRailClientCore>) {
        super(...args);
        const modules = createModuleBindings(this);
        this.projects = modules.projects;
        this.suites = modules.suites;
        this.sections = modules.sections;
        this.cases = modules.cases;
        this.plans = modules.plans;
        this.runs = modules.runs;
        this.tests = modules.tests;
        this.results = modules.results;
        this.milestones = modules.milestones;
        this.users = modules.users;
        this.metadata = modules.metadata;
        this.configurations = modules.configurations;
        this.attachments = modules.attachments;
        this.bdd = modules.bdd;
        this.sharedSteps = modules.sharedSteps;
        this.variables = modules.variables;
        this.datasets = modules.datasets;
        this.reports = modules.reports;
        this.labels = modules.labels;
    }

    /**
     * Returns a view of this client that applies `timeoutMs` (milliseconds) as
     * the request timeout for every call made through it — e.g.
     * `client.withTimeout(120_000).cases.getCases(1)` gives that one bulk export
     * two minutes instead of the client-wide default, without building a second
     * client. The view **shares** the underlying cache, rate-limit budget,
     * credential, and cleanup timer with this client (it is not a second
     * client), and does not register its own process lifecycle.
     *
     * The body-read deadline (SEC #21) tracks the new timeout when `bodyTimeout`
     * was left at its default; an explicitly configured `bodyTimeout` is kept.
     * Views chain — the outermost `withTimeout` wins. Because a view shares the
     * root's state, {@link TestRailClient.destroy} and
     * {@link TestRailClient.clearCache} called on a view act on the shared
     * client: `destroy()` on any handle zeroes the one credential and disables
     * the root and all its views.
     *
     * @param timeoutMs Request timeout in milliseconds; a positive number ≤ 5 minutes.
     * @throws {TestRailValidationError} When `timeoutMs` is out of range.
     */
    public withTimeout(timeoutMs: number): TestRailClient {
        const view = this.spawnTimeoutView(timeoutMs);
        // Rebind every domain module to the view so `view.cases.getCase(id)`
        // routes through the view's timeout-injecting request(). `w` is the
        // same object, cast to strip `readonly` for the rebind; module ctors
        // take the `view` reference itself.
        // Mirrors the constructor's module map; tests/exports.test.ts guards the
        // two paths in sync.
        const w = view as Mutable<TestRailClient>;
        rebindModules(w, view);
        return view;
    }
}
