# Readiness after case-field creation

A successful `add_case_field` response confirms creation, but the next complete
`get_case_fields` inventory can temporarily omit the new field. In the report
for [#270](https://github.com/dichovsky/testrail-api-client/issues/270), TestRail
10.7.1.1003 omitted a created field at about 2 and 61 seconds, then included it
at about 131 seconds. Another creation appeared immediately. These observations
are not an SLA or a reason to use a fixed sleep.

Retain the full successful POST result, especially `id` and `system_name`, before
checking readiness. Save it durably when the workflow must survive a process
restart. Never send another creation POST because a subsequent GET omits the
field or a readiness deadline expires. An uncertain write outcome also requires
reconciliation before any retry.

The opt-in [TypeScript example](../examples/case-field-readiness.ts) performs only
GETs through a dedicated client with caching and automatic retries disabled.
`get_case_fields` returns the complete array; it does not use the SDK pagination
trio. Polling a shared client with its default five-minute GET cache could keep
returning the first omission even after the server becomes ready.

The example provides three states, each preserving the original creation result:

| State      | Meaning and next step                                                                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`  | Creation succeeded, but readiness is incomplete. Inspect the reason (`deadline`, `cancelled`, `attempt_limit`, invalid metadata, or read/verification failure), keep the creation result, and reconcile or resume GET-only polling later. |
| `ready`    | Exactly one field matched both returned identifiers and passed the caller's configuration verification. Dependent case writes may proceed using its returned `system_name`.                                                               |
| `conflict` | An identifier collides or the returned configuration differs. Stop dependent writes and reconcile the existing field; do not create a replacement automatically.                                                                          |

`pending` with reason `invalid_config` means the dedicated reader rejected its
configuration before any GET (`attempts: 0`), for example an invalid `baseUrl`,
email, or request timeout. Correct the reader configuration before resuming
GET-only polling; waiting cannot fix this condition. The successful POST result
remains available as `created`, and creation must not be repeated.

Supply a deadline, positive backoff bounds, an attempt limit, an optional abort
signal, and a synchronous verification callback. Verify the intended type,
project and template scope, and field-specific options including option IDs.
The [field contract](https://support.testrail.com/hc/en-us/articles/7077281158164-Case-Fields)
describes nested configuration and scope; use the metadata returned by your
server. Do not infer readiness from undocumented activity/status enum values.

For example, after creating the project-1/template-1 Dropdown from Recipe 45,
the following callback requires its intended configuration. Adapt the exact
comparison if your server normalizes option formatting; do not simply skip
verification. The timing values below are caller-selected example limits.

```typescript
// In this repository, import waitForCaseField from the example. If copying it
// into an application, change its SDK import to '@dichovsky/testrail-api-client'
// and replace the repository timer constant with your application's limit.
import { waitForCaseField } from '../examples/case-field-readiness.js';

// `created` is the retained result of the one successful addCaseField(payload).
const readiness = await waitForCaseField(config, created, {
    timeoutMs: 180_000,
    initialDelayMs: 1_000,
    maxDelayMs: 10_000,
    maxAttempts: 30,
    signal: controller.signal,
    verify: (field) =>
        field.name === 'environment_tier' &&
        field.type_id === 6 &&
        field.include_all === false &&
        field.template_ids.length === 1 &&
        field.template_ids[0] === 1 &&
        field.configs.length === 1 &&
        field.configs.every(
            ({ context, options }) =>
                context.is_global === false &&
                Array.isArray(context.project_ids) &&
                context.project_ids.length === 1 &&
                context.project_ids[0] === 1 &&
                options.is_required === false &&
                options.items === '1, dev\n2, staging\n3, prod',
        ),
});

if (readiness.state === 'ready') {
    // A separate, intentional dependent write; no write occurs inside polling.
    await client.cases.updateCase(caseId, { [readiness.field.system_name]: 2 });
}
// Retain readiness.created for pending/conflict as well. Neither means create failed.
```

Cancellation interrupts backoff and fetch, and the caller-visible deadline also
bounds injected DNS/fetch implementations that ignore cancellation. Such an
implementation may finish its current GET in the background; the example starts
no further GETs or dependent writes after cancellation. Transport/schema errors
stop polling with a pending result. Existing SDK callers keep their current
latency and response passthrough unless they opt into this workflow.
