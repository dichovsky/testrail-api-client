# `testrail` recipes

Numbered, copy-pasteable recipes covering every CLI command. Read
`SKILL.md` first for authentication, the destructive-operation gates, and the
output/pagination policy — those apply to every recipe here.

## Recipes

Recipes that execute destructive commands assume `TESTRAIL_ALLOW_DESTRUCTIVE=1`
is set for the approved workflow. Every such call also requires `--yes`;
`--dry-run` needs neither gate.

### 1. Smoke-test auth & connectivity

<!-- recipe-for: user:list -->

```bash
testrail user list --project-id 5 --quiet && echo "auth OK" || echo "auth FAILED"
```

Exit code 0 = creds resolve and TestRail responds; 1 = anything broken.
Non-admin users need the project scope; administrators may omit `--project-id`.

### 2. Fetch a project

<!-- recipe-for: project:get -->

```bash
testrail project get 5
```

### 3. List projects with pagination

<!-- recipe-for: project:list -->

```bash
testrail project list --limit 25 --offset 0
testrail project list --page --limit 25 --offset 0
testrail project list --all --page-size 100
```

### 4. List suites under a project

<!-- recipe-for: suite:list -->

```bash
testrail suite list --project-id 5 --all
```

### 5. List cases in a specific suite

<!-- recipe-for: case:list -->

```bash
testrail case list --project-id 5 --suite-id 12 --all
```

### 6. Extract just the IDs from any list (generic pattern)

```bash
testrail case list --project-id 5 --all | jq '.[].id'
```

### 7. Count pass/fail for a run

<!-- recipe-for: run:get -->

```bash
testrail run get 42 | jq '{passed: .passed_count, failed: .failed_count}'
```

### 8. Collect a large result list safely

<!-- recipe-for: result:list -->

```bash
testrail result list --run-id 100 --all --page-size 100 --max-items 25000 \
  --created-after 1735689600 --created-by 7,8 --status-id 1,5 \
  --defects-filter JIRA-1234 \
  | jq -c '.[]'
```

### 9. Author a new test case

<!-- recipe-for: case:add -->

```bash
testrail case add 12 --data '{
    "title": "Login page accepts SSO redirect",
    "type_id": 1,
    "priority_id": 3,
    "refs": "JIRA-1234"
}'
```

### 10. Update a test case (partial fields)

<!-- recipe-for: case:update -->

```bash
testrail case update 87 --data '{"title": "Renamed", "priority_id": 4}'
```

### 11. Create a CI test run

<!-- recipe-for: run:add -->

```bash
RUN=$(testrail run add 5 --data '{
    "name": "CI build #'"$CI_BUILD_NUMBER"'",
    "include_all": false,
    "case_ids": [42, 43, 44]
}')
RUN_ID=$(echo "$RUN" | jq '.id')
```

### 12. Publish bulk results from a CI run

<!-- recipe-for: result:add-bulk -->

```bash
testrail result add-bulk "$RUN_ID" --data-file /tmp/results.json
```

Where `/tmp/results.json` has shape:

```json
{
    "results": [
        { "case_id": 42, "status_id": 1, "comment": "passed" },
        { "case_id": 43, "status_id": 5, "comment": "failed: timeout" }
    ]
}
```

### 13. Close a run when CI finishes

<!-- recipe-for: run:close -->

```bash
testrail run close "$RUN_ID" --yes
```

Destructive: closing a run is irreversible (TestRail has no `open_run`).
The `--yes` gate prevents accidental closure from agent-issued commands.
Combine with `--dry-run` (preview wins) to confirm the target before
committing.

### 14. Validate a payload before sending (`--dry-run`)

<!-- recipe-for: result:add -->

```bash
testrail result add 100 42 --data '{"status_id":1,"comment":"sanity check"}' --dry-run
```

Prints the parsed payload + a `"dryRun": true` marker; no API call made.

### 15. Attach a Playwright screenshot to a test result

<!-- recipe-for: result:add, attachment:add-to-result -->

```bash
RESULT=$(testrail result add "$RUN_ID" 42 --data '{"status_id":5,"comment":"failed"}')
RESULT_ID=$(echo "$RESULT" | jq '.id')
testrail attachment add-to-result "$RESULT_ID" --file ./test-results/screenshot.png
```

Output is `{ "attachment_id": <id> }`. Filename uploaded is `screenshot.png`
(basename of `--file`). Use `--filename <name>` to rename on upload.

### 16. Attach a repro file to a test case

<!-- recipe-for: attachment:add-to-case -->

```bash
testrail attachment add-to-case 42 --file ./repro.zip --filename "bug-1234-repro.zip"
```

`--filename` overrides the path basename so the attachment shows up with a
meaningful name in the TestRail UI even when the local file is generic.

### 17. Download the latest attachment on a case to inspect locally

<!-- recipe-for: attachment:list-for-case, attachment:get -->

```bash
LATEST_ID=$(testrail attachment list-for-case 42 --all | jq 'max_by(.created_on // 0) | .id // .attachment_id')
testrail attachment get "$LATEST_ID" --out ./fetched.bin
```

`--out` is required. Refuses to overwrite an existing file; pass `--force`
to overwrite. JSON ack on stdout includes `attachmentId`, `out`, and `size`.

`attachment list-for-case`, `list-for-run`, and `list-for-plan` are in
the pagination registry: use `--page` for metadata or `--all` for the
bounded complete array. Test-scoped listing retains its historical
single-response `--limit`/`--offset` options but does not expose
`--page`/`--all`. Plan-entry listing remains one-response-only.

```bash
# Collect every attachment on a long-lived case (50/request):
testrail attachment list-for-case 42 --all --page-size 50 | jq -c '.[]'
```

### 18. Audit then delete attachments on a deprecated case

<!-- recipe-for: attachment:list-for-case, attachment:delete -->

```bash
# 1. List + audit
testrail attachment list-for-case 42 --all

# 2. Dry-run each delete to preview intent without calling the API.
#    Passing --yes alongside --dry-run is optional but recommended:
#    dry-run wins (no API call either way), and including --yes here
#    means step 3 differs only by dropping --dry-run — minimum delta
#    between test and real invocation.
for ID in 101 102 103; do
    testrail attachment delete "$ID" --yes --dry-run
done

# 3. Real delete (drop --dry-run)
for ID in 101 102 103; do
    testrail attachment delete "$ID" --yes
done
```

### 19. Fetch a single test plan

<!-- recipe-for: plan:get -->

```bash
testrail plan get 50
```

### 20. List active plans for a project

<!-- recipe-for: plan:list -->

```bash
# Filter on the server; add `--milestone-id 4` when the workflow targets one milestone.
testrail plan list --project-id 1 --is-completed false --all --page-size 100
```

### 21. Create an empty test plan

<!-- recipe-for: plan:add -->

```bash
testrail plan add 1 --data '{
    "name": "Release 1.0",
    "description": "Smoke + regression for the 1.0 cut",
    "milestone_id": 4
}'
```

### 22. Create a plan with nested entries (matrix testing in one call)

<!-- recipe-for: plan:add, plan:update -->

```bash
# Each entry is a suite to run. `config_ids` slot the entry into a TestRail
# configuration matrix (e.g., Linux + macOS). The nested `runs[]` overrides
# per config — name is auto-derived from the config, so omit it.
testrail plan add 1 --data '{
    "name": "Release 1.0 — Cross-platform",
    "entries": [
        {
            "suite_id": 1,
            "include_all": true,
            "config_ids": [10, 11],
            "runs": [
                { "config_ids": [10], "assignedto_id": 7 },
                { "config_ids": [11], "assignedto_id": 8 }
            ]
        }
    ]
}'

# Rename the plan after creation:
testrail plan update 50 --data '{"name":"Release 1.0 — final"}'
```

### 23. Add an entry to an existing plan

<!-- recipe-for: plan:add-entry -->

```bash
# Use this for plans that grow over a release cycle. Returns the new entry
# (including its UUID-style `id` and the runs auto-created for any configs).
testrail plan add-entry 50 --data '{
    "suite_id": 2,
    "include_all": true,
    "assignedto_id": 7
}'
```

### 24. Results pipeline — choosing per-test vs per-case vs bulk endpoints

<!-- recipe-for: result:list-for-test -->
<!-- recipe-for: result:list-for-case -->
<!-- recipe-for: result:edit -->

TestRail exposes four ways to fetch results; the right one depends on what
IDs you already have and the granularity you need. Decision tree:

1. **You have a `test_id`** (a test is the run-instance of a case in a
   specific run) → `result list-for-test <test_id> --all`. Returns the full
   result history for that one test. Cheapest complete read when you already
   resolved the test from a previous `get_tests` / `get_test` lookup.

    ```bash
    testrail result list-for-test 4242 --all --page-size 50 --status-id 1,5
    ```

2. **You have a `run_id` and `case_id` but no `test_id`** →
   `result list-for-case <run_id> <case_id>`. TestRail resolves the
   test internally. Use this from CI when the test runner only knows the
   case ID (e.g. tagged in the test file) and the run it published to.

    ```bash
    # Find the most recent failure for case 87 in run 100, filtered by JIRA ticket
    testrail result list-for-case 100 87 --limit 1 --status-id 5 --defects-filter JIRA-1234
    ```

3. **You want every result in the run** (audit, export, dashboard) →
   `result list --run-id <id> --all`. Prefer this over N calls to
   `list-for-test` when N is the size of the run.

    ```bash
    # Whole-run reads support creator/date, status, and defect filters.
    testrail result list --run-id 100 --all --page-size 100 \
      --created-after 1735689600 --created-by 7,8 --status-id 1,5 \
      --defects-filter JIRA-1234
    ```

4. **You're writing, not reading** → `result add` (one), `result
add-bulk` (many by `case_id`), or `result add-bulk-by-test` (many by
   `test_id`). Already shipped; mirror the per-test / per-case split on
   the write side.

5. **You need to correct an existing result** → `result edit
<result_id>`. TestRail 10.4+ accepts a partial payload, so send only the
   fields that need changing:

    ```bash
    testrail result edit 9876 --data '{"comment":"Corrected after investigation"}'
    ```

Filter flags shared by `list-for-test` and `list-for-case`:

- `--status-id 1,5` — comma-separated status IDs (1 = passed,
  5 = failed; instance-specific values via `status list`).
- `--defects-filter JIRA-1234` — substring match on the result's
  `defects` field.
- `--limit N` / `--offset N` — pagination (TestRail caps `limit` at 250
  server-side).

Rule of thumb: prefer `list-for-test` when you already have a `test_id`
(one fewer server-side join); fall back to `list-for-case` when CI only
knows the case; reach for `list` only when you actually need every result
in the run.

### 25. Plan entries lifecycle (add → add-run → update → delete cascade)

<!-- recipe-for: plan:close -->
<!-- recipe-for: plan:delete -->
<!-- recipe-for: plan:delete-entry -->
<!-- recipe-for: plan:delete-run-from-entry -->

End-to-end walkthrough of a plan's lifecycle, showing where each
destructive operation fits. Every step is idempotent in isolation; the
cascade order (run → entry → plan) matters because `delete_plan` removes
everything inside it but `delete_plan_entry` only removes its own runs.

```bash
# 1. Create the plan
PLAN=$(testrail plan add 1 --data '{
    "name": "Release 1.0 — Cross-platform",
    "milestone_id": 4
}')
PLAN_ID=$(echo "$PLAN" | jq '.id')

# 2. Add an entry (a suite to run, optionally split across configs)
ENTRY=$(testrail plan add-entry "$PLAN_ID" --data '{
    "suite_id": 1,
    "include_all": true,
    "config_ids": [10, 11],
    "runs": [
        { "config_ids": [10], "assignedto_id": 7 },
        { "config_ids": [11], "assignedto_id": 8 }
    ]
}')
ENTRY_ID=$(echo "$ENTRY" | jq -r '.id')     # UUID-style string, NOT numeric

# 3. Add a fresh run to the entry (e.g. a newly-added platform).
#    If your CLI build is older than the one that shipped
#    `plan add-run-to-entry`, recreate the entry with the new
#    config_ids instead.
NEW_RUN=$(testrail plan add-run-to-entry "$PLAN_ID" "$ENTRY_ID" --data '{
    "config_ids": [12],
    "assignedto_id": 9
}')
NEW_RUN_ID=$(echo "$NEW_RUN" | jq '.id')

# 4. Update the entry's name/assignee/include_all across all its runs.
testrail plan update-entry "$PLAN_ID" "$ENTRY_ID" --data '{
    "name": "Cross-platform smoke (renamed)",
    "include_all": true
}'

# 5. Update a single run inside the entry (e.g. swap the assignee).
testrail plan update-run-in-entry "$NEW_RUN_ID" --data '{
    "assignedto_id": 10
}'

# 6. Delete cascade — narrowest first, widest last
#    a) Remove one specific run from its entry; siblings remain.
testrail plan delete-run-from-entry "$NEW_RUN_ID" --yes

