# Programmatic TypeScript API

For tasks the CLI cannot express. `SKILL.md` covers when to prefer this over
the CLI.

## Programmatic TypeScript API

The `testrail` CLI is a thin wrapper over `TestRailClient`. If you are
writing TypeScript or JavaScript that needs typed responses, retry /
rate-limit / cache reuse across many calls, or precise error handling,
import the client directly instead of shelling out.

```bash
npm install @dichovsky/testrail-api-client
```

```typescript
import {
    TestRailClient,
    TestRailApiError,
    TestRailPaginationError,
    TestRailValidationError,
} from '@dichovsky/testrail-api-client';

const client = new TestRailClient({
    baseUrl: process.env.TESTRAIL_BASE_URL!,
    email: process.env.TESTRAIL_EMAIL!,
    apiKey: process.env.TESTRAIL_API_KEY!,
});

try {
    const project = await client.projects.getProject(1);
    console.log(project.name);
} catch (e) {
    if (e instanceof TestRailApiError) {
        // HTTP/network/protocol errors carry .status / .statusText / .response.
        console.error(`HTTP ${e.status}: ${e.statusText}`);
    } else if (e instanceof TestRailPaginationError) {
        // Safe aggregate/page failure; no partial result was returned.
        console.error(e.reason, e.pagesFetched, e.itemsFetched);
    } else if (e instanceof TestRailValidationError) {
        // Bad config or caller arguments.
        console.error(`Invalid input: ${e.message}`);
    }
    throw e;
} finally {
    // Stops the cache cleanup timer, clears the cache, and zeroes the
    // credential. Library callers MUST do this in their shutdown hook
    // (the CLI does it automatically via `registerProcessHandlers: true`).
    client.destroy();
}
```

The examples below share the configured `client` above and may refer to
entities created in preceding examples; adjust the IDs for your instance.
Endpoint methods return `Promise<T>`; all errors
inherit from `Error` (`TestRailApiError` for HTTP/network/protocol failures,
`TestRailPaginationError` for safe pagination failure, and
`TestRailValidationError` for other validation failures).

### Projects

```typescript
// Backward-compatible one-response array.
const projects = await client.projects.getProjects();

// Preserve one envelope, or collect every page under explicit bounds.
const projectPage = await client.projects.getProjectsPage({ limit: 25 });
const allProjects = await client.projects.getAllProjects({
    pageSize: 100,
    maxItems: 10_000,
});

// Fetch one.
const project = await client.projects.getProject(1);

// Create (Zod-validated against AddProjectPayloadSchema).
const created = await client.projects.addProject({ name: 'CI', suite_mode: 1 });

// Update (partial fields).
await client.projects.updateProject(created.id, { name: 'CI (renamed)' });

// Delete — destructive; the client method runs immediately, so wrap it
// behind your own --yes equivalent.
await client.projects.deleteProject(created.id);
```

### Suites & sections

```typescript
const suites = await client.suites.getSuites(1); // by project_id
const suite = await client.suites.addSuite(1, { name: 'Smoke' });

const sections = await client.sections.getSections(1, { suiteId: suite.id });
const section = await client.sections.addSection(1, {
    suite_id: suite.id,
    name: 'Login',
});
```

### Cases

```typescript
const cases = await client.cases.getCases(1, { suiteId: 5 });
const c = await client.cases.getCase(42);
const browser = c['custom_browser']; // unknown: narrow before use

const created = await client.cases.addCase(section.id, {
    title: 'Login page accepts SSO redirect',
    type_id: 1,
    priority_id: 3,
});

// Bulk update many cases in a suite to the same field values.
await client.cases.updateCases(suite.id, {
    case_ids: [1, 2, 3],
    priority_id: 4,
});

// Edit history (TestRail 6.5.4+); collect every response page.
const history = await client.cases.getAllHistoryForCase(42, { pageSize: 100 });
```

### Runs

```typescript
const run = await client.runs.addRun(1, {
    name: `CI build ${process.env.CI_BUILD_NUMBER}`,
    include_all: false,
    case_ids: [42, 43, 44],
});

const runs = await client.runs.getAllRuns(1, { pageSize: 100 });
await client.runs.updateRun(run.id, { milestone_id: 7 });

// Close is irreversible — TestRail has no open_run.
await client.runs.closeRun(run.id);
```

### Results

```typescript
// One result at a time.
const r1 = await client.results.addResultForCase(run.id, 42, {
    status_id: 1,
    comment: 'passed',
});

// Bulk by case_id.
await client.results.addResultsForCases(run.id, {
    results: [
        { case_id: 42, status_id: 1 },
        { case_id: 43, status_id: 5, comment: 'failed: timeout' },
    ],
});

// Bulk by test_id (already-known test instances inside the run).
await client.results.addResults(run.id, {
    results: [{ test_id: 1001, status_id: 1 }],
});

// Read.
const results = await client.results.getAllResultsForRun(run.id, { pageSize: 100 });
const forCase = await client.results.getResultsForCase(run.id, 42);
```

### Milestones

```typescript
const m = await client.milestones.addMilestone(1, {
    name: 'v2.0',
    description: 'Q2 release',
});
await client.milestones.updateMilestone(m.id, { is_completed: true });
const milestones = await client.milestones.getMilestones(1);
```

### Attachments

