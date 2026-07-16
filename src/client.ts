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

export { TestRailApiError, TestRailLicenseError, TestRailValidationError } from './errors.js';

/** Strips `readonly` so `withTimeout` can rebind the module fields on a view. */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

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
        this.projects = new ProjectModule(this);
        this.suites = new SuiteModule(this);
        this.sections = new SectionModule(this);
        this.cases = new CaseModule(this);
        this.plans = new PlanModule(this);
        this.runs = new RunModule(this);
        this.tests = new TestModule(this);
        this.results = new ResultModule(this);
        this.milestones = new MilestoneModule(this);
        this.users = new UsersModule(this);
        this.metadata = new MetadataModule(this);
        this.configurations = new ConfigurationModule(this);
        this.attachments = new AttachmentModule(this);
        this.bdd = new BddModule(this);
        this.sharedSteps = new SharedStepModule(this);
        this.variables = new VariableModule(this);
        this.datasets = new DatasetModule(this);
        this.reports = new ReportModule(this);
        this.labels = new LabelModule(this);
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
     * Views chain — the outermost `withTimeout` wins. Because state is shared,
     * call {@link TestRailClient.destroy} on the root client, not on a view.
     *
     * @param timeoutMs Request timeout in milliseconds; a positive number ≤ 5 minutes.
     * @throws {TestRailValidationError} When `timeoutMs` is out of range.
     */
    public withTimeout(timeoutMs: number): TestRailClient {
        const view = this.spawnTimeoutView(timeoutMs);
        // Rebind every domain module to the view so `view.cases.getCase(id)`
        // routes through the view's timeout-injecting request(). `w` is the same
        // object, cast to strip `readonly` for the rebind; the module ctors take
        // the `view` reference itself. Mirrors the constructor's module list;
        // tests/exports.test.ts guards the two lists in sync.
        const w = view as Mutable<TestRailClient>;
        w.projects = new ProjectModule(view);
        w.suites = new SuiteModule(view);
        w.sections = new SectionModule(view);
        w.cases = new CaseModule(view);
        w.plans = new PlanModule(view);
        w.runs = new RunModule(view);
        w.tests = new TestModule(view);
        w.results = new ResultModule(view);
        w.milestones = new MilestoneModule(view);
        w.users = new UsersModule(view);
        w.metadata = new MetadataModule(view);
        w.configurations = new ConfigurationModule(view);
        w.attachments = new AttachmentModule(view);
        w.bdd = new BddModule(view);
        w.sharedSteps = new SharedStepModule(view);
        w.variables = new VariableModule(view);
        w.datasets = new DatasetModule(view);
        w.reports = new ReportModule(view);
        w.labels = new LabelModule(view);
        return view;
    }
}