#    b) Remove the entire entry (all of its remaining runs).
testrail plan delete-entry "$PLAN_ID" "$ENTRY_ID" --yes

#    c) Either close the plan (irreversible — preferred when results
#       need to be preserved) …
testrail plan close "$PLAN_ID" --yes

#    … or delete it outright (also irreversible; loses all results).
#    `delete_plan` does NOT support TestRail's --soft preview, so the
#    only safe rehearsal is --dry-run (client-side, no API call).
testrail plan delete "$PLAN_ID" --yes --dry-run    # preview
testrail plan delete "$PLAN_ID" --yes              # commit
```

Notes:

- `entry_id` is a UUID-style string TestRail mints server-side; pass it
  verbatim. The CLI rejects empty or whitespace-only values before
  calling the API.
- `--dry-run` always wins over `--yes`. Use it in CI to confirm the
  target before committing — `--yes --dry-run` emits a preview marked
  `"destructive": true` and makes no API call.
- `plan close` is irreversible — TestRail has no `open_plan`. Prefer it
  over `plan delete` when historical results matter (closed plans stay
  queryable; deleted plans take their runs and results with them).
- The chain `delete-run-from-entry → delete-entry → delete/close plan`
  is the safe top-down ordering. Reversing it (`delete plan` first)
  works but skips the audit trail of touching each layer; not
  recommended in shared/production projects.

### 26. Bulk case delete with `--soft` server-side preview

<!-- recipe-for: case:delete-bulk -->

Use `case delete-bulk` for mass cleanup (sunset features, deprecated
suites) or project archival where deleting cases one-by-one would burn
through the 100 req/60s rate budget. The action wraps TestRail's
`POST delete_cases/{suite_id}&project_id={project_id}` and accepts a
`case_ids: number[]` payload.

Three independent safety layers stack on top of each other; understand
which one runs where before invoking:

| Layer       | Side   | API call?      | What it does                                                      |
| ----------- | ------ | -------------- | ----------------------------------------------------------------- |
| `--dry-run` | client | no             | Short-circuits before the request; emits a parsed-payload preview |
| `--soft`    | server | yes (`soft=1`) | TestRail returns affected-test counts but does **not** delete     |
| `--yes`     | client | n/a            | Gate flag; without it the CLI exits 1 before any API call         |

`--dry-run` always wins over `--yes` and over `--soft`. `--soft` only
takes effect when an actual API call is made (i.e. `--yes` without
`--dry-run`).

Recommended workflow — preview server-side first, then commit:

```bash
# 1. Server-side preview: hit the API with soft=1 so TestRail returns
#    affected-test counts WITHOUT deleting. Confirms the IDs resolve in
#    the target suite/project and surfaces the blast radius (e.g. how
#    many tests inside open runs would be touched).
testrail case delete-bulk 12 --project-id 5 \
    --soft --yes \
    --data '{"case_ids":[101,102,103]}'

# 2. Review the returned preview. If the affected-test counts look
#    wrong (e.g. far more than expected, hitting active runs), STOP
#    and reconcile the case_ids list before continuing.

# 3. Real delete — drop --soft. This is irreversible.
testrail case delete-bulk 12 --project-id 5 \
    --yes \
    --data '{"case_ids":[101,102,103]}'
```

Flag-interaction matrix (verified against `handleCaseDeleteBulk`):

```bash
# (a) --dry-run --yes --soft → client-side preview, NO API call.
#     The preview JSON includes "destructive": true and "soft": true so
#     audit logs distinguish it from a plain dry-run. Safe in CI to
#     validate payload shape before consuming rate budget.
testrail case delete-bulk 12 --project-id 5 --yes --dry-run --soft \
    --data '{"case_ids":[101,102,103]}'

# (b) --soft --yes (no --dry-run) → real API call with soft=1.
#     Server returns affected-test counts; nothing is deleted.
#     Output: { "suiteId": 12, "projectId": 5, "soft": true,
#               "deleted": false, "preview": {...} }
testrail case delete-bulk 12 --project-id 5 --yes --soft \
    --data '{"case_ids":[101,102,103]}'

# (c) --yes (no --soft, no --dry-run) → real delete. Irreversible.
#     Output: { "suiteId": 12, "projectId": 5, "soft": false,
#               "deleted": true }
testrail case delete-bulk 12 --project-id 5 --yes \
    --data '{"case_ids":[101,102,103]}'

# (d) (no --yes) → exits 1: "Destructive action; pass --yes to confirm."
```

CI/automation pattern — fail loud if the soft preview indicates a
blast radius outside expectations:

```bash
# Pin the expected count of affected cases. If TestRail reports a
# different number, bail before the real delete. Adjust the jq path
# (`.preview.cases_to_delete` here) to whatever the soft response
# returns for your TestRail version.
EXPECTED=3
PREVIEW=$(testrail case delete-bulk 12 --project-id 5 --yes --soft \
    --data '{"case_ids":[101,102,103]}')
ACTUAL=$(echo "$PREVIEW" | jq '.preview.cases_to_delete // (.preview | length)')
if [ "$ACTUAL" != "$EXPECTED" ]; then
    echo "Bulk delete preview mismatch: expected $EXPECTED, got $ACTUAL" >&2
    exit 1
fi
testrail case delete-bulk 12 --project-id 5 --yes \
    --data '{"case_ids":[101,102,103]}'
```

Recovery if a delete fires by mistake:

- **No client-side recovery.** The CLI does not stage or buffer the
  request; once `--yes` (without `--dry-run`) is sent, TestRail deletes
  the cases server-side and returns 200.
- **TestRail audit log** (admin-only, web UI) records the delete with
  the acting user and timestamp. Use it to identify which cases were
  removed and replay their definitions from version control if the
  case bodies live in a repo (e.g. BDD `.feature` files committed
  alongside the test suite).
- **TestRail support recovery** is best-effort and depends on backup
  cadence (TestRail Cloud) or your self-hosted backup policy. Open a
  ticket immediately; don't wait — backups roll off.

The takeaway: treat `--soft --yes` as the rehearsal step in every CI
pipeline that touches bulk delete, and never invoke the no-`--soft`
form without a recent backup or a versioned definition of the cases
being removed.

### 27. Configuration groups & configs hierarchy management

<!-- recipe-for: configuration:list -->
<!-- recipe-for: configuration-group:add -->
<!-- recipe-for: configuration-group:delete -->
<!-- recipe-for: configuration:add -->
<!-- recipe-for: configuration:delete -->

TestRail models the test-environment matrix as a two-level tree:

```
project
└── config_group        (e.g. "Browsers", "Operating Systems")
    └── config (leaf)   (e.g. "Chrome", "Firefox", "Safari")
```

Plan entries reference individual `config_id` values to spin up
per-environment runs (see recipe 22 — "Plan entries with config matrices").
The CLI surfaces both layers via two resources:

- `configuration-group <action>` — operates on the group (parent).
- `configuration <action>` — operates on the leaf config OR lists the
  whole tree (`configuration list <project_id>` returns every group with
  its nested `configs[]` in one call; there is no separate
  list-configs-in-group endpoint upstream).

End-to-end walkthrough — create a matrix, list it, mutate it, then
tear it down in parent-after-child order:

```bash
# 1. Create a group at the project level.
GROUP=$(testrail configuration-group add 5 --data '{"name":"Browsers"}')
GROUP_ID=$(echo "$GROUP" | jq '.id')

# 2. Add leaf configs to the group. Each is independently addressable
#    by its own config_id and can be referenced from plan entries.
CHROME=$(testrail configuration add "$GROUP_ID" --data '{"name":"Chrome"}')
FIREFOX=$(testrail configuration add "$GROUP_ID" --data '{"name":"Firefox"}')
CHROME_ID=$(echo "$CHROME" | jq '.id')
FIREFOX_ID=$(echo "$FIREFOX" | jq '.id')

# 3. List the whole tree (one API call returns all groups + all configs).
testrail configuration list 5 | jq '.[] | {id, name, configs: [.configs[].name]}'

# 4. Rename a leaf config (e.g. clarify a version).
testrail configuration update "$CHROME_ID" --data '{"name":"Chrome (stable)"}'

# 5. Rename the group itself (configs underneath keep their IDs).
testrail configuration-group update "$GROUP_ID" --data '{"name":"Desktop Browsers"}'

# 6. Delete cascade — parent-after-child is the safe ordering.
#    a) Remove individual configs first. Any plan entry that referenced
#       this config loses it from its config selection; sibling configs
#       in the group are unaffected.
testrail configuration delete "$FIREFOX_ID" --yes

#    b) Then drop the whole group (TestRail cascades the remaining
#       configs server-side). Doing this first works but skips the
#       per-config audit trail.
testrail configuration-group delete "$GROUP_ID" --yes
```

Notes:

- `configuration-group delete` and `configuration delete` are both
  destructive: gated by `TESTRAIL_ALLOW_DESTRUCTIVE=1` + `--yes`, with no `--soft` server-side preview
  upstream (TestRail does NOT support `soft=1` on either endpoint).
  Use `--dry-run` (client-side, no API call) to validate the target
  before committing — `--yes --dry-run` emits a preview marked
  `"destructive": true`.
- Deleting a group cascades to every config in it. If you only need
  to retire a subset, delete the individual configs first
  (`configuration delete <config_id>`) and leave the group standing.
- Cascade caveat: deleting a config invalidates that selection on any
  plan entry referencing it. Existing runs/results in those entries
  survive (TestRail keeps historical results even when their config is
  removed), but new runs added to those plan entries will no longer
  offer the deleted config in their `config_ids[]` shortlist.
- Configurations are project-scoped; the same group/config name in a
  different project is a different ID. Always pair list/mutate calls
  with the project context.

### 28. Shared step propagation + history audit

<!-- recipe-for: shared-step:add -->
<!-- recipe-for: shared-step:update -->
<!-- recipe-for: shared-step:delete -->
<!-- recipe-for: shared-step:history -->

Shared steps let a single step block be reused across many test cases.
Editing the shared step updates **every case that references it** — the
change is server-side and propagates immediately, so a single
`shared-step update` can mutate hundreds of cases in one call. That
power cuts both ways: an unchecked edit is a fan-out blast radius.
Always audit references with `shared-step history` before any update or
delete.

Lifecycle walkthrough — create, reference from cases, update,
audit the blast radius, then retire safely:

```bash
# 1. Create the shared step at the project level. `custom_steps_separated`
#    is a free-form array of step objects (passthrough); TestRail
#    accepts whatever keys your project template defines (typically
#    `content`, `expected`, `additional_info`).
STEP=$(testrail shared-step add 5 --data '{
  "title": "Log in as admin",
  "custom_steps_separated": [
    {"content": "Navigate to /login", "expected": "Login form renders"},
    {"content": "Submit admin credentials", "expected": "Redirected to /dashboard"}
  ]
}')
SHARED_STEP_ID=$(echo "$STEP" | jq '.id')

# 2. Reference the shared step from a test case. In `custom_steps_separated`,
#    a step entry with `shared_step_id` points to the shared block;
#    TestRail expands it server-side when the case is rendered or copied
#    into a run. Mix inline steps and shared-step references freely.
testrail case add "$SECTION_ID" --data "{
  \"title\": \"Admin can delete users\",
  \"custom_steps_separated\": [
    {\"shared_step_id\": $SHARED_STEP_ID},
    {\"content\": \"Open /users\", \"expected\": \"User list renders\"},
    {\"content\": \"Click 'Delete' on a user row\", \"expected\": \"User removed\"}
  ]
}"

# 3. Audit BEFORE you mutate. `shared-step history` returns every prior
#    revision (timestamps + `user_id` + the `custom_steps_separated`
#    snapshot at that point) so you can see who last touched it and what
#    the cases inherited. The endpoint is response-driven: use --all
#    instead of inventing a request page size/offset.
testrail shared-step history "$SHARED_STEP_ID" --all --max-items 25000

# 4. Update the shared step. Every case referencing it now picks up the
#    new content on its next read (no per-case patch needed). The
#    history endpoint records this revision so future audits can trace
#    when behavior changed.
testrail shared-step update "$SHARED_STEP_ID" --data '{
  "title": "Log in as admin (MFA)",
  "custom_steps_separated": [
    {"content": "Navigate to /login", "expected": "Login form renders"},
    {"content": "Submit admin credentials", "expected": "MFA prompt shown"},
    {"content": "Enter TOTP code", "expected": "Redirected to /dashboard"}
  ]
}'

# 5. Confirm the revision landed. --page preserves the server page;
#    caller-controlled --limit/--offset are rejected in page mode.
testrail shared-step history "$SHARED_STEP_ID" --page | jq '.items[0]'

# 6. Retire the shared step. `--keep-in-cases true` preserves its expanded
#    content in referencing cases while breaking the shared association.
#    It is TestRail's default, but spelling it out makes agent intent auditable.
testrail shared-step delete "$SHARED_STEP_ID" --keep-in-cases true --yes --dry-run
testrail shared-step delete "$SHARED_STEP_ID" --keep-in-cases true --yes

