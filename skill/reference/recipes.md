# `testrail` recipes

Use these numbered recipes as examples for every CLI command.
Read `SKILL.md` first for authentication, destructive-operation gates, and output and pagination rules.

## Recipes

Destructive recipes assume that `TESTRAIL_ALLOW_DESTRUCTIVE=1` is set in your environment.
Pass `--yes` on every destructive call.
`--dry-run` does not require either gate.

### 1. Test authentication and connectivity

<!-- recipe-for: user:list -->

```bash
testrail user list --project-id 5 --quiet && echo "auth OK" || echo "auth FAILED"
```

Exit code 0 means that credentials work and TestRail responds.
Exit code 1 means that authentication or the connection failed.
Non-admin users must pass `--project-id`. Administrators can omit `--project-id`.

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

### 6. Extract IDs from a list

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

### 9. Create a test case

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

Where `/tmp/results.json` has this structure:

```json
{
    "results": [
        { "case_id": 42, "status_id": 1, "comment": "passed" },
        { "case_id": 43, "status_id": 5, "comment": "failed: timeout" }
    ]
}
```

Each entry requires `case_id` and at least one of `status_id`, `comment`, or `assignedto_id`.
If any entry lacks all three fields, the CLI rejects the payload before making an API call.

### 13. Close a run when CI finishes

<!-- recipe-for: run:close -->

```bash
testrail run close "$RUN_ID" --yes
```

Closing a run is permanent because TestRail has no `open_run` endpoint.
Pass `--yes` to confirm the action.
Pass `--dry-run` with `--yes` to preview the target before you close the run.

### 14. Validate a payload before sending (`--dry-run`)

<!-- recipe-for: result:add -->

```bash
testrail result add 100 42 --data '{"status_id":1,"comment":"sanity check"}' --dry-run
```

This command prints the validated payload with `"dryRun": true` and makes no API call.

### 15. Attach a Playwright screenshot to a test result

<!-- recipe-for: result:add, attachment:add-to-result -->

```bash
RESULT=$(testrail result add "$RUN_ID" 42 --data '{"status_id":5,"comment":"failed"}')
RESULT_ID=$(echo "$RESULT" | jq '.id')
testrail attachment add-to-result "$RESULT_ID" --file ./test-results/screenshot.png
```

The command outputs `{ "attachment_id": <id> }`.
By default, the uploaded filename is `screenshot.png` (the basename of `--file`).
Pass `--filename <name>` to set a different filename on upload.

### 16. Attach a reproduction file to a test case

<!-- recipe-for: attachment:add-to-case -->

```bash
testrail attachment add-to-case 42 --file ./repro.zip --filename "bug-1234-repro.zip"
```

Pass `--filename` to override the local basename and display a clear name in the TestRail UI.

### 17. Download the latest attachment on a case to inspect locally

<!-- recipe-for: attachment:list-for-case, attachment:get -->

```bash
LATEST_ID=$(testrail attachment list-for-case 42 --all | jq 'max_by(.created_on // 0) | .id // .attachment_id')
testrail attachment get "$LATEST_ID" --out ./fetched.bin
```

`--out` is required.
The CLI refuses to overwrite an existing file unless you pass `--force`.
Stdout prints a JSON acknowledgment with `attachmentId`, `out`, and `size`.

`attachment list-for-case`, `list-for-run`, and `list-for-plan` support pagination.
Pass `--page` for page metadata or `--all` for the complete bounded array.
`attachment list-for-test` supports single-response `--limit` and `--offset` flags, but not `--page` or `--all`.
`attachment list-for-plan-entry` returns a single response only.

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

The following choices cover result reads, writes, and edits.
Select the command that matches your available IDs and required scope:

1. **You have a `test_id`**: Run `result list-for-test <test_id> --all`. A test is the run instance of a case. This command returns the full result history for that test with minimal overhead.

    ```bash
    testrail result list-for-test 4242 --all --page-size 50 --status-id 1,5
    ```

2. **You have a `run_id` and `case_id` but no `test_id`**: Run `result list-for-case <run_id> <case_id>`. TestRail resolves the test internally. Use this command in CI when the test runner knows only the case ID and run ID.

    ```bash
    # Find the most recent failure for case 87 in run 100, filtered by JIRA ticket
    testrail result list-for-case 100 87 --limit 1 --status-id 5 --defects-filter JIRA-1234
    ```

3. **You want every result in the run**: Run `result list --run-id <id> --all`. Use this command for audits, exports, or dashboards instead of calling `list-for-test` for each test.

    ```bash
    # Whole-run reads support creator/date, status, and defect filters.
    testrail result list --run-id 100 --all --page-size 100 \
      --created-after 1735689600 --created-by 7,8 --status-id 1,5 \
      --defects-filter JIRA-1234
    ```

4. **Write new results**: Use the command that matches your IDs.
   `result add` writes one result by `run_id` and `case_id`.
   `result add-bulk` writes multiple results by `case_id`.
   `result add-bulk-by-test` writes multiple results by `test_id`.

5. **You need to correct an existing result**: Run `result edit <result_id>`. TestRail 10.4+ accepts partial payloads, so send only the fields you want to change:

    ```bash
    testrail result edit 9876 --data '{"comment":"Corrected after investigation"}'
    ```

Both `list-for-test` and `list-for-case` support these filter flags:

- `--status-id 1,5`: Filter by comma-separated status IDs (`1` = passed, `5` = failed). Run `status list` to check custom IDs.
- `--defects-filter JIRA-1234`: Match a substring in the `defects` field.
- `--limit N` and `--offset N`: Control single-response pagination (maximum `limit` is 250).

Use `list-for-test` when you have a `test_id`.
Use `list-for-case` when CI knows only the `case_id`.
Use `result list` only when you need all results in the run.

### 25. Plan entries lifecycle (add → add-run → update → delete cascade)

<!-- recipe-for: plan:close -->
<!-- recipe-for: plan:delete -->
<!-- recipe-for: plan:delete-entry -->
<!-- recipe-for: plan:delete-run-from-entry -->

