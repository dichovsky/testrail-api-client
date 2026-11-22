# Readiness after case-field creation

A successful `add_case_field` response confirms field creation. However, the next
`get_case_fields` inventory can temporarily omit the new field. In issue
[#270](https://github.com/dichovsky/testrail-api-client/issues/270), TestRail
10.7.1.1003 omitted a new field at 2 seconds and 61 seconds. The server included
the field at 131 seconds. Another field appeared immediately.

These observations do not define an SLA. Do not use a fixed sleep delay.

Keep the full POST response, especially `id` and `system_name`, before you poll
for readiness. Save the response to durable storage if the workflow must survive
a process restart. Do not send another `add_case_field` POST if a subsequent GET
omits the field or a readiness deadline expires. If the result of a write is
uncertain, reconcile the server state before you retry.

The opt-in [TypeScript example](../examples/case-field-readiness.ts) sends only
GET requests through a dedicated client. This client disables caching and
automatic retries. The `get_case_fields` endpoint returns the complete array and
does not use the SDK pagination methods. Do not poll through a shared client with
the default five-minute GET cache. A cached response can repeat the first
omission after the server is ready.

The example returns one of three states. Each state keeps the original creation
result:

| State      | Meaning and next step                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`  | Creation succeeded, but the field is not ready. Examine the reason (`deadline`, `cancelled`, `attempt_limit`, invalid metadata, or read/verification failure). Keep the creation result. Resume GET-only polling later. |
| `ready`    | One field matched both returned identifiers and passed the configuration check. Run dependent case writes with the returned `system_name`.                                                                              |
| `conflict` | An identifier collides or the returned configuration does not match. Stop dependent writes. Examine the existing field. Do not create a replacement field automatically.                                                |

A `pending` state with reason `invalid_config` means the reader client rejected
its configuration before any GET request (`attempts: 0`). For example, `baseUrl`,
`email`, or `timeout` was invalid. Fix the reader configuration before you resume
GET-only polling. If you only wait, the configuration stays invalid. The `created`
property still holds the POST result. Do not repeat the creation request.

Supply a deadline, positive backoff bounds, an attempt limit, an optional abort
signal, and a synchronous verification callback. Validate the field type, project
scope, template scope, and field options (including option IDs). The
[field contract](https://support.testrail.com/hc/en-us/articles/7077281158164-Case-Fields)
describes the nested configuration and scope. Compare against the metadata that
your server returns. Do not infer readiness from undocumented activity or status
values.

The following example validates the project-1, template-1 Dropdown from Recipe 45.
Adjust the comparison if your server normalizes option formatting. Do not skip
the verification check. Set the timing limits to match your application.

The snippet uses `config` and `client` from
[Create a client](SDK.md#create-a-client). `created` holds the result that you
kept from the one successful `addCaseField()` call. `caseId` identifies the case that the
dependent write updates.

```typescript
// In this repository, import waitForCaseField from the example. If copying it
// into an application, change its SDK import to '@dichovsky/testrail-api-client'
// and replace the repository timer constant with your application's limit.
import { waitForCaseField } from '../examples/case-field-readiness.js';

// Call controller.abort() to cancel polling.
const controller = new AbortController();

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

Cancellation stops the backoff timer and the in-flight fetch. The deadline also
limits custom DNS or fetch functions that ignore the abort signal. A custom
function can finish its current GET request in the background. However, the
helper starts no more GET requests or dependent writes after cancellation.

A transport error or a schema error stops polling, and the helper returns a
`pending` result. Standard SDK calls keep their normal latency and response
behavior unless you call this helper.