# Use false only when the content should also be removed from referencing cases.
testrail shared-step delete "$SHARED_STEP_ID" --keep-in-cases false --yes --dry-run
```

Notes:

- **Propagation is immediate and server-side.** Updates to a shared
  step take effect the next time any referencing case is read by the
  API, the UI, or a run. There is no per-case cache to invalidate on
  the client side; the GET-LRU in this client keys by endpoint, so
  `case get` for a referencing case must be re-fetched (or cache
  bypassed) after `shared-step update` to see the new content.
- **Deletion never deletes the case rows.** The request's `keep_in_cases`
  field controls the shared content: the default (`--keep-in-cases true`)
  preserves expanded content in each referencing case while removing the
  shared association; `false` asks TestRail to remove that content too.
  Existing runs retain their historical step text and results.
- **Audit before every mutation.** `shared-step history` is the only
  reliable way to see how many revisions a shared step has accumulated
  and who touched it last. A high revision count on a step
  referenced by hundreds of cases means an update has a wide blast
  radius — review the inline steps before pushing. The history
  response may be paginated, but it does not document request controls.
  Use `--all` with safety bounds such as `--max-items`; continuation
  comes from the response. Do not use `--page-size`/`--start-offset`.
- **No bulk reference lookup upstream.** TestRail does not expose a
  "list cases referencing shared step X" endpoint. To estimate impact
  before an update, page through `case list` for the project/suite
  and `jq` over `custom_steps_separated[]?.shared_step_id` looking
  for the target ID. The walk is read-only and cache-friendly.
- **Empty update payloads are accepted.** `UpdateSharedStepPayloadSchema`
  intentionally allows `{}` (every field optional, matching
  `UpdateMilestonePayloadSchema`) — TestRail treats it as a no-op.
  This is a schema-layer decision; if you want non-empty enforcement,
  validate above the CLI before invoking.
- **`shared-step delete` is destructive, gated by `TESTRAIL_ALLOW_DESTRUCTIVE=1` + `--yes`.** Mirrors
  `milestone delete` / `plan delete`: no `--soft` server-side preview
  upstream, so the only preview mechanism is client-side `--dry-run`.
  Use `--keep-in-cases true|false` to make the retention choice explicit;
  omitted means TestRail's default `true`.
  `--dry-run` wins
  over `--yes` so `--yes --dry-run` always short-circuits without
  hitting the API.

### 29. Data-driven runs via Variables + Datasets

<!-- recipe-for: dataset:get -->
<!-- recipe-for: dataset:list -->
<!-- recipe-for: dataset:add -->
<!-- recipe-for: dataset:update -->
<!-- recipe-for: dataset:delete -->

TestRail's data-driven testing pairs two project-scoped resources:

- **Variables** — named placeholders referenced inside case steps using
  `${var_name}` syntax (e.g. `${env}`, `${region}`). Manage with
  `variable add | update | delete` and list with `variable list`.
- **Datasets** — named maps from variable names to string values. The write
  payload uses `variables: Record<string, string>`; responses expand that map
  into entries containing each variable's server ID, name, and value.

Together they let one test case run N times against N environments
without duplicating the case definition. Workflow:

```bash
# 1. Define the variables at project level (one-time setup).
#    Dataset payloads use variable names; capture IDs only for later teardown.
ENV=$(testrail variable add 5 --data '{"name":"env"}')
REGION=$(testrail variable add 5 --data '{"name":"region"}')
ENV_ID=$(echo "$ENV" | jq '.id')
REGION_ID=$(echo "$REGION" | jq '.id')

# 2. Create a dataset in the same project and assign values by variable name.
#    Values must be strings; use "" when an intentionally empty value is needed.
DATASET=$(testrail dataset add 5 --data '{
  "name":"Staging EU",
  "variables":{"env":"staging.example.com","region":"eu-west-1"}
}')
DATASET_ID=$(echo "$DATASET" | jq '.id')

# 3. Reference variables in case steps with ${name} placeholders.
#    Example case step content:
#      "Navigate to ${env}.example.com and select region ${region}."
#    Selecting this dataset supplies its string values during execution.

# 4. Inspect every dataset definition and its expanded variables.
testrail dataset list 5 --all

# 5. Fetch one dataset by ID to confirm its values before selecting it.
testrail dataset get "$DATASET_ID"

# 6. Rename the dataset and replace its variable-value map.
testrail dataset update "$DATASET_ID" --data '{
  "name":"Production EU",
  "variables":{"env":"prod.example.com","region":"eu-west-1"}
}'

# 7. Tear down — variables and datasets are independently deletable.
#    Both deletes are destructive (no --soft; env unlock + --yes required).
testrail dataset delete "$DATASET_ID" --yes
testrail variable delete "$REGION_ID" --yes
testrail variable delete "$ENV_ID" --yes
```

Example payload — `name` is required and `variables` is an optional map whose
keys are existing project variable names and whose values are strings.
`custom_*` extras pass through unchanged:

```jsonc
{
    "name": "Staging EU",
    "variables": {
        "env": "staging.example.com",
        "region": "eu-west-1",
    },
    "custom_owner": "qa-team",
}
```

Notes:

- **CLI writes include values.** `dataset add | update` accept both `name`
  and `variables`. Every map value must be a string; numbers, booleans,
  arrays, and objects fail Zod validation before an API call. On update,
  supply the complete variable-value map you want TestRail to store.
- **Variable references use `${name}` syntax inside case steps.** The
  literal `${env}` in a step's `content`, `expected`, or `additional_info`
  field is substituted at run-execution time with the value from the
  current dataset row. Misspelled placeholders render verbatim — there
  is no validation hop between case definition and run execution.
- **Selection is separate from CRUD.** These endpoints create, inspect,
  update, and delete project dataset definitions. Select datasets when
  configuring the data-driven run in TestRail; the dataset CRUD payload does
  not carry a run or plan-entry ID.
- **Destructive lifecycle.** `dataset delete` follows the locked-in
  destructive pattern: `--yes` required, `--dry-run` wins for
  preview-without-API, and `--soft` is rejected (TestRail's
  `delete_dataset` does not support soft preview — mirrors
  `variable delete` / `milestone delete` / `project delete`). Deleting
  a dataset that's bound to an active plan entry invalidates that
  entry's data-driven configuration; existing historical results
  survive but new runs lose the substitution matrix.
- **Project-scoped IDs.** Both variables and datasets are addressed by
  global IDs but scoped to a project. The same `name` in a different
  project is a different ID; always pair list/mutate calls with the
  project context (`variable list <project_id>` /
  `dataset list <project_id>`).

### 30. Bulk-author cases under a section in one API call

<!-- recipe-for: case:add-bulk -->

Use `case add-bulk` to seed many cases at once (e.g. importing a CSV /
generating cases from a spec document) without burning through the
100 req/60s rate budget one POST at a time. The body is a **JSON array**
of case payloads — each item has the same shape as `case add`.

```bash
# Author 3 cases under section 12 in one round-trip.
testrail case add-bulk 12 --data '[
    {"title": "Login form rejects invalid email", "type_id": 1, "priority_id": 3},
    {"title": "Login form rejects empty password", "type_id": 1, "priority_id": 3},
    {"title": "Login form respects redirect_to query param", "type_id": 1, "priority_id": 2}
]'
```

```bash
# Or from a file when the array is large.
testrail case add-bulk 12 --data-file ./cases-to-import.json
```

`--dry-run` validates the array (and each item) against Zod **without**
calling the API — useful for previewing the parsed payload before
committing a multi-hundred-case import. The dry-run preview includes a
`count` field so agents can confirm the array length matches their
source data.

TestRail's 7.0 release notes already describe `add_cases` as an updated
endpoint, so the client does not impose the former 7.5+ version gate or
rewrite ordinary server errors as version failures. The CLI accepts an array
for agent ergonomics; the client wraps it as the live-proven
`{"cases":[...]}` request and decodes the matching response envelope. An
unknown successful response fails closed as an indeterminate write outcome —
do not retry blindly because the cases may already have been created.

### 31. Watch a run until completion (CI integration)

<!-- recipe-for: run:watch -->

`run watch` polls `get_run/{run_id}` on a fixed interval (default 30s)
and emits an event each time one of the watched counters changes. With
`--format json` the event is structured JSON; with `--format table` the
same event object is rendered as a table row. The watcher exits with code 0 the moment TestRail
flips `is_completed` to `true` — useful for CI pipelines that need to
block until a manual / external run completes before publishing
reports, sending notifications, or promoting a deploy.

Watched fields (closed set; mutable timestamps like `completed_on` are
intentionally ignored to avoid noisy events):

- `is_completed`
- `passed_count` / `failed_count` / `retest_count`
- `blocked_count` / `untested_count`

```bash
# Block until run 42 completes; emit per-change diffs along the way.
testrail run watch 42
```

```bash
# Tight CI loop: poll every 10 seconds instead of the default 30.
# Interval bounds are [5, 600] seconds — outside that range the CLI
# exits 1 fail-fast before any API call. 5s is the floor to protect
# the default 100 req/60s rate budget under fleet usage.
testrail run watch 42 --interval 10
```

```bash
# One-shot status check: poll once, emit the snapshot, exit 0
# regardless of is_completed. Useful when you want the watcher's
# rendering without a long-running process.
testrail run watch 42 --once
```

Example event output (`--format json`):

```json
{
  "event": "snapshot",
  "runId": 42,
  "is_completed": false
}
{
  "event": "change",
  "runId": 42,
  "changes": [{ "field": "passed_count", "from": 7, "to": 8 }]
}
{
  "event": "completed",
  "runId": 42,
  "is_completed": true
}
```

SIGINT (Ctrl-C) is handled gracefully: the watcher cancels the pending
timeout, writes a one-line `interrupted` summary with the last seen
snapshot to **stderr**, and exits with code 130 (POSIX convention).
Subsequent transient `getRun` failures (network blip, 5xx) surface on
stderr but do not abort the watcher — only an unrecoverable rejection
(e.g. auth lost mid-watch) propagates and triggers exit 1.

### 32. Create a user (TestRail 7.3+)

<!-- recipe-for: user:add -->

`user add` calls `POST add_user` and returns the created `User` object.
Only `name` and `email` are required by the TestRail 10.7 contract. Optional
fields are `is_active`, `is_admin`, `role_id`, `group_ids`, `mfa_required`,
`email_notifications`, `sso_enabled`, and `assigned_projects`. The schema
passes unknown future fields through, but it does not advertise `password` or
`language`, which are absent from the 10.7 request table.

```bash
# Minimal documented request
testrail user add --data '{"name":"Alice Smith","email":"alice@example.com"}'
```

```bash
# Use a file for a larger provisioning policy.
# It may include role_id, group_ids, assigned_projects, and account flags.
testrail user add --data-file ./new-user.json
```

```bash
# Dry-run: validate the payload without hitting the API
testrail user add --data-file ./new-user.json --dry-run
# → {"dryRun":true,"action":"user add","payload":{...},"source":"file"}
```

```typescript
// Programmatic equivalent
import { TestRailClient } from '@dichovsky/testrail-api-client';
const client = new TestRailClient({ baseUrl, email, apiKey });
const user = await client.users.addUser({
    name: 'Alice Smith',
    email: 'alice@example.com',
    role_id: 3,
    assigned_projects: [5],
});
console.log(user.id); // assigned user ID
```

### 33. Update a user (TestRail 7.3+)

<!-- recipe-for: user:update -->

`user update <user_id>` calls `POST update_user/{user_id}` and returns the
updated `User` object. All fields are optional (PATCH semantics): send only
the fields you want to change. An empty `{}` body is accepted by TestRail
and returns the user unchanged. The documented field set matches `user add`;
`password` and `language` are not claimed as TestRail 10.7 update fields.

```bash
# Deactivate a user
testrail user update 42 --data '{"is_active":false}'
```

```bash
# Change display name and role
testrail user update 42 --data '{"name":"Alice Smith-Jones","role_id":5}'
```

```bash
# Update project assignment and SSO policy
testrail user update 42 --data '{"assigned_projects":[5,8],"sso_enabled":true}'
```

```bash
# Dry-run: verify what would be sent without making an API call
testrail user update 42 --data '{"name":"Preview Name"}' --dry-run
# → {"dryRun":true,"action":"user update","userId":42,"payload":{"name":"Preview Name"},"source":"data"}
```

```typescript
// Programmatic equivalent
const updated = await client.users.updateUser(42, { name: 'Alice Smith-Jones', role_id: 5 });
```

### 34. Add a single test result by test ID

<!-- recipe-for: result:add-by-test -->

`result add-by-test` wraps `POST add_result/{test_id}` — the lightest write
path when you already hold a `test_id` (the run-scoped instance of a case).
Unlike the per-case endpoint (`result add`), this path does not require a
`run_id`; the `test_id` alone identifies the target unambiguously.

```bash
testrail result add-by-test 123 --data '{"status_id":1,"comment":"PASS — verified","elapsed":"45s","version":"2.4.1"}'
```

Default `status_id` mapping (project-specific values may differ — verify with
`testrail status list`):

| ID  | Meaning  |
| --- | -------- |
| 1   | Passed   |
| 2   | Blocked  |
| 3   | Untested |
| 4   | Retest   |
| 5   | Failed   |

**When to use per-test vs alternatives:**

- `result add-by-test <test_id>` — one result, you already have the `test_id`
  (e.g. captured from `testrail test list <run_id> --all`). Fewest API calls.
- `result add <run_id> <case_id>` — one result, you have `run_id` + `case_id`
  but no `test_id`. TestRail resolves the test internally.
- `result add-bulk-by-case <run_id>` — many results, identified by `case_id`.
  Prefer this for CI pipelines that report by case, not by test instance.
- `result add-bulk-by-test <run_id>` — many results, identified by `test_id`.
  Use when you have the full test-instance list (e.g. from `test list <run_id> --all`).

**Dry-run preview (no API call):**

```bash
testrail result add-by-test 123 --dry-run --data '{"status_id":5,"comment":"Failed on step 3"}'
```

**Custom fields** pass through transparently (`.passthrough()` schema):

```bash
testrail result add-by-test 123 --data '{"status_id":1,"custom_env":"staging","custom_browser":"chrome"}'
```

### 35. Attachment lifecycle (entry types: plan, plan-entry, run, test)

<!-- recipe-for: attachment:list-for-plan -->
<!-- recipe-for: attachment:list-for-plan-entry -->
<!-- recipe-for: attachment:list-for-run -->
<!-- recipe-for: attachment:list-for-test -->
<!-- recipe-for: attachment:add-to-plan -->
<!-- recipe-for: attachment:add-to-plan-entry -->
<!-- recipe-for: attachment:add-to-run -->

Attachments can be stored on four entry types beyond cases and results:
test plans, plan entries, test runs, and individual tests. This recipe
covers the listing and upload workflows for each. Like recipe 16/17/18,
uploads use `--file <path>` (or `--file -` for stdin) and `--filename`
overrides the basename.

**Upload workflow — add attachments to a plan and plan entry:**

```bash
# Upload a requirements document to a test plan.
testrail attachment add-to-plan 100 --file ./requirements.pdf