This workflow shows the complete lifecycle of a test plan and its destructive operations.
Creation steps can create duplicates if you repeat them. Inspect the server state before you retry an uncertain write.
Follow the cascade order (run → entry → plan) when you delete items.
`delete_plan` removes the entire plan. `delete_plan_entry` removes only its entry and associated runs.

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
#    `delete_plan` does not support TestRail's --soft preview, so the
#    only safe rehearsal is --dry-run (client-side, no API call).
testrail plan delete "$PLAN_ID" --yes --dry-run    # preview
testrail plan delete "$PLAN_ID" --yes              # commit
```

Notes:

- `entry_id` is a server-generated UUID string. Pass it unchanged. The CLI requires the `8-4-4-4-12` hexadecimal UUID format before any API call.
- `--dry-run` overrides `--yes`. Use `--yes --dry-run` in CI to emit a local preview with `"destructive": true` and no API call.
- `plan close` is irreversible because TestRail has no `open_plan` endpoint. Use `plan close` to keep historical results. Closed plans remain queryable. Deleted plans lose their runs and results.
- `plan delete` does not support `--soft` preview. Follow the order `delete-run-from-entry` → `delete-entry` → `delete/close plan` to keep a clear audit trail.

### 26. Bulk case delete with `--soft` server-side preview

<!-- recipe-for: case:delete-bulk -->

Use `case delete-bulk` to remove multiple deprecated cases in a single request instead of deleting them one by one.
This command calls `POST delete_cases/{suite_id}&project_id={project_id}` with a `case_ids: number[]` payload.

Three independent safety layers apply. Check where each layer runs before you invoke the command:

| Layer       | Side   | API call?      | What it does                                                      |
| ----------- | ------ | -------------- | ----------------------------------------------------------------- |
| `--dry-run` | client | no             | Stops before the request and prints a parsed payload preview      |
| `--soft`    | server | yes (`soft=1`) | Returns affected-test counts from TestRail without deleting cases |
| `--yes`     | client | n/a            | Confirms the action. Without `--yes`, the CLI exits with code 1   |

`--dry-run` overrides both `--yes` and `--soft`.
`--soft` runs only when the CLI sends an API request (`--yes` without `--dry-run`).

Follow this workflow to preview on the server before you delete cases:

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

Flag-interaction matrix:

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

In CI/automation, stop the script if the soft preview count does not match the expected value:

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

Recovery options after an accidental deletion:

- **No client-side recovery.** When you pass `--yes` without `--dry-run` or `--soft`, TestRail deletes the cases immediately.
- **TestRail audit log** (admin-only, web UI) records the deletion with the user and timestamp. Use the audit log to find which cases were deleted and restore them from version control.
- **TestRail support recovery** depends on your TestRail Cloud or self-hosted backup schedule. Open a support ticket immediately before backups expire.

Use `--soft --yes` as the rehearsal step in every CI/automation pipeline that runs bulk deletes.
Do not delete cases without `--soft` unless you have a current backup or versioned case definitions.

### 27. Configuration groups & configs hierarchy management

<!-- recipe-for: configuration:list -->
<!-- recipe-for: configuration-group:add -->
<!-- recipe-for: configuration-group:delete -->
<!-- recipe-for: configuration:add -->
<!-- recipe-for: configuration:delete -->

TestRail organizes the test-environment matrix as a two-level tree:

```
project
└── config_group        (e.g. "Browsers", "Operating Systems")
    └── config (leaf)   (e.g. "Chrome", "Firefox", "Safari")