```typescript
import { readFileSync } from 'node:fs';

// Upload — pass a Buffer (or a Blob) plus a filename.
const buf = readFileSync('./screenshot.png');
const ack = await client.attachments.addAttachmentToCase(42, buf, 'screenshot.png');
console.log(ack.attachment_id);

// Download — returns an ArrayBuffer; the caller writes to disk.
const blob = await client.attachments.getAttachment(ack.attachment_id);
// Use Buffer.from(blob) when a Node file API expects a byte buffer.

// Case/run/plan lists expose page/all projections; test/plan-entry do not.
const list = await client.attachments.getAllAttachmentsForCase(42, { pageSize: 100 });

// Destructive — no built-in --yes gate; guard yourself.
await client.attachments.deleteAttachment(ack.attachment_id);
```

### Plans

```typescript
const plan = await client.plans.addPlan(1, {
    name: 'Release smoke',
    entries: [{ suite_id: 5, include_all: true }],
});

// Add a config-specific run to an existing plan entry. Entry IDs are
// UUID-style strings (NOT integers) — use the value from plan.entries[].id.
await client.plans.addRunToPlanEntry(plan.id, plan.entries[0].id, {
    config_ids: [101, 102],
});

await client.plans.updatePlanEntry(plan.id, plan.entries[0].id, {
    name: 'Smoke (config matrix)',
});

// Close + delete are irreversible / destructive — guard with your own
// confirmation step.
await client.plans.closePlan(plan.id);
```

### Users

```typescript
const me = await client.users.getCurrentUser(); // TestRail 6.6+
const byEmail = await client.users.getUserByEmail('alice@example.com');
const user = await client.users.getUser(7);
const projectUsers = await client.users.getUsers(5); // project_id; required for non-admins
const allVisibleUsers = await client.users.getUsers(); // administrators may omit project_id
```

### Datasets & variables (data-driven testing)

```typescript
// Variables live on the project; datasets reference them by name.
const v = await client.variables.addVariable(1, { name: 'env' });
const d = await client.datasets.addDataset(1, {
    name: 'Staging EU',
    variables: { env: 'staging.example.com' },
});

const datasets = await client.datasets.getDatasets(1);
await client.datasets.updateDataset(d.id, {
    name: 'Production EU',
    variables: { env: 'prod.example.com' },
});
```

### Groups (TestRail 7.5+)

```typescript
// Instance-scoped — no project_id path param.
const group = await client.users.addGroup({ name: 'QA', user_ids: [1, 2, 3] });
const groups = await client.users.getAllGroups();
await client.users.updateGroup(group.id, { name: 'QA (renamed)' });
```

### Shared steps (TestRail 7.0+)

```typescript
const step = await client.sharedSteps.addSharedStep(1, {
    title: 'Login as admin',
    custom_steps_separated: [
        { content: 'Open /login', expected: '200 OK' },
        { content: 'Submit creds', expected: 'Redirect to /dashboard' },
    ],
});

// Cases reference shared steps via the `custom_steps_separated[].shared_step_id`
// field. Revising a shared step propagates to every referencing case on
// the next read.
await client.sharedSteps.updateSharedStep(step.id, { title: 'Login as admin (v2)' });
```

### Configuration matrix (project → config_groups → configs)

```typescript
// Tree fetch — one call returns groups with nested configs.
const groups = await client.configurations.getConfigurations(1);

// Create a group (e.g. "Browsers") then a leaf config (e.g. "Chrome").
const browsers = await client.configurations.addConfigurationGroup(1, { name: 'Browsers' });
const chrome = await client.configurations.addConfiguration(browsers.id, { name: 'Chrome' });

// Wire into a plan entry's config matrix:
//   plan_entry.config_ids = [chrome.id, ...]
```

### Configuration & client tuning

```typescript
// Override defaults from src/constants.ts. All values are optional.
const tuned = new TestRailClient({
    baseUrl: process.env.TESTRAIL_BASE_URL!,
    email: process.env.TESTRAIL_EMAIL!,
    apiKey: process.env.TESTRAIL_API_KEY!,
    timeout: 60_000, // header timeout (ms)
    bodyTimeout: 60_000, // body-read wall-clock deadline (ms)
    maxRetries: 5,
    rateLimiter: { maxRequests: 200, windowMs: 60_000 },
    maxJsonResponseBytes: 20 * 1024 * 1024, // 20 MiB cap
    // Library callers should leave this off and call destroy() from their
    // own shutdown hook. The CLI opts in.
    registerProcessHandlers: false,
});
```

### Error narrowing pattern

```typescript
async function safelyDeleteCase(id: number) {
    try {
        await client.cases.deleteCase(id);
        return { ok: true as const };
    } catch (e) {
        if (e instanceof TestRailApiError) {
            // HTTP layer: 4xx/5xx, network, rate limit, timeout, body cap,
            // 3xx blocked redirects.
            return { ok: false as const, kind: 'api', status: e.status, msg: e.statusText };
        }
        if (e instanceof TestRailValidationError) {
            // Pre-flight: bad ID, missing config, schema rejection.
            return { ok: false as const, kind: 'validation', msg: e.message };
        }
        throw e; // unexpected — re-throw
    }
}
```

See `CODEMAP.md` for the exhaustive list of methods (every public symbol
indexed with `file:line` links). See `docs/API-MAPPING.md` for the
endpoint ↔ method ↔ CLI command coverage matrix.