# Upload a config matrix reference to a plan entry
# (entry_id is a UUID-style string, NOT an integer).
testrail attachment add-to-plan-entry 100 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6' \
  --file ./config-matrix.xlsx
```

**Upload workflow — add attachments to a run and individual tests:**

```bash
# Upload a build log to the entire run.
testrail attachment add-to-run 42 --file ./build.log

# Upload a screenshot to a single test (run instance of a case).
testrail attachment add-to-test 1337 --file ./screenshot.png
```

**Listing workflow — pagination support varies:**

```bash
# Collect every attachment page on a plan.
testrail attachment list-for-plan 100 --all --page-size 100 \
  | jq '.[] | {id, filename, size}'

# Plan-entry listing remains one-response-only.
testrail attachment list-for-plan-entry 100 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6' \
  | jq '.[] | {id, filename, size}'

# Preserve one run-attachment page with metadata.
testrail attachment list-for-run 42 --page --limit 50 --offset 0

# Test listing has only the historical one-response controls.
testrail attachment list-for-test 1337 --limit 50
```

**Dry-run preview — validate the upload path before committing:**

```bash
testrail attachment add-to-plan 100 --file ./doc.pdf --dry-run
```

**Destructive gate — delete attachments from any entry type:**

Deletion is the same across all entry types (there is no per-entry-type
delete command):

```bash
# Retrieve attachment IDs first.
PLAN_ATTACHMENTS=$(testrail attachment list-for-plan 100 --all)
ATTACH_ID=$(echo "$PLAN_ATTACHMENTS" | jq '.[0].id')

# Dry-run.
testrail attachment delete "$ATTACH_ID" --yes --dry-run

# Real delete.
testrail attachment delete "$ATTACH_ID" --yes
```

Notes:

- **Entry types and scope.** Cases and results are the most common
  attachment targets (`attachment add-to-case`, `add-to-result` from
  recipes 16–18). Plan-scoped attachment listing
  (`list-for-plan`, `list-for-plan-entry`) is useful for attaching
  requirements matrices or config docs that apply to the whole plan or
  a specific plan entry. Run and test attachments are less common but
  mirror the case/result patterns: use `add-to-run` for run-wide
  artifacts and `add-to-test` for test-specific logs or media.
- **Pagination on listing.** Case-, run-, and plan-scoped lists expose
  default/`--page`/`--all` modes and documented request controls.
  Plan-entry listing is one-response-only. Test listing keeps legacy
  `--limit`/`--offset`, but it is outside the page/all registry. Every
  listing accepts `--format json` (default) or `--format table`.
- **Upload options.** Both `--file <path>` (local file) and
  `--file -` (stdin) are supported. `--filename <name>` overrides the
  basename; omit it to use the local filename. See recipe 16 for the
  `--filename` pattern.
- **Dry-run and destructive gates.** All write actions (`add-to-*`)
  support `--dry-run` (client-side validation, no API call). Delete
  requires `TESTRAIL_ALLOW_DESTRUCTIVE=1` + `--yes`; `--dry-run --yes`
  emits a preview without the env unlock.

### 36. Variable CRUD lifecycle

<!-- recipe-for: variable:list -->
<!-- recipe-for: variable:add -->
<!-- recipe-for: variable:update -->
<!-- recipe-for: variable:delete -->

Variables are project-scoped named placeholders for data-driven testing
(see recipe 29 for the full workflow with datasets). This recipe covers
the metadata-only variable CRUD — renaming and lifecycle.

**Create variables:**

```bash
# Add a variable to a project (name is required; custom_* extras passthrough).
ENV=$(testrail variable add 5 --data '{"name":"env"}')
ENV_ID=$(echo "$ENV" | jq '.id')

# With custom fields.
REGION=$(testrail variable add 5 --data '{"name":"region","custom_owner":"qa-team"}')
REGION_ID=$(echo "$REGION" | jq '.id')
```

**List variables in a project:**

```bash
# All variables in the project.
testrail variable list 5 --all

# Extract IDs for downstream operations.
testrail variable list 5 --all | jq '.[] | {id, name}'
```

**Update (rename) a variable:**

```bash
# The `update` endpoint only accepts `name` (and custom_* fields).
testrail variable update "$ENV_ID" --data '{"name":"environment"}'
```

**Delete variables (destructive):**

```bash
# Dry-run — no API call, just validate the shape.
testrail variable delete "$ENV_ID" --yes --dry-run

# Real delete — irreversible.
testrail variable delete "$ENV_ID" --yes
```

**Example — data-driven test provisioning:**

```bash
# Provision variables for a staging test matrix.
ENVS=$(testrail variable add 5 --data '{"name":"env"}' | jq '.id')
REGIONS=$(testrail variable add 5 --data '{"name":"region"}' | jq '.id')

# Reference them in case steps with ${env}, ${region}.
# (The web UI or API step-insertion workflow adds the case content.)

# Tear down at end of test cycle.
testrail variable delete "$ENVS" --yes
testrail variable delete "$REGIONS" --yes
```

Notes:

- **Project-scoped IDs.** Each variable's ID is global but the variable
  is scoped to a project. The same `name` in a different project is a
  different ID. Always pair list/mutate calls with the project context
  (`variable list <project_id>`).
- **Variable definitions are name-only.** `variable add/update` manage the
  project placeholder names. Supply their string values through
  `dataset add/update --data '{"variables":{"name":"value"}}'`; no
  undocumented row-CRUD endpoint is required.
- **Destructive gate.** `variable delete` is irreversible — requires
  `--yes` and does not support `--soft` server-side preview (TestRail's
  `delete_variable` endpoint does not expose a soft mode). Use
  `--dry-run` to validate intent before committing.
- **Linked to datasets.** Variables are referenced by name inside each
  dataset's `variables` map. Audit and update those maps before deleting a
  variable so case placeholders do not lose their value source.

### 37. Configuration mutation: update configuration & configuration-group

<!-- recipe-for: configuration:update -->
<!-- recipe-for: configuration-group:update -->

This recipe covers the update (rename) path for configurations and
configuration groups. For the full hierarchy lifecycle (add, list, delete),
see recipe 27. Updates are the narrow case — partial field mutations
on existing configs/groups.

**Update a configuration group (rename):**

```bash
# Fetch the ID (from configuration list or earlier add).
testrail configuration-group update 7 --data '{"name":"Desktop Browsers"}'
```

**Update a configuration (leaf; rename):**

```bash
# Configuration update takes a config_id (NOT a config_group_id).
testrail configuration update 12 --data '{"name":"Chrome (v120+)"}'
```

**Verify changes:**

```bash
# List the entire tree to confirm the rename propagated.
testrail configuration list 5 | jq '.[] | {id, name, configs: [.configs[].name]}'
```

**Programmatic perspective — TypeScript:**

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';

const client = new TestRailClient({...});

// Rename a configuration group.
await client.configurations.updateConfigurationGroup(7, { name: 'Desktop Browsers' });

// Rename a leaf configuration.
await client.configurations.updateConfiguration(12, { name: 'Chrome (v120+)' });

// List the tree to verify.
const groups = await client.configurations.getConfigurations(5);
groups.forEach((g) => console.log(g.name, g.configs.map((c) => c.name)));
```

Notes:

- **Update is rename-only (on CLI).** The `update_config` and
  `update_config_group` endpoints accept only the `name` field.
  Custom fields are NOT supported (the configuration API does not
  expose a `custom_*` passthrough). If you need to reorder or manage
  other metadata, use the TestRail web UI.
- **Leaf vs parent scope.** Configuration groups (`configuration-group`)
  and individual configs (`configuration`) are separate resources with
  different ID spaces. Renaming a group does not affect its children;
  renaming a config does not affect its siblings.
- **Impact on plan entries.** Renaming a config invalidates the human-
  readable shortlist in plan-entry UIs (the config remains functional —
  the ID is stable, only the display name changes). Existing runs and
  results that reference the old name survive unchanged; the new name
  applies to future selections.
- **Non-destructive.** Updates are safe — TestRail keeps the ID and
  does not cascade or require `--yes` confirmation. Pair with
  `configuration list <project_id>` to inspect the tree before renaming.

### 38. Plan entry extensions — add/update runs within existing entries

<!-- recipe-for: plan:add-run-to-entry -->
<!-- recipe-for: plan:update-entry -->
<!-- recipe-for: plan:update-run-in-entry -->

Once a plan entry exists (created with `plan add-entry`), extend it by adding new config-specific runs (when
you add support for a new platform mid-cycle) and by mutating the entry's metadata (name, assignee, case
selection) across all its runs.

**Add a fresh run to an entry (new platform):**

```bash
# Plan 100, entry a1b2c3d4e5f6... already has runs for Chrome & Firefox.
# Add a fresh run for Safari.
RESULT=$(testrail plan add-run-to-entry 100 a1b2c3d4e5f6 --data '{
    "config_ids": [3],
    "assignedto_id": 9
}')
echo "$RESULT" | jq '.id'  # New run_id, can be used in `result add` or `run watch`
```

Payload keys:

- `config_ids` (required) — TestRail configuration IDs for this run (array of integers).
- `assignedto_id` (optional) — User ID to assign the run to.
- `include_all` (optional) — If `true`, include all cases in the suite; if `false`, include only
  cases specified by `case_ids`.
- `case_ids` (optional) — Array of case IDs to include (ignored if `include_all: true`).

**Update entry metadata across all its runs:**

```bash
# Rename the entry & swap assignee (applies to every run in the entry)
testrail plan update-entry 100 a1b2c3d4e5f6 --data '{
    "name": "Smoke tests (renamed)",
    "assignedto_id": 10,
    "include_all": false,
    "case_ids": [1, 2, 3, 5]
}'
```

Payload keys:

- `name` (optional) — New entry name.
- `assignedto_id` (optional) — New assignee user ID.
- `include_all` (optional) — Toggle case selection mode (`true` = all; `false` = selection).
- `case_ids` (optional) — If `include_all: false`, which cases to include.

**Update a single run inside an entry (swap assignee, refine case selection):**

```bash
# Reassign Safari run to user 11 and include only specific cases
SAFARI_RUN_ID=42
testrail plan update-run-in-entry "$SAFARI_RUN_ID" --data '{
    "description": "Safari smoke suite",
    "assignedto_id": 11,
    "include_all": false,
    "case_ids": [1, 2, 3, 5]
}'
```

Payload keys (only these fields are mutable for runs inside entries):

- `description` (optional) — Run description.
- `assignedto_id` (optional) — Assignee user ID.
- `include_all` (optional) — Case selection mode toggle.
- `case_ids` (optional) — Case IDs if `include_all: false`.

**Dry-run preview:**

```bash
testrail plan update-entry 100 a1b2c3d4e5f6 --dry-run --data '{"name": "New name"}'
```

See also recipe #25 for the full plan lifecycle (add → entry → runs → close/delete cascade).

### 39. Run lifecycle — list active runs, update metadata, close and delete