```

Plan entries reference `config_id` values to create per-environment runs (see Recipe 22).
The CLI provides two resources for this tree:

- `configuration-group <action>`: Manages the parent group.
- `configuration <action>`: Manages the leaf configuration or lists the full tree. `configuration list <project_id>` returns all groups and their nested `configs[]` in one call.
  TestRail has no separate endpoint to list configurations in one group.

Follow this workflow to create, list, update, and delete a configuration matrix:

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

- Both `configuration-group delete` and `configuration delete` are destructive and require `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`. TestRail does not support `soft=1` on either endpoint. Pass `--yes --dry-run` for a local preview with `"destructive": true` and no API call.
- Deleting a group also deletes all configurations in that group. To remove only specific configurations, run `configuration delete <config_id>` and keep the group.
- Deleting a configuration removes it from plan entries that reference it. Existing runs and results remain intact, but new runs in those entries cannot select the deleted configuration.
- Configurations belong to a single project. The same name in another project has a different ID.
  Always use the target project context when you list or modify configurations.

### 28. Shared step propagation + history audit

<!-- recipe-for: shared-step:add -->
<!-- recipe-for: shared-step:update -->
<!-- recipe-for: shared-step:delete -->
<!-- recipe-for: shared-step:history -->

Shared steps let you reuse one block of steps across multiple test cases.
Updating a shared step changes **every case that references it** immediately on the server.
A single `shared-step update` call can modify hundreds of cases.
Run `shared-step history` to inspect revisions before you update or delete a shared step.
Find referencing cases with `case list` as described below.

Follow this workflow to create, reference, audit, update, and delete a shared step:

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

- **Propagation is immediate and server-side.** Updates to a shared step apply the next time the API, UI, or a run reads a referencing case. Re-fetch `case get` after `shared-step update` to read the updated content.
- **Deletion never deletes the case rows.** The `keep_in_cases` option controls the shared content. The default (`--keep-in-cases true`) keeps the expanded steps in each referencing case and removes only the shared link. Passing `false` asks TestRail to remove that content too. Existing runs keep their historical steps and results.
- **Audit before every mutation.** Run `shared-step history` to check how many revisions exist and who made the last change. Changes to a widely used step can affect many cases. Review its content before an update. Pass `--all` with safety limits such as `--max-items`. Do not pass `--page-size` or `--start-offset`.
- **No bulk reference lookup upstream.** TestRail does not provide an endpoint to list cases that reference a shared step. To find referencing cases, page through `case list` for the project or suite.
  Filter `custom_steps_separated[]?.shared_step_id` with `jq` for the target ID.
- **Empty update payloads are accepted.** `UpdateSharedStepPayloadSchema` allows `{}` because all fields are optional, as in `UpdateMilestonePayloadSchema`.
  TestRail treats `{}` as a no-op. If you require a non-empty payload, validate it before the CLI call.
- **`shared-step delete` is destructive, gated by `TESTRAIL_ALLOW_DESTRUCTIVE=1` + `--yes`.** TestRail offers no `--soft` server-side preview for this endpoint, so use `--dry-run` for local preview. Pass `--keep-in-cases true|false` explicitly. `--dry-run` overrides `--yes` and makes no API call.

### 29. Data-driven runs via Variables + Datasets

<!-- recipe-for: dataset:get -->
<!-- recipe-for: dataset:list -->
<!-- recipe-for: dataset:add -->
<!-- recipe-for: dataset:update -->
<!-- recipe-for: dataset:delete -->

TestRail data-driven testing uses two project-scoped resources:

- **Variables**: Named placeholders used in case steps with `${var_name}` syntax (such as `${env}` or `${region}`). Manage them with `variable add`, `variable update`, `variable delete`, and `variable list`.
- **Datasets**: Named maps from variable names to string values. Write payloads use `variables: Record<string, string>`, and responses return each variable's ID, name, and value.

Use variables and datasets together to run one test case across multiple environments without duplicating the case:

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

In this example, `name` is required. The optional `variables` map links existing project variable names to string values.
`custom_*` fields pass through unchanged:

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

- **CLI writes include values.** `dataset add` and `dataset update` accept `name` and `variables`. Every map value must be a string. Numbers, booleans, arrays, and objects fail Zod validation before an API call. On update, send the complete variable-value map.
- **Variable references use `${name}` syntax inside case steps.** TestRail replaces `${env}` in `content`, `expected`, or `additional_info` with the dataset value during run execution. Misspelled variable names remain unchanged as literal text. TestRail does not validate placeholders between case definition and run execution.
- **Selection is separate from CRUD.** These commands manage project dataset definitions. Select datasets when you configure a run in TestRail. The dataset CRUD payload does not carry a run or plan-entry ID.
- **Destructive lifecycle.** `dataset delete` is destructive and requires `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`. `--dry-run` previews locally, and `--soft` is rejected because `delete_dataset` does not support soft preview. Deleting a dataset invalidates its data-driven configuration in active plan entries. Historical results remain intact, but new runs lose those substitutions.
- **Project-scoped IDs.** Variables and datasets have global IDs, but each belongs to one project. The same name in another project has a different ID. Always pass `project_id` to `variable list <project_id>` and `dataset list <project_id>`.

### 30. Bulk-author cases under a section in one API call

<!-- recipe-for: case:add-bulk -->

Use `case add-bulk` to create multiple cases in one request and conserve your rate limit.
Pass a **JSON array** of case payloads where each item matches the `case add` schema.

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

Pass `--dry-run` to validate the array and each item locally with no API call.
The dry-run output includes a `count` field so you can verify the number of items before importing.

TestRail 7.0 release notes already describe updates to `add_cases`.
The client does not impose the former 7.5+ version gate or convert ordinary server errors into version errors.
The CLI accepts a JSON array and wraps it as `{"cases":[...]}` for the API request.
The client decodes the corresponding response envelope.
If the server returns an unexpected success response, the CLI reports an indeterminate write error.
Do not retry that write automatically because TestRail may have already created the cases.

### 31. Watch a run until completion (CI integration)

<!-- recipe-for: run:watch -->

`run watch` polls `get_run/{run_id}` at a fixed interval (default 30 seconds) and emits an event when watched counters change.
Pass `--format json` for JSON events or `--format table` for table rows.
The command exits with code 0 when `is_completed` becomes `true`.
Use `run watch` in CI pipelines that wait for a run to finish before publishing reports or promoting a deployment.

The watcher checks only these fields. It ignores changing timestamps such as `completed_on` to avoid unnecessary events:

- `is_completed`
- `passed_count`, `failed_count`, `retest_count`
- `blocked_count`, `untested_count`

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

On `SIGINT` (Ctrl-C), `run watch` cancels the timer, writes an `interrupted` summary with the last snapshot to stderr, and exits with code 130.
Temporary `getRun` errors (such as network errors or 5xx responses) log to stderr and do not stop the watcher.
Unrecoverable errors (such as authentication failure) stop the watcher with exit code 1.

### 32. Create a user (TestRail 7.3+)

<!-- recipe-for: user:add -->

`user add` calls `POST add_user` and returns the created `User` object.
Only `name` and `email` are required.
Optional fields are `is_active`, `is_admin`, `role_id`, `group_ids`, `mfa_required`, `email_notifications`, `sso_enabled`, and `assigned_projects`.
The schema allows unknown fields through `.passthrough()`.
It does not declare `password` or `language` because the TestRail 10.7 request table does not document them.

The `email` field requires one `@` character with non-empty, whitespace-free local and domain parts.
The client accepts intranet addresses such as `ada@corp`, `admin@localhost`, and `user@[192.168.1.1]`.
`user update` and `user get-by-email` use the same format check. TestRail determines whether the address is usable.

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

`user update <user_id>` calls `POST update_user/{user_id}` and returns the updated `User` object.
All fields are optional. Send only the fields that you want to change.
TestRail accepts an empty `{}` body and returns the user unchanged.
The documented fields match `user add`; TestRail 10.7 does not document `password` or `language` as update fields.

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

`result add-by-test` calls `POST add_result/{test_id}`.
Use this command when you already have a `test_id` (the run-scoped instance of a case).
Unlike `result add`, this command does not require `run_id`.

```bash
testrail result add-by-test 123 --data '{"status_id":1,"comment":"PASS — verified","elapsed":"45s","version":"2.4.1"}'
```

`status_id` is optional, but each result requires at least one of `status_id`, `comment`, or `assignedto_id`.
Omit `status_id` to add a comment or reassign the test without changing its status.
The stored result then has `status_id: null`:

```bash
testrail result add-by-test 123 --data '{"comment":"Investigating — see BUG-42"}'
testrail result add-by-test 123 --data '{"assignedto_id":7}'
```

Default `status_id` values (run `testrail status list` to check custom statuses):

| ID  | Meaning  |
| --- | -------- |
| 1   | Passed   |
| 2   | Blocked  |
| 3   | Untested |
| 4   | Retest   |
| 5   | Failed   |

**Choose the right result write command:**

- `result add-by-test <test_id>`: Write one result when you have `test_id`.
- `result add <run_id> <case_id>`: Write one result when you have `run_id` and `case_id`.
- `result add-bulk <run_id>`: Write multiple results by `case_id`.
- `result add-bulk-by-test <run_id>`: Write multiple results by `test_id`.

**Dry-run preview (no API call):**

```bash
testrail result add-by-test 123 --dry-run --data '{"status_id":5,"comment":"Failed on step 3"}'
```

**Custom fields** pass through unchanged:

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

You can also store attachments on test plans, plan entries, test runs, and individual tests.
Pass `--file <path>` (or `--file -` for stdin) to upload a file.
Pass `--filename` to override the basename.

**Upload attachments to a plan and plan entry:**

```bash
# Upload a requirements document to a test plan.
testrail attachment add-to-plan 100 --file ./requirements.pdf

# Upload a config matrix reference to a plan entry
# (entry_id is a UUID-style string, NOT an integer).
testrail attachment add-to-plan-entry 100 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6' \
  --file ./config-matrix.xlsx
```

**Upload attachments to a run and individual tests:**

```bash
# Upload a build log to the entire run.
testrail attachment add-to-run 42 --file ./build.log

# Upload a screenshot to a single test (run instance of a case).
testrail attachment add-to-test 1337 --file ./screenshot.png
```

**List attachments across entry types:**

```bash
# Collect every attachment page on a plan.
testrail attachment list-for-plan 100 --all --page-size 100 \
  | jq '.[] | {id, filename, size}'

# Plan-entry listing remains one-response-only.
testrail attachment list-for-plan-entry 100 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6' \
  | jq '.[] | {id, filename, size}'

