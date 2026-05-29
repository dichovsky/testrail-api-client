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

export { TestRailApiError, TestRailValidationError } from './errors.js';

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
    }
}