<!-- recipe-for: run:list -->
<!-- recipe-for: run:update -->
<!-- recipe-for: run:delete -->

Runs are the execution containers for test cases. Typical workflows: enumerate active runs for a project,
update run metadata (milestone, assignee), and eventually close or delete the run and its associated results.

**List runs in a project:**

```bash
# Page 1: first 250 (default limit)
testrail run list --project-id 5 | jq '.[] | {id, name, is_completed, passed_count, failed_count}'

# Page 2 with custom limit
testrail run list --project-id 5 --offset 250 --limit 100 | jq '.[] | select(.is_completed == false)'

# Collect all response pages, then filter with jq.
testrail run list --project-id 5 --all --page-size 100 \
  | jq '.[] | select(.is_completed == false) | {id, name}'
```

`run list` returns an array of run objects with:

- `id` (number) — Run ID.
- `name` (string) — Run name.
- `is_completed` (boolean) — Whether the run is closed.
- `passed_count`, `failed_count`, `blocked_count`, `untested_count` (numbers) — Result summary.
- `completed_on` (number | null) — Timestamp if closed.
- `milestone_id` (number | null) — Associated milestone ID.
- `assignedto_id` (number | null) — Assigned user ID.

**Update run metadata:**

```bash
# Re-assign, add milestone, update description
testrail run update 42 --data '{
    "name": "Chrome desktop @ v2.0",
    "milestone_id": 7,
    "assignedto_id": 9,
    "description": "Updated to cover 2.0 release"
}'

# Dry-run (no API call)
testrail run update 42 --dry-run --data '{"milestone_id": 8}'
```

Payload keys (all optional):

- `name` — New run name.
- `description` — Run description.
- `milestone_id` — Milestone to associate (or `null` to clear).
- `assignedto_id` — Assignee user ID (or `null` to clear).
- `include_all` — Redefine case selection (rarely done post-creation).
- `case_ids` — Case selection if `include_all: false`.

**Close a run (irreversible — preferred when preserving results):**

```bash
# Close the run — results stay queryable, but no new results can be added
testrail run close 42 --yes

# Dry-run preview
testrail run close 42 --yes --dry-run
```

A closed run's `is_completed` flag becomes `true` and `completed_on` is set to the current timestamp.
TestRail has no `open_run` endpoint; closing is not reversible.

**Delete a run (irreversible — removes run and all results):**

```bash
# Delete the run and every result in it
testrail run delete 42 --yes

# Server-side preview (TestRail returns affected-test count without deleting)
testrail run delete 42 --yes --soft

# Dry-run (client-side preview, no API call)
testrail run delete 42 --yes --dry-run
```

Differences:

- `--soft` — Test TestRail's soft-delete preview (API call made, no deletion).
- `--dry-run` — Client-side prediction only (no API call); overrides `--yes`.
- `--yes` — Required gate for destructive operation.

**Status check from `run list` output:**

```bash
# Count active vs closed runs
RUNS=$(testrail run list --project-id 5 --all)
ACTIVE=$(echo "$RUNS" | jq '[.[] | select(.is_completed == false)] | length')
CLOSED=$(echo "$RUNS" | jq '[.[] | select(.is_completed == true)] | length')
echo "Active: $ACTIVE, Closed: $CLOSED"
```

See recipe #31 for polling a run until completion with `run watch`.

### 40. Milestone lifecycle — read, list, create, update, close and delete

<!-- recipe-for: milestone:get -->
<!-- recipe-for: milestone:list -->
<!-- recipe-for: milestone:add -->
<!-- recipe-for: milestone:update -->
<!-- recipe-for: milestone:delete -->

Milestones group runs and plans into named release checkpoints. This recipe covers the complete CRUD
lifecycle: fetch individual milestones, list them per project, create new ones, update metadata
(including `is_completed` / `is_started` toggles), and delete old milestones.

**Fetch a single milestone:**

```bash
testrail milestone get 7 | jq '{id, name, description, is_completed, is_started}'
```

Returns a milestone object with:

- `id` (number) — Milestone ID.
- `name` (string) — Milestone name.
- `description` (string) — Milestone description.
- `due_on` (number | null) — Unix timestamp of deadline.
- `is_completed` (boolean) — Whether marked complete.
- `is_started` (boolean) — Whether marked started (TestRail 5.3+).
- `completed_on` (number | null) — Timestamp when completed.
- `project_id` (number) — Parent project ID.

**List milestones in a project:**

```bash
# All milestones, any status
testrail milestone list --project-id 5 --all | jq '.[] | {id, name, is_completed}'

# Filter to active milestones (not completed)
testrail milestone list --project-id 5 --all | jq '.[] | select(.is_completed == false)'

# Pagination example
testrail milestone list --project-id 5 --offset 250 --limit 50
```

**Create a new milestone:**

```bash
MILESTONE=$(testrail milestone add 5 --data '{
    "name": "Release 2.0",
    "description": "Q2 2025 feature release",
    "due_on": 1718736000
}')
MILESTONE_ID=$(echo "$MILESTONE" | jq '.id')
echo "Created milestone $MILESTONE_ID"
```

Payload keys:

- `name` (required) — Milestone name.
- `description` (optional) — Milestone description.
- `due_on` (optional) — Unix timestamp deadline.
- `parent_id` (optional) — Parent milestone ID for hierarchy (TestRail 5.3+).

`is_started` is not an add-milestone field. Create the milestone first, then
set it with `milestone update` when work begins.

**Update milestone metadata:**

```bash
# Rename, adjust deadline, or mark as started
testrail milestone update 7 --data '{
    "name": "Release 2.0 (delayed)",
    "due_on": 1725312000,
    "is_started": true
}'

# Mark complete
testrail milestone update 7 --data '{"is_completed": true}'

# Dry-run preview
testrail milestone update 7 --dry-run --data '{"is_completed": true}'
```

Payload keys (all optional):

- `name` — New milestone name.
- `description` — New description.
- `due_on` — New deadline (Unix timestamp, or `null` to clear).
- `is_completed` — Mark as complete (`true`) or reopen (`false`).
- `is_started` — Mark as started (TestRail 5.3+; update-only).

**Delete a milestone (irreversible):**

```bash
# Delete the milestone (associated runs/plans are unaffected)
testrail milestone delete 7 --yes

# Dry-run (client-side prediction, no API call)
testrail milestone delete 7 --yes --dry-run
```

TestRail does not support `--soft` for milestone deletion. Use `--dry-run`
to validate the target without an API call, then drop `--dry-run` for the
irreversible delete.

When a milestone is deleted, runs/plans that reference it keep their `milestone_id` field but the
milestone record itself is removed. A subsequent `milestone list` will not include it.

**Workflow example — release versioning:**

```bash
# Create milestones for the quarter
M1=$(testrail milestone add 5 --data '{"name":"2.0 alpha","due_on":1718736000}' | jq -r '.id')
M2=$(testrail milestone add 5 --data '{"name":"2.0 beta","due_on":1721328000}' | jq -r '.id')
M3=$(testrail milestone add 5 --data '{"name":"2.0 GA","due_on":1723920000}' | jq -r '.id')

# As work progresses, mark milestones started/complete
testrail milestone update "$M1" --data '{"is_started":true}'
testrail milestone update "$M1" --data '{"is_completed":true}'   # alpha done
testrail milestone update "$M2" --data '{"is_started":true}'     # beta starts

# Clean up old milestones from previous quarter
OLD_MILESTONE=$(testrail milestone list --project-id 5 --all | jq -r '.[] | select(.name == "1.9 GA") | .id')
test -n "$OLD_MILESTONE" && testrail milestone delete "$OLD_MILESTONE" --yes
```

### 41. User lookups: current session, by ID, by email

<!-- recipe-for: user:get-current -->
<!-- recipe-for: user:get -->
<!-- recipe-for: user:get-by-email -->

The three user lookups serve distinct use cases. All return a single `User` object
with fields like `id`, `name`, `email`, `role_id`, `group_ids`, `is_active`.

**Get current session user** (auth-bound; TestRail 6.6+):

`user get-current` calls `GET get_current_user` and returns the user identified by
the API key you authenticated with. Requires no path args and always reflects your
own account. Useful to bootstrap a session or verify permissions:

```bash
testrail user get-current
# → {"id":5,"name":"Alice Smith","email":"alice@example.com","role_id":3,"is_active":true,...}
```

```bash
# Check your own role to determine what you can do
testrail user get-current | jq '.role_id'
```

**Get user by ID** (any user, universal):

`user get <user_id>` calls `GET get_user/{user_id}` and returns a user by their
numeric ID. Works for any user on the instance:

```bash
testrail user get 5
# → {"id":5,"name":"Alice Smith","email":"alice@example.com",...}
```

**Get user by email** (email-based lookup):

`user get-by-email` calls `GET get_user_by_email` and finds a user by their
email address. Takes no path args; requires `--user-email <address>`. The
global `--email` flag selects the authentication identity and is not a lookup
filter:

```bash
testrail user get-by-email --user-email alice@example.com
# → {"id":5,"name":"Alice Smith","email":"alice@example.com",...}
```

```bash
# Combine with jq to extract just the user ID
testrail user get-by-email --user-email alice@example.com | jq '.id'
```

**When to use each:**

- `user get-current` — you want info about your own account (always works,
  bound to auth credentials).
- `user get <user_id>` — you already know the numeric ID (direct, fast).
- `user get-by-email --user-email <email>` — you have an email address and need to find
  the user's ID or other metadata (e.g. provisioning workflows that resolve
  email → user_id before assigning to a group).

**Programmatic equivalents:**

```typescript
const current = await client.users.getCurrentUser();
const user = await client.users.getUser(5);
const userByEmail = await client.users.getUserByEmail('alice@example.com');
```

### 42. Group CRUD lifecycle (TestRail 7.5+)

<!-- recipe-for: group:get -->
<!-- recipe-for: group:list -->
<!-- recipe-for: group:add -->
<!-- recipe-for: group:update -->
<!-- recipe-for: group:delete -->

User groups are instance-level resources that organize users into permission sets.
All group actions require TestRail 7.5+. The CRUD shape mirrors suites/milestones:
`get` and `list` are reads; `add`, `update`, `delete` are writes. `delete`
is destructive and requires `TESTRAIL_ALLOW_DESTRUCTIVE=1` + `--yes`.

**Get a single group by ID:**

`group get <group_id>` calls `GET get_group/{group_id}` and returns the group
object with `id`, `name`, `user_ids` (array of user IDs in the group).

```bash
testrail group get 12
# → {"id":12,"name":"QA Team","user_ids":[5,6,7]}
```

**List all groups on the instance:**

`group list --all` follows every response page from `GET get_groups` (no path
args) and returns all user groups defined on the TestRail instance:

```bash
testrail group list --all
# → [{"id":1,"name":"Admins","user_ids":[1,2]},{"id":12,"name":"QA Team","user_ids":[5,6,7]}]
```

```bash
# Count groups
testrail group list --all | jq 'length'
```

**Create a new group (payload-only):**

`group add` calls `POST add_group` and takes no path args. Body requires `name`
(string) and optional `user_ids` (array of numeric user IDs to add on creation).
Returns the created group object with assigned `id`:

```bash
testrail group add --data '{"name":"QA West","user_ids":[5,6]}'
# → {"id":12,"name":"QA West","user_ids":[5,6]}
```

```bash
# Dry-run: validate the payload without creating the group
testrail group add --data '{"name":"QA West"}' --dry-run
# → {"dryRun":true,"action":"group add","payload":{"name":"QA West"},"source":"data"}
```

**Update an existing group (partial fields):**

`group update <group_id>` calls `POST update_group/{group_id}` and allows
partial updates. You can change `name`, `user_ids`, or both. An empty `{}`
body is accepted and returns the group unchanged (PATCH semantics):

```bash
# Rename a group
testrail group update 12 --data '{"name":"QA West + Central"}'
```

```bash
# Replace the group membership (all users in one call)
testrail group update 12 --data '{"user_ids":[5,6,8,10]}'
```

```bash
# Change both name and members
testrail group update 12 --data '{"name":"QA","user_ids":[5,6]}'
```

**Delete a group (requires env unlock + `--yes`):**

`group delete <group_id>` calls `POST delete_group/{group_id}` and is destructive.
Set the env unlock and pass `--yes` to confirm:

```bash
testrail group delete 12 --yes
# → (empty response; group is gone)
```

```bash
# Dry-run: preview what would be deleted without making the API call
testrail group delete 12 --dry-run
# → {"destructive":true,"dryRun":true,"action":"group delete","groupId":12}
```

**Programmatic equivalents:**

```typescript
const group = await client.users.getGroup(12);
const allGroups = await client.users.getAllGroups();
const created = await client.users.addGroup({ name: 'QA West', user_ids: [5, 6] });
const updated = await client.users.updateGroup(12, { name: 'QA West + Central' });
await client.users.deleteGroup(12);
```

### 43. Role list (TestRail permission roles)

<!-- recipe-for: role:list -->