# Preserve one run-attachment page with metadata.
testrail attachment list-for-run 42 --page --limit 50 --offset 0

# Test listing has only the historical one-response controls.
testrail attachment list-for-test 1337 --limit 50
```

**Preview an upload with `--dry-run`:**

```bash
testrail attachment add-to-plan 100 --file ./doc.pdf --dry-run
```

**Delete attachments from any entry type:**

Use `attachment delete <attachment_id>` for all entry types:

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

- **Entry types and scope:** Use `add-to-plan` and `add-to-plan-entry` for plan documents or configuration matrices. Use `add-to-run` for run-level logs. See Recipes 15–18 for case and result attachments.
- **Pagination:** Case, run, and plan attachment lists support default, `--page`, and `--all` modes. `list-for-plan-entry` returns a single response only. `list-for-test` supports `--limit` and `--offset`, but not `--page` or `--all`.
- **Upload flags:** Pass `--file <path>` for a local file or `--file -` for stdin. Pass `--filename <name>` to override the local filename.
- **Safety gates:** All `add-to-*` actions support `--dry-run`. `attachment delete` requires `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`.

### 36. Variable CRUD lifecycle

<!-- recipe-for: variable:list -->
<!-- recipe-for: variable:add -->
<!-- recipe-for: variable:update -->
<!-- recipe-for: variable:delete -->

Variables are project-scoped named placeholders for data-driven testing (see Recipe 29 for datasets).
Use these commands to create, list, rename, and delete variables.

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

- **Project-scoped IDs:** Variable IDs are global, but each variable belongs to one project. Always pass `project_id` to `variable list <project_id>`.
- **Name-only definitions:** `variable add` and `variable update` manage variable names only. Assign string values to variables with `dataset add` or `dataset update`.
- **Destructive gate:** `variable delete` is permanent and requires `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`. TestRail does not support `--soft` on `delete_variable`. Use `--dry-run` for a local preview.
- **Dataset references:** Datasets reference variables by name in their `variables` map. Update your datasets before you delete a variable.

### 37. Configuration mutation: update configuration & configuration-group

<!-- recipe-for: configuration:update -->
<!-- recipe-for: configuration-group:update -->

Use `configuration-group update` and `configuration update` to rename existing configuration groups and configurations.
See Recipe 27 for the full configuration hierarchy lifecycle.

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

- **Rename only:** `update_config` and `update_config_group` document only the `name` field.
  The configuration API does not document `custom_*` fields. Use the TestRail UI to reorder items or manage other metadata.
- **Separate ID spaces:** `configuration-group` and `configuration` use separate IDs. Renaming a group does not change its child configurations. Renaming a configuration does not change its siblings.
- **Plan entries:** Renaming a configuration updates its display name while keeping the same ID. Existing runs and results remain unchanged. Future selections use the new name.
- **Non-destructive:** Renaming does not require `--yes`. Run `configuration list <project_id>` to inspect the tree before you rename items.

### 38. Plan entry extensions — add/update runs within existing entries

<!-- recipe-for: plan:add-run-to-entry -->
<!-- recipe-for: plan:update-entry -->
<!-- recipe-for: plan:update-run-in-entry -->

After you create a plan entry with `plan add-entry`, you can add new configuration-specific runs or update metadata across existing runs.

**Add a fresh run to an entry (new platform):**

```bash
# Plan 100, entry a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6 already has runs for Chrome & Firefox.
# Add a fresh run for Safari.
RESULT=$(testrail plan add-run-to-entry 100 a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6 --data '{
    "config_ids": [3],
    "assignedto_id": 9
}')
echo "$RESULT" | jq '.id'  # New run_id, can be used in `result add` or `run watch`
```

Payload keys:

- `config_ids` (required): Array of configuration IDs for this run.
- `assignedto_id` (optional): User ID assigned to the run.
- `include_all` (optional): Set `true` to include all cases in the suite, or `false` to use `case_ids`.
- `case_ids` (optional): Array of case IDs to include when `include_all` is `false`.

**Update entry metadata across all its runs:**

```bash
# Rename the entry & swap assignee (applies to every run in the entry)
testrail plan update-entry 100 a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6 --data '{
    "name": "Smoke tests (renamed)",
    "assignedto_id": 10,
    "include_all": false,
    "case_ids": [1, 2, 3, 5]
}'
```

Payload keys:

- `name` (optional): New entry name.
- `assignedto_id` (optional): New assignee user ID.
- `include_all` (optional): Set `true` for all cases or `false` for selected cases.
- `case_ids` (optional): Array of case IDs when `include_all` is `false`.

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

Payload keys:

- `description` (optional): Run description.
- `assignedto_id` (optional): Assignee user ID.
- `include_all` (optional): Case selection mode.
- `case_ids` (optional): Array of case IDs when `include_all` is `false`.

**Dry-run preview:**

```bash
testrail plan update-entry 100 a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6 --dry-run --data '{"name": "New name"}'
```

See Recipe 25 for the full plan lifecycle.

### 39. Run lifecycle — list active runs, update metadata, close and delete

<!-- recipe-for: run:list -->
<!-- recipe-for: run:update -->
<!-- recipe-for: run:delete -->

Runs are execution containers for test cases.
Use these commands to list active runs, update run metadata, and close or delete runs.

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

`run list` returns an array of run objects with these fields:

- `id` (number): Run ID.
- `name` (string): Run name.
- `is_completed` (boolean): Whether the run is closed.
- `passed_count`, `failed_count`, `blocked_count`, `untested_count` (numbers): Result counts.
- `completed_on` (number | null): Completion timestamp when closed.
- `milestone_id` (number | null): Associated milestone ID.
- `assignedto_id` (number | null): Assigned user ID.

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

- `name`: New run name.
- `description`: Run description.
- `milestone_id`: Milestone ID (or `null` to clear).
- `assignedto_id`: Assignee user ID (or `null` to clear).
- `include_all`: Case selection mode.
- `case_ids`: Array of case IDs when `include_all` is `false`.

**Close a run (irreversible — preferred when preserving results):**

```bash
# Close the run — results stay queryable, but no new results can be added
testrail run close 42 --yes

# Dry-run preview
testrail run close 42 --yes --dry-run
```

Closing a run sets `is_completed` to `true` and records `completed_on`.
TestRail has no `open_run` endpoint, so closing a run is permanent.

**Delete a run (irreversible — removes run and all results):**

```bash
# Delete the run and every result in it
testrail run delete 42 --yes

# Server-side preview (TestRail returns affected-test count without deleting)
testrail run delete 42 --yes --soft

