# Programmatic TypeScript API

Use this reference for typed SDK calls and client lifecycle control.
Read [SKILL.md](../SKILL.md) for the CLI usage rules.

## Setup and lifecycle

The `testrail` CLI calls `TestRailClient` methods.
Import `TestRailClient` directly in TypeScript or JavaScript code.
Use the client when you need typed responses, shared retry and rate-limit state, response caching, or structured error handling.

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
    // Put the selected endpoint calls here, before client cleanup.
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
    // Stop the cleanup timer, clear cached data, and overwrite credentials.
    client.destroy();
}
```

Use the snippets below inside the `try` block above. Move any extra imports to the top of your file.
Choose the calls that you need. These snippets are not one script to run in order.
Some snippets use a `suite`, `section`, or `run` that another example creates. Create those entities in the same `try` block.
Replace example IDs with valid IDs from your TestRail instance.
Call `destroy()` after the last request, or from your application's shutdown hook. A destroyed client cannot send more requests.
The CLI manages this lifecycle automatically.

All endpoint methods return `Promise<T>`, and all error classes extend `Error`:

- `TestRailApiError`: HTTP, network, or protocol failures.
- `TestRailPaginationError`: Pagination bound or continuation failures.
- `TestRailValidationError`: Configuration or argument validation failures.

### Validate dynamic write input

SDK payload types validate input only at compile time.
SDK methods do not parse payloads at runtime. CLI write commands validate payloads automatically.
Call `.parse()` on the Zod schema to validate untrusted or dynamic input before you call the SDK:

```typescript
import { AddResultPayloadSchema } from '@dichovsky/testrail-api-client';

const input: unknown = JSON.parse('{"comment":"Investigating"}');
const payload = AddResultPayloadSchema.parse(input);
await client.results.addResult(1001, payload);
```

Schema refinements also run during `.parse()`.
For example, `AddResultPayloadSchema` rejects an empty `{}` object even though each individual TypeScript field is optional.

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

// Create (typed payload; use AddProjectPayloadSchema.parse for dynamic input).
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
```

Keep the run open while you write results. The next example closes it after the last write.

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

// status_id is optional: each result needs at least one of status_id, comment
// or assignedto_id. A comment-only result leaves the test's status unchanged.
await client.results.addResultForCase(run.id, 44, { comment: 'Investigating — see BUG-42' });

// Read.
const results = await client.results.getAllResultsForRun(run.id, { pageSize: 100 });
const forCase = await client.results.getResultsForCase(run.id, 42);

// Close only after all result writes. TestRail has no open_run.
await client.runs.closeRun(run.id);
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
// The response type permits a missing ID. Stop before you use it.
if (ack.attachment_id == null) throw new Error('Upload returned no attachment ID');
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
// The response type permits missing entries. Stop before you use the ID.
const entryId = plan.entries?.[0]?.id;
if (entryId === undefined) throw new Error('Plan response has no entry ID');
await client.plans.addRunToPlanEntry(plan.id, entryId, {
    config_ids: [101, 102],
});

await client.plans.updatePlanEntry(plan.id, entryId, {
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
```

`getUsers(projectId)` keeps its existing single-response behavior. Non-admin users must supply a project ID.
Administrators can omit the project ID for global user lists.

```typescript
const firstUsers = await client.users.getUsers();
const users = await client.users.getUsers(undefined, { limit: 25, offset: 0 });
const page = await client.users.getUsersPage({ limit: 25, offset: 0 });
const allUsers = await client.users.getAllUsers({ pageSize: 100, maxItems: 10000 });
```

`getUsers(undefined, options)` returns one item array. `getUsersPage()` returns a `Page<User>`.
`getAllUsers()` returns all global users within safety limits. These pagination methods and options apply only to global user lists.
On TestRail 10.10.1 or later, `getUsers()` without options returns only the first page, which has a maximum of 250 users by default.
An older server can ignore `limit` and `offset` and return all users in one response.

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

try {
    const project = await tuned.projects.getProject(1);
    console.log(project.name);
} finally {
    tuned.destroy();
}
```

This example creates its own client. Keep its cleanup separate from the client in the setup example.
See the [SDK configuration guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md#configuration) for all options.
See the [networking guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md) for private hosts, DNS, proxies, and certificate authorities.

### Error narrowing pattern

A write can reach TestRail before an error occurs. Check the server state before you repeat a failed write.
The SDK does not apply the CLI's destructive-action gates. Your application must supply its own confirmation.

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
            // Invalid config/ID or a throwing response-validation hook.
            return { ok: false as const, kind: 'validation', msg: e.message };
        }
        throw e; // unexpected — re-throw
    }
}
```

See the [source symbol index](https://github.com/dichovsky/testrail-api-client/blob/main/CODEMAP.md) for all public methods.
See the [API coverage matrix](https://github.com/dichovsky/testrail-api-client/blob/main/docs/API-MAPPING.md) for endpoint, SDK, and CLI mappings.
The [SDK guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md) includes caching, pagination, response validation, and custom fields.