`role list --all` follows every response page from `GET get_roles` (no path
args) and returns all user roles defined on the TestRail instance. Each role has an `id` (numeric),
`name` (string), and may expose `is_project_admin` for project-admin roles.

Standard TestRail roles (instance-specific IDs may vary; query to be sure):

```bash
testrail role list --all
# → [{"id":1,"name":"Lead","is_project_admin":true},{"id":2,"name":"Analyst","is_project_admin":false},...]
```

```bash
# Extract role IDs and names as a lookup table
testrail role list --all | jq 'map({key: .name, value: .id}) | from_entries'
# → {"Admin":"1","Analyst":"2",...}
```

```bash
# Find project-admin roles when the server exposes the flag
testrail role list --all | jq '.[] | select(.is_project_admin == true)'
# → {"id":1,"name":"Lead","is_project_admin":true}
```

Use role IDs when creating or updating users (`user add`, `user update`)
to assign a specific permission level:

```bash
# Assign a chosen role (assuming role_id=1) when creating a user
testrail user add --data '{"name":"Charlie","email":"charlie@example.com","role_id":1}'
```

**Programmatic equivalent:**

```typescript
const roles = await client.metadata.getAllRoles();
```

### 44. Case lifecycle: read, edit history, copy, move, and bulk update

<!-- recipe-for: case:get -->
<!-- recipe-for: case:history -->
<!-- recipe-for: case:titles -->
<!-- recipe-for: case:copy-to-section -->
<!-- recipe-for: case:move-to-section -->
<!-- recipe-for: case:update-bulk -->

This recipe combines the main case read and mutation patterns: fetch a single
case, audit its edit history, duplicate it to another section, move a batch
into a new home, and bulk-update many cases in a suite to the same field values.

**Fetch a single case by ID:**

```bash
testrail case get 1337 | jq '{id, title, section_id, type_id, priority_id, assigned_to_id}'
```

The response includes every custom field defined on the TestRail instance
(those starting with `custom_`). Pipe to `jq` to extract fields of interest.

For a lightweight lookup of several known case IDs on TestRail 10.5+, request
only their IDs and titles:

```bash
testrail case titles 1337,1338,1339
```

**Audit edit history (TestRail 6.5.4+):**

History is paginated; use `--limit` and `--offset` to page through large changelogs:

```bash
# Fetch the 50 most recent edits to case 1337.
testrail case history 1337 --limit 50

# Page backward through 500 edits (10 pages of 50).
for offset in 0 50 100 150 200 250 300 350 400 450; do
    testrail case history 1337 --limit 50 --offset "$offset" | jq -c '.[]'
done
```

Each history entry includes: `id`, `created_by`, `created_on` (Unix timestamp),
`action` (e.g., "created", "updated"), and `changes` (list of field mutations).
Use this before any destructive update or delete to confirm no other user
has modified the case recently.

**Copy a case (or batch) to a new section:**

`case copy-to-section` creates independent clones in the destination; the
original case remains in its source section. Useful for duplicating a case
across multiple test suites or sections without disturbing the original.

```bash
# Copy case 1337 into section 99. Specify the target section in the path;
# the payload identifies the source case(s).
testrail case copy-to-section 99 --data '{
    "case_ids": [1337, 1338]
}'
```

The response is the array of newly created case objects. Each has a fresh `id`
and inherits custom fields from the source.

**Move a batch of cases to a new section (requires suite context):**

Unlike copy, move is destructive — the cases leave their source section and
land in the destination (same suite only). The `suite_id` in the payload tells
TestRail which suite contains both source and destination sections.

```bash
# Move cases 1337, 1338 from their current section into section 99.
# suite_id identifies the suite scope (both sections must be in the same suite).
testrail case move-to-section 99 --data '{
    "case_ids": [1337, 1338],
    "suite_id": 12
}'
```

**Bulk-update many cases to the same field values:**

`case update-bulk` is a mass-mutation tool: update `priority_id`, `assigned_to_id`,
`custom_*` fields, etc. across a suite's cases in a single API call. Apply the
same logic to a list of case IDs without burning rate budget on N individual
`case update` calls.

```bash
# Promote the priority on three cases at once.
testrail case update-bulk 12 --data '{
    "case_ids": [1337, 1338, 1339],
    "priority_id": 2
}'
```

Bulk updates can include custom fields as top-level keys in the payload.
Use the exact returned `system_name` — e.g., `"custom_rfc": "RFC-5678"`
for a field whose metadata reports `system_name: "custom_rfc"` (see Recipe 45).

**CI/scripting pattern — list all cases in a suite, then bulk-promote by priority:**

```bash
# Extract case IDs where assigned_to_id is null (unassigned).
CASES=$(testrail case list --project-id 5 --suite-id 12 --all | \
    jq -r '.[] | select(.assigned_to_id == null) | .id')

# Convert to a JSON array and bulk-update.
CASE_IDS=$(echo "$CASES" | jq -Rs 'split("\n") | map(select(. != "") | tonumber)')

testrail case update-bulk 12 --data "$(jq -n --argjson ids "$CASE_IDS" '{
    "case_ids": $ids,
    "priority_id": 4
}')"
```

### 45. Case field configuration and discovery

<!-- recipe-for: case-field:list -->
<!-- recipe-for: case-field:add -->

Custom case fields are instance-level definitions with project and template
scope. Discover existing definitions before creating a field (admin-only);
creation does not make it applicable to every case.

**List all custom case fields on the instance:**

```bash
testrail case-field list | jq '.[] | {id, name, system_name, label, type_id, include_all, template_ids, configs}'
```

Keep the three identifiers separate:

- `id` identifies the field definition; `name` is its unprefixed name.
- `system_name` is the exact case-payload property name. Reuse it unchanged.
- Option IDs identify choices within `configs[].options.items`; they are
  unrelated to the numeric field ID. `label` is display text.