# Dry-run (client-side preview, no API call)
testrail run delete 42 --yes --dry-run
```

Flag behavior:

- `--soft`: Requests a server-side deletion preview from TestRail without deleting the run.
- `--dry-run`: Prints a local preview with no API call and overrides `--yes`.
- `--yes`: Confirms the destructive operation.

**Status check from `run list` output:**

```bash
# Count active vs closed runs
RUNS=$(testrail run list --project-id 5 --all)
ACTIVE=$(echo "$RUNS" | jq '[.[] | select(.is_completed == false)] | length')
CLOSED=$(echo "$RUNS" | jq '[.[] | select(.is_completed == true)] | length')
echo "Active: $ACTIVE, Closed: $CLOSED"
```

See Recipe 31 to poll a run until completion with `run watch`.

### 40. Milestone lifecycle — read, list, create, update, close and delete

<!-- recipe-for: milestone:get -->
<!-- recipe-for: milestone:list -->
<!-- recipe-for: milestone:add -->
<!-- recipe-for: milestone:update -->
<!-- recipe-for: milestone:delete -->

Milestones group runs and plans into release checkpoints.
Use these commands to fetch, list, create, update, and delete milestones.

**Fetch a single milestone:**

```bash
testrail milestone get 7 | jq '{id, name, description, is_completed, is_started}'
```

Returns a milestone object with these fields:

- `id` (number): Milestone ID.
- `name` (string): Milestone name.
- `description` (string): Milestone description.
- `due_on` (number | null): Due date as a Unix timestamp.
- `is_completed` (boolean): Whether the milestone is complete.
- `is_started` (boolean): Whether the milestone is started (TestRail 5.3+).
- `completed_on` (number | null): Completion timestamp.
- `project_id` (number): Parent project ID.

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

- `name` (required): Milestone name.
- `description` (optional): Milestone description.
- `due_on` (optional): Due date as a Unix timestamp.
- `parent_id` (optional): Parent milestone ID (TestRail 5.3+).

`milestone add` does not accept `is_started`.

1. Create the milestone.
2. Run `milestone update` to set `is_started: true`.

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

- `name`: New milestone name.
- `description`: New description.
- `due_on`: New deadline as a Unix timestamp, or `null` to clear.
- `is_completed`: Set `true` to complete or `false` to reopen.
- `is_started`: Set `true` to mark as started (TestRail 5.3+).

**Delete a milestone (irreversible):**

```bash
# Delete the milestone (associated runs/plans are unaffected)
testrail milestone delete 7 --yes

# Dry-run (client-side prediction, no API call)
testrail milestone delete 7 --yes --dry-run
```

`milestone delete` does not support `--soft`.
Run `milestone delete <id> --yes --dry-run` to preview locally before you delete the milestone.
Deleting a milestone removes the milestone record. Existing runs and plans keep their `milestone_id` values.
`milestone list` no longer returns the deleted milestone.

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

Each user lookup command returns a `User` object with `id`, `name`, `email`, `role_id`, `group_ids`, and `is_active`.

**Get current session user** (TestRail 6.6+):

`user get-current` calls `GET get_current_user` and returns the user for the active API key.
Use it to inspect your own account or check permissions:

```bash
testrail user get-current
# → {"id":5,"name":"Alice Smith","email":"alice@example.com","role_id":3,"is_active":true,...}
```

```bash
# Check your own role to determine what you can do
testrail user get-current | jq '.role_id'
```

**Get user by ID:**

`user get <user_id>` calls `GET get_user/{user_id}` and returns a user by numeric ID:

```bash
testrail user get 5
# → {"id":5,"name":"Alice Smith","email":"alice@example.com",...}
```

**Get user by email:**

`user get-by-email` calls `GET get_user_by_email`.
Pass `--user-email <address>` to specify the target user.
Do not use `--email` for lookups because `--email` sets your authentication identity:

```bash
testrail user get-by-email --user-email alice@example.com
# → {"id":5,"name":"Alice Smith","email":"alice@example.com",...}
```

```bash
# Combine with jq to extract just the user ID
testrail user get-by-email --user-email alice@example.com | jq '.id'
```

**Choose the right lookup command:**

- `user get-current`: Inspect your own authenticated user account.
- `user get <user_id>`: Look up a user when you know the numeric ID.
- `user get-by-email --user-email <email>`: Resolve an email address to a user ID.

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

User groups organize users at the instance level (TestRail 7.5+).
Use `group get` and `group list` to read groups.
Use `group add`, `group update`, and `group delete` to modify them.
`group delete` is destructive and requires `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`.

**Get a single group by ID:**

`group get <group_id>` calls `GET get_group/{group_id}` and returns `id`, `name`, and `user_ids`:

```bash
testrail group get 12
# → {"id":12,"name":"QA Team","user_ids":[5,6,7]}
```

**List all groups on the instance:**

`group list --all` fetches all pages from `GET get_groups`:

```bash
testrail group list --all
# → [{"id":1,"name":"Admins","user_ids":[1,2]},{"id":12,"name":"QA Team","user_ids":[5,6,7]}]
```

```bash
# Count groups
testrail group list --all | jq 'length'
```

**Create a new group:**

`group add` calls `POST add_group`.
Pass a JSON payload with `name` (required) and `user_ids` (optional array of numeric user IDs):

```bash
testrail group add --data '{"name":"QA West","user_ids":[5,6]}'
# → {"id":12,"name":"QA West","user_ids":[5,6]}
```

```bash
# Dry-run: validate the payload without creating the group
testrail group add --data '{"name":"QA West"}' --dry-run
# → {"dryRun":true,"action":"group add","payload":{"name":"QA West"},"source":"data"}
```

**Update an existing group:**

`group update <group_id>` calls `POST update_group/{group_id}`.
Pass `name`, `user_ids`, or both. An empty `{}` payload returns the group unchanged:

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

**Delete a group:**

`group delete <group_id>` calls `POST delete_group/{group_id}`.
Set `TESTRAIL_ALLOW_DESTRUCTIVE=1` and pass `--yes` to confirm:

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

`role list --all` fetches all pages from `GET get_roles` and returns every role on the TestRail instance.
Each role includes `id`, `name`, and optionally `is_project_admin`.
Role IDs depend on the instance. Query your instance before you use an example ID:

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

Pass a role ID in `role_id` when you run `user add` or `user update`:

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

These commands fetch cases, inspect edit history, copy or move cases between sections, and update multiple cases in a suite.

**Fetch a single case by ID:**

```bash
testrail case get 1337 | jq '{id, title, section_id, type_id, priority_id, assigned_to_id}'
```

The response includes all `custom_*` fields on the case.
On TestRail 10.5+, run `case titles` to fetch only IDs and titles for known case IDs:

```bash
testrail case titles 1337,1338,1339
```

**Audit edit history (TestRail 6.5.4+):**

Pass `--limit` and `--offset` (or `--all`) to page through case history:

```bash
# Fetch the 50 most recent edits to case 1337.
testrail case history 1337 --limit 50