Project applicability lives in each `configs[].context`: `is_global: true`
or a matching `project_ids` entry. Read `options` from that configuration.
Template applicability is separate: `include_all` or matching `template_ids`.
Check both scopes before writing cases. See the
[official field contract](https://support.testrail.com/hc/en-us/articles/7077281158164-Case-Fields).

Common response `type_id` values and case-payload values:

| type_id | Meaning      | Value under the returned `system_name`          |
| ------- | ------------ | ----------------------------------------------- |
| 1       | String       | `"RFC-5678"`                                    |
| 2       | Integer      | `42`                                            |
| 3       | Text         | `"Detailed text"`                               |
| 4       | URL          | `"https://example.com/spec"`                    |
| 5       | Checkbox     | `true`                                          |
| 6       | Dropdown     | One integer option ID, e.g. `2`                 |
| 7       | User         | Integer user ID                                 |
| 8       | Date         | String in the API user's configured date format |
| 12      | Multi-select | Array of integer option IDs, e.g. `[1, 2]`      |

The [case-value contract](https://support.testrail.com/hc/en-us/articles/7077292642580-Cases#add_case)
distinguishes Dropdown from Multi-select. The field documentation maps
Multi-select to `12` and BDD Scenarios to `13`. Verify returned metadata
against the target server's field configuration/version before choosing a
case-payload value shape. Creation uses the string `type` (e.g. `"Dropdown"`
or `"Multiselect"`), rather than the response property `type_id`.

**Preview complete creation payloads (admin-only when submitted):**

Replace sample project/template IDs with IDs from your instance. `include_all`
controls templates; `context.is_global` controls projects. `--dry-run` validates
local structure without an API request; server acceptance is a separate check.
After reviewing the preview, remove `--dry-run` to submit once.

```bash
# String field for all projects and templates.
testrail case-field add --dry-run --data '{
    "type": "String",
    "name": "rfc_reference",
    "label": "RFC Reference",
    "description": "Design reference",
    "include_all": true,
    "configs": [{
        "context": {"is_global": true, "project_ids": []},
        "options": {"is_required": false, "default_value": ""}
    }]
}'

# Dropdown for project 1 and template 1; option IDs are 1, 2, 3.
testrail case-field add --dry-run --data '{
    "type": "Dropdown",
    "name": "environment_tier",
    "label": "Environment Tier",
    "include_all": false,
    "template_ids": [1],
    "configs": [{
        "context": {"is_global": false, "project_ids": [1]},
        "options": {"is_required": false, "items": "1, dev\n2, staging\n3, prod"}
    }]
}'

# Date for project 1 and template 1; Date has no default_value option.
testrail case-field add --dry-run --data '{
    "type": "Date",
    "name": "target_release_date",
    "label": "Target Release Date",
    "include_all": false,
    "template_ids": [1],
    "configs": [{
        "context": {"is_global": false, "project_ids": [1]},
        "options": {"is_required": false}
    }]
}'
```

Retain the successful POST result (`id`, `system_name`, and `configs`). Creation
returns `configs` as a JSON-encoded string; parse it with `JSON.parse(result.configs)`
when needed. Discovery returns structured configs. If discovery lags, use the
[bounded readiness example](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CASE-FIELD-READINESS.md)
to poll with GET only; never repeat a successful creation POST to wait for it.

**Use returned names when writing case values:**

TestRail 9 introduced `custom_case_` for new case fields; older fields retain
`custom_`. Always read `system_name` instead of constructing either prefix or
using `custom_<numeric field id>`. This example assumes section 42 belongs to
project 1 and the discovered field has been checked for template 1, with
option `2` still representing staging in that project's configuration.

```javascript
// Reuse an authenticated client; call client.destroy() when finished.
const fields = await client.metadata.getCaseFields();
const matches = fields.filter((candidate) => candidate.name === 'environment_tier');
if (matches.length !== 1) throw new Error('Expected one Environment Tier field');
const field = matches[0];
if (!field || typeof field.system_name !== 'string' || !field.system_name.startsWith('custom_')) {
    throw new Error('Missing or unexpected case-field system_name');
}
await client.cases.addCase(42, {
    title: 'Staging smoke test',
    template_id: 1,
    [field.system_name]: 2,
});
```

**Dropdown and Multi-select option text compatibility:**

`options.items` is newline-separated `ID, label` text, not a JSON option array.
In the [reported TestRail 10.7.1.1003 incident](https://github.com/dichovsky/testrail-api-client/issues/268),
embedded commas in Dropdown labels caused HTTP 400; replacing only those
commas with semicolons succeeded. This is version-specific observed behavior,
not a verified restriction for every server or field type. The official docs
do not establish comma escaping, so do not assume CSV quoting or backslashes
will work.

The schema and CLI preserve the submitted string, including extra commas,
Unicode, and malformed lines. A successful dry-run does not validate option
semantics, permissions, or server readiness. If you choose label substitutions,
keep a reversible mapping such as `{"Alpha, Beta": "Alpha; Beta"}`, avoid
collisions with existing labels, and verify returned option IDs and labels in
the applicable project config. Never silently rewrite punctuation or renumber
options. Live compatibility experiments should be opt-in and use disposable
metadata outside ordinary CI.

For server validation details, add `--diagnostic-file ./case-field-error.json`
to the original submission. It writes a bounded, redacted error record to a
new private file on failure. Never replay a write just to collect diagnostics.

### 46. Case metadata lookups: types and statuses

<!-- recipe-for: case-type:list -->
<!-- recipe-for: case-status:list -->

`case-type list` and `case-status list` are reference-data queries: discover
the built-in and custom case types and statuses available in your TestRail
instance. These are typically used at startup to seed a mapping or in
validation logic before writing cases.

**List all case types (readonly):**

Case types categorize the intent of a case (e.g., Automated, Manual, Exploratory).

```bash
testrail case-type list
```

Output:

```json
[
    { "id": 1, "name": "Automated", "is_builtin": true },
    { "id": 2, "name": "Manual", "is_builtin": true },
    { "id": 3, "name": "Exploratory", "is_builtin": true },
    { "id": 4, "name": "Performance", "is_builtin": false }
]
```

Use these IDs in `type_id` when creating or updating cases:

```bash
testrail case add 42 --data '{"title": "Login flow", "type_id": 1}'
```

**List all case-level statuses (TestRail Enterprise 7.3+):**

Case-level statuses (distinct from result statuses) model the lifecycle of
a case itself: Draft, Active, Deprecated, etc. This is different from a
result status (Passed/Failed) and is rarely used on cloud instances; more
common in on-premise with custom lifecycle policies.

```bash
testrail case-status list --all
```

If the Enterprise instance supports case-level statuses, the response is an
array with `case_status_id`, `name`, `abbreviation`, `is_default`, and
`is_approved`. Professional and pre-7.3 instances do not
provide this workflow endpoint.

Compatibility note: always check the length of the response before assuming
the feature is available — do not hardcode status IDs.

### 47. Delete a single test case with safety gates

<!-- recipe-for: case:delete -->

`case delete` removes a single case and all its associated history, results,
and attachments. It is **irreversible** — TestRail does not provide soft-delete
or transaction rollback. The CLI gates deletion behind two safety layers:
`--yes` (per-invocation) and `TESTRAIL_ALLOW_DESTRUCTIVE=1` (process-wide).
`--soft` is an optional server-side preview after both gates clear.

**Destructive-action gate (`--yes` + env var):**

All destructive CLI actions (case delete, run delete, suite delete, etc.)
require both:

1. The `--yes` flag (client-side gate)
2. The `TESTRAIL_ALLOW_DESTRUCTIVE=1` environment variable (second layer)

Omitting either prevents the API call:

```bash
# Without --yes: exits 1.
testrail case delete 1337
# Error: Destructive action; pass --yes to confirm.

# Without env var: exits 2.
testrail case delete 1337 --yes
# Error: Destructive action requires TESTRAIL_ALLOW_DESTRUCTIVE=1.
```

Both must be present:

```bash
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail case delete 1337 --yes
```

**Server-side preview with `--soft` (hits API, no deletion):**

The `--soft` flag (independent of `--yes`) tells TestRail to return a preview
of affected entities without actually deleting. This is distinct from `--dry-run`
(client-side, no API call):

```bash
# Server-side preview: hit the API, receive affected-entity count, no deletion.
# Still requires --yes gate; still consumes one API request.
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail case delete 1337 --yes --soft
```

Response (no deletion occurred):

```json
{
    "caseId": 1337,
    "soft": true,
    "deleted": false,
    "preview": {
        "cases_affected": 1,
        "results_affected": 42,
        "attachments_affected": 3
    }
}
```

**Client-side preview with `--dry-run` (no API call):**

`--dry-run` short-circuits before any request and emits a client-side validation
preview. Useful for CI pipelines to confirm the ID parses before consuming rate
budget:

```bash
testrail case delete 1337 --dry-run --yes
```

Output:

```json
{
    "caseId": 1337,
    "destructive": true,
    "dry_run": true,
    "soft": false
}
```

**Three safety layers in order of precedence (from highest to lowest):**

| Flag        | Side   | API call? | Effect                              |
| ----------- | ------ | --------- | ----------------------------------- |
| `--dry-run` | client | no        | Parses ID, emits preview, exits 0   |
| `--soft`    | server | yes       | TestRail returns preview, no delete |
| `--yes`     | client | n/a       | Gate; without it, exits 1           |

`--dry-run` always wins: if present, neither `--soft` nor any API happens.

**Recommended CI pattern — audit before commit:**

```bash
# Step 1: Client-side validation (no API call, no rate-limit impact).
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail case delete 1337 --yes --dry-run

# Step 2: Server-side preview (costs 1 API request, returns counts).
PREVIEW=$(testrail case delete 1337 --yes --soft)
RESULTS_AFFECTED=$(echo "$PREVIEW" | jq '.preview.results_affected')

if [ "$RESULTS_AFFECTED" -gt 100 ]; then
    echo "Too many results affected; aborting." >&2
    exit 1
fi

# Step 3: Real delete (irreversible).
testrail case delete 1337 --yes
```

**Recovery if a delete fires by mistake:**

- **No client-side recovery.** Once `--yes --soft` is omitted and the CLI
  sends the request, TestRail deletes the case server-side immediately.
- **TestRail audit log** (admin panel, Web UI) records the deletion with
  the acting user and timestamp. Use this to identify when the case was
  removed and by whom.
- **TestRail support recovery** (Cloud/on-premise) depends on backup
  cadence. Open a support ticket immediately; backups roll off after
  7–30 days depending on your plan.

**Idempotence and race conditions:**

If the case ID does not exist, TestRail returns 404 / "Case not found".
The CLI exits 1 with that error; it does not "succeed" on missing IDs.
In CI pipelines, account for this:

```bash
export TESTRAIL_ALLOW_DESTRUCTIVE=1

if testrail case delete 1337 --yes; then
    echo "Case 1337 deleted."
elif [ $? -eq 1 ]; then
    # Could be 404 (not found) or a network error — check stderr
    if testrail case delete 1337 --dry-run 2>&1 | grep -q "not found"; then
        echo "Case 1337 does not exist; skipping."
    else
        echo "Delete failed; aborting." >&2
        exit 1
    fi
fi
```

### 48. Section CRUD lifecycle (get → list → add → move → update → delete)

<!-- recipe-for: section:get -->
<!-- recipe-for: section:list -->
<!-- recipe-for: section:add -->
<!-- recipe-for: section:move -->
<!-- recipe-for: section:update -->
<!-- recipe-for: section:delete -->

Sections are containers for test cases within a suite. This walkthrough
shows the full lifecycle: discover sections, create new ones, reorder
them, update metadata, and delete when no longer needed.

**1. Fetch a single section by ID:**

```bash
testrail section get 42
```

Returns `{ id: 42, project_id: 5, suite_id: 12, parent_id: null, name: "Login", depth: 0, display_order: 1 }` etc.

**2. List all sections in a project (optionally filtered by suite):**

```bash
# All sections in the project
testrail section list 5 --all

# Sections in a specific suite (multi-suite mode projects only)
testrail section list 5 --suite-id 12 --all
```

**3. Create a new section:**

For multi-suite mode projects, `suite_id` is required. Single-suite mode
projects will use their default suite if omitted.

```bash
testrail section add 5 --data '{
    "name": "Authentication",
    "suite_id": 12,
    "description": "Login, SSO, session handling"
}'
```

**4. Move a section to reorder or reparent (TestRail 6.5.2+):**

```bash
# Move to a different parent section or top-level position
testrail section move 42 --data '{
    "parent_id": 50,
    "display_order": 2
}'

# Move to top level (no parent)
testrail section move 42 --data '{
    "parent_id": null,
    "display_order": 1
}'
```

The `move_section` endpoint accepts partial payloads — omit fields you
don't want to change.

**5. Update section metadata (name, description):**

```bash
testrail section update 42 --data '{
    "name": "Authentication (renamed)",
    "description": "Updated scope"
}'
```

**6. Delete a section (destructive; requires env unlock + --yes):**

```bash
testrail section delete 42 --yes
```

TestRail's `delete_section` cascade behavior:

- Deletes the section and all child sections (if nested).
- Deletes all cases under those sections.
- **Does NOT** automatically reassign cases to a different section —
  you must explicitly `case move-to-section` before deleting if you
  want to preserve them.

Use `--dry-run` to preview the call shape without deleting:

```bash
testrail section delete 42 --yes --dry-run
```

### 49. Suite CRUD lifecycle (get → add → update → delete)

<!-- recipe-for: suite:get -->
<!-- recipe-for: suite:add -->
<!-- recipe-for: suite:update -->
<!-- recipe-for: suite:delete -->

Suites are the top-level test organization container. They separate test
cases into independent test inventories within a project. This recipe
covers the full lifecycle.

**1. Fetch a single suite by ID:**

```bash
testrail suite get 12
```

Returns `{ id: 12, project_id: 5, name: "Web API", is_master: false, is_baseline: false, ... }` etc.

**2. Create a new suite in a project:**

```bash
testrail suite add 5 --data '{
    "name": "Mobile App",
    "description": "iOS and Android test cases"
}'
```

The `is_master` and `is_baseline` flags are read-only and cannot be set on
creation — they are managed by TestRail internally.

**3. Update suite metadata (name, description):**

```bash
testrail suite update 12 --data '{
    "name": "Web API (renamed)",
    "description": "REST and GraphQL endpoints"
}'
```

**4. Delete a suite (destructive; requires env unlock + --yes):**

```bash
testrail suite delete 12 --yes
```

TestRail's `delete_suite` removes:

- The suite itself.
- All sections and cases inside the suite.
- All runs, tests, and results associated with cases in that suite.

This is irreversible. Use `--dry-run` to validate the call before
executing:

```bash
testrail suite delete 12 --yes --dry-run
```

**Gotcha:** If a project is in **multi-suite mode**, you cannot delete
all suites. At least one suite must exist. Attempting to delete the
last suite returns a 400 / `"Invalid request"` error.

### 50. Shared steps (get → list)

<!-- recipe-for: shared-step:get -->
<!-- recipe-for: shared-step:list -->

Shared steps are reusable step templates that appear in cases as
single-instance references (TestRail 7.0+). This recipe covers
discovering and fetching them. For creation/update/deletion, see
the existing recipes for `shared-step:add`, `shared-step:update`,
and `shared-step:delete`.

**1. Fetch a single shared step set by ID:**

```bash
testrail shared-step get 100
```

Returns `{ id: 100, project_id: 5, name: "Navigate to login", steps: [...] }` etc. The `steps` array contains the step definitions.

**2. List all shared step sets in a project:**

```bash
testrail shared-step list --project-id 5 --all
```

The default is one response. Use `--page` for metadata or `--all` for every page:

```bash
testrail shared-step list --project-id 5 --all --page-size 50 --start-offset 100
```

**Example workflow:** Look up a shared step to verify its ID before
embedding it in a case:

```bash
# Find the shared step ID
STEP_ID=$(testrail shared-step list --project-id 5 --all | jq '.[] | select(.name == "Navigate to login") | .id')

# Use it when adding a case
testrail case add 42 --data "{
    \"title\": \"Login flow\",
    \"type_id\": 1,
    \"custom_steps\": [
        {\"content\": \"{step_id: ${STEP_ID}}\"}
    ]
}"
```

### 51. BDD scenarios (list → get → add → update)

<!-- recipe-for: bdd:get -->
<!-- recipe-for: bdd:list -->
<!-- recipe-for: bdd:add -->
<!-- recipe-for: bdd:update -->

TestRail's BDD (Behavior-Driven Development) mode stores Gherkin
.feature files as case content. This recipe covers downloading and
uploading Gherkin scenarios.

**1. List BDD entries in a project:**

```bash
testrail bdd list --project-id 5 --all --refs JIRA-1234,JIRA-5678
```

**2. Download a case's BDD (Gherkin .feature) content to a file:**

```bash
testrail bdd get 1337 --out scenario.feature
```

The output is UTF-8 plain text in Gherkin syntax:

```gherkin
Feature: Login
  Scenario: Valid credentials
    Given I am on the login page
    When I enter email "user@example.com"
    And I enter password "secret123"
    Then I should see the dashboard
```

Use `--force` to overwrite an existing file:

```bash
testrail bdd get 1337 --out scenario.feature --force
```

**3. Create a BDD case under a section from a `.feature` file:**

```bash
testrail bdd add 42 --file scenario.feature
```

The file must be valid UTF-8 Gherkin. TestRail validates the syntax
before accepting the upload. If the file is malformed, the CLI returns
a 400 / validation error with details.

**Dry-run preview:**

```bash
testrail bdd add 42 --file scenario.feature --dry-run
```

Shows the parsed file size and mimetype without uploading.

**4. Replace an existing case's BDD content:**

```bash
testrail bdd update 1337 --file scenario.feature
```

**Integration pattern:** Maintain existing scenarios in version control, then
sync them to TestRail using the case ID encoded in each filename:

```bash
for feature in features/*.feature; do
    CASE_ID=$(echo "$feature" | sed 's/.*-\([0-9]*\)\.feature/\1/')
    testrail bdd update "$CASE_ID" --file "$feature"
done
```

### 52. Test case templates (template list)

<!-- recipe-for: template:list -->

Test case templates define the default fields and custom-field layout
when creating a new case. This recipe shows how to list available
templates in a project — useful for understanding which custom fields
are required or optional when authoring cases.

```bash
testrail template list 5
```

Returns an array of templates, each with:

```json
{
    "id": 1,
    "name": "Test Case",
    "is_default": true
}
```

**Use case:** Before bulk-creating cases with `case add-bulk`, inspect
the templates to see which custom fields (`custom_*`) the project expects:

```bash
testrail template list 5 | jq '.[] | select(.is_default) | .id'
```

The default template (if any) is marked with `is_default: true`. Custom
fields attached to the template are not exposed via the CLI's `template
list` endpoint — to see them, use the programmatic API or the TestRail
web UI.

### 53. Record multiple results for tests in one API call

<!-- recipe-for: result:add-bulk-by-test -->

`result add-bulk-by-test` wraps `POST add_results/{run_id}` and records
multiple test results keyed by `test_id` in a single API call. Use this
when you have the full list of test instances (e.g. from
`testrail test list <run_id> --all`) and want to record outcomes for many tests
at once.

Recipe #24 already discusses choosing between bulk endpoints; this path is
optimal when:

- You already have `test_id` values (the run-scoped instance of a case).
- You're publishing results from an environment that captures test instances
  from a prior run query.
- You want to minimize round-trips (one call for N results).

**Single-file example — bulk write via stdin:**

```bash
# Fetch the test list, map to results, and publish all at once.
testrail result add-bulk-by-test 42 --data '[
  {"test_id": 100, "status_id": 1, "comment": "✓ unit tests passed"},
  {"test_id": 101, "status_id": 5, "comment": "✗ integration failed on step 2"},
  {"test_id": 102, "status_id": 1, "elapsed": "2m15s", "version": "3.1.4"}
]'
```

**Dry-run preview (validate payload structure without hitting the API):**

```bash
testrail result add-bulk-by-test 42 --dry-run --data '[
  {"test_id": 100, "status_id": 1},
  {"test_id": 101, "status_id": 5}
]'
```

**Custom fields and optional fields pass through transparently:**

```bash
testrail result add-bulk-by-test 42 --data '[
  {"test_id": 100, "status_id": 1, "custom_env": "prod", "custom_browser": "safari"},
  {"test_id": 101, "status_id": 5, "defects": "BUG-123"}
]'
```

**When to choose alternatives:**

- One result, you have `test_id` → `result add-by-test <test_id>` (lighter).
- Many results, you have `run_id` + `case_id` pairs → `result add-bulk <run_id>`
  (per-case keying).
- You're unsure of status ID values → `testrail status list` (below in recipe 36).

### 54. Reference data and metadata lookups

<!-- recipe-for: result-field:list -->
<!-- recipe-for: status:list -->
<!-- recipe-for: priority:list -->
<!-- recipe-for: version:get -->
<!-- recipe-for: dynamic-filter-field:list -->

TestRail exposes read-only reference-data endpoints for dropdowns, validation,
and result/case payloads. Check the installed server version directly, and on
TestRail 10.4+ inspect the filter fields available to a project:

```bash
testrail version get
testrail dynamic-filter-field list 5
```

The remaining commands in this recipe return instance-wide metadata as JSON
arrays of small objects.

**List all custom result fields (instance-level metadata):**

```bash
testrail result-field list --format json
```

Output structure:

```json
[
    {
        "id": 1,
        "name": "Environment",
        "system_name": "custom_env",
        "type_id": 1,
        "configs": [1, 2, 3]
    },
    {
        "id": 2,
        "name": "Browser",
        "system_name": "custom_browser",
        "type_id": 2,
        "configs": [1]
    }
]
```

Use the `system_name` (e.g. `custom_env`) as the key when writing results:

```bash
testrail result add-by-test 123 --data '{"status_id": 1, "custom_env": "staging"}'
```

**List all result statuses (used in `result add*` payloads):**

```bash
testrail status list --format json | jq '.[] | {id, label}'
```

Output:

```json
[
    { "id": 1, "label": "Passed" },
    { "id": 2, "label": "Blocked" },
    { "id": 3, "label": "Untested" },
    { "id": 4, "label": "Retest" },
    { "id": 5, "label": "Failed" }
]
```

These IDs (e.g. `1` for "Passed", `5` for "Failed") are required in
`result add` / `result add-bulk` / `result add-bulk-by-test` payloads.
Instance configuration may differ, so always query the endpoint to validate
before hardcoding values in CI.

**List all case priorities (used in case and plan payloads):**

```bash
testrail priority list --format json | jq '.[] | {id, name}'
```

Output:

```json
[
    { "id": 1, "name": "None" },
    { "id": 2, "name": "Low" },
    { "id": 3, "name": "Medium" },
    { "id": 4, "name": "High" },
    { "id": 5, "name": "Critical" }
]
```

Use these IDs in `case add` / `case update` / `plan add` payloads:

```bash
testrail case add 456 --data '{"title": "Critical path test", "priority_id": 5}'
```

**Programmatic access (TypeScript/JavaScript):**

All three return typed arrays from the client:

```typescript
const resultFields = await client.metadata.getResultFields();
const statuses = await client.metadata.getStatuses();
const priorities = await client.metadata.getPriorities();

// Find status ID for "Failed"
const failedStatus = statuses.find((s) => s.label === 'Failed');
console.log(failedStatus?.id); // 5 (typically)
```

### 55. Reports — list templates and trigger generation

<!-- recipe-for: report:list -->
<!-- recipe-for: report:run -->
<!-- recipe-for: report:list-cross-project -->
<!-- recipe-for: report:run-cross-project -->

TestRail exposes pre-configured report templates. You can list the templates
available in a project and trigger an async generation job that returns
downloadable report URLs.

**List report templates in a project:**

```bash
testrail report list 5 --format json | jq '.[] | {id, name, is_global}'
```

Output:

```json
[
    {
        "id": 1,
        "name": "Test Results Summary",
        "is_global": true
    },
    {
        "id": 8,
        "name": "Custom Defect Report",
        "is_global": false
    }
]
```

**Trigger a report generation:**

`report run` wraps `GET run_report/{report_template_id}` and initiates an
async report-generation job. The endpoint returns a JSON object containing
URLs for both HTML and PDF versions (generation may take a few seconds).

```bash
testrail report run 8
```

Output:

```json
{
    "report_url": "https://instance.testrail.io/reports/index.html?user_id=1",
    "report_url_pdf": "https://instance.testrail.io/reports/index.pdf?user_id=1"
}
```

Enterprise instances can discover and execute API-enabled cross-project
templates without a project ID:

```bash
testrail report list-cross-project
testrail report run-cross-project 12
```

**Saving a report to a file:**

`report run` returns report URLs as JSON; it does not support `--out` (the
flag is rejected before dispatch). Download the HTML with `curl`/`wget` from
the returned URL:

```bash
# Note: The API returns URLs; to download, use curl or wget
URLS=$(testrail report run 8)
REPORT_URL=$(echo "$URLS" | jq -r '.report_url')
curl -o report.html "$REPORT_URL"
```

**When to use reports in automation:**

- **CI integration** — Trigger a report at the end of a test run so
  stakeholders have a snapshot. Embed the report URL in Slack, email, or a
  build artifact.
- **Test result audit** — Generate a compliance report after a critical
  release.
- **Dashboard refresh** — Periodically regenerate the same template on a
  schedule.

### 56. Project lifecycle: add, update, delete

<!-- recipe-for: project:add -->
<!-- recipe-for: project:update -->
<!-- recipe-for: project:delete -->

The project resource sits at the root of every TestRail hierarchy
(project → suite → section → case → run → result). Use `project add` to
spin up a workspace, `project update` to rename or change suite-mode
settings or project access assignments, and `project delete` to retire it.
Both writes accept arbitrary `custom_*` fields through `.passthrough()`.

```bash
# Create a new project (single-suite mode = 1, multi-suite = 3)
testrail project add --data '{"name":"Mobile App QA","announcement":"Pre-release suite for v3.0","show_announcement":true,"suite_mode":1}'
```

```bash
# Rename + flip announcement flag
testrail project update 5 --data '{"name":"Mobile QA (renamed)","show_announcement":false}'
```

```bash
# Update project access. TestRail's docs use both id and user_id for a user;
# the client accepts exactly one identifier per user assignment.
testrail project update 5 --data '{
  "default_role_id": 3,
  "groups": [
    {"id": 12, "role_id": 0},
    {"id": 13, "role_id": 4}
  ],
  "users": [
    {"user_id": 42, "role_id": null},
    {"id": 43, "role_id": 5}
  ]
}'
```

For nested `groups[]` and `users[]`, a positive `role_id` assigns that
project role, `0` selects the user's Global Role, and `null` clears an
existing project-specific role assignment. Group entries require `id`. User
entries require exactly one of `id` or `user_id`; providing neither or both
fails validation before the request. `default_role_id` accepts a non-negative
role ID.

```bash
# Dry-run to preview the payload that would be sent
testrail project update 5 --data '{"is_completed":true}' --dry-run
```

**Suite-mode reference (set once at creation, cannot be changed later
without admin intervention):**

| `suite_mode` | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| 1            | Single-suite (project has exactly one suite)                     |
| 2            | Single-suite + baselines (single suite with versioned baselines) |
| 3            | Multi-suite (project can hold multiple independent suites)       |

**Destructive delete with safety gates** — `project delete` is irreversible.
The CLI requires `TESTRAIL_ALLOW_DESTRUCTIVE=1` + `--yes` to actually
delete; `--dry-run` short-circuits client-side; `--soft` is **not**
supported by TestRail for projects.

```bash
# Preview a delete with no API call
testrail project delete 5 --dry-run

# Hard delete (requires env unlock + --yes; otherwise rejected)
testrail project delete 5 --yes
```

```typescript
// Programmatic equivalents
const created = await client.projects.addProject({ name: 'Mobile QA', suite_mode: 1 });
const renamed = await client.projects.updateProject(created.id, {
    name: 'Mobile QA v2',
    default_role_id: 3,
    groups: [{ id: 12, role_id: 0 }],
    users: [{ user_id: 42, role_id: null }],
});
await client.projects.deleteProject(renamed.id);
```

### 57. Tests: fetch by ID and list per run

<!-- recipe-for: test:get -->
<!-- recipe-for: test:list -->

A _test_ in TestRail is the run-scoped instance of a case (one case + one
run = one test). `test get` returns a single test by `test_id`;
`test list --all` enumerates every test in a run (the canonical way to walk
all cases assigned to a run, including their current `status_id`). Without
`--all`, the command returns one response only.

```bash
# Fetch a single test instance
testrail test get 1337
```

```bash
# Ask TestRail for the test plus its results and attachments.
# The CLI normalizes the wire wrapper into one object.
testrail test get 1337 --with-data 1 \
  | jq '{id, title, results, attachments}'
```

`--with-data` accepts only TestRail's literal `0` or `1`. With `1`, the
response includes `results` and `attachments` arrays on the returned test;
with `0` or no flag, it is the ordinary `get_test` response.

```bash
# List every test in a run
testrail test list 42 --all

# Filter by current status (e.g. Failed=5)
testrail test list 42 --all --status-id 5

# Filter by one or more label IDs (TestRail 10.5+)
testrail test list 42 --all --label-id 7,8
```

```bash
# Common pattern — extract test_ids ready for per-test result writes
testrail test list 42 --all | jq '.[] | select(.status_id == 3) | .id'
```

**When you reach for `test:list` vs alternatives:**

- `test list <run_id> --all` — enumerate every test in a run; canonical input
  for per-test result loops (pair with `result add-by-test`)
- `case list --project-id <id> --suite-id <id> --all` — enumerate the case
  catalog (not run-scoped); use when designing a run, not executing one
- `result list --run-id <id> --all` — enumerate results (not tests); use when
  you want the latest verdict per test, not the test definitions

```typescript
// Programmatic equivalent — drive a per-test CI publisher
const tests = await client.tests.getAllTests(42, { statusId: [3] }); // 3 = Untested
for (const t of tests) {
    await client.results.addResult(t.id, { status_id: 1, comment: 'auto-passed' });
}

const enriched = await client.tests.getTest(1337, { withData: '1' });
console.log(enriched.results, enriched.attachments);
```

### 58. Assign labels to tests (single and bulk)

<!-- recipe-for: test:update-labels -->
<!-- recipe-for: test:update-labels-bulk -->

`update-labels` sets the labels on a test — it is a **label-only** mutation,
not a general test update. Each `labels` element is an existing label ID
(number) or its title (string); TestRail resolves titles to IDs. The bulk
form applies the **same** labels to every listed test (it cannot set
different labels per test) and takes no path param — the targets live in
`test_ids`.

```bash
# Set labels on one test (mix of label ID and title)
testrail test update-labels 1337 --data '{"labels":[1,"regression"]}'

# Apply the same labels to many tests in one call
testrail test update-labels-bulk --data '{"test_ids":[1337,1338,1339],"labels":["smoke"]}'

# Preview without hitting the API
testrail test update-labels 1337 --data '{"labels":["smoke"]}' --dry-run
```

```typescript
// Programmatic equivalent
await client.tests.updateTest(1337, { labels: [1, 'regression'] });
await client.tests.updateTests({ test_ids: [1337, 1338], labels: ['smoke'] });
```

### 59. Labels: manage project label definitions

<!-- recipe-for: label:get -->
<!-- recipe-for: label:list -->
<!-- recipe-for: label:add -->
<!-- recipe-for: label:update -->
<!-- recipe-for: label:delete -->
<!-- recipe-for: label:delete-bulk -->

The Labels API manages label _definitions_. Labels are project-scoped, titles
are capped at 20 characters, and renaming a label propagates to every case and
test using it. Deletes are irreversible and use the CLI's two safety gates.

```bash
# List every label defined in a project.
testrail label list 1 --all

# Fetch one label by ID
testrail label get 7

# Create a project-scoped label
testrail label add 1 --data '{"title":"Release 2.0"}'

# Rename a label (propagates to all cases/tests that carry it)
testrail label update 7 --data '{"project_id":1,"title":"Release 2.1"}'

# Preview one or many deletions without making an API call
testrail label delete 7 --dry-run
testrail label delete-bulk --data '{"label_ids":[7,8]}' --dry-run

# Execute an irreversible delete (requires both gates)
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail label delete 7 --yes
```

```typescript
// Programmatic equivalent
const labels = await client.labels.getAllLabels(1);
const label = await client.labels.getLabel(7);
const created = await client.labels.addLabel(1, { title: 'Release 2.0' });
await client.labels.updateLabel(created.id, { project_id: 1, title: 'Release 2.1' });
await client.labels.deleteLabels({ label_ids: [7, 8] });

// Note the field-name divergence: `get_label` returns `name`, while
// `get_labels` / `update_label` return `title`. `Label` carries both as
// optional, so normalize before rendering:
const display = label.title ?? label.name ?? '';
```