# Page backward through 500 edits (10 pages of 50).
for offset in 0 50 100 150 200 250 300 350 400 450; do
    testrail case history 1337 --limit 50 --offset "$offset" | jq -c '.[]'
done
```

Each history entry contains `id`, `created_by`, `created_on`, `action`, and `changes`.
Check the history before you update or delete a case.

**Copy cases to a new section:**

`case copy-to-section` creates independent copies in the target section and leaves the original cases in place:

```bash
# Copy case 1337 into section 99. Specify the target section in the path;
# the payload identifies the source case(s).
testrail case copy-to-section 99 --data '{
    "case_ids": [1337, 1338]
}'
```

**Move cases to a new section:**

`case move-to-section` moves cases from their current section to the target section within the same suite.
Include `suite_id` in the payload:

```bash
# Move cases 1337, 1338 from their current section into section 99.
# suite_id identifies the suite scope (both sections must be in the same suite).
testrail case move-to-section 99 --data '{
    "case_ids": [1337, 1338],
    "suite_id": 12
}'
```

**Bulk-update multiple cases in a suite:**

Use `case update-bulk` to apply the same field values to multiple cases in one API call:

```bash
# Promote the priority on three cases at once.
testrail case update-bulk 12 --data '{
    "case_ids": [1337, 1338, 1339],
    "priority_id": 2
}'
```

To update custom fields, use the exact `system_name` (such as `"custom_rfc": "RFC-5678"`). See Recipe 45.

**CI/scripting pattern — list unassigned cases and update their priority:**

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

Custom case fields are instance-level definitions with project and template scope.
List existing definitions before you create a new field (admin-only).

**List all custom case fields on the instance:**

```bash
testrail case-field list | jq '.[] | {id, name, system_name, label, type_id, include_all, template_ids, configs}'
```

Distinguish these three identifiers:

- `id` is the numeric field definition ID, and `name` is the unprefixed field name.
- `system_name` is the exact property name used in case payloads. Use it unchanged.
- Option IDs identify choices inside `configs[].options.items`; they are unrelated to the numeric field definition ID.
  `label` is the display text.

Check `configs[].context` (`is_global: true` or `project_ids`) for project scope.
Read `options` from the applicable configuration.
Check `include_all` or `template_ids` for template scope.
Verify both scopes before you write cases. See the [official field contract](https://support.testrail.com/hc/en-us/articles/7077281158164-Case-Fields).

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

See the [case-value contract](https://support.testrail.com/hc/en-us/articles/7077292642580-Cases#add_case) for Dropdown and Multi-select values (`12` is Multi-select, `13` is BDD Scenarios).
When you create a field with `case-field add`, pass the string `type` (such as `"Dropdown"` or `"Multiselect"`) instead of `type_id`.

**Preview complete creation payloads (admin-only when submitted):**

Replace the sample project and template IDs with IDs from your instance.
`include_all` controls template scope, and `context.is_global` controls project scope.

1. Preview the payload with `--dry-run`.
2. Remove `--dry-run` to submit the request once:

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

Save the returned `id`, `system_name`, and `configs` from `case-field add`.
`case-field add` returns `configs` as a JSON string. `case-field list` returns parsed objects.
For creation responses, use `JSON.parse(result.configs)` before you inspect options.
If discovery lags after creation, poll with GET using the [bounded readiness example](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CASE-FIELD-READINESS.md).
Do not repeat a successful `case-field add` POST request.

**Use returned names when writing case values:**

TestRail 9 introduced `custom_case_` for new case fields. Older fields keep `custom_`.
Read `system_name` from field metadata. Do not construct a prefix or use `custom_<numeric field id>`.
This example assumes section 42 belongs to project 1 and the field applies to template 1.
It also assumes option `2` means staging in that project configuration:

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

`options.items` is newline-separated `ID, label` text.
In [issue #268](https://github.com/dichovsky/testrail-api-client/issues/268) on TestRail 10.7.1.1003, commas inside Dropdown labels caused HTTP 400 errors, and replacing those commas with semicolons succeeded.
This observed behavior applies to that version; it is not a verified restriction for all servers or field types.
TestRail documentation does not define comma escaping. Do not assume that quotes or backslashes work.

The schema and CLI keep the `options.items` string unchanged, including extra commas, Unicode, and malformed lines.
A successful dry-run does not validate option meanings, permissions, or server readiness.
If you substitute punctuation, record the mapping (for example, `{"Alpha, Beta": "Alpha; Beta"}`).
Avoid collisions with existing labels. Verify the returned option IDs and labels in the project configuration.
Never change punctuation silently or renumber options.
Run live compatibility experiments only when explicitly authorized, with disposable metadata outside ordinary CI.
Pass `--diagnostic-file ./case-field-error.json` on the initial command to capture redacted server validation errors.
Do not repeat a write command only to collect diagnostics.

### 46. Case metadata lookups: types and statuses

<!-- recipe-for: case-type:list -->
<!-- recipe-for: case-status:list -->

Run `case-type list` and `case-status list` to inspect the available case types and statuses on your TestRail instance.

**List all case types (readonly):**

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

Pass these IDs in `type_id` when you create or update cases:

```bash
testrail case add 42 --data '{"title": "Login flow", "type_id": 1}'
```

**List all case-level statuses (TestRail Enterprise 7.3+):**

Case statuses track the lifecycle of a case (such as Draft, Active, or Deprecated), which is separate from test result statuses:

```bash
testrail case-status list --all
```

On supported Enterprise instances, each item includes `case_status_id`, `name`, `abbreviation`, `is_default`, and `is_approved`.
Check the response array before you use case-status IDs.

### 47. Delete a single test case with safety gates

<!-- recipe-for: case:delete -->

`case delete` permanently removes a single case and its history, results, and attachments.
The CLI requires both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`.
Pass `--soft` for an optional server-side preview.

**Destructive-action gate (`--yes` + env var):**

Every destructive CLI action requires both gates:

1. The `--yes` flag.
2. The `TESTRAIL_ALLOW_DESTRUCTIVE=1` environment variable.

If either gate is missing, the CLI blocks the API call:

```bash
# Without --yes: exits 1.
testrail case delete 1337
# Error: Destructive action; pass --yes to confirm.

# Without env var: exits 2.
testrail case delete 1337 --yes
# Error: Destructive action requires TESTRAIL_ALLOW_DESTRUCTIVE=1.
```

Provide both gates to delete the case:

```bash
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail case delete 1337 --yes
```

**Server-side preview with `--soft` (hits API, no deletion):**

Pass `--soft` with `--yes` to request an affected-entity count from TestRail without deleting the case:

```bash
# Server-side preview: hit the API, receive affected-entity count, no deletion.
# Still requires --yes gate; still consumes one API request.
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail case delete 1337 --yes --soft
```

Response:

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

Pass `--dry-run` to validate the ID and print a local preview with no API call:

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

**Safety layers in order of precedence:**

| Flag        | Side   | API call? | Effect                              |
| ----------- | ------ | --------- | ----------------------------------- |
| `--dry-run` | client | no        | Parses ID, emits preview, exits 0   |
| `--soft`    | server | yes       | TestRail returns preview, no delete |
| `--yes`     | client | n/a       | Gate; without it, exits 1           |

`--dry-run` always overrides `--soft` and `--yes`.

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

**Recovery options after an accidental deletion:**

- **No client-side recovery:** When you run `case delete --yes` without `--soft` or `--dry-run`, TestRail deletes the case immediately.
- **TestRail audit log:** Check the admin audit log in the web UI to see when the case was deleted and by whom.
- **TestRail support recovery:** Open a support ticket immediately to request backup restoration before backups expire.

**Missing case IDs:**

If the case ID does not exist, TestRail returns HTTP 404 and the CLI exits with code 1:

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

Sections organize test cases inside a suite.
Use these commands to fetch, list, create, move, update, and delete sections.

**1. Fetch a single section by ID:**

```bash
testrail section get 42
```

Returns `{ id: 42, project_id: 5, suite_id: 12, parent_id: null, name: "Login", depth: 0, display_order: 1 }`.

**2. List all sections in a project:**

```bash
# All sections in the project
testrail section list 5 --all

# Sections in a specific suite (multi-suite mode projects only)
testrail section list 5 --suite-id 12 --all
```

**3. Create a new section:**

Pass `suite_id` for multi-suite projects. Single-suite projects use the default suite when you omit `suite_id`:

```bash
testrail section add 5 --data '{
    "name": "Authentication",
    "suite_id": 12,
    "description": "Login, SSO, session handling"
}'
```

**4. Move a section (TestRail 6.5.2+):**

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

`section move` accepts partial payloads. Omit fields that you do not want to change.

**5. Update section metadata:**

```bash
testrail section update 42 --data '{
    "name": "Authentication (renamed)",
    "description": "Updated scope"
}'
```

**6. Delete a section (destructive; requires env unlock + `--yes`):**

```bash
testrail section delete 42 --yes
```

`section delete` removes:

- The section and all child sections.
- All cases inside those sections.

Run `case move-to-section` before you delete a section if you want to keep its cases.
Pass `--dry-run` to preview the command without deleting:

```bash
testrail section delete 42 --yes --dry-run
```

### 49. Suite CRUD lifecycle (get → add → update → delete)

<!-- recipe-for: suite:get -->
<!-- recipe-for: suite:add -->
<!-- recipe-for: suite:update -->
<!-- recipe-for: suite:delete -->

Suites are top-level containers for test cases in a project.
Use these commands to fetch, create, update, and delete suites.

**1. Fetch a single suite by ID:**

```bash
testrail suite get 12
```

Returns `{ id: 12, project_id: 5, name: "Web API", is_master: false, is_baseline: false, ... }`.

**2. Create a new suite in a project:**

```bash
testrail suite add 5 --data '{
    "name": "Mobile App",
    "description": "iOS and Android test cases"
}'
```

`is_master` and `is_baseline` are read-only fields managed by TestRail.

**3. Update suite metadata:**

```bash
testrail suite update 12 --data '{
    "name": "Web API (renamed)",
    "description": "REST and GraphQL endpoints"
}'
```

**4. Delete a suite (destructive; requires env unlock + `--yes`):**

```bash
testrail suite delete 12 --yes
```

`suite delete` permanently removes:

- The suite.
- All sections and cases in the suite.
- All runs, tests, and results associated with the suite.

Pass `--dry-run` to preview the command locally before you delete the suite:

```bash
testrail suite delete 12 --yes --dry-run
```

**Note:** In multi-suite projects, at least one suite must remain. Deleting the last suite fails with HTTP 400.

### 50. Shared steps (get → list)

<!-- recipe-for: shared-step:get -->
<!-- recipe-for: shared-step:list -->

Shared steps are reusable step templates referenced inside test cases (TestRail 7.0+).
Use these commands to fetch and list shared steps.
See Recipe 28 to create, update, audit, or delete shared steps.

**1. Fetch a single shared step set by ID:**

```bash
testrail shared-step get 100
```

Returns `{ id: 100, project_id: 5, name: "Navigate to login", steps: [...] }`.

**2. List all shared step sets in a project:**

```bash
testrail shared-step list --project-id 5 --all
```

By default, `shared-step list` returns one response. Pass `--page` for metadata or `--all` for all pages:

```bash
testrail shared-step list --project-id 5 --all --page-size 50 --start-offset 100
```

**Example workflow:** Find a shared step ID before you reference it in a case:

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

TestRail BDD mode stores Gherkin `.feature` files as case content.
Use these commands to list, download, and upload Gherkin scenarios.

**1. List BDD entries in a project:**

```bash
testrail bdd list --project-id 5 --all --refs JIRA-1234,JIRA-5678
```

**2. Download a case's BDD (Gherkin `.feature`) content to a file:**

```bash
testrail bdd get 1337 --out scenario.feature
```

The output is UTF-8 Gherkin text:

```gherkin
Feature: Login
  Scenario: Valid credentials
    Given I am on the login page
    When I enter email "user@example.com"
    And I enter password "secret123"
    Then I should see the dashboard
```

Pass `--force` to overwrite an existing file:

```bash
testrail bdd get 1337 --out scenario.feature --force
```

**3. Create a BDD case under a section from a `.feature` file:**

```bash
testrail bdd add 42 --file scenario.feature
```

Provide a valid UTF-8 Gherkin file.
TestRail validates the syntax and returns HTTP 400 if the file is malformed.

**Dry-run preview:**

```bash
testrail bdd add 42 --file scenario.feature --dry-run
```

This command prints the parsed file size and MIME type without uploading.

**4. Replace an existing case's BDD content:**

```bash
testrail bdd update 1337 --file scenario.feature
```

**Integration pattern:** Keep `.feature` files in version control and sync them to TestRail by case ID:

```bash
for feature in features/*.feature; do
    CASE_ID=$(echo "$feature" | sed 's/.*-\([0-9]*\)\.feature/\1/')
    testrail bdd update "$CASE_ID" --file "$feature"
done
```

### 52. Test case templates (template list)

<!-- recipe-for: template:list -->

Test case templates define the field layout for a case.
Run `template list` to inspect the templates in a project:

```bash
testrail template list 5
```

Returns an array of template objects:

```json
{
    "id": 1,
    "name": "Test Case",
    "is_default": true
}
```

**Use case:** Find the default template ID in a project:

```bash
testrail template list 5 | jq '.[] | select(.is_default) | .id'
```

The default template has `is_default: true`.
Run `case-field list` (Recipe 45) to see which custom fields apply to each `template_id`.

### 53. Record multiple results for tests in one API call

<!-- recipe-for: result:add-bulk-by-test -->

`result add-bulk-by-test` calls `POST add_results/{run_id}` and records multiple test results by `test_id` in one API call.
Use this command when you already have the `test_id` list (for example, from `testrail test list <run_id> --all`).

Use `result add-bulk-by-test` when:

- You already have `test_id` values for the run.
- Your test runner maps results to `test_id` instances.
- You want to publish many results in a single request.

**Bulk write example:**

```bash
# Fetch the test list, map to results, and publish all at once.
testrail result add-bulk-by-test 42 --data '[
  {"test_id": 100, "status_id": 1, "comment": "✓ unit tests passed"},
  {"test_id": 101, "status_id": 5, "comment": "✗ integration failed on step 2"},
  {"test_id": 102, "status_id": 1, "elapsed": "2m15s", "version": "3.1.4"}
]'
```

**Dry-run preview (no API call):**

```bash
testrail result add-bulk-by-test 42 --dry-run --data '[
  {"test_id": 100, "status_id": 1},
  {"test_id": 101, "status_id": 5}
]'
```

**Custom fields pass through unchanged:**

```bash
testrail result add-bulk-by-test 42 --data '[
  {"test_id": 100, "status_id": 1, "custom_env": "prod", "custom_browser": "safari"},
  {"test_id": 101, "status_id": 5, "defects": "BUG-123"}
]'
```

**Alternatives:**

- Write one result by `test_id`: Run `result add-by-test <test_id>`.
- Write multiple results by `case_id`: Run `result add-bulk <run_id>`.
- Check valid status IDs: Run `testrail status list` (Recipe 54).

### 54. Reference data and metadata lookups

<!-- recipe-for: result-field:list -->
<!-- recipe-for: status:list -->
<!-- recipe-for: priority:list -->
<!-- recipe-for: version:get -->
<!-- recipe-for: dynamic-filter-field:list -->

Use these read-only commands to inspect server version and metadata for result and case payloads.
Run `version get` to check the TestRail server version, and run `dynamic-filter-field list` (TestRail 10.4+) to list filter fields for a project:

```bash
testrail version get
testrail dynamic-filter-field list 5
```

**List all custom result fields:**

```bash
testrail result-field list --format json
```

Output:

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

Use `system_name` (such as `custom_env`) as the key when you write results:

```bash
testrail result add-by-test 123 --data '{"status_id": 1, "custom_env": "staging"}'
```

**List all result statuses:**

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

Use these IDs in `result add`, `result add-bulk`, and `result add-bulk-by-test` payloads.
Query `status list` on your instance before you hardcode status IDs in CI.

**List all case priorities:**

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

Use these IDs in `case add` and `case update` payloads:

```bash
testrail case add 456 --data '{"title": "Critical path test", "priority_id": 5}'
```

**Programmatic access (TypeScript/JavaScript):**

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

Use these commands to list pre-configured report templates and start report generation jobs.

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

**Trigger report generation:**

`report run` calls `GET run_report/{report_template_id}` and returns URLs for the generated HTML and PDF reports:

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

On TestRail Enterprise, list and run cross-project report templates without a project ID:

```bash
testrail report list-cross-project
testrail report run-cross-project 12
```

**Download a generated report:**

`report run` returns URLs as JSON and does not accept `--out`.
Download the report from the returned URL with `curl` or `wget`:

```bash
# Note: The API returns URLs; to download, use curl or wget
URLS=$(testrail report run 8)
REPORT_URL=$(echo "$URLS" | jq -r '.report_url')
curl -o report.html "$REPORT_URL"
```

**Common automation uses:**

- **CI summary:** Trigger a report after a test run completes and share the URL.
- **Compliance audit:** Generate a report after a release.
- **Scheduled refresh:** Regenerate a template on a recurring schedule.

### 56. Project lifecycle: add, update, delete

<!-- recipe-for: project:add -->
<!-- recipe-for: project:update -->
<!-- recipe-for: project:delete -->

Projects are the root container in TestRail.
Use `project add` to create a project.
Use `project update` to change settings or user access.
Use `project delete` to remove a project.
Both write commands pass `custom_*` fields through unchanged.

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

In `groups[]` and `users[]`, `role_id` controls the role assignment:

- A positive integer assigns that project role.
- `0` selects the Global Role.
- `null` clears the project role.

Each group entry requires `id`.
Each user entry requires either `id` or `user_id`, not both.
Entries with both or neither fail validation before the request. `default_role_id` accepts a non-negative role ID.

```bash
# Dry-run to preview the payload that would be sent
testrail project update 5 --data '{"is_completed":true}' --dry-run
```

**Suite modes:**

Choose the mode at project creation. Later changes require administrator action.

| `suite_mode` | Meaning                                                       |
| ------------ | ------------------------------------------------------------- |
| 1            | Single-suite (project has one suite)                          |
| 2            | Single-suite + baselines (one suite with versioned baselines) |
| 3            | Multi-suite (project holds multiple independent suites)       |

**Delete a project:**

`project delete` is permanent and requires `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`.
TestRail does not support `--soft` on `delete_project`. Use `--dry-run` for a local preview:

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

A test in TestRail is the run-scoped instance of a case.
Run `test get` to fetch one test by `test_id`.
Run `test list --all` to list all tests in a run, including each current `status_id`.
Without `--all`, `test list` returns one response page.

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

`--with-data` accepts `0` or `1`.
Pass `1` to include `results` and `attachments` arrays on the returned test object.
With `0` or no flag, TestRail returns the ordinary `get_test` response.

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

**Choose between `test list`, `case list`, and `result list`:**

- `test list <run_id> --all`: List all test instances in a run (pair with `result add-by-test`).
- `case list --project-id <id> --suite-id <id> --all`: List the case catalog when you design a run.
- `result list --run-id <id> --all`: List recorded result entries for a run.

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

`test update-labels` changes only the labels on a test; it does not update other test fields.
Each element in `labels` can be a numeric label ID or a string title. TestRail resolves titles to IDs.
`test update-labels-bulk` sets the same `labels` array on all tests listed in `test_ids`.
It accepts no path parameter and cannot set different labels per test:

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

Use the `label` commands to manage project-scoped label definitions.
Label titles have a 20-character limit.
Renaming a label updates every case and test that uses it.
`label delete` and `label delete-bulk` are permanent and require `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`.

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
