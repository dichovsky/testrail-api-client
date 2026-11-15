# BACKLOG archive

This file stores archived items from `BACKLOG.md` to keep the main backlog compact. It preserves shipped items, security writeups, API-gap history, and decision rationales.

# BACKLOG

This registry tracks deferred work items from the v2.1.0 skill-publishing design (`SKILL-PLAN.md`). These items are excluded from v2.1.0 to prevent scope creep and guide future pull requests.

Conventions:

- `[ ]` open · `[x]` shipped · `[~]` partially shipped · `[!]` **won't do** (explicitly rejected)
- **Effort**: S (≤½ day) · M (1–2 days) · L (1+ week)
- **Trigger**: condition that justifies adding this item to a release

---

## CLI read surface — API coverage gaps (P0)

`TestRailClient` already included the `getTest` and `getTests` programmatic methods. The items below added the CLI read commands tracked in `docs/API-MAPPING.md`.

- [x] **`test get` (GET `get_test/{test_id}`)** — Shipped in PR #86 ("CLI test get + test list (P0)"). The CLI exposes `testrail test get <test_id>` via `src/cli/handlers/test.ts`. `src/cli/metadata.ts` adds an `ActionSpec` entry with `apiEndpoint: 'GET get_test/{test_id}'` to match the `@testrail` JSDoc tag in `src/modules/tests.ts`. All drift gates (`codemap`, `mapping`, and `skill` `--check`) are wired automatically.
- [x] **`test list` (GET `get_tests/{run_id}`)** — Shipped in PR #86 ("CLI test get + test list (P0)"). The CLI exposes `testrail test list <run_id> [--status-id 1,5] [--limit N] [--offset N]`. The handler splits `--status-id` on commas and validates each token with `parseId` to produce a `number[]`. Malformed tokens fail immediately with `IdParseError`. The CLI does not drop invalid tokens or pass raw strings to the API. `src/cli/flags.ts` and the `KNOWN_FLAGS` inventory test now include `status-id`. An empty `{}` response body returns `[]` to match `getTests`. Unit tests are in `tests/cli-read-handlers.test.ts` (the read-side counterpart to `cli-write-handlers.test.ts`).
- [x] **`case-field list` (GET `get_case_fields`)** — Shipped in the "CLI metadata reads — case-field/result-field/status/template (P1)" PR. The CLI exposes `testrail case-field list` with no positional arguments and rejects extra positional arguments immediately. `src/cli/handlers/case-field.ts` provides the read handler alongside `case-field-write.ts`. `src/cli/metadata.ts` places the `ActionSpec` in the "Metadata read actions" cluster.
- [x] **`result-field list` (GET `get_result_fields`)** — Shipped in the same PR. The CLI exposes `testrail result-field list` with no positional arguments in `src/cli/handlers/result-field.ts`.
- [x] **`status list` (GET `get_statuses`)** — Shipped in the same PR. The CLI exposes `testrail status list` with no positional arguments in `src/cli/handlers/status.ts`. This resource is separate from `case-status list` because TestRail keys case statuses on `case_status_id` instead of `id`.
- [x] **`template list` (GET `get_templates/{project_id}`)** — Shipped in the same PR. The CLI exposes `testrail template list <project_id>` in `src/cli/handlers/template.ts`. `parseId` validates the positive-integer path parameter and rejects `0`, `-1`, floats, hex, scientific notation, and empty strings before any network call. Four zero-argument handlers (`case-field list`, `case-status list`, `result-field list`, `status list`) check `pathParams.length > 0` and throw `IdParseError`. A typo such as `testrail status list 5` fails with a clear error instead of ignoring `5`. Unit and subprocess tests verify this check. A follow-up commit ("fix: tighten extra-arg handling") changed the error class from `Error` to `IdParseError` and added the check to `case-status list`.
- [x] **`role list` (GET `get_roles`)** — Shipped in the "CLI role/priority/case-type list (P2)" PR. The CLI exposes `testrail role list` in `src/cli/handlers/role.ts` with no positional arguments and rejects extra positional arguments with `IdParseError`. `src/cli/metadata.ts` places the `ActionSpec` in the "Reference-data read actions" cluster to separate static reference data from field-definition metadata. The `HELP` text groups both clusters under "Metadata actions" because agents use both to look up identifiers before creating cases, runs, or results.
- [x] **`priority list` (GET `get_priorities`)** — Shipped in the same PR. The CLI exposes `testrail priority list` with no positional arguments in `src/cli/handlers/priority.ts`. The command returns `priority` (sort order) and `is_default` so agents can look up a priority by name for `case add --data '{"priority_id":...}'` and `case update-bulk`.
- [x] **`case-type list` (GET `get_case_types`)** — Shipped in the same PR. The CLI exposes `testrail case-type list` with no positional arguments in `src/cli/handlers/case-type.ts`. It uses the same zero-argument read pattern, `IdParseError` check on extra arguments, and `--format table` / `--format json` output path as `role list` and `priority list`. This command completes CLI coverage for the instance-level reference-data getters on `TestRailClient`.
- [x] **`user get-by-email` (GET `get_user_by_email`)** — The CLI exposes `testrail user get-by-email --user-email <addr>` with no positional arguments and rejects extra arguments with `IdParseError`. The `--user-email` lookup flag is separate from the `--email` authentication flag so administrators can query another user without changing their Basic Auth identity. The handler requires non-empty input, and `EMAIL_REGEX` in `src/modules/users.ts` rejects malformed email addresses before any network call. The CLI returns exit code 1 on 404, 401, 403, and network errors.
- [x] **`user get-current` (GET `get_current_user`)** — Shipped in the "CLI user lookups (P2)" PR. The CLI exposes `testrail user get-current` with zero positional arguments and rejects extra arguments with `IdParseError`. The command returns the authenticated user for credential verification and user lookup without a numeric `user_id` (TestRail 6.6+).

## CLI write surface — structural setup

These commands map to existing `TestRailClient` methods that were omitted from the v2.1 CLI. Version 2.1 shipped only the 6 actions for authoring cases and publishing results because humans usually perform project setup once in the TestRail UI.

- [x] **`project add` / `project update`** — Shipped in the "Structural-setup CLI" PR. The CLI exposes `addProject` and `updateProject` as `project add --data ...` (no path parameter) and `project update <project_id> --data ...`. The PR migrated `AddProjectPayload` and `UpdateProjectPayload` from interfaces in `types.ts` to Zod schemas in `schemas.ts`. `suite_mode` uses `z.number().optional()` instead of a `1|2|3` literal union so the server validates mode values directly.
- [x] **`suite add` / `suite update`** — Shipped in the "Structural-setup CLI" PR. The CLI exposes `addSuite` and `updateSuite` as `suite add <project_id> --data ...` and `suite update <suite_id> --data ...`. The PR migrated the payload schemas from `types.ts` to Zod in `schemas.ts`.
- [x] **`section add` / `section update`** — Shipped in the "Structural-setup CLI" PR. The CLI exposes `addSection` and `updateSection` as `section add <project_id> --data ...` and `section update <section_id> --data ...` in `section-write.ts` alongside `section move`. `AddSectionPayloadSchema` marks `suite_id` as optional to support single-suite and multi-suite projects. TestRail returns HTTP 400 on invalid `suite_id` combinations.
- [x] **`milestone add` / `milestone update`** — Shipped in the "Structural-setup CLI" PR. The CLI exposes `addMilestone` and `updateMilestone` as `milestone add <project_id> --data ...` and `milestone update <milestone_id> --data ...`. Only the update schema includes the state-toggle fields (`is_completed`, `is_started`).
- [x] **`user add` / `user update`** — Shipped `addUser` and `updateUser` for TestRail 7.3+. The TestRail 10.7 audit updated the create contract to require only `name` and `email`. Documented optional fields include activation, admin, SSO, and MFA flags, notifications, role, groups, and assigned projects. The 10.7 contract does not include password or language request fields.
- [x] **`plan add` / `plan update` / `plan add-entry`** — Shipped `addPlan`, `updatePlan`, and `addPlanEntry` together with `plan get` and `plan list`. The PR migrated plan payload schemas from interfaces in `types.ts` to Zod schemas in `schemas.ts`. Zod validates nested `entries[]`, and `PlanEntryRunPayloadSchema` makes all fields optional (including `name`) because TestRail derives the run name from the configuration. `plan close`, `plan delete`, `plan-entry update`, and `plan-entry delete` remained deferred and required a UUID string parser for `entry_id`.
- [x] **`run update`** — Shipped as `run update <run_id> --data ...`. `TestRailClient` already exposed `updateRun(runId, payload)` with `@testrail POST update_run/{run_id}`. This PR added `handleRunUpdate`, the `ActionSpec` entry, `HELP` text, schema-name binding in `scripts/skill-renderer.mjs`, and tests. All fields in `UpdateRunPayloadSchema` are optional, so the handler accepts an empty body (`'{}'`). This command lets users rename a run or change its milestone from the CLI.
- [x] **`shared-step add` / `shared-step update` / `shared-step delete`** — Shipped in PR8 ("CLI shared-step add/update/delete (P1)"). `TestRailClient` already included `addSharedStep`, `updateSharedStep`, and `deleteSharedStep` (TestRail 7.0+). This PR added the CLI handlers in `src/cli/handlers/shared-step-write.ts`, three `ActionSpec` entries, `HELP` text under "Shared-step actions", and schema-name bindings in `scripts/skill-renderer.mjs`. It migrated `AddSharedStepPayloadSchema` and `UpdateSharedStepPayloadSchema` from `types.ts` to Zod in `schemas.ts`. `custom_steps_separated` uses `z.array(z.record(z.string(), z.unknown())).optional()`, and `.passthrough()` on `zObject` forwards arbitrary `custom_*` keys. `shared-step delete` rejects `--soft` and exposes TestRail's `keep_in_cases` body option as `--keep-in-cases` (default `true` to keep step content in referencing cases).
- [x] **`configuration list` + `configuration-group add/update/delete` + `configuration add/update/delete`** — Shipped in PR9 ("Configurations CLI"). The CLI exposes TestRail's two-level configuration hierarchy (`project` → `config_groups` → `configs`) under `configuration-group` (`<config_group_id>`) and `configuration` (`<config_id>` and `configuration list <project_id>`). `ConfigurationModule` already existed. This PR added 7 CLI handlers: 1 read handler and 6 write or destructive handlers. It added 4 Zod payload schemas with `.passthrough()`: `AddConfigurationGroupPayloadSchema`, `UpdateConfigurationGroupPayloadSchema`, `AddConfigurationPayloadSchema`, and `UpdateConfigurationPayloadSchema`. It also added schema-name bindings in `scripts/skill-renderer.mjs` and `HELP` text under "Configuration actions". It also migrated the 4 payload types from `types.ts` to `z.infer` types in `schemas.ts`. Both delete commands require `--yes`, honor `--dry-run` first, and reject `--soft` because `delete_config_group` and `delete_config` do not support `?soft=1`. `tests/cli-helpers.test.ts` pins both delete actions in the destructive and no-body-write sets. Recipe #26 in `skill/SKILL.md` ("Configuration groups & configs hierarchy management") includes five `<!-- recipe-for: -->` tags for gate C2.
- [x] **`group get` / `group list` / `group add` / `group update` / `group delete`** — Shipped in PR13 ("CLI group CRUD (P2)"). The CLI exposes TestRail's instance-level user-group resource (TestRail 7.5+) under `group` with two reads (`get <group_id>`, `list`) and three writes (`add`, `update <group_id>`, `delete <group_id>`). `UsersModule` already included `getGroup`, `getGroups`, `addGroup`, `updateGroup`, and `deleteGroup`. This PR added `src/cli/handlers/group.ts`, `src/cli/handlers/group-write.ts`, five `ActionSpec` entries in `src/cli/metadata.ts`, `HELP` text, and schema-name bindings in `scripts/skill-renderer.mjs`. It migrated `Group`, `AddGroupPayload`, and `UpdateGroupPayload` from `types.ts` to Zod schemas with `.passthrough()` in `schemas.ts`. `UpdateGroupPayloadSchema` accepts an empty body (`{}`). `group delete` rejects `--soft` because `delete_group` does not support `?soft=1`. Deleting a group removes user memberships but does not delete the user accounts. The handler checks `parseId → --soft reject → --dry-run → --yes` (tracked for harmonization under ARCH #9). `tests/cli-helpers.test.ts` pins `group:delete` in the destructive and no-body-write sets. `group` manages instance-level user memberships, whereas `configuration-group` manages project-scoped test configurations.

## CLI write surface — destructive operations

Version 2.1 omitted destructive operations so agents could not run irreversible actions without human review. The programmatic API already exposed these methods.

- [x] **`case delete`** — Shipped in the "Destructive single-entity delete CLI surface" PR as `case delete <case_id> [--soft] --yes`. `--yes` confirms the deletion, and `--dry-run` overrides `--yes` to return a client-side preview. `--soft` sends `?soft=1` to return `affected_*` counts without deleting the case. The programmatic API added a `deleteCase(id, { soft: true })` overload that returns `SoftDeletePreview`.
- [x] **`run delete`** — Shipped in the same PR as `run delete <run_id> [--soft] --yes`. The programmatic API added a `deleteRun(id, { soft: true })` overload.
- [x] **`suite delete` / `section delete` / `milestone delete` / `project delete`** — Shipped in the same PR. `suite delete` and `section delete` accept `[--soft]`. `milestone delete` and `project delete` reject `--soft` because TestRail does not support `?soft=1` on those endpoints. `project delete` uses the same `--yes` gate because TestRail provides no extra server-side confirmation parameter.
- [x] **`plan close` / `plan delete` / `plan delete-entry` / `plan delete-run-from-entry`** — Shipped in PR6 ("CLI destructive plan ops + lifecycle recipe"). Each command requires `--yes`, lets `--dry-run` override `--yes`, and rejects non-positive path-parameter IDs before checking `--yes`. `plan close` is irreversible because TestRail has no `open_plan` endpoint. All four commands reject `--soft` because none of the endpoints support `?soft=1`. `delete-entry` validates the UUID-style `entry_id` string in the handler and returns `entry_id must be a non-empty string` on invalid input. `tests/cli-helpers.test.ts` pins all four actions in the destructive-action set.
- [x] **`TESTRAIL_ALLOW_DESTRUCTIVE=1` env-var gate (BREAKING)** — Shipped in PR4 of the v4.0.0 batch ("CLI destructive env-var gate"). Destructive CLI actions now require both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1` (exact string `'1'`; values such as `'true'`, `'yes'`, `'on'`, and `'1 '` fail). `checkDestructiveEnvGate` in `src/cli/dispatch.ts` runs before authentication and handler execution so no destructive handler can bypass the check. A missing or invalid environment variable exits with code **2** instead of `1` so CI pipelines can detect the missing unlock. `--dry-run` bypasses both `TESTRAIL_ALLOW_DESTRUCTIVE` and `--yes`. The programmatic API (`TestRailClient`) is unchanged. `tests/cli.test.ts` sets `TESTRAIL_ALLOW_DESTRUCTIVE: '1'` in `AUTH_ENV` by default and tests all combinations of `(destructive?, dryRun, env value)`. `tests/cli-helpers.test.ts` tests `checkDestructiveEnvGate` and verifies that every `destructive: true` action in `ACTIONS` is gated. See `CHANGELOG.md` (v4.0.0), `README.md`, and `docs/ARCHITECTURE.md` §6.6.
- [ ] **`result delete`** — Not applicable. The TestRail API does not support deleting individual results. Won't implement.

## CLI write surface — bulk operations

Version 2.1 shipped `result add-bulk` because test runs produce many results. Other bulk endpoints were deferred.

- [x] **`case add-bulk`** — Shipped in the "CLI bulk-case + run watch + attachment pagination (P2)" PR as `testrail case add-bulk <section_id> --data '[{...},{...}]'`. `AddCasesBulkPayloadSchema` rejects empty arrays and invalid case items before any network call. The TestRail 10.7 audit removed the 7.5 version-error rewrite because TestRail 7.0 already supports `add_cases`. The CLI accepts a JSON array, and the module wraps it in `{ cases: [...] }` and decodes the response envelope. `--dry-run` outputs `count` to preview large imports.
- [ ] **`run add-bulk`** — Not applicable. The TestRail API does not support bulk run creation. Won't implement.

## CLI feature extensions

- [x] **Output format: `yaml`** — Shipped in the "CLI `--format yaml`/`--format csv` (P1)" PR. `renderYaml` in `src/cli/output.ts` implements a zero-dependency YAML 1.2 emitter. It uses a 2-space indent (`YAML_INDENT_SPACES` in `src/constants.ts`) and double-quotes strings that match numbers, booleans, null tokens, or reserved leading characters. It escapes C0 and DEL characters (`\n`, `\r`, `\t`, `\b`, `\f`, `\0`, `\xNN`) and formats `NaN` and `±Infinity` as `.nan`, `.inf`, and `-.inf`. Empty objects and arrays render as `{}` and `[]`. Mapping keys use the same quoting rules as scalars so `"42"` remains a string. A `try/catch` block catches circular references and outputs `error: unserializable / message: …`. This custom emitter avoids adding `yaml` or `js-yaml` as runtime dependencies.
- [x] **Output format: `csv`** — Shipped in the same PR. `renderCsv` implements an RFC 4180 emitter with CRLF line endings and double-quote escaping. It sorts the union of top-level keys across all rows to produce deterministic headers. Nested objects and arrays serialize as JSON strings within a single cell to keep the column count constant. Single-object responses render as a 1-row CSV in key insertion order. For mixed arrays of objects and primitives, `renderCsv` places primitives in column 0. Unknown `--format` values exit with code 1 and print `unknown --format 'xml'. Valid values: json, table, yaml, csv.`
- [x] **Attachment upload** — Shipped `addAttachmentToCase`, `addAttachmentToResult`, and related methods as `attachment add-to-case|result|run|plan|plan-entry --file <path> [--filename <name>]`. Reused the multipart upload path in `client-core.ts`.
- [x] **Attachment download** — Shipped `getAttachment` as `attachment get <id> --out <path> [--force]`. Refuses to overwrite an existing file without `--force`.
- [x] **Watch mode** — Shipped in the "CLI bulk-case + run watch + attachment pagination (P2)" PR as `testrail run watch <run_id> [--interval N] [--once]`. The handler polls `GET get_run/{run_id}` with a recursive `setTimeout` chain to prevent timer drift and stacking. The CLI bounds `--interval` to `[5, 600]` seconds (default 30 seconds) to protect TestRail's rate limit of 100 requests per 60 seconds. Change detection compares `is_completed`, `untested_count`, `passed_count`, `failed_count`, `retest_count`, and `blocked_count`. The command exits with code 0 when `is_completed` becomes `true`. On `SIGINT`, a prepended listener writes `interrupted at runId=N; lastSnapshot=...` to `stderr` before the process exits with code 130. Transient `getRun()` errors are reported without stopping the watcher, while unrecoverable errors exit with code 1.
- [!] **Interactive prompts** — `--interactive` mode for human input. **Won't do.** This tool targets agents and scripts; humans can use the TestRail web UI.
- [!] **Telemetry / usage analytics** — **Won't do.** Conflicts with the single-dependency policy and user privacy.

## Attachment surface — deferred follow-ups

The v2.2 attachment-surface PR shipped 11 read, write, and download actions plus `attachment delete` (gated by `--yes`, where `--dry-run` overrides `--yes`).

- [ ] **Binary stdin upload** — `cat foo.png | attachment add-to-case 42 --filename foo.png`. **Effort:** S (handle binary `stdin` across platforms and require `--filename`). **Trigger:** agents that pipe artifacts without temporary files.
- [ ] **Binary stdout download** — `attachment get 42 --out -` to stream binary output to `stdout` (for example, `| sha256sum`). **Effort:** S. **Trigger:** shell pipeline use cases. Must refuse when `stdout.isTTY` is true.
- [x] **Pagination on `attachment list-for-*`** — Shipped in the "CLI bulk-case + run watch + attachment pagination (P2)" PR. `getAttachmentsForCase`, `getAttachmentsForRun`, and `getAttachmentsForTest` now accept `GetAttachmentsOptions { limit?, offset? }` (exported from the package root). The CLI passes `--limit` and `--offset` to TestRail's `&limit=` and `&offset=` query parameters (server default page size: 250). `list-for-plan` and `list-for-plan-entry` do not paginate because TestRail returns the full plan attachment tree. `validatePaginationParams` rejects `limit <= 0` and `offset < 0` before any network call, and `optInt` (`NON_NEG_INT_RE`) converts malformed tokens to `undefined`.
- [ ] **Streaming upload for very large files** — `--file` buffers the entire file into a `Uint8Array`. TestRail accepts files up to 256 MB. **Effort:** M (update `requestMultipart` to stream instead of requiring `Blob | Uint8Array`). **Trigger:** memory pressure on CI runners.
- [ ] **Destructive-ops env-var alternative** — Accept `TESTRAIL_ALLOW_DESTRUCTIVE=1` as an alternative to `--yes`. **Effort:** S. **Trigger:** user request from CI environments.

## Skill scope expansion

- [x] **SKILL recipe: Plan entries lifecycle (add → add-run → update → delete cascade)** — Shipped in PR6 as recipe #24 in `skill/SKILL.md`. It documents plan creation, entry creation, per-config run creation, entry and run updates, and top-down deletion (`delete-run-from-entry` → `delete-entry` → `delete/close plan`). Four `<!-- recipe-for: -->` HTML comments bind the recipe to the four destructive plan actions in gate C2 and `docs/API-MAPPING.md`. The recipe also references `plan add-run-to-entry`, `plan update-entry`, and `plan update-run-in-entry` from PR5.
- [x] **SKILL recipe: Bulk case delete with `--soft` server-side preview** — Shipped as recipe #26 in `skill/SKILL.md` with `<!-- recipe-for: case:delete-bulk -->`. It documents the safety flags in `handleCaseDeleteBulk` (`src/cli/handlers/case-write.ts`). `--dry-run` previews locally with `destructive: true` and `soft`; missing `--yes` causes an error. `--soft --yes` previews on the server and returns `{ deleted: false, preview }`. `--yes` deletes and returns `{ deleted: true }`. The recovery section notes that TestRail has no client-side rollback and points to the TestRail audit log. `tests/skill-recipes.test.ts` pins the `recipe-for` tag, safety table, workflow commands, and exit-code text.
- [x] **SKILL recipe: Configuration groups & configs hierarchy management** — Shipped in PR9 as recipe #26 in `skill/SKILL.md` alongside the seven configuration CLI commands. It documents the `project` → `config_group` → `config` lifecycle and uses five `<!-- recipe-for: -->` tags (`configuration:list`, `configuration-group:add`, `configuration-group:delete`, `configuration:add`, `configuration:delete`) for gate C2. It notes that deleting a configuration group removes its deleted configurations from future plan-entry runs while preserving historical results. `tests/skill-recipes.test.ts` pins the tag grouping, command order, and warning text.
- [x] **Programmatic TypeScript API recipes in the skill** — Shipped in PR5 ("Skill expansion"). Added `## Programmatic TypeScript API` to `skill/SKILL.md` with runnable TypeScript examples. They cover projects, suites, sections, cases, runs, results, milestones, attachments, plans, users, datasets, variables, groups, shared steps, and configurations. Every snippet uses `new TestRailClient({...})` with `try`/`catch`/`finally` and `client.destroy()`. The section also demonstrates `TestRailApiError` and `TestRailValidationError` narrowing, retry and rate-limit options, body size caps, and `registerProcessHandlers`. `README.md` links to this section under "Using with AI Coding Agents".
- [x] **Cursor rules file (`.cursor/rules/testrail.mdc`)** — Shipped in PR5. `scripts/generate-cursor-rules.js` generates `.cursor/rules/testrail.mdc` from `src/cli/metadata.ts` and `scripts/rules-content.mjs` with YAML frontmatter (`description`, `globs`, `alwaysApply`). This format follows the [Cursor rules specification](https://docs.cursor.com/context/rules-for-ai). Added `cursor-rules` and `cursor-rules:check` npm scripts and wired `cursor-rules:check` into `pretest`.
- [x] **Continue rules** — Shipped in PR5. `scripts/generate-continue-rules.js` generates `.continue/rules/testrail.md` from `src/cli/metadata.ts` and `scripts/rules-content.mjs` as plain Markdown. This format follows the [Continue rules specification](https://docs.continue.dev/customization/rules). Added `continue-rules` and `continue-rules:check` npm scripts and wired `continue-rules:check` into `pretest`.
- [x] **Generic `AGENTS.md`** — Shipped in PR5. `scripts/generate-agents-md.js` generates `AGENTS.md` at the repository root with the shared rules content and a `Build / verify commands` section. Added `agents-md` and `agents-md:check` npm scripts and wired `agents-md:check` into `pretest`. The file follows the [agents.md specification](https://agents.md/). All three rule generators share `scripts/rules-content.mjs`.
- [ ] **Localization (non-English)** — Translate the skill file. **Effort:** L (translation and per-language generator). **Trigger:** documented non-English user base.

## `install-skill` enhancements

- [!] **Symlink install option** — **Won't do** (Q11). Causes permission issues on Windows and broken-symlink edge cases. Copying the file is fast enough to rerun on update.
- [!] **`postinstall` auto-install hook** — **Won't do** (Q11). Runs without user consent, breaks CI pipelines, and affects users who do not use Claude Code.
- [x] **`testrail uninstall-skill`** — Shipped in PR5 ("Skill expansion"). `src/cli/uninstall-skill.ts` exports `runUninstallSkill()` and `getInstallTarget()`. It removes the skill file from `./.claude/skills/testrail-cli/` (default) or `~/.claude/skills/testrail-cli/` (`--global`), and removes the `testrail-cli/` directory if it is empty without modifying `.claude/skills/`. To prevent TOCTOU attacks, it checks the target with `lstat` and refuses to remove symlinks or non-regular files. `src/cli/index.ts` dispatches `uninstall-skill` alongside `install-skill`. `uninstall-skill` does not modify `.cursor/rules/testrail.mdc`, `.continue/rules/testrail.md`, or `AGENTS.md`. SEC #5 tracks the remaining TOCTOU symlink issue on `install-skill`. `tests/uninstall-skill.test.ts` (12 tests) and `tests/cli.test.ts` verify this command.
- [ ] **Multi-version skill management** — Support side-by-side skill installations for multiple package versions. **Effort:** M. **Trigger:** monorepos that pin multiple versions.
- [ ] **Claude Code plugin marketplace publish** — Publish to a separate distribution channel. **Effort:** M (process and metadata). **Trigger:** launch of an official Claude Code marketplace.

## Drift detection — beyond generator diff

The v2.1 plan uses hybrid generation with `<!-- GENERATED -->` sentinels and a `prepublishOnly` diff check.

- [ ] **Snapshot test for recipe code blocks** — Parse `SKILL.md` and extract fenced `bash` blocks. Run each block against the CLI with mocked `fetch`. Verify the exit codes. **Effort:** M. **Trigger:** recipe drift that bypasses the schema-level generator.
- [ ] **Generator runs in CI separately from `pretest`** — Add a GitHub Action that fails pull requests with a clear "run `npm run skill`" message. **Effort:** S. **Trigger:** contributor confusion from `pretest` failure messages.

## Quality / verification

- [ ] **Coverage delta enforcement** — Fail CI if test coverage drops below 98%. **Effort:** S (Vitest configuration). **Trigger:** a pull request that reduces coverage.
- [ ] **CLI fuzz tests** — Pass random JSON payloads to write actions and verify that Zod rejects invalid shapes. **Effort:** M. **Trigger:** payload-validation bugs.
- [ ] **Stricter numeric parsing in `parseId` / `optInt`** — `Number(raw)` + `Number.isInteger` currently accepts non-decimal literals such as `'1e3'` (1000) and `'0x10'` (16). Validate inputs with `/^[1-9]\d*$/` (or `/^\d+$/` for `optInt`) so the CLI accepts only decimal positive integers. **Effort:** S. **Trigger:** Copilot review on PR #53, deferred to a release that documents stricter input validation.

## TestRail API methods — not yet implemented

This section tracks programmatic client gaps against the [TestRail API reference](https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference). Each item adds a method on `TestRailClient`, a Zod schema, and tests.

To implement an endpoint:
1. Add the method to the module in `src/modules/`.
2. Validate IDs with `this.client.validateId(...)`.
3. Parse responses with `this.client.parse(Schema, raw)`.
4. Define request and response schemas in `src/schemas.ts` with `.passthrough()` to preserve `custom_*` fields.
5. Re-export public types from `src/index.ts`.
6. Add tests in `tests/client-*.test.ts`.
See `CLAUDE.md` → "Add API endpoint" for the complete checklist.

### BDDs ([API docs](https://support.testrail.com/hc/en-us/articles/7832161593620-BDDs)) — entire category, TestRail 7.5+

- [x] **`getBdd(caseId)`** — Shipped in the "BDD endpoints" PR. `GET get_bdd/{case_id}` returns raw Gherkin `.feature` text (TestRail 7.5+). Added `requestText()` to `TestRailClientCore` to apply the same retry, rate-limit, timeout, and DNS rules as `request<T>()` while returning `response.text()`. Implemented in `src/modules/bdd.ts`. The CLI command `bdd get <case_id> --out <path> [--force]` writes UTF-8 text and outputs a JSON acknowledgement with the byte count.
- [x] **`addBdd(caseId, file, filename)`** — Shipped in the "BDD endpoints" PR. `POST add_bdd/{case_id}` uploads a `.feature` file via `requestMultipart` and returns the updated `Case` validated by `CaseSchema`. The CLI command `bdd add <case_id> --file <path> [--filename <name>]` matches `attachment add-to-case`, including `--dry-run` preview.

### Cases ([API docs](https://support.testrail.com/hc/en-us/articles/7077292642580-Cases)) — bulk and history

- [x] **`updateCases(suiteId, payload)`** — Shipped in the "Bulk case operations" PR. `POST update_cases/{suite_id}` sends `{ case_ids: number[], ...sharedFields }` and returns the updated cases. `UpdateCasesPayloadSchema` is defined inline with `.passthrough()`. The CLI exposes `case update-bulk <suite_id> --data ...` and requires `suite_id` as a path parameter to match the live API and reference Python client (`tolstislon/testrail-api`).
- [x] **`deleteCases(suiteId, projectId, payload, options?)`** — Shipped in the "Bulk case operations" PR. `POST delete_cases/{suite_id}&project_id=X[&soft=1]` requires `project_id` as a positional parameter. Setting `options.soft=true` appends `soft=1` to return affected counts from the server without deleting cases, whereas CLI `--dry-run` previews locally without calling the API. The CLI exposes `case delete-bulk <suite_id> --project-id <id> [--soft] --data ... --yes`.
- [x] **`copyCasesToSection(sectionId, payload)`** — Shipped in the "Bulk case operations" PR. `POST copy_cases_to_section/{section_id}` sends `{ case_ids: number[] }` and returns `Case[]`. The CLI exposes `case copy-to-section <section_id> --data ...`. `CopyCasesToSectionPayloadSchema` is kept separate from `DeleteCasesPayloadSchema` so future changes to one endpoint do not affect the other.
- [x] **`moveCasesToSection(sectionId, payload)`** — Shipped in the "Bulk case operations" PR. `POST move_cases_to_section/{section_id}` sends `{ case_ids: number[], suite_id: number }`. The live API takes `section_id` only in the URL path and requires `suite_id` in the body. The CLI exposes `case move-to-section <section_id> --data ...`.
- [x] **`getHistoryForCase(caseId, options?)`** — Shipped in the "History/statuses" PR alongside `getSharedStepHistory` and `getCaseStatuses` (TestRail 6.5.4+). The CLI exposes `case history <case_id> [--limit N] [--offset N]`. It shares `HistoryEntrySchema` (with `.passthrough()`) with `getSharedStepHistory`.

### Case Fields ([API docs](https://support.testrail.com/hc/en-us/articles/7077281158164-Case-Fields))

- [x] **`addCaseField(payload)`** — Shipped in the "addCaseField" PR. `POST add_case_field` requires administrator permissions on the TestRail server. `AddCaseFieldPayloadSchema` uses a dedicated `AddCaseFieldConfigPayloadSchema` for `configs[]` and `.passthrough()` for field-type-specific options. It returns the created `CaseField`. The CLI exposes `case-field add --data ...` with no path parameters.

### Plans ([API docs](https://support.testrail.com/hc/en-us/articles/7077711537684-Plans)) — per-entry run management

- [x] **`addRunToPlanEntry(planId, entryId, payload)` / `updateRunInPlanEntry(runId, payload)` / `deleteRunFromPlanEntry(runId)`** — Shipped in the "Plan entry runs" PR on `TestRailClient`. Added `AddRunToPlanEntryPayloadSchema` (`config_ids` required) and `UpdateRunInPlanEntryPayloadSchema` (four optional mutable fields). `UpdateRunInPlanEntryPayloadSchema` rejects `name`, `config_ids`, and `refs` on the client because the endpoint ignores them.
- [x] **CLI: `plan add-run-to-entry` / `plan update-entry` / `plan update-run-in-entry`** — Shipped in the "Plan-entry write CLI" PR under the `plan` resource. A local `parseEntryId` helper validates that the UUID `entry_id` is a non-empty string to match `client-core.validateEntryId`. Each handler uses `parseId` for numeric path parameters, `resolveBody` for `--data | --data-file | stdin`, `--dry-run` preview, and Zod payload validation. `plan delete-entry` and `plan delete-run-from-entry` shipped separately in PR6.

### Results ([API docs](https://support.testrail.com/hc/en-us/articles/7077819312404-Results))

- [x] **`addResults(runId, payload)`** — Shipped with CLI `result add-bulk-by-test <run_id> --data ...`. `AddResultForTestPayloadSchema` requires `test_id` and `status_id`, and `AddResultsPayloadSchema` wraps the array. Defining the schema inline keeps `.passthrough()` unambiguous and returns `Result[]` in server response order.

### Sections ([API docs](https://support.testrail.com/hc/en-us/articles/7077918603412-Sections))

- [x] **`moveSection(sectionId, payload)`** — Shipped in the "moveSection" PR (`POST move_section/{section_id}`, TestRail 6.5.2+). The request body accepts `{ parent_id?: number | null, after_id?: number | null }` using `z.number().nullable().optional()`. Passing `null` moves the section to the root or top, whereas omitting a field leaves that position unchanged. The method returns `Promise<void>`. The CLI exposes `section move <section_id> --data '{"parent_id":null,"after_id":42}'` in `src/cli/handlers/section-write.ts`.

### Shared Steps ([API docs](https://support.testrail.com/hc/en-us/articles/7077919815572-Shared-Steps))

- [x] **`getSharedStepHistory(sharedUpdateId, options?)`** — Shipped in the "History/statuses" PR. The CLI exposes `shared-step history <shared_update_id> --page|--all` using response-driven pagination without `--limit` or `--offset`. This PR also added `shared-step get` and `shared-step list` to the CLI.

### Statuses ([API docs](https://support.testrail.com/hc/en-us/articles/7077935129364-Statuses))

- [x] **`getCaseStatuses()`** — Shipped in the "History/statuses" PR for TestRail Enterprise 7.3+. `CaseStatusSchema` keys records on `case_status_id` instead of `id` to keep it separate from `StatusSchema`. The CLI exposes `case-status list`.

### Suggested grouping for future PRs

1. ~~**Bulk case operations PR**~~ — `updateCases`, `deleteCases`, `copyCasesToSection`, `moveCasesToSection` (shipped).
2. **Plan entry runs PR** — `addRunToPlanEntry`, `updateRunInPlanEntry`, `deleteRunFromPlanEntry` (cohesive feature).
3. ~~**BDD PR**~~ — `getBdd`, `addBdd` (shipped).
4. ~~**History/statuses PR**~~ — `getHistoryForCase`, `getSharedStepHistory`, `getCaseStatuses` (shipped).
5. **Standalone** — ~~`addResults`~~ (shipped), ~~`moveSection`~~ (shipped), ~~`addCaseField`~~ (shipped) (independent).

---

## Decision Log

The items below were rejected (**won't do**) during the v2.1 design. Do not re-propose them without new evidence.

| Item                                            | Decided in      | Reason                                                                        |
| ----------------------------------------------- | --------------- | ----------------------------------------------------------------------------- |
| Postinstall hook                                | Q2              | User-hostile; ignorable via `--ignore-scripts`; conflicts with zero-dep ethos |
| Symlink install                                 | Q11             | Windows permission issues; broken-symlink edge cases                          |
| Interactive CLI prompts                         | Q13             | Conflicts with agent/scripting target audience                                |
| Telemetry                                       | Q13 calibration | Conflicts with zero-dep ethos                                                 |
| Value coercion in payload schemas               | Q8              | Honest fail-fast > silent fix; surfaces agent bugs                            |
| Programmatic API recipes in the CLI skill       | Q2              | Skill stays focused; `README` + `CODEMAP` cover programmatic use              |
| Cursor / Continue / generic agent formats in v1 | Q1              | One well-supported format > three half-baked ones                             |

If you reopen a rejected item, document the new information that changed the decision.

---

## Security Findings (CTF audit, 2026-05-16)

A security audit of the request pipeline and CLI file I/O identified the findings below. Each entry lists the audit severity and a fix summary.

**Status (v2.2):** Shipped findings #1–#3. DNS validation now runs before every request without construction-time caching and fails closed on lookup errors. Set `allowPrivateHosts: true` to allow private hosts or bypass unavailable DNS validation. `--out` paths use `lstat` to detect broken symlinks, and file writes use `wx` and post-write `lstat` checks to minimize the TOCTOU window. Added tests in `tests/cli-file-output.test.ts`, `tests/cli-safe-write.test.ts`, and `tests/client-features.test.ts` (`DNS validation`).

**Status (v3.0, CLI safety cluster):** Shipped findings #6, #10, #11, #16, #18, and #24. `run close` now requires `--yes`. Post-parse flag validation rejects unknown flags such as `--dryrun`. Removed `--api-key <key>` from `argv`; pass the API key via `TESTRAIL_API_KEY` or `--api-key-stdin`. The CLI strips ANSI and OSC escape sequences from `stderr` error messages and `--format table` cells. `stdin` reads are capped at 1 MiB (see #24 for the open wall-clock timeout follow-up). See [CHANGELOG.md](../../CHANGELOG.md) for migration notes.

### 1. DNS-rebinding bypass of SSRF guard — `src/client-core.ts` (Severity: HIGH) — [SHIPPED]

`validatePublicHost()` (~L97–127) resolves the configured `baseUrl` hostname once during client construction and stores the result in a single promise (`dnsValidationPromise`). Every subsequent `request*()` awaits that settled promise and calls `fetch(url, …)`. `fetch()` then runs its own DNS lookup through the OS resolver at request time. Because the two lookups are independent, `fetch()` never uses the IP address validated at construction time.

Attack: An attacker-controlled DNS server for `evil.example.com` returns a public IP (`1.2.3.4`) with a low TTL during client construction. On the next query, the DNS server returns `169.254.169.254` (cloud metadata) or `127.0.0.1`. Validation succeeds, and `fetch()` sends the request with the `Authorization: Basic <creds>` header to the private or loopback target.

The synchronous `PRIVATE_HOST_PATTERNS` regular expression on `url.hostname` does not block this attack because the hostname string remains the public domain.

**Fix sketch (S):** Resolve the hostname with `dns.lookup`. Use the resolved IP address as the URL host and the original hostname in the `Host` header. A custom `undici` Dispatcher or `lookup` option is another possible approach. Re-validate IP addresses on every request instead of caching the construction-time result.

### 2. Fail-open DNS validation — `src/client-core.ts:118–126` (Severity: HIGH) — [SHIPPED]

`validatePublicHost()` wraps the `dns.lookup` call in a `try/catch` block. `dns.lookup` or `import('node:dns/promises')` can throw errors such as `SERVFAIL`, `NXDOMAIN`, or `REFUSED`. For errors other than `TestRailValidationError`, the `catch` block logs `console.warn(...)` and returns normally. The client then proceeds to call `fetch()`.

Attack: An attacker-controlled DNS server returns `SERVFAIL` during validation. An IDN/punycode name rejected by the local resolver has the same effect: the IP check is skipped. The construction-time regular expression accepts the hostname string. `fetch()` later resolves the hostname to a private IP address through the OS resolver.

When combined with finding #1, this flaw allows a single-step SSRF attack without DNS rebinding.

**Fix sketch (S):** Treat DNS lookup errors as validation failures (`allowPrivateHosts: true` provides the documented bypass). If needed, separate lookup timeouts from private-IP rejections and fail open on timeouts only when `allowDnsFailures` is enabled.

### 3. TOCTOU symlink-clobber in `attachment get --out` — `src/cli/file-output.ts` + `src/cli/handlers/attachment.ts` (Severity: MEDIUM) — [SHIPPED]

`resolveOut()` rejects the command when `existsSync(path)` returns `true` and `--force` is not set. Because `existsSync` follows symlinks, it returns `false` for a broken symlink whose target does not exist. After this check passes, `handleAttachmentGet` calls `getAttachment()` over the network and then calls `writeFileSync(resolved.path, bytes)`. `writeFileSync` uses the default `'w'` flag, which follows symlinks and overwrites or creates the target file.

Attack: A local attacker places a broken symlink at the `--out` path on a shared filesystem. The link points to `~/.ssh/authorized_keys` or a CI secret file. Shared CI runners, multi-user hosts, and containers with mounted volumes can be affected. During the network download, the check has already passed. When the download finishes, `writeFileSync` writes the attachment bytes to the symlink target under the CLI user's UID.

**Fix sketch (S):** Open the output file with `flag: 'wx'` when `--force` is not set so the OS kernel rejects existing paths and broken symlinks atomically. When `--force` is set, call `lstat()` first and reject symlinks (or open the file with `O_NOFOLLOW` via `open()` and `fs.write`). Add a test that creates a broken symlink, runs `attachment get --out <symlink>`, and verifies that the target file does not change.

### 4. SSRF guard bypassed by HTTP redirect — `src/client-core.ts` (Severity: HIGH) — [OPEN]

All four `fetch()` call sites (`request()` at L624, `requestText()` at L745, `requestMultipart()` at L829, and `requestBinary()` at L899) call `fetch(url, options)` without setting `redirect`. Node's WHATWG `fetch` defaults to `redirect: 'follow'` (up to 20 redirects). `validatePublicHost()` validates only the configured `baseUrl` hostname. The client never validates the `Location` header of a 3xx response against `PRIVATE_HOST_PATTERNS` or `dns.lookup`.

Attack: A malicious or misconfigured origin server responds to a request (such as `get_user_by_email`) with a redirect:

```
HTTP/1.1 302 Found
Location: http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

`fetch()` follows the redirect to the AWS IMDSv1 endpoint or an internal service (`http://localhost:6379/`, `http://127.0.0.1:9200/`, `http://internal-admin.testrail.example.com:9000/`, or `http://localhost/var/run/...`). `request<T>()` then attempts to parse the response with `JSON.parse` and throws `Invalid JSON response from TestRail API`, after the internal request has already executed. A `307` or `308` redirect also preserves the HTTP method and request body, so a `POST` request can trigger an internal write endpoint.

Same-host port redirects also bypass host checks. For example, `https://testrail.example.com` can redirect to `Location: http://testrail.example.com:9200/_cluster/health`. Even per-request IP validation (finding #1) accepts this target unless the client also validates the scheme and port against `baseUrl`.

Credential exposure: `undici` strips the `Authorization` header on cross-origin redirects, but preserves it on same-origin and same-host redirects. A same-host port redirect therefore sends the `Basic <base64(email:apiKey)>` header to the target port.

**Fix sketch (S):** Set `redirect: 'error'` on all four `fetch()` calls so any 3xx response fails with a `TypeError` that maps to `TestRailApiError`. Alternatively, set `redirect: 'manual'` and validate that any `Location` URL matches the scheme, host, and port of `baseUrl` and passes `validatePublicHost()` (limited to one redirect). Add a test with a local server that returns `302 Location: http://127.0.0.1:1/` and verify that the client throws `TestRailApiError` without contacting the loopback target.

### 5. TOCTOU symlink-clobber in `install-skill` — `src/cli/install-skill.ts` (Severity: MEDIUM) — [OPEN]

The `wx`/`lstat` fix for finding #3 protects `attachment get --out`, but does not protect `testrail install-skill`. `runInstallSkill()` (L44–88) runs the following code:

```ts
if (existsSync(target) && !opts.force) {
    // L67 — existsSync FOLLOWS symlinks
    writeErr(`SKILL.md already exists ...`);
    return 1;
}
// ...
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target); // L74 — also follows symlinks
```

`existsSync` returns `false` for a broken symlink. If a local attacker creates a broken symlink at `target` (such as `<cwd>/.claude/skills/testrail-cli/SKILL.md -> ~/.ssh/authorized_keys`), the check passes without `--force`. `copyFileSync(source, target)` then opens the destination with `O_WRONLY | O_CREAT | O_TRUNC`, follows the symlink, and writes the bundled `SKILL.md` contents into the target file under the user's UID.

This vulnerability has a wide attack surface for three reasons:

- `runInstallSkill()` uses `existsSync` instead of `lstatSync`, so it accepts broken symlinks.
- `--global` writes to `~/.claude/skills/testrail-cli/`, where parent directories on shared hosts or CI runners may have permissive permissions.
- `mkdirSync(dirname(target), { recursive: true })` follows symlinked parent directories (`~/.claude/skills/testrail-cli`) and writes `SKILL.md` into the target directory.

`SKILL.md` is public, so the main risks are file corruption and denial of service. The flaw can overwrite `.npmrc`, Claude settings JSON, or `authorized_keys`.

**Fix sketch (S):** Apply the `safeWriteBinary` pattern from `src/cli/safe-write.ts`:

1. Replace `existsSync(target)` with `lstatSync(target)` (catching `ENOENT`) to detect broken symlinks without following them.
2. When `--force` is not set, call `copyFileSync(source, target, fs.constants.COPYFILE_EXCL)` so the kernel rejects existing files and symlinks atomically.
3. When `--force` is set, call `lstatSync(target)` and reject symlinks before calling `copyFileSync` (matching `safe-write.ts:30–38`).

Tests: Create a broken symlink at the install target pointing to a sentinel file outside the temporary directory, and run `runInstallSkill({ force: false, ...})`. Verify that the function returns `1` with a symlink error, leaves the sentinel file unchanged, and preserves the symlink. Repeat the test with `force: true`.

### 6. `run close` is irreversible but not `--yes` gated — `src/cli/handlers/run-write.ts:23–30` + `src/cli/metadata.ts:254–260` (Severity: MEDIUM) — [SHIPPED]

The v2.2 destructive-action policy requires `--yes` for irreversible API operations while allowing `--dry-run` to preview them. That policy covered `attachment delete` and `case delete-bulk`, but omitted **`run close`**.

The TestRail API documentation states that `close_run` is irreversible. TestRail provides no `open_run` endpoint and no UI action to reopen a closed run. Closing a run makes its results read-only and prevents adding or updating results. If an agent runs `run close 42` instead of `run get 42`, the run is permanently locked.

Two places omitted the destructive gate:

- `metadata.ts:254–260`: The `ActionSpec` for `run:close` sets `isWrite: true` without `destructive: true`. The skill generator therefore lists `run close` as a standard write command in `SKILL.md`.
- `handlers/run-write.ts:23–30`: `handleRunClose` checks `ctx.dryRun` but does not check `ctx.confirmDestructive`, unlike `handleAttachmentDelete` (`attachment-write.ts:91–110`) and `handleCaseDeleteBulk` (`case-write.ts:59–96`).

Two related items require attention:

- `plan close` (in `## CLI write surface — destructive operations`) must also require `--yes` when implemented.
- Setting `is_completed: true` in `milestone update` also closes a milestone via the JSON payload, which the boolean `destructive: true` action flag does not track.

**Fix sketch (S):**

1. Add `destructive: true` to the `run:close` `ActionSpec` in `metadata.ts:254`.
2. In `handleRunClose`, check `ctx.confirmDestructive` immediately after the `dryRun` check:
    ```ts
    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }
    ```
3. Add `run close` to the `Destructive actions` list in `HELP` (`src/cli/index.ts:113`).
4. Run `npm run skill` to regenerate `skill/SKILL.md` with the `destructive` label.

Tests:

- `tests/cli-write-handlers.test.ts`: Add `run close` unit tests for execution with `--yes`, rejection without `--yes`, and `--dry-run` preview with `destructive: true`.
- `tests/cli.test.ts`: Add a subprocess test verifying that `testrail run close 42` without `--yes` exits with code 1 and prints `'pass --yes to confirm'` to `stderr`.
- `tests/cli-helpers.test.ts`: Update the `destructive` `ActionSpec` inventory test to require `run:close` alongside `attachment:delete` and `case:delete-bulk`.

### 7. TOCTOU symlink-follow on attachment **upload** — `src/cli/file-input.ts` (Severity: MEDIUM) — [OPEN]

Finding #3 fixed the symlink TOCTOU vulnerability on attachment downloads (`attachment get --out`). However, attachment and BDD uploads (`attachment add-to-case|result|run|plan|plan-entry` and `bdd add`) still follow symlinks when reading `--file`:

```ts
// src/cli/file-input.ts:46–67
const stat = statSync(path); // ← follows symlinks
if (!stat.isFile()) {
    return { ok: false, error: `--file '${path}' is not a regular file.` };
}
size = stat.size;
// ...
const buf = readFileSync(path); // ← follows symlinks again
```

`statSync` inspects the symlink target, so `isFile()` returns `true` when the symlink points to a regular file. `readFileSync` follows the symlink again, reads the target file's bytes, and uploads them to TestRail via `requestMultipart()`.

**Threat model:** A local attacker places a symlink at the expected `--file` path on a shared filesystem. This includes CI runners, multi-user hosts, and shared container volumes. The agent then runs:

```sh
ln -sf /home/victim/.aws/credentials /tmp/builds/screenshots/test-42.png
```

When the agent runs `testrail attachment add-to-case 42 --file /tmp/builds/screenshots/test-42.png`:

1. `statSync` resolves the symlink and reports a regular file.
2. `isFile()` passes and records the target file size.
3. `readFileSync` resolves the symlink again and reads `~/.aws/credentials`.
4. The CLI uploads the file contents to TestRail as `test-42.png`.
5. Any user with read access to that TestRail case can download the leaked credentials with `attachment get 42 --out leaked.txt`.

A race window also exists between `statSync` (L46) and `readFileSync` (L67), or the attacker can create the symlink beforehand at a predictable build output path.

Unlike finding #3 (which overwrote local files with predictable data), finding #7 exfiltrates any local file readable by the CLI user's UID to TestRail. To prevent symlink traversal on file reads, open the file with `fs.openSync(path, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW)` and pass the file descriptor to `fs.readFileSync(fd)`.

**Fix sketch (S):**

1. Replace `statSync(path)` with `lstatSync(path)` and reject symbolic links:
    ```ts
    const lst = lstatSync(path);
    if (lst.isSymbolicLink()) {
        return { ok: false, error: `Refusing to upload through symbolic link '${path}'.` };
    }
    if (!lst.isFile()) {
        return { ok: false, error: `--file '${path}' is not a regular file.` };
    }
    ```
2. On the read branch (L67), open the file with `O_NOFOLLOW` and read from the file descriptor so a symlink swap after `lstatSync` fails with `ELOOP`:
    ```ts
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        const buf = readFileSync(fd);
        // ...
    } finally {
        closeSync(fd);
    }
    ```
3. Keep `basename(path)` to derive the default filename from the `argv` string.

If users need to upload symlinked files in CI pipelines, require an explicit `--follow-symlinks` flag so the default behavior remains fail-closed.

Tests:

- `tests/cli-file-input.test.ts`: Create a symlink pointing to a sentinel file containing `SECRET_TOKEN=abc123`, call `resolveFile({ fileFlag: <link> }, { read: true })`, and verify that it returns `{ ok: false }` without reading `SECRET_TOKEN`.
- `tests/cli-attachment-handlers.test.ts`: Verify that `setupUpload` fails with a symlink error before calling `requestMultipart`.
- `tests/cli.test.ts`: Run `testrail attachment add-to-case 1 --file <symlink>` in a subprocess and verify that it exits with code 1 and never sends the sentinel bytes.

### 8. Library constructor hijacks host SIGINT/SIGTERM with `process.exit()` — `src/client-core.ts:157–174` (Severity: MEDIUM) — [OPEN]

The package ships both a CLI (`bin: ./dist/cli.js`) and a programmatic library (`exports['.'] → ./dist/index.js`). Both entrypoints use the `TestRailClientCore` constructor, which calls `registerProcessHandlers()`:

```ts
// src/client-core.ts:157–173
process.on('exit', cleanupAllClients);
process.on('SIGINT', () => {
    cleanupAllClients();
    process.exit(130);
});
process.on('SIGTERM', () => {
    cleanupAllClients();
    process.exit(143);
});
```

Calling `process.exit(130)` and `process.exit(143)` is appropriate for the CLI, which owns the process. However, when a host application imports the library, these handlers override the host application's shutdown sequence.

**Failure path:** A long-running application (such as an HTTP server, queue worker, daemon, or Electron app) registers an asynchronous graceful-shutdown handler:

```ts
process.on('SIGINT', async () => {
    await db.commitInFlight(); // drains 5–30 s of pending transactions
    await connections.closeAll(); // closes WebSockets gracefully
    server.close(() => process.exit(0));
});
```

When the application later constructs a `TestRailClient`, the library registers its `SIGINT` listener after the host listener. On `SIGINT`, Node runs both listeners in registration order:

1. The host listener starts `db.commitInFlight()` asynchronously and returns a pending promise.
2. The library listener runs `cleanupAllClients()` synchronously and calls `process.exit(130)`.
3. `process.exit` terminates the process immediately without waiting for pending promises. In-flight database transactions abort and network connections drop without closing cleanly.

This behavior causes data loss during normal shutdown signals (such as `docker stop` or pod scaling) for three reasons:

- The documentation and `TestRailConfig` JSDoc do not warn callers that the constructor installs `process.exit` signal handlers.
- Because `processHandlersRegistered` is a module-level flag, callers cannot cleanly opt out by calling `process.removeAllListeners('SIGINT')`.
- `cleanupAllClients()` is synchronous and already runs on the `'exit'` event (L163). The library therefore does not need `process.exit()` in its `SIGINT` or `SIGTERM` handlers.

**Fix sketch (S):**

1. **Remove `process.exit()` from the library's `SIGINT` and `SIGTERM` listeners.** Keep `cleanupAllClients()` and rely on the `'exit'` listener when the host process exits.
2. **Make signal-handler registration opt-in.** Add `registerSignalHandlers: boolean` to `TestRailConfig` (default `false` for library callers, `true` for the CLI in `src/cli/index.ts:278`):
    ```ts
    client = new TestRailClient({ ...auth.config, registerSignalHandlers: true });
    ```
3. **Document client lifecycle.** Add a `Lifecycle` section to `README.md` instructing library callers to call `client.destroy()` during shutdown.
4. **Check existing listeners.** If `process.listeners('SIGINT').length` is already non-zero, skip handler registration and log a warning with `console.warn`.

Tests:

- `tests/client-features.test.ts`: Spawn a subprocess that constructs a default `TestRailClient`. Register an asynchronous `SIGINT` handler that writes a sentinel file after 200 ms. Send `SIGINT`. Verify that the subprocess writes the sentinel file and exits with the host's exit code instead of 130.
- `tests/client-features.test.ts`: Construct multiple clients with `registerSignalHandlers: false` and verify that `process.listeners('SIGINT').length === 0`.
- `tests/cli.test.ts`: Verify that the CLI still exits with code 130 on `SIGINT`.

### 9. Schema-invalid response poisons GET cache for full TTL — `src/client-core.ts:653–667` (Severity: MEDIUM) — [OPEN]

`request<T>()` caches the raw `JSON.parse(responseText)` result before the calling module validates the response with Zod:

```ts
// src/client-core.ts:653–667
const responseText = await response.text();
if (!responseText) return {} as T;
try {
    const result = JSON.parse(responseText) as T;
    if (method === 'GET' && !skipCache) {
        const cacheKey = `${method}:${endpoint}`;
        this.setCachedData(cacheKey, result); // ← cached BEFORE Zod parse
    }
    return result;
} catch {
    throw new TestRailApiError(0, 'Invalid JSON response from TestRail API');
}
```

Each module validates the response one layer higher via `this.client.parse<T>(Schema, raw)` (for example, `src/modules/users.ts:14`). When Zod rejects the response, the unvalidated object is already stored in the LRU cache under `GET:${endpoint}` for the 5-minute TTL (`DEFAULT_CACHE_TTL_MS`).

**Effect:** A single 2xx response containing valid JSON that fails schema validation causes every subsequent call to that endpoint to fail for 5 minutes. Each retry reads the invalid object from the cache and throws `TestRailValidationError: Schema validation failed` without making a new network request. Read-only workloads cannot recover until the TTL expires or the caller runs `clearCache()`.

**Threat models:**

1. **Transient server error:** During a partial outage, an upstream proxy or plugin returns HTTP 200 with a maintenance JSON object. One invalid response causes 5 minutes of failed reads even after the server recovers.
2. **Chained with finding #4 (redirect SSRF):** An attacker redirects one `GET get_run/42` request to an internal endpoint that returns valid JSON with a different schema. The client caches that response under `GET:get_run/42` for 5 minutes.
3. **Chained with finding #1 (DNS rebinding):** A request can resolve to an internal service between `validatePublicHost()` and `fetch()`. The client caches that internal response for 5 minutes. Later lookups that return the public IP do not remove it.

Because `POST` requests call `clearCache()`, read-write workloads clear poisoned entries while read-only workloads remain blocked for the full TTL.

**Fix sketch (S+):** Cache responses only after schema validation succeeds. Two approaches work:

A. **Validate inside `request<T>`:** Add an optional `schema?: ZodType` parameter to `request<T>`, run `schema.parse()`, and cache the validated result.

B. **Validate in a dedicated helper:** Add `client.cachedRequest<T>(method, endpoint, schema)` to fetch, parse JSON, validate with Zod, and write to the cache.

In both approaches:

- Do not cache empty 2xx responses (`response.text() === ''`), which currently cache `{}` and fail subsequent schema checks that require fields such as `id`.
- Add a test that returns a schema-invalid 200 response. Verify that the next read sends a new request and does not reuse the invalid object.

Tests:

- `tests/client-features.test.ts`: Stub `fetch` to return HTTP 200 with `'{"unrelated": true}'`. Verify that `client.getUser(1)` rejects and that a second `client.getUser(1)` call triggers a second `fetch` call.
- `tests/client-features.test.ts`: Verify that an empty 2xx response body is not cached for subsequent calls.
- `tests/client-edge-cases.test.ts`: Stub a redirect to an endpoint with a different JSON shape and verify that subsequent reads do not serve a cached invalid response.

### 10. `parseArgs({strict: false})` silently swallows typo'd safety flags — `src/cli/index.ts:131–161` (Severity: MEDIUM) — [SHIPPED]

The CLI entrypoint parses command-line arguments with `strict: false`:

```ts
// src/cli/index.ts:131–161
const parsed = parseArgs({
    args: process.argv.slice(2),
    options: { 'dry-run': { type: 'boolean', default: false }, 'yes': ..., 'force': ..., ... },
    allowPositionals: true,
    strict: false,
});
```

Because `strict: false` is set, `parseArgs` accepts unknown flags without throwing an error. If an agent passes `--dryrun` (without the hyphen), `parseArgs` sets `values['dryrun'] = true` while `values['dry-run']` remains `false`. The check `const dryRun = values['dry-run'] === true;` at L272 evaluates to `false`, and the CLI executes the live API request instead of a dry-run preview.

This flaw affects destructive and state-changing commands:

- `testrail case delete-bulk 7 --project-id 1 --data '{...}' --yes --dryrun` deletes the cases on TestRail because `--yes` is set and `--dryrun` is ignored.
- `testrail attachment delete 42 --yes --dryrun` permanently deletes the attachment.
- `testrail run close 99 --dryrun` permanently closes the run.

While a typo on `--yes` (such as `--y`) fails safely because `confirmDestructive` defaults to `false`, a typo on `--dry-run` or `--soft` fails unsafely:

| Intended flag | Typo            | Effect when mistyped                                                                                |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| `--dry-run`   | `--dryrun`      | Runs the live API call instead of a preview                                                         |
| `--force`     | `--forced`/`-f` | Refuses to overwrite existing `--out` files or fails `install-skill` when the target already exists |
| `--soft`      | `--softdelete`  | Runs a permanent delete on `case delete-bulk` instead of a server-side `soft=1` preview             |
| `--quiet`     | `--silent`      | Does not suppress output                                                                            |

**Fix sketch (S):** Keep `strict: false` in `parseArgs`, and validate that every key in `parsed.values` belongs to the known option set before calling `dispatch()`:

```ts
const KNOWN_FLAGS = new Set([
    'base-url',
    'email',
    'api-key',
    'format',
    'quiet',
    'help',
    'version',
    'project-id',
    'suite-id',
    'run-id',
    'case-id',
    'limit',
    'offset',
    'data',
    'data-file',
    'dry-run',
    'global',
    'force',
    'print-path',
    'file',
    'filename',
    'out',
    'yes',
    'soft',
]);
for (const key of Object.keys(values)) {
    if (!KNOWN_FLAGS.has(key)) {
        process.stderr.write(`Error: unknown flag '--${key}'. Run --help for the full list.\n`);
        return 1;
    }
}
```

Derive both `options` and `KNOWN_FLAGS` from a single `FLAGS` definition so they cannot drift.

Tests:

- `tests/cli.test.ts`: Verify in a subprocess that `testrail case delete-bulk 7 --project-id 1 --yes --dryrun --data '{"case_ids":[1]}'` exits with code 1, writes `unknown flag '--dryrun'` to `stderr`, and does not call `client.deleteCases`.
- `tests/cli.test.ts`: Verify the same behavior for `testrail attachment delete 1 --yes --dryrun`.
- `tests/cli.test.ts`: Verify that every flag in `KNOWN_FLAGS` succeeds when spelled correctly.
- `tests/cli-helpers.test.ts`: Verify that `KNOWN_FLAGS` matches `Object.keys(options)`.

### 11. CLI accepts `--api-key <key>` argv with no stdin/file alternative — `src/cli/auth.ts` + `src/cli/index.ts:136,221` (Severity: MEDIUM) — [SHIPPED]

`resolveAuth()` accepts the TestRail API key from the `--api-key <key>` command-line flag alongside `TESTRAIL_API_KEY`:

```ts
// src/cli/auth.ts:20–37
export function resolveAuth(flags: AuthFlags, env: AuthEnv): AuthResolution {
    const baseUrl = flags.baseUrl ?? env.TESTRAIL_BASE_URL;
    const email = flags.email ?? env.TESTRAIL_EMAIL;
    const apiKey = flags.apiKey ?? env.TESTRAIL_API_KEY;
    ...
}
```

```ts
// src/cli/index.ts:136
'api-key': { type: 'string' },
// src/cli/index.ts:221
apiKey: values['api-key'] as string | undefined,
```

The CLI `HELP` text at L87–90 lists the environment variable and command-line flag as equivalent options:

```
Auth (env var or flag):
  TESTRAIL_BASE_URL / --base-url <url>
  TESTRAIL_EMAIL    / --email <email>
  TESTRAIL_API_KEY  / --api-key <key>
```

Passing secrets in command-line arguments (`argv`, CWE-214) exposes credentials to local users and logging systems:

- **`/proc/<pid>/cmdline`**: Readable by all local users on Linux by default (`0o555`) and visible in `ps auxww`.
- **Shell history**: Stored in `~/.bash_history`, `~/.zsh_history`, and other shell history files.
- **CI logs**: Recorded in step logs when `set -x` or CI debug tracing (`CI_DEBUG_TRACE`) is enabled.
- **Container and cloud audit logs**: Captured in pod specifications (`kubectl get pod -o yaml`), `execve` audit traces, and cloud task definitions.
- **Crash dumps and profilers**: Recorded by crash reporters, `sysdig`, `perf`, and APM agents.

Although the CLI provides `--data-file <path>` and `stdin` piping as alternatives to `--data` for request payloads, it provides no `stdin` or file alternative for `--api-key`.

**Threat models:**

1. **Agent-driven CI step:** An agent runs `testrail run close 42 --base-url ... --email ... --api-key sk-xxx`, and the CI log records the full command line for all project members to read.
2. **Multi-tenant host:** On a shared Linux host or CI runner, another local process polls `/proc/*/cmdline` and reads the API key.
3. **Diagnostic dumps:** A crash report or process dump includes the process `argv` containing the API key.

**Fix sketch (S):**

1. **Add `--api-key-stdin` (boolean):** Read the API key from `stdin`. Make `--api-key-stdin` mutually exclusive with `--api-key` and `stdin` JSON body input; require `--data` or `--data-file` for write payloads when `--api-key-stdin` is used.
2. **Add `--api-key-file <path>`:** Read the trimmed API key from a file after validating the path with `lstatSync` to reject symlinks.
3. **Deprecate or remove `--api-key <key>`:** Emit a deprecation warning on `stderr` (or remove `--api-key` in a major release) and recommend `TESTRAIL_API_KEY` or `--api-key-stdin`.
4. **Update `HELP`:** Recommend `TESTRAIL_API_KEY` and `--api-key-stdin`.

Tests:

- `tests/cli.test.ts`: Verify that `echo 'sk-xxx' | testrail project list --base-url ... --email ... --api-key-stdin` authenticates with the piped key without exposing `sk-xxx` in `argv`.
- `tests/cli.test.ts`: Verify that passing both `--api-key` and `--api-key-stdin` exits with code 1.
- `tests/cli.test.ts`: Verify that `--api-key-file <symlink>` is rejected.

### 12. Unbounded response body reads OOM the client — `src/client-core.ts:628,653,749,767,843,850,911,925` (Severity: MEDIUM) — [OPEN]

All four `fetch()` call sites read the full response body into memory without a size limit:

| Method               | Success path                           | Error path                                |
| -------------------- | -------------------------------------- | ----------------------------------------- |
| `request<T>()`       | `await response.text()` (L653)         | `await response.text().catch(...)` (L628) |
| `requestText()`      | `return response.text()` (L767)        | `await response.text().catch(...)` (L749) |
| `requestMultipart()` | `await response.text()` (L850)         | `await response.text().catch(...)` (L843) |
| `requestBinary()`    | `return response.arrayBuffer()` (L925) | `await response.text().catch(...)` (L911) |

`Response.text()` and `Response.arrayBuffer()` buffer the entire body in memory. V8 throws `RangeError: Invalid string length` for strings at approximately 1 GB. `ArrayBuffer` allocations continue until the process exceeds its V8 heap or container memory limit. CI containers often have limits of 512 MB or 1 GB.

**Threat models:**

1. **Oversized redirect response (chained with finding #4):** An attacker redirects a request to `http://attacker.example.com/loot.bin`, which streams a 100 GB `Transfer-Encoding: chunked` body. `undici` reads until the process runs out of memory and terminates.
2. **Malicious or misconfigured origin:** The configured `baseUrl` server returns an oversized response body on any endpoint.
3. **5xx retry amplification:** The client retries 5xx responses up to `maxRetries` times. Each retry allocates another large buffer while the previous buffer awaits garbage collection.
4. **Oversized error bodies:** The non-2xx error paths at L628, L749, L843, and L911 still read the full response body. They throw `TestRailApiError` only after storing the body in memory.
5. **Cache amplification (chained with finding #9):** An oversized valid JSON response enters the GET cache for 5 minutes. Subsequent reads return the stored object.

**Fix sketch (M):** Enforce a configurable response-size limit across all eight body reads (`src/client-core.ts:628,653,749,767,843,850,911,925`):

1. Add `maxResponseBytes?: number` to `TestRailConfig`. Define `DEFAULT_MAX_RESPONSE_BYTES = 50 * 1024 * 1024`, `DEFAULT_MAX_BINARY_RESPONSE_BYTES = 256 * 1024 * 1024`, and `MAX_ERROR_BODY_BYTES = 64 * 1024` in `src/constants.ts`.
2. Read `response.body` (`ReadableStream`) chunk by chunk, track the byte total, and call `controller.abort()` when the total exceeds the limit:

    ```ts
    async function readBodyCapped(response: Response, cap: number, controller: AbortController): Promise<Uint8Array> {
        const reader = response.body?.getReader();
        if (!reader) return new Uint8Array();
        const chunks: Uint8Array[] = [];
        let total = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > cap) {
                controller.abort();
                throw new TestRailApiError(0, `Response body exceeded ${cap} bytes`);
            }
            chunks.push(value);
        }
        const out = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
            out.set(c, off);
            off += c.byteLength;
        }
        return out;
    }
    ```

3. For JSON and text responses, decode the byte array with `new TextDecoder('utf-8').decode(await readBodyCapped(...))`.
4. For `requestBinary`, return `Uint8Array.buffer` as an `ArrayBuffer`.
5. Cap all error-body reads at `MAX_ERROR_BODY_BYTES`.

Tests:

- `tests/client-features.test.ts`: Stub `fetch` to return a `ReadableStream` that yields 1 KB chunks without closing. Verify that `await client.getProject(1)` rejects with a body-size error and keeps `process.memoryUsage().heapUsed` growth below `2 * cap`.
- `tests/client-features.test.ts`: Verify that a normal 4 KB response succeeds.
- `tests/client-edge-cases.test.ts`: Verify that a 503 response with a 100 MB body throws `TestRailApiError(0, 'Response body exceeded ...')` without reading the full body.
- `tests/client-features.test.ts`: Verify that overriding `maxResponseBytes` allows large downloads within the configured limit.

### 13. POST retried without idempotency on 5xx / network error → duplicate writes — `src/client-core.ts:630–637, 685–691` (Severity: MEDIUM) — [OPEN]

`request<T>()` uses the same retry conditions for all HTTP methods:

```ts
// src/client-core.ts:630–637 — 5xx / 429 path
if ((response.status >= 500 || response.status === 429) && retryCount < this.maxRetries) {
    const retryAfterMs = response.status === 429 ? this.parseRetryAfterMs(response) : null;
    const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
    await sleep(delay);
    return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
}

// src/client-core.ts:685–691 — network-error path
if (retryCount < this.maxRetries) {
    await sleep(this.getRetryDelay(retryCount));
    return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
}
```

`request<T>()` retries `POST` requests on 5xx and network errors just like `GET` requests. Only `requestMultipart` disables retries (L791–792: "uploads are not idempotent").

**Failure sequence:**

1. The client sends `POST add_case/42` to TestRail.
2. TestRail creates the case (ID 7891) and commits it to the database.
3. A network interruption or reverse-proxy timeout drops the HTTP response in flight.
4. `fetch()` throws a network error or receives HTTP 502 from a load balancer.
5. `request<T>` waits for the backoff delay and sends `POST add_case/42` again. TestRail creates a duplicate case (ID 7892).
6. The client returns case 7892 and leaves case 7891 orphaned in TestRail.

With `maxRetries: 3`, a single write call can create up to 4 duplicate entities.

**Affected POST endpoints:**

| Endpoint                                                                                 | Duplicate effect                                                           |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `add_case`                                                                               | Creates two cases with identical titles in the same section                |
| `add_run`                                                                                | Creates two runs for the same project, suite, and case set                 |
| `add_result*` (all forms)                                                                | Adds two results for the same case in the same run, skewing status counts  |
| `add_attachment_to_*`                                                                    | Exempt (`requestMultipart` does not retry; see L791–792)                   |
| `add_plan` / `add_plan_entry`                                                            | Creates duplicate plans or plan entries                                    |
| `add_project` / `add_suite` / `add_section` / `add_milestone` / `add_user` / `add_group` | Creates duplicate entities                                                 |
| `update_*`                                                                               | Repeats the update (last write wins)                                       |
| `delete_*`                                                                               | Returns HTTP 404 on the second call                                        |
| `close_run`                                                                              | Returns HTTP 4xx on the second call (already closed)                       |
| `move_cases_to_section`                                                                  | Returns HTTP 4xx on the second call (already moved)                        |
| `copy_cases_to_section`                                                                  | Creates **two copies** of each source case in the target section           |

**Impact:**

- **Test integrity:** Duplicate `add_result` calls inflate pass and fail counts in TestRail run statistics.
- **Bulk write amplification:** Retrying `result add-bulk` or `result add-bulk-by-test` during network instability duplicates hundreds of results.
- **License quota usage:** Duplicate case creation increases the total test-case count on TestRail Enterprise accounts.

**Fix sketch (S+):**

1. **Restrict 5xx and network-error retries to idempotent methods (`GET`):** Allow non-GET methods to retry only on HTTP 429 (rate-limited, before the server processes the write):
    ```ts
    const isIdempotent = method === 'GET';
    if ((response.status === 429 || (isIdempotent && response.status >= 500))
        && retryCount < this.maxRetries) { ... }
    ```
    Apply `isIdempotent` to the network-error retry path as well so failed writes surface immediately to the caller.
2. **Document retry behavior** in the JSDoc for `request<T>`, `closeRun`, `addCase`, and `addResult`.
3. **(Optional) Add `retryablePost?: boolean` to `TestRailConfig`** for callers that explicitly want automatic retries on `POST`.

Tests:

- `tests/client-features.test.ts`: Stub `fetch` to return HTTP 502 followed by HTTP 200. Call `client.addCase(1, { title: 't' })` and verify that `fetch` runs once and throws the 502 error.
- `tests/client-features.test.ts`: Verify that `client.addCase` does not retry when `fetch` rejects with a network error.
- `tests/client-features.test.ts`: Verify that `client.getProject(1)` still retries on HTTP 502.

### 14. Cache returns mutable reference; caller mutation poisons next read — `src/client-core.ts:462–500` (Severity: LOW–MEDIUM) — [OPEN]

`setCachedData()` and `getCachedData()` store and return direct object references without cloning or freezing:

```ts
// src/client-core.ts:467–472
const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
if (entry !== undefined && entry.expiry > Date.now()) {
    this.cache.delete(cacheKey);
    this.cache.set(cacheKey, entry);
    return entry.data; // ← reference, not a copy
}
```

```ts
// src/client-core.ts:496–499
this.cache.set(cacheKey, {
    data, // ← reference into the cache, not a copy
    expiry: Date.now() + this.cacheTtl,
});
```

If a caller mutates the returned object, that mutation modifies the cached entry in place. Every subsequent cache hit returns the mutated object until the 5-minute TTL expires or a write call clears the cache:

```ts
const projects = await client.getProjects(); // miss → fetch → cache stores reference
projects[0].name = 'Modified by caller'; // mutates the cached entry in place
const again = await client.getProjects(); // hit → returns same reference
console.log(again[0].name); // 'Modified by caller' — not 'Authoritative'
```

**Threat models:**

1. **Cross-request data corruption:** A service shares one `TestRailClient` across requests. One handler changes `cases[0].title` for display, and subsequent callers receive that modified title.
2. **Test contamination:** A test mutates a returned object, and later tests in the same suite read the mutated object from the cache.
3. **Combined with findings #4 and #9:** Mutating a cached response writes changes back into the shared cache entry for the remainder of the TTL.

**Fix sketch (S):** Clone cached values at both boundaries (`setCachedData` and `getCachedData`) with `structuredClone` (or deep-freeze cached entries on write):

```ts
private setCachedData<T>(cacheKey: string, data: T): void {
    if (!this.enableCache) return;
    // … LRU eviction unchanged …
    this.cache.set(cacheKey, {
        data: structuredClone(data),
        expiry: Date.now() + this.cacheTtl,
    });
}
```

Cloning on both write and read protects the stored cache entry. Callers can change initial responses and cache-hit responses without changing the cache.

Tests:

- `tests/client-features.test.ts`: Read a cached entry, mutate a field, read the entry again, and verify that the second read returns the original value.
- `tests/client-features.test.ts`: Mutate the object returned from the initial cache-miss call, then verify that the subsequent cache hit returns the unmodified value.

### 15. IPv6 SSRF allowlist gaps: `fec0::/10`, 6to4 `2002::/16`, NAT64 `64:ff9b::/96` — `src/client-core.ts:31–96` (Severity: LOW–MEDIUM) — [OPEN]

The SSRF guard uses two layers: the synchronous regular-expression check `PRIVATE_HOST_PATTERNS` (L31–42) and the post-lookup IP classifier `isPrivateOrLoopbackIP()` (L66–96). Both layers miss several IPv6 private and transition address ranges.

**Layer 1 — `PRIVATE_HOST_PATTERNS`:**

```ts
/^::1$/                  // IPv6 loopback, canonical only
/^fe80:/i                // link-local
/^f[cd][0-9a-f]{2}:/i    // ULA fc00::/7 (matches fc** and fd**)
```

These patterns miss:

- `fec0::/10` (`fec0`–`feff` in the first hextet): Deprecated IPv6 site-local range (RFC 3879), still routable on legacy enterprise networks.
- `2002::/16` (RFC 3056 6to4): Embeds an IPv4 address in hextets 2 and 3 (for example, `2002:7f00:0001::` wraps `127.0.0.1`).
- `64:ff9b::/96` (RFC 6052 NAT64): Embeds an IPv4 address in the final 32 bits (for example, `64:ff9b::a00:1` translates to `10.0.0.1`).
- `100::/64` (RFC 6666 IPv6 discard prefix).

**Layer 2 — `isPrivateOrLoopbackIP()`:**

```ts
// src/client-core.ts:86–92
return (
    firstHextet.startsWith('fc') ||
    firstHextet.startsWith('fd') ||
    firstHextet.startsWith('fe8') ||
    firstHextet.startsWith('fe9') ||
    firstHextet.startsWith('fea') ||
    firstHextet.startsWith('feb')
);
```

`isPrivateOrLoopbackIP()` checks only `::ffff:a.b.c.d` for embedded IPv4 addresses and returns `false` for `fec0::/10`, `2002::/16`, and `64:ff9b::/96`.

**Threat models:**

1. **6to4 wrapping a private IPv4 address:** On a network with 6to4 routing enabled, `https://[2002:7f00:1::]/` passes `validatePublicHost()` and connects to `127.0.0.1`.
2. **NAT64 wrapping a private IPv4 address:** On a DNS64/NAT64 network, `https://[64:ff9b::a00:1]/` passes validation and translates to `10.0.0.1`.
3. **Legacy site-local `fec0::/10`:** Passes validation on networks that route site-local IPv6 addresses.

**Fix sketch (S):** Update `isPrivateOrLoopbackIP` and `PRIVATE_HOST_PATTERNS` to block `fec0::/10`, `2002::/16`, and `64:ff9b::/96`:

```ts
// IPv6 site-local (deprecated, still routable on legacy stacks).
// fec0–feff in the first hextet.
if (firstHextet.length === 4 && firstHextet.startsWith('fe')) {
    const third = firstHextet.charCodeAt(2);
    // 'c' .. 'f' nibble
    if (third >= 0x63 && third <= 0x66) return true;
}

// 6to4 (2002::/16) — extract the embedded IPv4 from hextets 2–3.
if (firstHextet === '2002') {
    const hextets = normalized.split(':');
    const hi = parseInt(hextets[1] ?? '', 16);
    const lo = parseInt(hextets[2] ?? '', 16);
    if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
        const ip = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        if (isPrivateOrLoopbackIPv4(ip)) return true;
    }
}

// NAT64 well-known prefix 64:ff9b::/96 — embedded IPv4 in last 32 bits.
if (normalized.startsWith('64:ff9b:') || normalized.startsWith('64:ff9b::')) {
    // Pull the last two hextets (or the embedded dotted-quad form).
    const dotted = normalized.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (dotted && isPrivateOrLoopbackIPv4(dotted)) return true;
    // Hex-hextet form: 64:ff9b::a00:1 == 10.0.0.1
    const tail = normalized.split('::').pop() ?? normalized;
    const tailHextets = tail.split(':');
    if (tailHextets.length >= 2) {
        const hi = parseInt(tailHextets.at(-2) ?? '', 16);
        const lo = parseInt(tailHextets.at(-1) ?? '', 16);
        if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
            const ip = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
            if (isPrivateOrLoopbackIPv4(ip)) return true;
        }
    }
}
```

Add the matching prefixes to `PRIVATE_HOST_PATTERNS`:

```ts
/^fe[c-f][0-9a-f]:/i,        // fec0::/10
/^2002:/i,                    // 6to4 prefix (gated by IPv4 classifier in layer 2)
/^64:ff9b:/i,                 // NAT64
```

Tests:

- `tests/client-features.test.ts`: Verify with `it.each` that `validateConfig` rejects `https://[fec0::1]/`, `https://[2002:7f00:1::]/`, `https://[64:ff9b::a00:1]/`, `https://[fed1::42]/`, and `https://[2002:c0a8:1::]/`.
- `tests/client-features.test.ts`: Verify that `allowPrivateHosts: true` accepts all of those addresses.

### 16. Reflected user input in stderr error messages enables ANSI/OSC terminal injection — `src/cli/output.ts:93`, `src/cli/index.ts:168,282,293`, `src/cli/install-skill.ts:49`, `src/cli/ids.ts:11` (Severity: MEDIUM) — [SHIPPED]

CLI error paths write error messages directly to `process.stderr`:

```ts
// src/cli/output.ts:93
process.stderr.write(`Error: ${message}\n`);

// src/cli/index.ts:168, 282
process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
```

Many error messages include unescaped user input:

| Source                                                                  | Message shape                                                                     |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `IdParseError` (`src/cli/ids.ts:11`)                                    | `` `${name} must be a positive integer (got: ${raw ?? '(none)'})` ``              |
| `TestRailValidationError` — private-host (`client-core.ts:103,140,279`) | `` `baseUrl resolves to a private/loopback host ("${hostname}"...)` ``            |
| `TestRailValidationError` — DNS failure (`client-core.ts:131`)          | `` `baseUrl DNS validation failed for "${hostname}": ${err.message}.` ``          |
| `dispatch` "unknown resource"                                           | `` `Unknown resource '${resource}'. Use: ${Object.keys(RESOURCES).join(', ')}` `` |
| `dispatch` "unknown action"                                             | `` `Unknown action '${action}' for ${resource}. Use: ${actions.join(', ')}` ``    |
| `resolveBody` — JSON parse (`body.ts:91`)                               | `` `Invalid JSON: ${e.message}` `` (includes the parser's character pointer)      |
| `resolveBody` — data-file read (`body.ts:69`)                           | `` `Cannot read --data-file '${path}': ${err.message}` ``                         |
| `resolveFile` — file read (`file-input.ts:54,72`)                       | `` `Cannot stat --file '${path}': ${err.message}` ``                              |
| `resolveOut` — out path (`file-output.ts:55,62,69`)                     | `` `Refusing to write through symbolic link '${path}'.` ``                        |

Because these paths do not strip C0/C1 control characters or ANSI/OSC escape sequences (CWE-150), terminal emulators execute any embedded escape sequences written to `stderr`:

- `\x1b[2J\x1b[H`: Clears the screen and moves the cursor to the home position, hiding prior output.
- `\x1b]52;c;<base64>\x07`: Overwrites the user's clipboard via OSC 52.
- `\x1b]8;;https://attacker.example.com\x07Click here\x1b]8;;\x07`: Renders a clickable phishing link via OSC 8.
- `\x1b[?1049h\x1b[?25l`: Switches to the alternate screen buffer and hides the cursor.
- `\x1bP...\x1b\\`: Sends a Device Control String (DCS) sequence.
- `\x1b[c`: Queries Device Attributes (DA), causing the terminal to write a response back to `stdin`.

**Threat models:**

1. **Prompt-injected agent:** An attacker-controlled document instructs an agent to run `testrail run get '<payload>'` containing an OSC 52 sequence. `parseId` fails and prints the payload to `stderr`, overwriting the user's clipboard.
2. **CI log manipulation:** An attacker-supplied parameter injects screen-clear sequences into a CI log that renders ANSI escapes, hiding subsequent error or destructive-action messages.
3. **Terminal hyperlink phishing:** A malformed `--base-url` containing an OSC 8 sequence renders a deceptive clickable link in the terminal error message.

**Fix sketch (S):** Strip C0 (except `\t` and `\n`), DEL (`0x7F`), and C1 (`0x80`–`0x9F`) control characters from all error messages before writing to `stderr`:

```ts
// Strip control chars (C0: 0x00–0x1F except 0x09 tab; 0x7F DEL;
// C1: 0x80–0x9F). Keep tab and newline only — those are the
// glyphs operators legitimately want in multi-line errors.
function sanitiseForTerminal(s: string): string {
    return s.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, '�');
}
```

Apply `sanitiseForTerminal` at all `stderr` write sites (`output.ts:93`, `install-skill.ts:49`, and `index.ts:168,282,293`).

Tests:

- `tests/cli-helpers.test.ts`: Verify that `sanitiseForTerminal` preserves printable ASCII, tabs, and newlines, and replaces all other C0, DEL, and C1 characters with `U+FFFD`.
- `tests/cli.test.ts`: Run `testrail run get $'\x1b]52;c;cGF5bG9hZA==\x07'` and `testrail run get $'\x1b[2J'` in a subprocess and verify that `stderr` contains no `\x1b` bytes.
- `tests/cli.test.ts`: Verify that valid IPv4 and IDN hostnames appear unchanged in error output.

### 17. `--data-file` reads through symlinks with no size cap → JSON-body exfil primitive — `src/cli/body.ts:63–71` (Severity: MEDIUM) — [OPEN]

`resolveBody()` reads `--data-file <path>` with `readFileSync`:

```ts
// src/cli/body.ts:63–71
} else if (input.dataFileFlag !== undefined) {
    try {
        raw = readFileSync(input.dataFileFlag, 'utf-8');
    } catch (e) {
        return {
            ok: false,
            error: `Cannot read --data-file '${input.dataFileFlag}': ${...}`,
        };
    }
    source = 'file';
}
```

This call has two vulnerabilities:

1. **No `lstat` or `O_NOFOLLOW` check:** `readFileSync` follows symbolic links. If a local attacker places a symlink at the `--data-file` path, the CLI reads the target file and sends its contents in the request body.
2. **No file size limit:** `readFileSync(path, 'utf-8')` reads the entire file into memory. Passing `/dev/zero`, a large file, or a named pipe (FIFO) causes the process to run out of memory or hang indefinitely.

Because all write payload schemas use `.passthrough()` (`src/schemas.ts:3`), Zod preserves extra JSON properties and forwards them to TestRail. Many schemas require only a single common field:

| Schema                      | Hard requirement                | Result if any JSON file has a matching field       |
| --------------------------- | ------------------------------- | -------------------------------------------------- |
| `AddCasePayloadSchema`      | `title: string`                 | Entire JSON sent as a case body                    |
| `AddProjectPayloadSchema`   | `name: string`                  | Entire JSON sent as a project body                 |
| `AddSuitePayloadSchema`     | `name: string`                  | Entire JSON sent as a suite body                   |
| `AddSectionPayloadSchema`   | `name: string`                  | Entire JSON sent as a section body                 |
| `AddMilestonePayloadSchema` | `name: string`                  | Entire JSON sent as a milestone body               |
| `MoveSectionPayloadSchema`  | (all optional) — passes on `{}` | Any JSON file passes; passthrough fields forwarded |

**Threat models:**

1. **Local symlink exfiltration:** An attacker on a shared CI runner or host links `/tmp/<build>/payload.json` to a JSON configuration file. A file with `name` or `title` can pass validation; `section move` accepts any JSON object. When the agent runs `testrail case add 42 --data-file /tmp/<build>/payload.json`, the CLI sends the file contents to TestRail, where any user with read access to the project can view them.
2. **Denial of service via special files:** Passing `--data-file /dev/zero` or a FIFO blocks or crashes the CLI process.

**Fix sketch (S):**

1. Validate the path with `lstatSync`, reject symlinks and non-regular files, and open the file with `O_NOFOLLOW`:
    ```ts
    let raw: string;
    try {
        const lst = lstatSync(input.dataFileFlag);
        if (lst.isSymbolicLink()) {
            return { ok: false,
                error: `Refusing to read --data-file '${input.dataFileFlag}' through a symbolic link.` };
        }
        if (!lst.isFile()) {
            return { ok: false,
                error: `--data-file '${input.dataFileFlag}' is not a regular file.` };
        }
        const fd = openSync(input.dataFileFlag,
            constants.O_RDONLY | constants.O_NOFOLLOW);
        try {
            raw = readFileSync(fd, { encoding: 'utf-8' });
        } finally {
            closeSync(fd);
        }
    } catch (e) { … }
    ```
2. **Enforce a file size limit:** Define `MAX_DATA_FILE_BYTES = 4 * 1024 * 1024` in `src/constants.ts` and check `lst.size` before reading:
    ```ts
    if (lst.size > MAX_DATA_FILE_BYTES) {
        return {
            ok: false,
            error:
                `--data-file '${input.dataFileFlag}' is ${lst.size}` + ` bytes; exceeds limit ${MAX_DATA_FILE_BYTES}.`,
        };
    }
    ```

Tests:

- `tests/cli-body-source.test.ts`: Create a symlink to a JSON file containing `{"title":"SECRET_TITLE"}`, call `resolveBody` with `AddCasePayloadSchema`, and verify that it returns `{ ok: false }` with a symlink error.
- `tests/cli.test.ts`: Run `testrail case add 1 --data-file <symlink>` in a subprocess and verify that it exits with code 1 and makes no network request.
- `tests/cli-body-source.test.ts`: Verify that files larger than `MAX_DATA_FILE_BYTES` and non-regular files (such as `/dev/zero`) are rejected.
- `tests/cli-body-source.test.ts`: Verify that a valid 4 KB JSON file succeeds.

### 18. `--format table` reflects TestRail-controlled string fields verbatim to stdout (ANSI/OSC terminal injection on the success path) — `src/cli/output.ts:11–25, 32–51` (Severity: MEDIUM) — [SHIPPED]

Finding #16 fixed terminal injection on the error path (`stderr` via `Error: ${message}`). The success path has the same vulnerability when the user selects `--format table`. On this path, the reflected bytes come from TestRail rather than from user arguments.

```ts
// src/cli/output.ts:11–25
export function valueToString(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') { … JSON.stringify … }
    if (typeof v === 'string') return v;        // ← raw, no escape encoding
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    if (typeof v === 'symbol') return v.toString();
    return '[Function]';
}

// src/cli/output.ts:32–51
export function renderTable(data: unknown): string {
    …
    const body = rows.map((r) =>
        keys.map((k, i) => valueToString(getField(r, k)).padEnd(widths[i] ?? k.length)).join(' | '),
    );
    return [header, line, ...body].join('\n');
}

// src/cli/output.ts:83–95
const out = (data: unknown): void => {
    if (opts.quiet) return;
    if (opts.format === 'table') {
        process.stdout.write(`${renderTable(data)}\n`);
    } else {
        process.stdout.write(`${safeJsonStringify(data)}\n`);
    }
};
```

- **JSON output is safe** — `safeJsonStringify` calls
  `JSON.stringify(data, null, 2)`, which encodes ESC `\x1b` as
  ``, all C0 controls as `\u00XX`, etc. The terminal sees the
  literal six-char ``, not the escape byte.
- **Table output is not safe:** `valueToString` returns the raw string when `typeof v === 'string'`. `renderTable` joins these raw strings with `' | '` padding and writes the result to `process.stdout.write`. The terminal executes any C0 or C1 control byte in a TestRail string field.

The CLI renders the following TestRail fields in table output:

| Endpoint                                                  | Fields rendered                                                |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| `project get/list`                                        | `name`, `announcement`                                         |
| `suite get/list`                                          | `name`, `description`                                          |
| `case get/list`                                           | `title`, `refs`, `estimate`                                    |
| `section get` (via tree)                                  | `name`, `description`                                          |
| `run get/list`                                            | `name`, `description`, `refs`                                  |
| `milestone get/list`                                      | `name`, `description`                                          |
| `user get/list`                                           | `name`, `email`, `role`                                        |
| `plan get/list`                                           | `name`, `description`                                          |
| `result list`                                             | `comment`, `defects`                                           |
| `shared-step list`                                        | `title`, `custom_steps_separated[*].content` (via passthrough) |
| `bdd get` (returns raw text — already C0-bearing by spec) | Gherkin text                                                   |

Most of these fields accept arbitrary user input in the TestRail UI. The TestRail API does not strip C0 control bytes before it stores data.

**Threat models:**

1. **Hostile co-tenant on a shared TestRail instance:** A low-privilege TestRail user creates a case with the title `"Innocuous title\x1b]52;c;<base64-of-attacker-payload>\x07"`. When another user runs `testrail case get <that_id> --format table` or `testrail case list --project-id ... --format table`, their terminal executes the OSC 52 sequence. This overwrites the user's clipboard with the attacker's payload.
2. **Cross-project leak through run or milestone descriptions:** The `run list` and `milestone list` outputs include `description` fields. A user with write access to any project in the TestRail tenant can insert payloads that appear to every user who lists runs in `--format table`.
3. **Combination with Finding #4 (redirect SSRF):** An attacker who controls the redirect target returns crafted JSON (`{"name": "...\x1b[2J\x1b[?1049h..."}`) in `--format table`. The terminal switches to the alternate screen buffer and hides subsequent user commands from the primary screen.
4. **Combination with Finding #9 (cache poisoning):** The cache stores the attacker response for its TTL. Every `--format table` read from that cache key repeats the terminal injection.

This vulnerability is CWE-150, like Finding #16, but has a larger threat model because the data comes from a remote multi-tenant server. An attacker only needs a low-privilege TestRail account.

Test helpers and external consumers that import `./cli/output.js` also use `valueToString`. Sanitize strings inside `valueToString` so that all callers receive sanitized output.

**Fix sketch (S):** Reuse the `sanitiseForTerminal` helper from Finding #16:

```ts
function sanitiseForTerminal(s: string): string {
    return s.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, '�');
}

export function valueToString(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') { … }
    if (typeof v === 'string') return sanitiseForTerminal(v);   // ← here
    …
}
```

Apply `sanitiseForTerminal` inside `valueToString`, which formats every table cell. JSON output already encodes control characters, so it requires no changes.

Check `process.stdout.isTTY === true` before sanitizing so that non-TTY pipes (such as `testrail case list --format table > cases.tsv`) preserve the raw byte stream.

Tests:

- `tests/cli-helpers.test.ts`: `valueToString('foo\x1b[2J bar')`
  returns `'foo� bar'` (in TTY mode); returns the raw string in
  non-TTY mode.
- `tests/cli.test.ts`: subprocess: stub the client to return
  `{ id: 1, name: 'Inn\x1b]52;c;cGF5bG9hZA==\x07' }`; run
  `testrail project get 1 --format table`; assert stdout contains
  **no** `\x1b]52` byte sequence.
- `tests/cli.test.ts`: Repeat the test with `--format json` as a positive control. Verify that JSON contains the harmless encoded `\u001b` form. Verify that the raw escape byte is absent. This confirms that JSON output was safe before and after the fix.
- Regression: Verify that valid non-control content (emoji, RTL text, IDN hostnames, and IPv4 addresses) passes through `valueToString` unchanged.

### 19. `install-skill`'s `mkdirSync` omits `mode`, producing world-writable directories under permissive `umask` — `src/cli/install-skill.ts:73` (Severity: LOW–MEDIUM) — [OPEN]

`runInstallSkill()` creates the parent directories of the installation target without an explicit mode:

```ts
// src/cli/install-skill.ts:73
mkdirSync(dirname(target), { recursive: true });
```

Node.js `fs.mkdirSync` defaults to mode `0o777`, modified by the process `umask`. The resulting directory mode is `0o777 & ~umask`. On most systems (`umask 022`), this produces `0o755` (writable only by the owner).

However, several environments use a permissive `umask` by default:

- **Minimal container images:** Some `busybox sh` environments set `umask 000` during initialization.
- **CI runners:** Some self-hosted runners and Kubernetes executors run with `umask 000`.
- **Mounted overlay filesystems:** When a container bind-mounts `~/.claude` from the host, the host `umask` applies.

In these environments, `mkdirSync(dirname(target), { recursive: true })` creates `0o777` (world-writable) directories at every newly created level:

- `<cwd>/.claude/`
- `<cwd>/.claude/skills/`
- `<cwd>/.claude/skills/testrail-cli/`

(or the `~` equivalents when `--global` is set). Any local user on the host can then:

1. **Add files to the world-writable directory:** Tools that read from `.claude/skills/`, such as Claude Code, will load attacker-controlled skill files on the next launch.
2. **Delete and replace `SKILL.md`:** Even if `SKILL.md` has mode `0o644`, POSIX allows any user to unlink and replace a file inside a writable directory.
3. **Create symlinks for Findings #5, #7, and #17:** World-writable directories give local attackers the write access required to exploit symlink vulnerabilities.

Because directory permissions depend on `umask`, operators who test on a machine with `umask 022` see `0o755` while CI containers silently create `0o777` directories.

**Threat models:**

1. **Co-tenant on a shared CI runner:** Job 1 runs `testrail install-skill --global` on a shared host. Job 2 (running as a different UID on the same host) places a malicious `SKILL.md` in the world-writable directory. Job 3 runs Claude Code, which loads the malicious skill.
2. **Container with a persistent volume:** A container running with `umask 000` writes the skill to a persistent volume. Another container later mounts that volume and loads a file modified by an unprivileged container user.
3. **Multi-user development VM:** Developer A has `umask 000` and installs the skill. Developer B replaces `SKILL.md` in Developer A's home directory.

**Fix sketch (S):**

1. Pass an explicit mode to `mkdirSync`. Use `0o700` for `--global` targets under `~`, and `0o755` for project-local `<cwd>/.claude/skills/` targets:

    ```ts
    const mode = opts.global ? 0o700 : 0o755;
    mkdirSync(dirname(target), { recursive: true, mode });
    ```

2. Call `chmodSync` on the target directory after creation so that pre-existing directories with wider permissions are also restricted:

    ```ts
    chmodSync(dirname(target), mode);
    ```

3. Set explicit permissions on the installed file. Call `chmodSync(target, 0o600)` for `--global` installations and `chmodSync(target, 0o644)` for project-local installations.
4. Check `process.umask()` during installation. If the `umask` is less restrictive than `0o022`, write a warning to `stderr`.

Tests:

- `tests/install-skill.test.ts`: Set `process.umask(0o000)`, run `runInstallSkill({ force: false, cwdOverride: tmp, ... })`, and verify that `lstatSync(join(tmp, '.claude', 'skills', 'testrail-cli')).mode & 0o777` is `0o755`.
- `tests/install-skill.test.ts`: Run with `opts.global = true` and `homeOverride: tmp`, and verify that the directory mode is `0o700`.
- `tests/install-skill.test.ts`: Verify that the installed file mode is `0o644` for project-local installs and `0o600` for global installs, regardless of source mode and `umask`.
- Regression: Verify that installation behavior under `umask 0o022` remains unchanged.

### 20. `baseUrl` accepted with embedded userinfo (`user:pass@…`) → credential string preserved in heap, URLs, and fetch error metadata — `src/client-core.ts:255–290, 200, 603, 724, 813, 893` (Severity: LOW–MEDIUM) — [OPEN]

`validateConfig` parses `config.baseUrl` with `new URL()` and checks the protocol and hostname, but it does not check `url.username` or `url.password`:

```ts
// src/client-core.ts:255–289
try {
    const url = new URL(config.baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) { … }
    if (url.protocol === 'http:' && config.allowInsecure !== true) { … }
    // … hostname → PRIVATE_HOST_PATTERNS check …
}
```

For `new URL('https://foo:bar@testrail.example.com/')`, `hostname` is `testrail.example.com`. The regex check and DNS lookup both pass. The client then stores the full string `https://foo:bar@testrail.example.com` in `this.baseUrl` (L200) and concatenates it into every outbound URL:

```ts
// src/client-core.ts:603, 724, 813, 893 (one per fetch site)
const url = `${this.baseUrl}/index.php?/api/v2/${endpoint}`;
```

**Network layer behavior:** The `undici` `Request` constructor removes userinfo from the URL before sending the HTTP request line. The client sets an explicit `Authorization: Basic` header from `config.email` and `config.apiKey`. Therefore, the client does not send a second authentication header over the network.

**Remaining exposure:**

1. **`this.baseUrl` retains the userinfo string for the lifetime of the client:** `destroy()` (L560) clears `this.auth`, but `this.baseUrl` is `readonly` and remains in memory. A heap snapshot can recover `foo:bar` in plaintext.
2. **Every fetch URL contains userinfo:** Each constructed URL remains in the heap with embedded credentials until garbage collection removes the immutable V8 string.
3. **Fetch error messages may include the URL:** `undici` attaches diagnostic information to `error.cause`. When the client wraps network errors at L691:
    ```ts
    throw new TestRailApiError(0, `Network error: ${(error as Error).message}`, (error as Error).message);
    ```
    If the error message includes the URL with userinfo, the CLI writes the credentials to `stderr` and CI logs.
4. **Same-origin redirects preserve userinfo:** When `redirect: 'follow'` is active (Finding #4), same-origin redirects forward `foo:bar` to the next URL in the redirect chain.

**Threat models:**

1. **Operator credential exposure:** An operator who migrates from a `curl https://email:apikey@testrail.example.com/api/...` command may leave userinfo in `baseUrl`. Heap dumps, crash reports, and debug logs then capture the credentials.
2. **Application startup logs:** Applications that log their startup `config` send `baseUrl` to structured log systems such as Datadog or Splunk. Redaction rules usually target `apiKey`, not `baseUrl`.
3. **Combination with Finding #11 (`--api-key` argv exposure):** Passing userinfo in `--base-url` exposes credentials in process arguments as well.

**Fix sketch (S):**

1. Reject any `baseUrl` that contains a non-empty `username` or `password`:

    ```ts
    // src/client-core.ts:257 (inside the existing try { … } block)
    const url = new URL(config.baseUrl);
    if (url.username !== '' || url.password !== '') {
        throw new TestRailValidationError(
            'baseUrl must not contain userinfo (user:pass@host); ' +
                'pass credentials via the email and apiKey config fields.',
        );
    }
    ```

2. Normalize the stored `baseUrl` using `url.origin + url.pathname.replace(/\/$/, '')` instead of `config.baseUrl.replace(/\/$/, '')`. Because `url.origin` never includes userinfo, credentials cannot reach `this.baseUrl`.
3. Document in the `README.md` Configuration section that credentials must be passed in `email` and `apiKey`, not in `baseUrl`.

Tests:

- `tests/client-features.test.ts`: Verify that `https://u@host/`, `https://u:p@host/`, `https://:p@host/`, and `https://%40:p@host/` all throw `TestRailValidationError` at construction.
- `tests/client-features.test.ts`: Verify that a valid `baseUrl` without userinfo is stored unchanged.
- `tests/client-features.test.ts`: Verify that `url.origin` normalization strips userinfo from `this.baseUrl` even if the validation check is bypassed.
- `tests/client-edge-cases.test.ts`: Verify that redirects do not forward userinfo to the redirect target.

### 21. Slowloris-on-body DoS: timeout cleared before body is read — `src/client-core.ts:611–625, 732–746, 826–840, 896–908` (Severity: MEDIUM) — [OPEN]

All four fetch sites clear the request timeout before reading the response body:

```ts
// src/client-core.ts:611–625 (request<T>; identical at 732/826/896)
const timeoutId = setTimeout(() => controller.abort(), this.timeout);
// …
try {
    const response: Response = await fetch(url, options);
    clearTimeout(timeoutId);              // ← timeout disarmed here
    // …
    const responseText = await response.text();   // ← unbounded wait
```

The `setTimeout` timer only protects the header round-trip. `await fetch(...)` resolves as soon as the response headers arrive, before any body bytes are read. The next line calls `clearTimeout(timeoutId)`, so `response.text()` and `response.arrayBuffer()` run with no time limit.

`controller.signal` controls both the request and response body stream. However, the client cancels the `controller.abort()` timer when the headers arrive.

**Slowloris attack on the response body:** A malicious or compromised server (or redirect target from Finding #4):

1. Accepts the request and immediately returns `200 OK` headers.
2. Sends the response body at 1 byte every 30 seconds.
3. Holds the client's `await response.text()` call open indefinitely because the steady trickle prevents TCP keep-alive timeouts from firing.

As a result, the client ignores `DEFAULT_TIMEOUT_MS = 30_000` (30 s) and `MAX_TIMEOUT_MS = 300_000` (5 min) during body reads.

**Affected paths:**

| Method             | setTimeout site | first clearTimeout (headers) | body read after               |
| ------------------ | --------------- | ---------------------------- | ----------------------------- |
| `request<T>`       | L611            | L625                         | L628 (error) / L653 (success) |
| `requestText`      | L732            | L746                         | L749 / L767                   |
| `requestMultipart` | L826            | L840                         | L843 / L850                   |
| `requestBinary`    | L896            | L908                         | L911 / L925                   |

**Interaction with other findings:**

- **Finding #4 (redirect SSRF):** Redirecting to a slow-streaming internal endpoint holds connections open, exhausting rate-limit slots and sockets.
- **Finding #12 (unbounded response body):** A slow server can also grow the response buffer without a limit. Growth stops only at the V8 string length limit.
- **Finding #13 (POST idempotency):** Because the server returns `200 OK` headers, retries never trigger and the client hangs on the first attempt.
- **Finding #9 (cache poisoning):** If the slow response eventually completes, the client caches the response for the full TTL.

**Fix sketch (M):** Keep the timeout timer active until the body is completely read, or set a separate timer for the body read:

A. **Clear the timeout after reading the body:** Move `clearTimeout(timeoutId)` after `response.text()` and `response.arrayBuffer()`:

```ts
try {
    const response: Response = await fetch(url, options);
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        clearTimeout(timeoutId); // ← moved
        // … retry / throw …
    }
    if (method !== 'GET') this.clearCache();
    const responseText = await response.text();
    clearTimeout(timeoutId); // ← moved
    // … parse / return …
} catch (error) {
    clearTimeout(timeoutId); // unchanged
    // … existing catch …
}
```

With this change, `this.timeout` covers both headers and body end-to-end. If the timer fires during the body read, `controller.abort()` aborts the stream and the existing `catch` block throws a 408 `TestRailApiError`.

B. **Use a separate body timeout:** Clear the header timer when headers arrive, then start a second `setTimeout` for the body read (configurable via `bodyTimeout`).

Combine either option with the streaming byte limit from Finding #12 so that body reads enforce both time and byte limits.

Tests:

- `tests/client-features.test.ts`: Stub `fetch` to return a `Response` with a `ReadableStream` body that yields 1 byte every 200 ms. Set `timeout: 500`. Verify that `client.getProject(1)` rejects with a 408 `TestRailApiError` within ~500 ms.
- `tests/client-features.test.ts`: Repeat the slow-stream test for `requestBinary`, `requestText`, and `requestMultipart`.
- Regression: Verify that a fast response completes normally without aborting.
- `tests/client-features.test.ts`: Verify that a slow-streaming error body on a 5xx response also aborts when the timeout expires.

### 22. Prototype-chain property access in `dispatch()` crashes the CLI on `Object.prototype` resource names — `src/cli/dispatch.ts:118–131, 144–163` (Severity: LOW) — [OPEN]

`RESOURCES` is a plain JavaScript object that inherits from `Object.prototype`. `dispatch()` indexes into `RESOURCES` using the user-supplied `resource` argument:

```ts
// src/cli/dispatch.ts:118–131
const RESOURCES: Record<string, readonly string[]> = (() => {
    const grouped: Record<string, string[]> = {};
    for (const key of Object.keys(HANDLERS)) {
        const [resource, action] = key.split(':');
        if (resource === undefined || action === undefined) continue;
        const existing = grouped[resource];
        if (existing === undefined) { grouped[resource] = [action]; }
        else { existing.push(action); }
    }
    return grouped;
})();

// src/cli/dispatch.ts:144–157
export function dispatch(resource: string, action: string): DispatchResult {
    const actions = RESOURCES[resource];        // ← walks proto chain
    if (actions === undefined) {                // ← truthy proto values bypass
        return { ok: false, error: `Unknown resource '${resource}'...` };
    }
    if (!actions.includes(action)) { ... }     // ← TypeError on non-array
    ...
}
```

For any property name on `Object.prototype`, `RESOURCES[resource]` returns the inherited prototype property instead of `undefined`:

| `resource` argv                                                                   | `RESOURCES[resource]` returns         | `.includes(...)` outcome                        |
| --------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| `__proto__`                                                                       | `Object.prototype` (the proto itself) | `TypeError: actions.includes is not a function` |
| `constructor`                                                                     | `Object` (the constructor function)   | `TypeError: actions.includes is not a function` |
| `toString`                                                                        | `Function.prototype.toString`         | `TypeError: actions.includes is not a function` |
| `valueOf`                                                                         | `Object.prototype.valueOf`            | `TypeError: actions.includes is not a function` |
| `hasOwnProperty`                                                                  | `Object.prototype.hasOwnProperty`     | `TypeError: actions.includes is not a function` |
| `isPrototypeOf`                                                                   | `Object.prototype.isPrototypeOf`      | `TypeError: actions.includes is not a function` |
| `propertyIsEnumerable`                                                            | …                                     | `TypeError: actions.includes is not a function` |
| `toLocaleString`                                                                  | …                                     | `TypeError: actions.includes is not a function` |
| `__defineGetter__` / `__defineSetter__` / `__lookupGetter__` / `__lookupSetter__` | …                                     | same shape                                      |

Verification on Node.js 24:

```
$ node -e "const r = {}; try { r['__proto__'].includes('x'); } catch(e) { console.log(e.message); }"
r.__proto__.includes is not a function
```

The `TypeError` propagates to the `catch` block in `main()` (`index.ts:281`):

```ts
} catch (e: unknown) {
    err(e instanceof Error ? e.message : String(e));
    return 1;
}
```

The user receives `Error: actions.includes is not a function` on `stderr` instead of `Unknown resource '__proto__'. Use: project, suite, ...`.

**Impact assessment:**

- **No data leak:** The `TypeError` message does not expose sensitive data.
- **No authentication bypass:** `dispatch()` fails at L145 before `resolveAuth()` runs at L217.
- **No prototype pollution:** `RESOURCES` is populated from static `Object.keys(HANDLERS)` entries, none of which are prototype keys.
- **Per-invocation failure only:** The CLI exits with code 1, but prints a `TypeError` instead of the help message.
- **Related lookup sites in `src/cli/`:**
  1. `RESOURCES[resource]` (L145): Vulnerable to prototype lookup.
  2. `HANDLERS[\`${resource}:${action}\`]` (L158): Concatenates a colon, which does not match any `Object.prototype` key, but remains a plain object lookup.
  3. `grouped[resource]` (L123): Safe because keys come from `Object.keys(HANDLERS)`.
  4. `Object.keys(RESOURCES).join(', ')` (L149): Safe because `Object.keys` only enumerates own properties.
  5. `ACTIONS.find(...)` in `getActionSpec` (`metadata.ts:551`): Safe because `Array.prototype.find` iterates array elements.

**Fix sketch (S):** Store `RESOURCES` in a container without `Object.prototype`:

A. **Use `Object.create(null)`:**

```ts
const RESOURCES: Record<string, readonly string[]> = (() => {
    const grouped: Record<string, string[]> = Object.create(null);
    for (const key of Object.keys(HANDLERS)) {
        const [resource, action] = key.split(':');
        if (resource === undefined || action === undefined) continue;
        const existing = grouped[resource];
        if (existing === undefined) grouped[resource] = [action];
        else existing.push(action);
    }
    return grouped;
})();
```

`Object.create(null)` creates an object with a `null` prototype, so `grouped['__proto__']` returns `undefined`.

B. **Use `Map<string, readonly string[]>`:**

```ts
const RESOURCES = new Map<string, readonly string[]>();
// … construct … RESOURCES.set(resource, [...existing, action]) …

const actions = RESOURCES.get(resource);
if (actions === undefined) { … }
```

Tests:

- `tests/cli.test.ts`: Run `testrail __proto__ foo` in a subprocess and verify that it exits with code 1 and prints `Unknown resource '__proto__'`.
- Repeat the test for `constructor`, `toString`, `valueOf`, `hasOwnProperty`, `propertyIsEnumerable`, and `isPrototypeOf`.
- `tests/cli-helpers.test.ts`: Verify that `dispatch('__proto__', 'foo').error.startsWith("Unknown resource")` is `true`.
- Regression: Verify that `dispatch('project', 'get')` returns `{ ok: true, handler }`.

### 23. Cache stampede: N concurrent identical GETs fan out into N parallel network calls — `src/client-core.ts:591–598, 661–665` (Severity: LOW–MEDIUM) — [OPEN]

The GET LRU cache stores completed responses, not in-flight requests. Because the client writes to the cache only after the response body parses, concurrent callers of the same endpoint all miss the cache:

```ts
// src/client-core.ts:591–598 (request<T>)
if (method === 'GET' && !skipCache) {
    const cacheKey = `${method}:${endpoint}`;
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData !== undefined) {
        return cachedData;
    }
}
// … fetch … parse JSON …
// src/client-core.ts:661–665
if (method === 'GET' && !skipCache) {
    const cacheKey = `${method}:${endpoint}`;
    this.setCachedData(cacheKey, result);
}
return result;
```

When `N` callers invoke `client.getCase(42)` concurrently:

1. Caller 1 misses the cache and starts a `fetch` request.
2. Callers 2 through `N` also miss the cache before Caller 1 finishes, and each starts a separate `fetch` request.
3. All `N` requests resolve, overwrite the same cache entry, and return the same data.

This results in `N` network requests, `N` cache writes, `N` rate-limit slots consumed, and `N` response body allocations for a single logical read.

**Compounding effects:**

1. **Rate-limit exhaustion:** `checkRateLimit` (L383–405) records each request in a sliding window (`maxRequests: 100` by default). Concurrent calls with duplicate IDs consume multiple rate-limit slots for the same resource and can trigger 429 errors.
2. **Interaction with Finding #12 (unbounded response body):** `N` concurrent responses allocate memory in parallel, multiplying peak memory usage by `N`.
3. **Interaction with Finding #21 (slowloris on body):** If the server streams slowly, all `N` concurrent requests hold open sockets simultaneously.
4. **Interaction with Finding #4 (redirect SSRF):** `N` concurrent requests amplify a redirect into `N` parallel connections to the redirect target.
5. **Interaction with Finding #13 (retry behavior):** One of `N` concurrent GET requests can fail with a 5xx error. It retries with backoff even after the other `N - 1` requests populate the cache.

**Threat models:**

1. **Batch requests with duplicate IDs:** An agent calls `Promise.all(...)` over an array containing duplicate IDs and exhausts its own rate-limit budget.
2. **Cold-cache startup burst:** When a process starts with an empty cache, simultaneous requests for the same project or run trigger parallel upstream calls.
3. **Interaction with Finding #9 (cache poisoning):** Concurrent requests during an upstream change can receive different responses, causing callers to see inconsistent data.

**Fix sketch (S):** Track in-flight GET promises in a `Map` keyed by `GET:${endpoint}` so that concurrent callers share the pending promise:

```ts
// Field on TestRailClientCore:
private readonly inflight = new Map<string, Promise<unknown>>();

// In request<T>(), replace lines 591–598 with:
if (method === 'GET' && !skipCache) {
    const cacheKey = `${method}:${endpoint}`;

    // Hit the result cache first.
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData !== undefined) return cachedData;

    // Result-cache miss → check the in-flight cache.
    const pending = this.inflight.get(cacheKey);
    if (pending !== undefined) return pending as Promise<T>;
}

// After successful parse, register and clean up:
const inflightPromise = doFetchAndParse();   // refactor body into a helper
if (method === 'GET' && !skipCache) {
    this.inflight.set(cacheKey, inflightPromise);
    inflightPromise.finally(() => this.inflight.delete(cacheKey));
}
return inflightPromise as Promise<T>;
```

Key requirements:

- **Share both resolved and rejected promises:** If the in-flight request fails, all waiting callers receive the same `TestRailApiError` without starting new requests. When combined with Finding #14, clone the resolved value for each caller.
- **Do not coalesce when `skipCache: true` is set:** Callers that set `skipCache: true` must always perform a fresh fetch.
- **Do not coalesce POST requests:** Only coalesce `GET` requests.
- **Apply the same coalescing to `requestBinary`:** Concurrent attachment downloads benefit from sharing in-flight requests. `requestText` bypasses the cache by design, and `requestMultipart` only uses `POST`.

Tests:

- `tests/client-features.test.ts`: Run 50 concurrent `client.getProject(1)` calls with a mocked `fetch`. Verify that `fetch` is called once and all 50 callers receive the result.
- `tests/client-features.test.ts`: Run 50 concurrent calls where `fetch` rejects with 502 (`maxRetries: 0`). Verify that all 50 callers receive `TestRailApiError` and `fetch` is called once.
- `tests/client-features.test.ts`: Run 30 concurrent `getProject(1)` calls and 20 concurrent `getProject(2)` calls. Verify that `fetch` is called exactly twice.
- `tests/client-features.test.ts`: Verify that sequential calls clean up the `inflight` entry in `.finally()`.
- `tests/client-edge-cases.test.ts`: Verify that a call with `skipCache: true` performs a new fetch.

### 24. Unbounded stdin read for write-action bodies — `src/cli/index.ts:269`, `src/cli/body.ts:75–78` (Severity: LOW–MEDIUM) — [SHIPPED — partial]

> **Scope shipped in v3.0:** Fixed memory exhaustion. `readBoundedStdin` in `src/cli/stdin.ts` limits stdin reads to 1 MiB and throws an error when input exceeds the limit.
> > **Follow-up (not shipped):** A producer can keep the pipe open without exceeding `maxBytes`. Examples include `tail -f` and an unclosed FIFO. The CLI then blocks indefinitely on `fs.readSync`. Change `BodyInput.readStdin` from `() => string` to `() => Promise<string>`. Replace the `readSync` loop with an async stream reader and a wall-clock timeout, such as 30 s. Update `resolveBody` to be async. Copilot review on PR #70 identified this remaining time-limit requirement.

The CLI provides `stdin` as a third body source (alongside `--data` and `--data-file`) through a function that performs an unbounded read from file descriptor 0:

```ts
// src/cli/index.ts:269
...(process.stdin.isTTY === false && !isFileInputAction && {
    readStdin: () => readFileSync(0, 'utf-8'),
}),
```

```ts
// src/cli/body.ts:73–78  (resolveBody)
} else {
    try {
        raw = (input.readStdin as () => string)();   // ← reads ALL of stdin
    } catch (e) {
        return { ok: false, error: `Cannot read stdin: ...` };
    }
    ...
}
```

`readFileSync(0, 'utf-8')` blocks until EOF and buffers the entire stream into a single UTF-8 string. It enforces no byte limit and no time limit.

**Failure modes:**

| Invocation                                                  | Outcome                                                                                        |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `yes 'y' \| testrail case add 1`                            | `readFileSync(0)` buffers `y\ny\ny\n...` until V8 hits its ~1 GB string limit → `RangeError`   |
| `cat /dev/zero \| testrail case add 1`                      | Same shape; OOM-kill is faster on 32-bit V8 / constrained containers (kernel OOM-killer fires) |
| `tail -f /var/log/app.log \| testrail case add 1`           | `readFileSync(0)` blocks forever (no EOF); process hangs indefinitely                          |
| `dd if=/dev/random bs=1M count=2048 \| testrail case add 1` | 2 GB string allocation — OOM-killed in any default container                                   |
| `nc -l 4444 \| testrail case add 1`                         | Same as `tail -f`; netcat doesn't close stdin until the remote does                            |

Unlike `--data-file` (Finding #17), where the client can check file size with `lstat()` before reading, a `stdin` pipe has no upfront size metadata. Defending `stdin` requires both a byte limit and a wall-clock timeout.

**Threat models:**

1. **Prompt-injected agent piping an unending stream:** A prompt-injected agent runs `tail -f /var/log/build.log | testrail case add 42`. The CLI hangs indefinitely.
2. **Malicious upstream CI step:** A compromised upstream CI step writes gigabytes of data to `stdout` and pipes it to `testrail`. The runner terminates the job with an out-of-memory error.
3. **Accidental large file pipe:** An operator runs `cat large.json | testrail case add 1` with a 100 MB file, causing an out-of-memory crash on memory-constrained CI runners before `JSON.parse` runs.
4. **Combination with Finding #10 (mistyped flags):** An agent supplies a mistyped `--dryrun` flag and a large stdin stream. The CLI reads the full stream and sends the request.

**Fix sketch (S–M):** Enforce both a byte limit and a timeout when reading `stdin`:

1. Define constants in `src/constants.ts`:
    ```ts
    export const MAX_STDIN_BODY_BYTES = 4 * 1024 * 1024; // same as MAX_DATA_FILE_BYTES from #17
    export const MAX_STDIN_WAIT_MS = 30 * 1000; // 30 s default
    ```
2. Replace `readFileSync(0)` with a stream reader:
    ```ts
    async function readStdinCapped(
        maxBytes: number,
        timeoutMs: number,
    ): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
        return new Promise((resolve) => {
            const chunks: Buffer[] = [];
            let total = 0;
            const timer = setTimeout(() => {
                process.stdin.removeAllListeners();
                resolve({ ok: false, error: `stdin read exceeded ${timeoutMs} ms` });
            }, timeoutMs);
            process.stdin.on('data', (chunk: Buffer) => {
                total += chunk.byteLength;
                if (total > maxBytes) {
                    clearTimeout(timer);
                    process.stdin.removeAllListeners();
                    resolve({ ok: false, error: `stdin exceeded ${maxBytes} bytes` });
                    return;
                }
                chunks.push(chunk);
            });
            process.stdin.on('end', () => {
                clearTimeout(timer);
                resolve({ ok: true, text: Buffer.concat(chunks).toString('utf-8') });
            });
            process.stdin.on('error', (err) => {
                clearTimeout(timer);
                resolve({ ok: false, error: err.message });
            });
        });
    }
    ```
3. Update `resolveBody` to await the async `readStdin` function.
4. Check `fstatSync(0)` and reject directory file descriptors on `stdin`.

Tests:

- `tests/cli-body-source.test.ts`: Write `MAX_STDIN_BODY_BYTES + 1` bytes to `stdin` and verify that the CLI exits with code 1, prints the `stdin exceeded ... bytes` error, and makes no API call.
- `tests/cli-body-source.test.ts`: Open a FIFO without closing it, pipe it to `stdin`, and verify that the call fails with `stdin read exceeded ... ms` within `MAX_STDIN_WAIT_MS`.
- `tests/cli-body-source.test.ts`: Verify that a valid 4 KB JSON payload on `stdin` succeeds.
- `tests/cli.test.ts`: Run `yes 'y' | testrail case add 1 --base-url ... --email ... --api-key ...` in a subprocess and verify that it exits with code 1 before hitting a V8 `RangeError`.

### 25. `Retry-After` honored only for 429; ignored on 503 and all other retryable 5xx — `src/client-core.ts:632–636, 751–754, 915–918` (Severity: LOW–MEDIUM) — [OPEN]

All three retryable code paths parse `Retry-After` only when `response.status === 429` and use exponential backoff for all 5xx responses:

```ts
// src/client-core.ts:632–636 (request<T>; identical at 751 and 915)
if ((response.status >= 500 || response.status === 429) && retryCount < this.maxRetries) {
    const retryAfterMs = response.status === 429 ? this.parseRetryAfterMs(response) : null;
    const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
    await sleep(delay);
    return this.request<T>(method, endpoint, data, retryCount + 1, skipCache);
}
```

`getRetryDelay(retryCount)` computes `min(1000 * 2^N, 10000)` (1 s, 2 s, 4 s, 8 s, up to 10 s). With the default `maxRetries: 3`, the client retries at +1 s, +2 s, and +4 s (at most 7 s total wait).

RFC 7231 Section 7.1.3 specifies `Retry-After` on `503 Service Unavailable`:

> "The `Retry-After` HTTP header field can be used with any 3xx (Redirection) … or 503 (Service Unavailable) response to indicate how long the user agent ought to wait before making a follow-up request."

Upstream services and reverse proxies (CloudFront, Cloudflare, NGINX, and TestRail maintenance mode) return `503 Retry-After: <N>` during load shedding or maintenance.

Because the client ignores `Retry-After` on 503 responses, a `503 Retry-After: 60` response causes the client to retry at +1 s, +2 s, and +4 s. It sends three additional requests before the 60-second recovery window opens.

**Compounding effects:**

1. **Outage amplification:** A batch of 100 requests during a 503 outage generates 400 requests within 7 seconds.
2. **Shared rate-limit depletion:** Retries during a 503 outage consume the TestRail account rate budget needed by other clients.
3. **Interaction with Finding #23 (cache stampede):** `N` concurrent GET requests to an endpoint returning 503 each retry 3 times (`4 * N` requests in 7 seconds).
4. **Interaction with Finding #21 (slowloris):** Rapid retries against a 503 response with a slow body create overlapping connections that exhaust the socket pool.
5. **Unreachable HTTP-date parsing on 5xx:** `parseRetryAfterMs` supports both delay-seconds (`Retry-After: 60`) and HTTP-date (`Retry-After: Wed, 21 Oct 2026 07:28:00 GMT`), but the `response.status === 429` condition prevents either format from running on 5xx responses.

**Fix sketch (S):** Remove the `response.status === 429` condition so that all retryable statuses use `parseRetryAfterMs(response)`:

```ts
const retryAfterMs = this.parseRetryAfterMs(response);
const delay = retryAfterMs ?? this.getRetryDelay(retryCount);
```

When the `Retry-After` header is absent or invalid, `parseRetryAfterMs` returns `null` and the client falls back to `getRetryDelay()`. The existing `MAX_RETRY_DELAY_MS = 10 s` cap in `parseRetryAfterMs` prevents a server from stalling the client with a huge `Retry-After` value.

Apply this change at all three retry sites:

| Site                          | File:Line                |
| ----------------------------- | ------------------------ |
| `request<T>` retry trigger    | `src/client-core.ts:633` |
| `requestText` retry trigger   | `src/client-core.ts:752` |
| `requestBinary` retry trigger | `src/client-core.ts:916` |

Tests:

- `tests/client-features.test.ts`: Stub `fetch` to return `503 Retry-After: 3` followed by `200`. Verify that the delay between the two `fetch` calls is at least 3 s and at most 10.5 s.
- `tests/client-features.test.ts`: Stub `503 Retry-After: 99999` and verify that the delay is clamped to `MAX_RETRY_DELAY_MS` (10 s).
- `tests/client-features.test.ts`: Verify that `500 Internal Server Error` without `Retry-After` uses `getRetryDelay`.
- `tests/client-features.test.ts`: Verify that an HTTP-date `Retry-After` header is honored on 503 responses.
- `tests/client-features.test.ts`: Verify the same behavior for `requestText` and `requestBinary`.

### 26. `allowInsecure: true` enables cleartext credential transmission with no runtime warning or audit trail — `src/client-core.ts:262–269`, `src/types.ts:35` (Severity: LOW–MEDIUM) — [OPEN]

`validateConfig` requires `config.allowInsecure === true` for HTTP URLs and throws an error when the flag is not set:

```ts
// src/client-core.ts:262–269
if (url.protocol === 'http:' && config.allowInsecure !== true) {
    throw new TestRailValidationError(
        'baseUrl must use HTTPS. HTTP sends credentials in cleartext. ' +
            'Set allowInsecure: true only in isolated development environments.',
    );
}
```

However, when the caller sets `allowInsecure: true`, the client logs no warning at construction and exposes no state flag. It sends `Authorization: Basic ${base64(email:apiKey)}` over cleartext HTTP for the lifetime of the client without any diagnostic message.

In contrast, the client logs a warning for `maxCacheSize: 0`:

```ts
// src/client-core.ts:212–218
if (config.maxCacheSize === 0 && (config.enableCache ?? true)) {
    console.warn(
        'Warning: maxCacheSize is set to 0 (unlimited). ' +
            'This can cause unbounded memory growth. Consider setting a positive limit.',
    );
}
```

**Failure modes:**

1. **Configuration drift between staging and production:** A developer enables `allowInsecure: true` for a local HTTP mock and deploys the same configuration to production. Credentials are transmitted in cleartext with no startup warning.
2. **Copied migration configurations:** Operators who migrate from legacy HTTP setups keep `allowInsecure: true` in environments that already support HTTPS.
3. **Internal HTTP with log capture:** An endpoint such as `http://testrail.internal:8080/` can use `allowPrivateHosts: true` and `allowInsecure: true`. It sends cleartext Basic authentication headers that network monitors or log collectors can capture.
4. **Environment variable injection:** An attacker changes a host application `.env` file to set `TESTRAIL_ALLOW_INSECURE=true`. The application then starts without a cleartext authentication warning.

**Interaction with other findings:**

- **Finding #4 (redirect SSRF):** Cross-scheme redirects from HTTPS to HTTP expose the `Authorization` header in cleartext.
- **Finding #20 (`baseUrl` userinfo):** An HTTP `baseUrl` with embedded userinfo exposes credentials both in the URL and in the `Authorization` header.
- **Finding #11 (`--api-key` argv exposure):** Combining `--api-key` on the command line with HTTP exposes credentials in both process listings and network traffic.

**Fix sketch (S):**

1. **Emit a startup warning when `allowInsecure: true` is active on an `http:` URL:**

    ```ts
    // After `this.baseUrl = ...` is set:
    if (config.allowInsecure === true) {
        // eslint-disable-next-line no-console
        console.warn(
            'Warning: allowInsecure is true. Authorization (Basic <base64>) ' +
                'will be sent over plain HTTP and is recoverable by any ' +
                'on-path observer. Use only in isolated dev environments; ' +
                'switch to HTTPS for any environment with shared network ' +
                'access.',
        );
    }
    ```

2. **Add an optional `acknowledgeInsecure?: boolean` configuration field** to suppress the warning when explicitly set to `true`.
3. **Expose `isInsecure(): boolean` on the client** so that host applications can inspect the security state at startup.

Tests:

- `tests/client-features.test.ts`: Construct a client with `allowInsecure: true` and verify that `console.warn` is called once with the warning message.
- `tests/client-features.test.ts`: Construct a client with `allowInsecure: true, acknowledgeInsecure: true` and verify that `console.warn` is not called.
- `tests/client-features.test.ts`: Construct an HTTPS client and verify that `console.warn` is not called.
- `tests/exports.test.ts`: Verify that `TestRailConfig` exports `acknowledgeInsecure?: boolean`.
- `tests/client-features.test.ts`: Verify that `client.isInsecure()` returns `true` only when `allowInsecure: true` is set and the URL uses `http:`.

### 27. `parseId` silently accepts hex / binary / scientific forms via `Number()` — `src/cli/ids.ts:8–14` (Severity: LOW) — [OPEN]

`parseId` validates positive integers using `Number(raw)`:

```ts
// src/cli/ids.ts:8–14
export function parseId(raw: string | undefined, name: string): number {
    const n = Number(raw);
    if (raw === undefined || raw === '' || !Number.isInteger(n) || n <= 0) {
        throw new IdParseError(`${name} must be a positive integer (got: ${raw ?? '(none)'})`);
    }
    return n;
}
```

`Number()` accepts hexadecimal, binary, scientific notation, and whitespace-padded strings:

| `raw` input  | `Number(raw)` returns             | `Number.isInteger` | `> 0` | `parseId` outcome         |
| ------------ | --------------------------------- | ------------------ | ----- | ------------------------- |
| `'42'`       | `42`                              | true               | true  | accepted as `42`          |
| `'0x42'`     | `66` (hex)                        | true               | true  | accepted as `66`          |
| `'0b101'`    | `5` (binary)                      | true               | true  | accepted as `5`           |
| `'1e10'`     | `10000000000`                     | true               | true  | accepted as `1e10`        |
| `'  42  '`   | `42` (trimmed)                    | true               | true  | accepted as `42`          |
| `'1.0'`      | `1`                               | true               | true  | accepted as `1`           |
| `'0o7'`      | `NaN` (Number doesn't take octal) | false              | —     | rejected ✓                |
| `'42abc'`    | `NaN`                             | false              | —     | rejected ✓                |
| `'Infinity'` | `Infinity`                        | false              | —     | rejected ✓                |
| `''`         | `0`                               | true               | false | rejected ✓ (`raw === ''`) |

`parseId` converts `'0x42'` to `66`, `'1e10'` to `10000000000`, and `'0b101'` to `5`. It places the converted decimal numbers in the URL paths `get_case/66`, `get_case/10000000000`, and `get_case/5`.

**Failure modes:**

1. **Hexadecimal string coercion:** An agent runs `testrail case get 0x42` and receives case `66` instead of an error.
2. **Scientific notation coercion:** Running `testrail case get 1e10` requests `get_case/10000000000`.
3. **Inconsistent whitespace handling:** `parseId` trims `'42 '` to `42` without warning.
4. **Precision loss above `Number.MAX_SAFE_INTEGER`:** IEEE 754 precision limits cause `parseId('9007199254740993')` to return `9007199254740992`. The client requests the wrong ID without an error.

**Fix sketch (S):** Validate that `raw` contains only base-10 digits and fits within `Number.isSafeInteger`:

```ts
export function parseId(raw: string | undefined, name: string): number {
    if (raw === undefined || raw === '') {
        throw new IdParseError(`${name} must be a positive integer (got: (none))`);
    }
    // Strict decimal-integer pattern: no leading +, no leading zeros (allow
    // bare "0" — rejected later by > 0), no exponent, no hex/binary/octal
    // prefix, no surrounding whitespace.
    if (!/^[1-9]\d*$/.test(raw)) {
        throw new IdParseError(`${name} must be a positive decimal integer (got: ${raw})`);
    }
    const n = Number(raw);
    if (!Number.isSafeInteger(n)) {
        throw new IdParseError(`${name} must be ≤ ${Number.MAX_SAFE_INTEGER} (got: ${raw})`);
    }
    return n;
}
```

- `^[1-9]\d*$` rejects leading zeros, hex (`0x`), binary (`0b`), scientific notation (`1e10`), decimals (`1.0`), whitespace, and sign characters.
- `Number.isSafeInteger` rejects values greater than `2^53 - 1`.
- Apply the same decimal-only validation to `optInt(raw)` (`src/cli/ids.ts:16–20`) for `--limit` and `--offset`.

Tests:

- `tests/cli-helpers.test.ts`: Verify that `parseId('0x42', 'case_id')`, `'1e10'`, `'0b101'`, `'  42  '`, `'1.0'`, `'+42'`, and `'042'` throw `IdParseError`.
- `tests/cli-helpers.test.ts`: Verify that `parseId('9007199254740993', 'id')` throws `IdParseError`.
- `tests/cli-helpers.test.ts`: Verify that `parseId('42', 'id')` returns `42`.
- `tests/cli.test.ts`: Run `testrail case get 0x42` in a subprocess and verify that it exits with code 1 without calling the API.

### 28. `cleanupAllClients` has no try-catch — one throwing `destroy()` aborts cleanup for all subsequent clients — `src/client-core.ts:150–155` (Severity: LOW) — [OPEN]

The process-exit and signal-handler cleanup loop iterates over `activeClients` and calls `destroy()` on each client without a `try/catch` block:

```ts
// src/client-core.ts:150–155
// Synchronous-only cleanup — safe to call on process exit
function cleanupAllClients(): void {
    for (const client of activeClients) {
        client.destroy();
    }
}
```

If `client.destroy()` throws on any client, the loop aborts immediately. Every remaining client in `activeClients` retains:

- The base64-encoded `Basic` credential string in `this.auth`.
- The GET response cache in memory.
- The `cacheCleanupTimer` interval reference.

Because `Set` iterates in insertion order, a failure in an earlier client prevents all later clients from being destroyed.

**Potential causes of exceptions in `destroy()`:**

1. **Subclass overrides:** A subclass of `TestRailClient` or `TestRailClientCore` that overrides `destroy()` to release external resources may throw an exception.
2. **Mocked timers in tests:** Test runners that replace `setInterval` and `clearInterval` can throw when clearing an invalid or already-cleared timer handle.
3. **Proxied `Set` or `Map` instances:** Instrumentation or test proxies around `activeClients` or `this.cache` can throw during `delete()` or `clear()`.
4. **Future `destroy()` logic:** Additional cleanup steps added to `destroy()` in future releases could throw during teardown.

**Fix sketch (S):** Wrap `client.destroy()` in a `try/catch` block inside `cleanupAllClients()`:

```ts
// src/client-core.ts:150–155
function cleanupAllClients(): void {
    for (const client of activeClients) {
        try {
            client.destroy();
        } catch {
            // Swallow per-client errors so one bad apple
            // doesn't strand credentials in the others. Each
            // destroy() is best-effort during shutdown.
        }
    }
}
```

Ignoring per-client errors during process exit guarantees that `cleanupAllClients()` attempts to clear credentials on every registered client.

Tests:

- `tests/client-features.test.ts`: Create two clients, stub the first client's `destroy()` method to throw an error, and call `cleanupAllClients()`. Verify that the second client is destroyed and its `auth` field is cleared.
- `tests/client-features.test.ts`: Create three clients where the second client's `destroy()` throws, and verify that both the first and third clients are destroyed.
- `tests/client-features.test.ts`: Verify that `cleanupAllClients()` destroys all clients when no errors occur.

### 29. `validateEntryId` accepts any non-empty string; entryId is concatenated raw into endpoint URLs (`updatePlanEntry` / `deletePlanEntry` / `addRunToPlanEntry`) — `src/client-core.ts:417–425`, `src/modules/plans.ts:79–98` (Severity: MEDIUM) — [OPEN]

`validateEntryId` only checks that `entryId` is a non-empty string after trimming:

```ts
// src/client-core.ts:417–425
public validateEntryId(entryId: string): void {
    if (typeof entryId !== 'string' || entryId.trim() === '') {
        throw new TestRailValidationError('entryId must be a non-empty string');
    }
}
```

The client then interpolates `entryId` directly into the endpoint URL path:

```ts
// src/modules/plans.ts:82
await this.client.request<unknown>('POST', `update_plan_entry/${planId}/${entryId}`, payload);
// :89
await this.client.request<void>('POST', `delete_plan_entry/${planId}/${entryId}`);
// :97
await this.client.request<unknown>('POST', `add_run_to_plan_entry/${planId}/${entryId}`, payload);
```

Unlike `validateId`, which restricts numeric IDs to positive integers, `validateEntryId` allows path-traversal and query-string characters. TestRail plan entry IDs are UUIDs (32 hexadecimal characters separated by four hyphens, such as `01234567-89ab-cdef-0123-456789abcdef`). Because `validateEntryId` accepts any non-empty string, all of the following values pass validation:

| `entryId` value                                       | URL result                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `'../admin/secret'`                                   | `…/update_plan_entry/42/../admin/secret`                             |
| `'foo?injected=true'`                                 | `…/update_plan_entry/42/foo?injected=true`                           |
| `'%2E%2E%2Fadmin'`                                    | URL contains pre-encoded `..` traversal                              |
| `'real-uuid#fragment'`                                | `…/update_plan_entry/42/real-uuid#fragment` (fragment stripped)      |
| `'abc&other=true'`                                    | Query-string injection in the path slot                              |
| `'../../../../../etc/passwd'`                         | Path-traversal text (mostly query-string at the URL layer)           |
| `' '` (single space, fails `.trim() === ''` actually) | Rejected ✓                                                           |
| `'.'`                                                 | `…/update_plan_entry/42/.`                                           |
| `'a'.repeat(1e6)`                                     | 1 MB URL — TestRail rejects 414                                      |
| `'abc\x00inject'`                                     | NUL byte in path — fetch likely rejects, but the encode is undefined |

**URL parsing behavior:**

- The WHATWG URL parser rejects CR, LF, and tab characters (`\r`, `\n`, `\t`) with `TypeError: Invalid URL`.
- A `#` character truncates the request URL because `fetch` strips URL fragments before sending the request.
- A `/` character adds extra path segments to the endpoint URL without URL encoding.
- Percent-encoded traversal sequences (`%2E%2E%2F`) pass through unchanged to the server.

**Threat models:**

1. **Prompt-injected agent passing a crafted `entryId`:** An agent reads a malicious `entryId` from untrusted input and calls `client.deletePlanEntry(7, entryId)`, altering the target API path.
2. **Query-parameter injection:** Passing `entryId = 'real-uuid&soft=1'` appends `&soft=1` to the TestRail query string (`index.php?/api/v2/update_plan_entry/42/real-uuid&soft=1`), which can alter server-side parameters.
3. **Cache key pollution:** If a GET endpoint uses an unvalidated string ID, the cache key includes the injected characters.

**Fix sketch (S):** Restrict `validateEntryId` to the UUID format:

```ts
// src/client-core.ts:421–425
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

public validateEntryId(entryId: string): void {
    if (typeof entryId !== 'string') {
        throw new TestRailValidationError('entryId must be a string');
    }
    if (!UUID_REGEX.test(entryId)) {
        throw new TestRailValidationError(
            'entryId must be a UUID (32 hex chars + 4 dashes, e.g. ' +
                '01234567-89ab-cdef-0123-456789abcdef)',
        );
    }
}
```

Implementation notes:

- Anchor the regular expression at both ends (`^` and `$`).
- Allow only ASCII hexadecimal digits `[0-9a-f]` (case-insensitive) and hyphens in the `8-4-4-4-12` pattern.

Tests:

- `tests/client-features.test.ts`: Verify that all non-UUID inputs in the table above throw `TestRailValidationError`.
- `tests/client-features.test.ts`: Verify that lowercase (`'01234567-89ab-cdef-0123-456789abcdef'`) and uppercase (`'01234567-89AB-CDEF-0123-456789ABCDEF'`) UUIDs pass validation.
- `tests/client-endpoints.test.ts`: Verify that `updatePlanEntry`, `deletePlanEntry`, and `addRunToPlanEntry` reject invalid `entryId` values before calling `fetch`.
- `tests/client-edge-cases.test.ts`: Verify that `'real-uuid&soft=1'` is rejected during validation.

---

## Migrated from active BACKLOG (2026-05-18)

> **Agent Rules:** Add completed tasks here. Include `Impl:` (implementation details) and `Rat:` (rationale).

### Completed (shipped)

- [x] 🔴 🐛 SEC #4: HTTP redirect bypass of SSRF guard (`client-core.ts`)
  - **Impl:** Shipped in 3.4.0. All four fetch sites set `redirect: 'manual'` and pass the response through `assertNotRedirect()`. Any 3xx response throws `TestRailApiError` with the blocked `Location` header, never retries, and never writes to the GET cache.
  - **Rat:** Previously, a `Location` header pointing to a private or metadata IP bypassed `validateBaseUrl` and DNS pinning.
- [x] 🟡 🐛 SEC #9: Schema-invalid response poisons GET cache for full TTL (`client-core.ts`)
  - **Impl:** Shipped in 3.2.0. The new `requestParsed<T>` method validates the response before writing to the cache.
  - **Rat:** Previously, the cache served invalid response data for the full TTL until it expired.
- [x] 🟡 🐛 SEC #13: POST retries can duplicate writes (`client-core.ts`)
  - **Impl:** Shipped in 3.3.0. Non-GET methods retry only on 429 responses. They throw 5xx and network errors immediately.
  - **Rat:** Retrying write requests on 5xx or network errors can duplicate server-side mutations.
- [x] 🟢 🐛 SEC #25: `Retry-After` ignored on 503 / other retryable 5xx (`client-core.ts`)
  - **Impl:** All three retry sites in `TestRailClientCore` (`request<T>`, `requestText`, and `requestBinary`) now call `parseRetryAfterMs` on every retryable status, not only on 429. The retry-eligibility gate (GET-only for 5xx on `request` and `requestText`, and GET for `requestBinary`) remains unchanged, preserving the write-idempotency rules from SEC #13. The `parseRetryAfterMs` JSDoc documents the `MAX_RETRY_DELAY_MS` limit. Zero, past, and invalid header values return `null`, so callers use exponential backoff. Tests in `client-features.test.ts` cover delay-seconds, HTTP-date, cap enforcement, missing headers, zero values, invalid values, POST 503 with `Retry-After` (no retry), and `requestText` and `requestBinary` paths.
  - **Rat:** TestRail and reverse proxies (NGINX, Cloudflare) send `Retry-After` on 502, 503, and 504 responses during overload or maintenance. Honoring `Retry-After` on retryable 5xx responses prevents the client from sending rapid retries before the upstream recovery window opens.
- [x] 🟡 🐛 SEC #8: Library constructor hijacks host SIGINT/SIGTERM via `process.exit()` (`client-core.ts`)
  - **Impl:** Shipped in 3.5.0. Added `registerProcessHandlers?: boolean` to `TestRailConfig`, defaulting to `false`. The constructor calls `registerProcessHandlers()` only when the flag is `true`. The handler implementation, `activeClients` registry, and exit codes (130 and 143) are unchanged. The CLI (`src/cli/index.ts`) explicitly sets `registerProcessHandlers: true` when constructing its client. Tests in `client-edge-cases.test.ts` verify default-off behavior, explicit `false`, opt-in registration for `exit`, `SIGINT`, and `SIGTERM`, and idempotence across multiple clients.
  - **Rat:** Host applications (such as Express, NestJS, and Electron) manage their own process lifecycle. Registering global signal listeners and calling `process.exit()` from a library constructor interrupts host shutdown hooks. Making signal handler registration opt-in keeps library usage safe while preserving CLI cleanup behavior.
- [x] 🟡 🐛 SEC #12 + SEC #21: Unbounded response body reads + slowloris-on-body after timeout cleared (`client-core.ts`)
  - **Impl:** Added `readBodyWithLimits(response, {maxBytes, deadlineMs})` in `src/body-reader.ts`. This function reads `ReadableStream` chunks while enforcing a running byte limit and a `setTimeout` deadline that cancels the reader. All four fetch sites (`request<T>`, `requestText`, `requestMultipart`, and `requestBinary`) read both error and success bodies through `readBodyWithLimits`. Added three `TestRailConfig` options. `maxJsonResponseBytes` defaults to 10 MiB for JSON, text, and error bodies. `maxBinaryResponseBytes` defaults to 100 MiB for successful `requestBinary` bodies. `bodyTimeout` defaults to `timeout`; `0` disables its deadline. `validateConfig` validates all three options against `MAX_RESPONSE_BYTES_LIMIT` (1 GiB). A non-streaming fallback (`arrayBuffer()` to `text()`) preserves compatibility with test mocks while still enforcing the byte cap after reading. Added 31 unit tests in `tests/body-limits.test.ts`.
  - **Rat:** Previously, `response.text()`, `response.json()`, and `response.arrayBuffer()` read without a byte limit, and the client cleared `timeout` as soon as response headers arrived (SEC #21). Streaming the response body with both a byte cap and a wall-clock deadline prevents out-of-memory crashes and slowloris hangs across all four fetch sites.

### Results read surface — per-test / per-case CLI

- [x] **`result list-for-test`** — Shipped in the Results read-surface CLI PR. `result list-for-test <test_id> [--limit N] [--offset N] [--status-id 1,5] [--defects-filter STR]` calls `getResults(testId, options?)` (`GET get_results/{test_id}`).
- [x] **`result list-for-case`** — Shipped in the same PR. `result list-for-case <run_id> <case_id> [--limit N] [--offset N] [--status-id 1,5] [--defects-filter STR]` calls `getResultsForCase(runId, caseId, options?)` (`GET get_results_for_case/{run_id}/{case_id}`). Both commands share `buildResultOptions()` in `src/cli/handlers/result.ts`. A subsequent TestRail 10.7 alignment update added `--created-after`, `--created-before`, `--created-by`, `--status-id`, and `--defects-filter` to `result list` (including in `--all` mode). The SDK uses separate `GetResultsOptions` and `GetResultsForRunOptions` types. Creator and date filters apply only to whole-run queries; `defects_filter` applies to all three endpoints.
- [x] **SKILL recipe: Results pipeline — choosing per-test vs per-case vs bulk endpoints** — Shipped in the same PR. The recipe documents when to use per-test, per-case-in-run, whole-run, or bulk-write endpoints, and includes `<!-- recipe-for: result:list-for-test -->` and `<!-- recipe-for: result:list-for-case -->` tags for Gate C2 verification.

### 🚫 Decision Log (won't-do)

- 🟢 🚫 CLI: `result delete` — The TestRail API does not support deleting individual results.
- 🟢 🚫 CLI: `run add-bulk` — The TestRail API does not support bulk run creation.
- 🟢 🚫 CLI: interactive prompts — Conflicts with non-interactive agent and script execution.
- 🟢 🚫 CLI: telemetry / usage analytics — Conflicts with the single-dependency policy.
- 🟢 🚫 SKILL: symlink install option — Causes permission issues on Windows and broken-link edge cases.
- 🟢 🚫 SKILL: `postinstall` auto-install hook — Runs without user consent and breaks CI environments.

- [x] 🔴 📦 CLI: `section get` (GET `get_section/{section_id}`) — PR #TBD
  - **Impl:** Added read handler `src/cli/handlers/section.ts::handleSectionGet`, which parses `<section_id>` with `parseId()` and calls `client.getSection(id)`. Registered the action in `dispatch.ts` (`HANDLERS`), `metadata.ts` (`ACTIONS` with `apiEndpoint: 'GET get_section/{section_id}'`), and `index.ts` (`HELP`). Added subprocess tests in `tests/cli.test.ts` and unit tests in `tests/cli-read-handlers.test.ts`.
  - **Rat:** Exposes the P0 `get_section` endpoint in the CLI.
- [x] 🔴 📦 CLI: `section list` (GET `get_sections/{project_id}`) — PR #TBD
  - **Impl:** Added read handler `src/cli/handlers/section.ts::handleSectionList`, which parses `<project_id>` as a positional path parameter and passes `--suite-id`, `--limit`, and `--offset` to `client.getSections(projectId, options)`. Registered the action in `dispatch.ts` and `metadata.ts` with `apiEndpoint: 'GET get_sections/{project_id}'`. Added subprocess tests in `tests/cli.test.ts` and unit tests in `tests/cli-read-handlers.test.ts`.
  - **Rat:** Exposes the P0 `get_sections` endpoint in the CLI so agents can list sections before calling `case add`.
  - **Drive-by:** Updated `parseId()` (`src/cli/ids.ts`) from `Number.isInteger(Number(raw))` to `/^[1-9]\d*$/` so that `'1e2'`, `'0x1'`, `'01'`, `' 5 '`, and `'+1'` are rejected. Added boundary test cases in `tests/cli-helpers.test.ts`.
- [x] 🟢 🐛 SEC #27: `parseId` accepts hex / binary / scientific forms — PR #85 review
  - **Impl:** Fixed by tightening `parseId` with `POSITIVE_INT_RE = /^[1-9]\d*$/` in the `section get/list` PR. This regex rejects `'0x1'`, `'0b1'`, `'1e2'`, `'01'`, `' 5 '`, `'+1'`, `'1.5'`, and `'-1'`. Added unit tests in `tests/cli-helpers.test.ts` and subprocess tests in `tests/cli.test.ts`.
  - **Rat:** `Number()` silently coerced hexadecimal, binary, scientific-notation, leading-zero, signed, and whitespace-padded strings into integers. Rejecting non-decimal strings on the client fails fast with a clear error message.
- [x] 🟢 🐛 QA: stricter decimal-only parsing in `parseId` / `optInt` — PR #85 review
  - **Impl:** Updated `optInt` (`src/cli/ids.ts`) to use `NON_NEG_INT_RE = /^\d+$/` and `Number.isSafeInteger`. `optInt` accepts `'0'`, `'1'`, and `'100'`, and returns `undefined` for `'1e2'`, `'0x1'`, `'01'`, `' 5 '`, `'+1'`, `'1.5'`, `'-1'`, and values `>= 2^53`. Added boundary test cases in `tests/cli-helpers.test.ts`.
  - **Rat:** Aligns `optInt` with the strict decimal-only parsing in `parseId` so that `--limit` and `--offset` do not silently coerce hexadecimal or scientific-notation strings.
- [x] 🟡 📦 CLI: `report list` (GET `get_reports/{project_id}`) — PR #89
  - **Impl:** Added read handler `src/cli/handlers/report.ts::handleReportList`, which parses `<project_id>` with `parseId()` and calls `client.getReports(projectId)`. Registered the action in `dispatch.ts`, `metadata.ts` (`apiEndpoint: 'GET get_reports/{project_id}'`), and `index.ts` (`HELP`). Added subprocess tests in `tests/cli.test.ts` and unit tests in `tests/cli-read-handlers.test.ts`.
  - **Rat:** Exposes the P1 `get_reports` endpoint in the CLI so agents can list report templates before calling `report run`.
- [x] 🟡 📦 CLI: `report run` (GET `run_report/{report_template_id}`) — PR #89
  - **Impl:** Added read handler `handleReportRun`, which parses `<report_template_id>` with `parseId()` and calls `client.runReport(reportTemplateId)`. Registered the action in `dispatch.ts`, `metadata.ts`, and `index.ts`, with unit and subprocess test coverage.
  - **Rat:** Completes the P1 reports CLI surface alongside `report list`.
- [x] 🟡 📦 CLI: `variable list/add/update/delete` (P1) — Shipped
  - **Impl:** Added four actions in `src/cli/handlers/variable.ts` (read) and `src/cli/handlers/variable-write.ts` (write and destructive delete), calling `getVariables`, `addVariable`, `updateVariable`, and `deleteVariable`. Added `AddVariablePayloadSchema` (`name: string`) and `UpdateVariablePayloadSchema` (`name?: string`) with `.passthrough()` in `src/schemas.ts`, and migrated `Variable`, `AddVariablePayload`, and `UpdateVariablePayload` from `src/types.ts` to `src/schemas.ts`. Registered the four actions in `dispatch.ts`, `metadata.ts`, `cli/index.ts`, and `scripts/skill-renderer.mjs`.
  - **Rat:** Exposes the P1 data-driven testing variable endpoints in the CLI. `variable delete` requires `--yes`, allows `--dry-run` preview without calling the API, and rejects `--soft` because TestRail `delete_variable` does not support soft preview. Added unit tests in `tests/cli-write-handlers.test.ts` and `tests/cli-read-handlers.test.ts`, and subprocess tests in `tests/cli.test.ts`.
- [x] 🟢 📦 CLI: `dataset get/list/add/update/delete` (P2) — Shipped
  - **Impl:** Added five actions in `src/cli/handlers/dataset.ts` (`handleDatasetGet`, `handleDatasetList`) and `src/cli/handlers/dataset-write.ts` (`handleDatasetAdd`, `handleDatasetUpdate`, `handleDatasetDelete`), calling `DatasetModule` methods. The TestRail 10.7 audit added the optional `variables: Record<string, string>` field to both add and update payload schemas.
  - **Rat:** Exposes the P2 dataset endpoints in the CLI so agents can manage variable-name-to-value mappings for data-driven testing. `dataset delete` requires `--yes`, supports `--dry-run`, and rejects `--soft`.
- [x] 🟢 📦 SKILL recipe: Data-driven runs via Variables + Datasets (P2) — Shipped
  - **Impl:** Added Recipe #28 in `skill/SKILL.md` for variable creation, dataset values, placeholders, inspection, updates, and deletion. The CLI examples pass the `variables` string map.
  - **Rat:** Documents the end-to-end variable and dataset workflow for agents.

- [x] 🟢 📦 CLI: binary stdin upload — PR3a (feat/cli-binary-stdio)
  - **Impl:** Added the `--file -` sentinel in `src/cli/file-input.ts` to read binary upload payloads from `process.stdin`. `resolveFile` now returns `Promise<FileResolution>` and reads stdin under two limits. Before buffering each chunk, it checks `MAX_STDIN_UPLOAD_BYTES` (100 MiB) from `src/constants.ts`. `STDIN_READ_TIMEOUT_MS` imposes a 30 s deadline through `stream.destroy(error)`. `readStdinBinary()` normalizes `Buffer`, `string`, and `Uint8Array` chunks and defaults the filename to `stdin` unless `--filename` is provided. Wired into `handleAttachmentAddToCase`, `add-to-result`, `add-to-run`, `add-to-plan`, `add-to-plan-entry`, and `handleBddAdd`. `src/cli/index.ts` rejects `--file -` on non-upload actions, when combined with `--data`, `--data-file`, or `--api-key-stdin`, or when `process.stdin.isTTY` is `true`. In `--dry-run` mode, the CLI does not read `stdin` and reports `size: 0` and `source: 'stdin'`. Added unit and subprocess tests in `tests/cli-file-input.test.ts`, `tests/cli-attachment-handlers.test.ts`, and `tests/cli.test.ts`.
  - **Rat:** Allows binary uploads from Unix pipes without temporary files. The 30 s wall-clock timeout and 100 MiB byte cap also mitigate SEC #24 for the binary upload path.
- [x] 🟢 📦 CLI: binary stdout download — PR3a (feat/cli-binary-stdio)
  - **Impl:** Added the `--out -` sentinel (`STDOUT_SENTINEL`) in `src/cli/file-output.ts` to write downloaded bytes to `process.stdout.write(bytes)`. `resolveOut` returns `target: 'stdout' | 'file'` and skips filesystem checks when `target === 'stdout'`. `handleAttachmentGet` and `handleBddGet` write the JSON acknowledgement to `stderr` via `HandlerContext.errRaw`. `src/cli/index.ts` rejects `--format table` when `--out -` is set and logs a warning to `stderr` if `process.stdout.isTTY` is `true`. Added unit and subprocess tests in `tests/cli-file-output.test.ts`, `tests/cli-attachment-handlers.test.ts`, and `tests/cli.test.ts`.
  - **Rat:** Allows agents to pipe downloaded attachments and BDD files directly to downstream commands (`testrail attachment get 17 --out - | xxd`) while keeping `stdout` free of JSON metadata.
- [x] 🟡 ♻️ CLI: streaming upload for large files — Shipped
  - **Impl:** Updated `requestMultipart` (`src/client-core.ts`) to accept a `{ path: string; type?: string }` descriptor in addition to `Blob | Uint8Array | File`. The client resolves the descriptor with `fs.openAsBlob`, which streams file bytes on demand into `FormData`. Updated `src/cli/handlers/attachment-write.ts`, `src/cli/handlers/bdd.ts`, and `src/cli/file-input.ts::resolveFile` to pass the descriptor instead of reading the entire file into memory with `readFileSync`. Added 12 regression tests in `tests/streaming-upload.test.ts`.
  - **Rat:** Pre-reading large attachments with `readFileSync` caused out-of-memory crashes on files over 200 MB. Streaming via `fs.openAsBlob` keeps heap growth near zero while preserving all upload security invariants (no retry on 5xx/429/network errors, `AbortSignal` support, DNS pinning, and `assertNotRedirect`).

## CLI/Skill BACKLOG initiative — 2026-05-20 wave summary

This section archives the items completed during the CLI/Skill BACKLOG initiative (PRs #110–#125 and follow-up PR, May 20, 2026). The initiative shipped 3 new CLI commands, verified streaming uploads in `main`, added 69 curated SKILL recipes, and completed 3 infrastructure cleanups. Three deferred items (localization 🔴, multi-version skill 🟡, and marketplace publish 🟡) remain in the active backlog.

**Follow-up scope note:** Initial Wave 2 scoping covered 64 of the 69 SKILL recipe items in `BACKLOG.md`. A post-merge audit of `docs/API-MAPPING.md` identified 5 `command-table` fallback rows (`project:add`, `project:update`, `project:delete`, `test:get`, and `test:list`). A follow-up PR added recipe #56 for the project lifecycle and recipe #57 for test fetch/list. The 57 numbered recipes then contained 117 `recipe-for` bindings, covering all 117 CLI commands.

- [x] **CLI: expose `POST add_result/{test_id}` in CLI** — Shipped in PR #113 (`feat: CLI result add-by-test`, SHA `9734a0d`). `testrail result add-by-test <test_id>` reuses `AddResultPayloadSchema` and `addResult(testId, payload)` in `src/modules/results.ts:84`. Added the CLI handler, dispatch entry, metadata, HELP text, tests, and Recipe #34 in `skill/SKILL.md`. Recipe #34 was accidentally dropped during PR #114's rebase and restored in PR #115.
- [x] **CLI: `user add` (`POST add_user`)** — Shipped in PR #114 (`feat: CLI user add + user update`, SHA `8b90c9d`). The TestRail 10.7 audit changed `UserAddPayloadSchema` to require only `name` and `email`. Activation, admin, SSO, MFA, notifications, role, groups, and assigned projects are optional. The schema retains `.passthrough()`.
- [x] **CLI: `user update` (`POST update_user/{user_id}`)** — Shipped in PR #114 (SHA `8b90c9d`). `testrail user update <user_id>` uses `UserUpdatePayloadSchema` (all fields optional) and validates `<user_id>` with `parseId(ctx.args.pathParams[0], 'user_id')`.
- [x] **CLI: streaming upload for large files** — Shipped earlier in PR #109 (`security: TOCTOU symlink hardening, fd-based uploads & devDependencies cleanup`, SHA `452d3e4`). `requestMultipart` already accepts `UploadFilePathInput` and uses `openAsBlob` from `node:fs` for memory-bounded streaming while preserving all pipeline invariants.
- [x] **SKILL recipes: 69 curated recipe items** — Shipped across six Wave 2 cluster PRs, two recovery PRs, and one follow-up PR. Final coverage is 117 `recipe-for:` bindings across 57 numbered recipes:
  - **C1 Cases & Case Meta (10 tags)** — PR #123 (reland of closed #121, SHA `91343b1`). Added Recipes #44 (case lifecycle: `get`, `history`, `copy-to-section`, `move-to-section`, `update-bulk`), #45 (`case-field list/add`), #46 (`case-type:list` and `case-status:list`), and #47 (`case delete` with `--dry-run`, `--soft`, and `--yes`).
  - **C2 Test Repository Structure (15 tags)** — PR #124 (reland of closed #119, SHA `636f999`). Added Recipes #48 (section CRUD: 6 tags), #49 (suite CRUD: 4 tags), #50 (`shared-step get/list`), #51 (`bdd get/add`), and #52 (`template list`).
  - **C3 Execution: Plans/Runs/Milestones (11 tags)** — PR #116 (`f1e687c`). Added Recipes #38 (plan entry extensions: 3 tags), #39 (run lifecycle: `list/update/delete`), and #40 (milestone lifecycle: 5 tags), renumbered in recovery PR #122. Their original numbers were #60, #61, and #62.
  - **C4 Results & Reporting (6 tags)** — PR #125 (reland of closed #120, SHA `d8e52db`). Added Recipes #53 (`result:add-bulk-by-test`), #54 (`result-field`, `status`, and `priority` lookups), and #55 (`report:list` and `report:run`).
  - **C5 Identity: Users/Groups/Roles (9 tags)** — PR #117 (`0946811`). Added Recipes #41 (user lookups: 3 tags), #42 (group CRUD: 5 tags), and #43 (`role list`), renumbered in recovery PR #122. Their original numbers were #77, #78, and #79.
  - **C6 Attachments/Variables/Configurations (13 tags)** — PR #118 (`d213225`). Added Recipes #35 (attachment lifecycle: 4 list + 3 add tags), #36 (variable CRUD: 4 tags), and #37 (`configuration` and `configuration-group` update).

### Initiative meta-events

- **PR #110** (`bda75e0`) — Removed Cursor IDE rules support. Removed 4 completed or excluded backlog entries: Cursor rules, Continue rules, generic `AGENTS.md`, and `testrail uninstall-skill`. Addressed follow-up review comments in PR #112 (`132c686`).
- **PR #111** (`80c3a06`) — Synchronized `BACKLOG.md` on `main` with 75+ tracked items between Wave 0 and Wave 1.
- **PR #115** (`1ad066f`) — Restored Recipe #34 (`result:add-by-test`), which was dropped during PR #114's rebase. Filed a new QA backlog item to make Gate C2 bidirectional.
- **PR #122** (`36c90f6`) — Restored 20 `recipe-for` bindings. PR #118 (C6) had overwritten them during a `-Xtheirs` rebase over PR #116 (C3) and PR #117 (C5). Remaining cluster PRs were serialized and merged as PRs #123, #124, and #125.

### Lessons learned

- **Do not run parallel rebase agents on the same file.** Concurrent `skill/SKILL.md` edits with `-Xtheirs` caused silent regressions in PR #114 and PR #118. Serialize merges to shared files or enforce bidirectional CI checks.
- **Make Gate C2 bidirectional:** Subagent reviews checked only their own PR diffs and missed content dropped during rebases. A bidirectional Gate C2 check catches missing recipes in CI.
- **CI checks vs. code review limits:** When the Copilot review quota was reached, CI checks caught code errors, while content drops required stronger automated drift gates.
- **Verify cluster totals against source counts:** Initial Wave 2 scoping totaled 64 tags instead of the 69 items in `BACKLOG.md`. Count and reconcile all target items before launching parallel tasks.

## BACKLOG sync — 2026-05-22 (Spec Parity + Security audit)

This sync archives items verified as shipped during the `BACKLOG.md` audit on 2026-05-22 against `src/schemas.ts`, `src/client-core.ts`, `src/cli/dispatch.ts`, `src/cli/file-input.ts`, and `tests/skill-recipes.test.ts`. Partially shipped items (`SEC #5`, `SEC #26`, `SEC #28`, `SPEC #2.1.9`, and `SPEC #2.1.14`) remain open in `BACKLOG.md` with updated descriptions of the remaining work.

### Spec Parity — schema audit

- [x] **SPEC #1.1: `ResultSchema.id` and `ResultSchema.test_id` required** — Shipped. Both fields are required (non-nullish) at `src/schemas.ts:323-325`, restoring parity with the TestRail specification.

- [x] **SPEC #1.2: defensive `.nullish()` on `is_completed`** — Shipped in commit `9a565bc` (PR #130). The field accepts `undefined` or `null` for compatibility with older TestRail server versions and partial responses.

- [x] **SPEC #1.3: defensive `.nullish()` on `is_master`** — Shipped in commit `9a565bc` (PR #130) with the same rationale as `SPEC #1.2`.

- [x] **SPEC #1.4: defensive `.nullish()` on `show_announcement`** — Shipped in commit `9a565bc` (PR #130) with the same rationale as `SPEC #1.2`.

- [x] **SPEC #A.2: spec+wire nullability audit closure** — Closed in commit `9a565bc` (PR #130). Updated fields across `src/schemas.ts` to `.nullish()` where TestRail servers can return `null` or `undefined` (including `is_completed`, `is_master`, `show_announcement`, optional timestamps, `refs`, and list wrappers). Follow-up narrowing is tracked under `SPEC #1.5`, `SPEC #2.1.15`, and `SPEC #2.1.16`.

### QA — recipe drift coverage

- [x] **QA: snapshot test for recipe code blocks** — Shipped. `tests/skill-recipes.test.ts:51-69` asserts the command shapes and flags for per-test, per-case-in-run, and whole-run recipe examples. Structural binding coverage is tracked separately under `QA: Gate C2 bidirectional`.

### Security — verified shipped

- [x] **SEC #7: TOCTOU symlink-follow on attachment upload** — Shipped. `src/cli/file-input.ts:98` opens filesystem paths with `O_NOFOLLOW` and calls `fstatSync` at line 100 to verify `isFile()` on the open descriptor. This eliminates the TOCTOU window on attachment uploads. `SEC #5` (symlink clobber on the skill installation target) remains tracked separately.

- [x] **SEC #22: Prototype-chain property access in dispatch** — Shipped. `src/cli/dispatch.ts:339` looks up handlers and resources without prototype traversal, and `Object.keys()` at lines 232 and 253 enumerates only own properties.

- [x] **SEC #24: stdin wall-clock deadline (binary upload path)** — Shipped for binary uploads. `src/cli/file-input.ts:73-81` and `resolveFromStdin` (line 146) enforce both `STDIN_READ_TIMEOUT_MS` (30 s) and `MAX_STDIN_UPLOAD_BYTES` (100 MiB). The synchronous text reader (`readBoundedStdin`) is tracked separately.

## BACKLOG sync — 2026-05-24 (Architecture + SPEC #A.1 full closure)

This sync archives items verified as shipped during the `BACKLOG.md` audit on 2026-05-24 against `src/cli/safe-write.ts`, `src/cli/handlers/attachment.ts`, `src/cli/handlers/bdd.ts`, `scripts/generate-mapping.js`, `docs/API-MAPPING.md`, and PRs #148 and #149.

Audit methodology: Four read-only subagents audited the codebase in parallel and required quoted source evidence for every finding. `SEC #28` remained open because `cleanupAllClients` (`client-core.ts:176-180`) still lacked a per-client `try/catch` block at the time of this audit.

### Architecture — verified shipped

- [x] **ARCH #8: `scripts/generate-mapping.js` Phase 1 parser fix** — Shipped. `docs/API-MAPPING.md` contains zero `—` cells (`grep -c "| — " docs/API-MAPPING.md` returns `0`). Every module method has a `@testrail` JSDoc tag and every `ActionSpec` has an `apiEndpoint` field, verified by Gate C in `generate-mapping.js`. All four gates (A, B, C, and C2) run in `pretest` and CI.

- [x] **ARCH #11: Unify file-output writes across download handlers** — Shipped. `src/cli/safe-write.ts` exports `safeWriteBinary(path, bytes, force)` and `safeWriteText(path, text, force)`. Both download handlers (`src/cli/handlers/attachment.ts` and `src/cli/handlers/bdd.ts`) use these helpers, centralizing TOCTOU and symlink protection.

### Spec Parity — full closure

- [x] **SPEC #A.1: Split request/response schemas (full wave)** — Closed across PR #148 and PR #149. Phase 0 (PR #148, merged 2026-05-23) added `docs/SCHEMA-CONVENTIONS.md` and JSDoc annotations on `ResultSchema`, `AddResultPayloadSchema`, and bulk-result schemas. Phases 1–3 (PR #149, merged 2026-05-25) audited all 9 domains, confirmed zero request/response conflation violations, and added `tests/schema-conventions.test.ts` to enforce the separation statically.

## BACKLOG sync — 2026-05-26 (QA / Verification cluster — PRs #152–#156)

This sync archives all five items from the `## 🧪 QA / Verification` section of `BACKLOG.md`, verified against PRs #152–#156 on 2026-05-26.

### QA — verified shipped

- [x] **QA: separate CI job for skill-generation drift** — Shipped in PR #152 (`ci: add gen-drift job for codemap/skill/mapping checks`). A dedicated `gen-drift` CI job runs `npm run codemap:check`, `npm run skill:check`, and `npm run mapping:check` on every pull request.

- [x] **QA: Make Gate C2 bidirectional.** The previous check missed recipe #34 lost in PR #114 and C3+C5 recipes lost in PR #118. Manual audits found both regressions. Shipped in PR #153 (`test: make Gate C2 bidirectional (ACTIONS → recipe-for)`). Gate C2 in `scripts/generate-mapping.js` now checks both directions. Every `recipe-for:` tag in `skill/SKILL.md` must reference a valid `ACTIONS` entry. Every `ActionSpec` in `ACTIONS` must have at least one `recipe-for:` tag.

- [x] **QA: Test upload cleanup after file descriptor errors.** Shipped in PR #154 (`test: add FD-error tests to streaming-upload (EBADF cleanup)`). Tests in `tests/streaming-upload.test.ts` simulate mid-stream `EBADF` errors. They verify stream destruction and cleanup without resource leaks.

- [x] **QA: CLI fuzz tests** — Shipped in PR #155 (`test: add fast-check fuzz tests for CLI arg parsing`). Added property-based fuzz tests using `fast-check` for `parseId`, `optInt`, `resolveAuth`, and `dispatch`. The tests cover arbitrary strings, numeric edge cases, Unicode surrogates, deeply nested JSON, and `__proto__` keys. They require structured errors without unhandled exceptions or validation bypasses.

- [x] **QA: coverage delta enforcement (98% floor)** — Shipped in PR #156 (`test: enforce per-metric coverage floor (99/99/99/98)`). Configured `vitest.config.ts` to enforce minimum coverage thresholds of 99% lines, 99% statements, 99% functions, and 98% branches in CI.

## BACKLOG sync — 2026-05-27 (Architecture cluster — PRs #161–#164)

This sync archives five Architecture items shipped on 2026-05-27 in PRs #161–#164.

### Architecture — verified shipped

- [x] **ARCH #9: Harmonize `--soft`/`--dry-run` check order across destructive handlers** — Shipped in PR #162 (`refactor(cli): extract runDestructive helper + Pattern B ordering (ARCH #9+#10)`). All destructive handlers now execute checks in Pattern B order: `parseId` -> `dryRun` (emits preview) -> `softUnsupported` check (via `opts.softUnsupported`) -> `--yes` gate -> `execute`. Placed `dryRun: true, destructive: true` after `...preview` in `ctx.out({ ...preview, dryRun: true, destructive: true })` so preview keys cannot overwrite those flags, and enabled `{ softUnsupported: true }` on `attachment delete`.

- [x] **ARCH #10: Extract `runDestructive` helper** — Shipped in PR #162. Extracted `src/cli/run-destructive.ts` as the single implementation for the `--dry-run` and `--yes` guard sequence across all destructive handlers, with 11 unit tests in `tests/run-destructive.test.ts`.

- [x] **ARCH #12: Type `HandlerArgs` path-param contracts (count check)** — Shipped in PR #163 (`fix(dispatch): validate path-param count before handler invocation (ARCH #12)`). `checkPathParamCount(spec, pathParams)` in `src/cli/dispatch.ts` runs before `--api-key-stdin` and `resolveAuth()` in `src/cli/index.ts`, rejecting invalid argument counts before reading `stdin` or checking credentials.

- [x] **ARCH #13: Specialized Error Subclasses** — Shipped in PR #161 (`feat(errors): introduce specialized error subclasses (ARCH #13)`). `src/errors.ts` exports `TestRailRateLimitError` (429), `TestRailAuthError` (401 and 403), `TestRailNotFoundError` (404), and `TestRailTimeoutError` (408 and `AbortError`), all extending `TestRailApiError`. Added 25 unit tests in `tests/error-subclasses.test.ts`.

- [x] **ARCH #14: Injectable Fetch Adapter** — Shipped in PR #164 (`feat(config): injectable fetch adapter (ARCH #14)`). Added `TestRailConfig.fetch?: typeof globalThis.fetch` and validated it in `validateConfig()`. All four fetch sites in `client-core.ts` call `(this.fetchOverride ?? globalThis.fetch)(url, init)` at request time. Added 10 unit tests in `tests/injectable-fetch.test.ts`.

## BACKLOG sync — 2026-05-27 (Security cluster — PRs #169–#171)

This sync archives two Security items shipped on 2026-05-27 in PRs #170 and #171.

### Security — verified shipped

- [x] **SEC #29: `validateEntryId` accepts any non-empty string** — Shipped in PR #170 (`fix(security): enforce UUID format for plan entry IDs (SEC #29)`). Added `ENTRY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` to `src/client-core.ts` and `src/cli/ids.ts`. `validateEntryId` rejects non-UUID strings (such as `../../etc/passwd`), and `parseEntryId` trims and validates the input. Added regression tests for `updatePlanEntry`, `deletePlanEntry`, and `addRunToPlanEntry`.

- [x] **SEC #30: Fortify `requestMultipart` against fd mutation and resource leaks** — Shipped in PR #171 (`fix(security): fortify requestMultipart against fd mutation and resource leaks (SEC #30)`). Replaced `file.fd = undefined` mutation with a local `let fdToClose: number | undefined` variable. On POSIX systems, the client closes the original file descriptor immediately after `openAsBlob` opens `/dev/fd/<N>` or `/proc/self/fd/<N>`. On non-POSIX systems, the client closes the file descriptor before calling `openAsBlob`. Added an immutability regression test verifying that `descriptor.fd` is not mutated.

## BACKLOG sync — 2026-05-27 (Security cluster — PRs #166–#169, #173)

This sync archives eleven Security items shipped in PRs #166–#169 and #173.

### Security — verified shipped

- [x] **SEC #5: TOCTOU symlink-clobber on install target** — Shipped in PR #169 (`fix(security): filesystem hardening (SEC #5, #17, #19)`). `cli/install-skill.ts` now writes to a temporary sibling file, verifies the symlink state, and renames the file atomically instead of calling `unlinkSync` before writing.

- [x] **SEC #14: Mutable cached references let callers poison future reads** — Shipped in PR #166 (`fix(security): harden client-core (SEC #14, #20, #26, #28)`). `getCachedData()` returns a deep clone and `setCachedData()` stores a deep clone, preventing callers from mutating cached entries.

- [x] **SEC #15: IPv6 SSRF allowlist gaps** — Shipped in PR #166 / PR #167 (`fix(security): add missing IPv6 SSRF ranges (SEC #15)`). Added `fec0::/10` (deprecated site-local), `2002::/16` (6to4), and `64:ff9b::/96` (NAT64 well-known prefix) to `validatePublicHost` in `src/client-core.ts`.

- [x] **SEC #17: `--data-file` follows symlinks with no size cap** — Shipped in PR #169 (`fix(security): filesystem hardening (SEC #5, #17, #19)`). `resolveFromPath` in `cli/file-input.ts` opens `--data-file` paths with `O_NOFOLLOW`, validates `isFile()` with `fstatSync`, and enforces the `MAX_DATA_FILE_BYTES` (10 MiB) limit.

- [x] **SEC #19: `mkdirSync` omits explicit mode under permissive umask** — Shipped in PR #169 (`fix(security): filesystem hardening (SEC #5, #17, #19)`). All `mkdirSync` calls in `cli/install-skill.ts` pass `{ mode: 0o700 }` so directory permissions do not depend on the caller's `umask`.

- [x] **SEC #20: `baseUrl` accepts embedded userinfo** — Shipped in PR #166 (`fix(security): harden client-core (SEC #14, #20, #26, #28)`). `validateConfig()` throws `TestRailValidationError` when `new URL(baseUrl).username` or `.password` is non-empty.

- [x] **SEC #23: Identical GETs stampede into parallel upstream calls** — Shipped in PR #168 (`fix(security): coalesce concurrent identical GET requests (SEC #23)`). `request<T>()` coalesces concurrent in-flight GET requests by endpoint cache key so waiting callers share the pending promise.

- [x] **SEC #26: `allowInsecure: true` opts out of HTTPS enforcement silently** — Shipped in PR #166 (`fix(security): harden client-core (SEC #14, #20, #26, #28)`). The constructor logs `console.warn('[testrail-api-client] WARNING: allowInsecure is enabled. HTTP transmits credentials in cleartext. Use HTTPS in production.')` when `allowInsecure: true` is used with an `http:` URL.

- [x] **SEC #28: `destroy()` stale `activeClients` entries** — Shipped in PR #166 (`fix(security): harden client-core (SEC #14, #20, #26, #28)`). `destroy()` wraps `stopCacheCleanup` and `clearCache` in a `try` block with `finally { this.auth = ''; activeClients.delete(this); }`, and `cleanupAllClients()` wraps each `client.destroy()` call in a `try/catch` block.

- [x] **SEC #32: Safe-by-default root `.npmrc` configuration** — Shipped in PR #173 (`chore(security): supply-chain hardening — .npmrc + lockfile-lint (SEC #32, #33)`). The root `.npmrc` sets `ignore-scripts=true` and `registry=https://registry.npmjs.org/`.

- [x] **SEC #33: Integrate `lockfile-lint` verification** — Shipped in PR #173 (`chore(security): supply-chain hardening — .npmrc + lockfile-lint (SEC #32, #33)`). Added `lockfile-lint` as a devDependency with `.lockfile-lintrc` to verify that all `package-lock.json` entries use HTTPS URLs from `https://registry.npmjs.org/`. Wired `npm run lockfile-lint` into `pretest` and CI.

## BACKLOG sync — 2026-05-27 (continue.dev removal)

- [x] **USER: continue.dev option should be fully removed from repo** — Shipped in `chore: remove continue.dev integration`. Deleted `.continue/rules/testrail.md`, the `.continue/` directory, `scripts/generate-continue-rules.js`, and `scripts/rules-content.d.mts`. Removed `renderContinueRules` from `scripts/rules-content.mjs` and its test block from `tests/generate-rules.test.ts`. Removed `continue-rules` and `continue-rules:check` from `package.json` and `pretest`. Removed the rule path from `.prettierignore` and the Continue section from `README.md`. Regenerated `AGENTS.md`.

## BACKLOG sync — 2026-05-27 (scripts/ TypeScript conversion)

- [x] **USER: all scripts from `./scripts/` folder should be written in TypeScript** — Shipped in `refactor(scripts): convert scripts/ from JavaScript to TypeScript`. Converted all 7 generator scripts in `scripts/` from JavaScript (`.js`/`.mjs`) to TypeScript (`.ts`) executed via `tsx`: `generate-agents-md.ts`, `generate-codemap.ts`, `generate-mapping.ts`, `generate-skill.ts`, `mapping-renderer.ts`, `rules-content.ts`, and `skill-renderer.ts`. Deleted the old JavaScript files, updated `package.json` scripts to use `tsx`, and added `scripts/**/*` to `tsconfig.json`.

## BACKLOG sync — 2026-05-29 (Architecture cluster — PRs #188–#190)

This sync archives three Architecture items shipped in PRs #188–#190.

### Architecture — verified shipped

- [x] **ARCH #1: Extract `HttpPipeline` seam** — Shipped in PR #188 (`refactor(arch): unify HTTP pipeline behind single request(spec)`). Consolidated `request`, `requestText`, `requestMultipart`, `requestBinary`, and `requestParsed` into a single `request<T>(spec: RequestSpec<T>)` method backed by `executePipeline()` in `src/client-core.ts`. `RequestSpec` (`src/http-pipeline-types.ts`) defines the HTTP method, endpoint, optional `json` or `multipart` body, optional response `schema`, `responseKind` (`'json' | 'text' | 'binary'`), and named `retry` policy (`src/retry-policy.ts`). Earlier phases shipped in PRs #181 and #182.

- [x] **ARCH #2: Write-handler factory** — Shipped in PR #190 (`refactor(cli): collapse write handlers into createWriteHandler factory`). `src/cli/write-handler-factory.ts` exports `createWriteHandler` and `createDestructiveHandler` to handle path parameter parsing, body validation, `--dry-run` previews, client invocation, and output formatting. Removed `run-destructive.ts` after moving its logic into `createDestructiveHandler`. Specialized handlers (`case delete-bulk`, attachment uploads, and `group add`) remain custom functions.

- [x] **ARCH #3: Promote `ACTIONS` to single source of truth** — Shipped in PR #189 (`refactor(cli): derive HANDLERS and HELP from ACTIONS`). Each `ActionSpec` now includes its `handler`. `dispatch.ts` derives `HANDLERS` and `RESOURCES` from `ACTIONS`, and `src/cli/help.ts` generates the `--help` output from `ACTIONS`. Related PR #184 split `schemas.ts` and `cli/metadata.ts` into domain files under `src/schemas/*.ts` and `src/cli/metadata/*.ts`. PR #183 removed unused error subclasses. PR #191 removed lint rule suppressions in `src/`.

## BACKLOG sync — 2026-05-30 (stale-item cleanup — verified-shipped sweep)

This sync archives four items from `BACKLOG.md` that were already merged into `main`.

### From User — verified shipped

- [x] **USER: merge `tsconfig.eslint.json` into `tsconfig.json` and remove `tsconfig.eslint.json`. all dev scripts should use `tsconfig.json`** — Shipped in PR #178 (`chore: merge tsconfig.eslint.json into tsconfig.json`, merged 2026-05-27, commit `d72f48b`). Deleted `tsconfig.eslint.json`. All development scripts (`typecheck`, `lint`, `test`, and the `tsx` generators) now use `tsconfig.json`, while `npm run build` uses `tsconfig.prod.json`.

### Security — verified shipped

- [x] **SEC #31: Custom DNS Server / Host Mappings in Config** — Shipped in PR #172 (`feat(security): injectable dnsLookup for SSRF validation in restricted DNS environments`, merged 2026-05-27). `TestRailConfig` accepts a custom `dnsLookup` function so callers in restricted DNS environments can use custom DNS resolution while still enforcing SSRF public-IP validation.

- [x] **SEC #34: Automated Trusted Publishing (OIDC) & Provenance Attestations** — Shipped in PR #174 (`ci(security): OIDC trusted publishing + provenance attestations`, merged 2026-05-27). `.github/workflows/publish.yml` uses GitHub OIDC (`id-token: write`) and `npm publish --provenance` instead of a static `NPM_TOKEN` secret.

### Architecture — verified shipped

- [x] **ARCH #7: Eliminate hand-written 1517-line facade (`client.ts`)** — Shipped in PR #193 (`refactor(client)!: collapse flat facade; namespaced modules are the only access path`, merged 2026-05-29, commit `21fc48f`). Removed all 131 flat wrapper methods from `TestRailClient`. `src/client.ts` is now 76 lines and exposes 18 `public readonly` domain modules (such as `client.projects.getProject(id)` and `client.cases.addCase(...)`).

## BACKLOG sync — 2026-05-30 (ARCH #6 full closure — PRs #197, #198)

ARCH #6 shipped in two phases on 2026-05-30: Phase 1 was a backward-compatible refactor in v5.1.0, and Phase 2 removed the deprecated delegates in v6.0.0.

### Architecture — verified shipped

- [x] **ARCH #6: Move pure helpers out of `TestRailClientCore`.** The helpers are `validateId`, `validateEntryId`, `validatePaginationParams`, and `buildEndpoint`. Phase 1 shipped in PR #197 (`refactor: extract validation/URL helpers to leaf modules (ARCH #6 phase 1)`). It merged on 2026-05-30 as commit `6c80b9e` for v5.1.0. Phase 2 shipped in PR #198 (`refactor!: remove validation/URL delegate methods (ARCH #6 phase 2)`) for v6.0.0.
  Phase 1 created `src/validation.ts` with `validateId`, `validateEntryId`, `validatePaginationParams`, and `ENTRY_ID_RE`. It created `src/url.ts` with `buildEndpoint`. All 158 internal call sites across 18 `src/modules/*.ts` files now import those functions directly. `src/cli/ids.ts` also imports `ENTRY_ID_RE` from `src/validation.ts`. Phase 2 removed the four deprecated delegate methods from `TestRailClientCore` and deleted `tests/client-delegates.test.ts`.

- [x] **ARCH #8: Derive the retry policy from the request's shape** —
  Removed `RequestSpec.retry` and `RequestSpec.bypassCache`. `deriveRetryPolicy()` in `src/retry-policy.ts` now selects the retry policy from `body.kind`, `responseKind`, and `intent` (`RequestIntent`: `'side-effecting-read' | 'fresh-read'`). Multipart uploads are checked before `intent` so they never retry, preventing duplicate attachment uploads on 429 responses. Removed six manual `retry: 'none'` declarations (`attachments.ts` and `bdd.ts`), one `retry: 'binaryGet'` declaration, and the duplicate `retry: 'rateLimitOnly'` and `bypassCache: true` declarations in `reports.ts`. Created `CONTEXT.md` to document *request intent*, *side-effecting read*, and *fresh read*.

- [x] **ARCH #9: One module owns the upload source.** Renamed `src/upload-lifetime.ts` to `src/upload-source.ts`. Moved `isFilePathInput`, platform path mapping, `openAsBlob`, `FormData` construction, and descriptor cleanup out of `client-core.ts`. `releaseDescriptor()` is idempotent and clears the descriptor reference before closing so it cannot close a reused file descriptor number. `build()` is single-use and throws on a second call, preventing TOCTOU fallback to `file.path`. Added 7 unit tests in `tests/upload-source.test.ts`.

- [x] **ARCH #10: Give the request budget a module.** Created `src/request-budget.ts` to manage deadlines, phase timeout limits, promise racing, retry delays, and 408 errors across retries. `PipelineSpec` now carries a single `budget` object instead of `deadlineAt`, and `remainingTimeMs` was removed from `RequestSpec`, `PaginationRequest`, and the paginated-list transport. Added idempotent `BodyShape.release()` and wrapped `attemptPipeline` in `executePipeline`. Open upload descriptors now close after preamble failures: destroyed clients, DNS/SSRF rejection, or expired budgets. Added 16 unit tests in `tests/request-budget.test.ts`.

- [x] **ARCH #11: Give `main()` an interface.** Exported `runCli(runtime)`, which accepts `CliRuntime`. Earlier stdin defects (#221 and #230) and client-constructor defects (#281 and #283) occurred in untested entrypoint code. The object supplies `argv`, `env`, output writers, a stdin reader with `isTTY`, and a `createClient` factory. `src/cli.ts` builds the production runtime, sets `process.exitCode`, and passes `registerProcessHandlers: true` in `createClient` so tests calling `runCli` never register global `exit`, `SIGINT`, or `SIGTERM` listeners. Consolidated error returns into `fail(message, exitCode?)` using `EXIT_SUCCESS`, `EXIT_FAILURE`, and `EXIT_ARGV_INVALID`. Simplified `tests/cli.test.ts` to call `runCli` directly without module resets or polling, reducing full test suite execution from ~25 s to ~8 s.

- [x] **ARCH #12: Let diagnostics own its own lifecycle** —
  Encapsulated the six-step CLI diagnostic lifecycle inside `withDiagnostics(request, deps, work)` in `src/cli/diagnostics.ts`. Removed the mutable `diagnostic`, `succeeded`, and `handlerStarted` flags from `runCli`, and added `markDispatched()` to record `operationOutcome`. Consolidated the Windows platform check into `DIAGNOSTIC_UNSUPPORTED_PLATFORM` and `diagnosticSupportError(platform)`. Added `platform` and `lifetime` to `CliRuntime` so tests can use fakes without registering process `exit` listeners. Added 10 unit tests in `tests/cli-diagnostic-scope.test.ts`.

- [x] **ARCH #13: Output ownership.** `createOutput` now requires explicit `stdout` and `stderr` writers. Added `outRaw`, a stdout writer that honors quiet mode. Added `outPayload(payload, ack)` to write payloads to stdout, JSON acknowledgements to stderr, and applicable TTY warnings. Routed `emitStdoutAck`, `install-skill`, `uninstall-skill`, the schema-mismatch reporter, and `run watch` through `createOutput`. Fixed `run watch` to read `--quiet` from the `argv` passed to `runCli` rather than `process.argv`, and derived the `--out -` TTY warning from the payload type. Added an ESLint `no-restricted-properties` rule forbidding `process.stdout`, `process.stderr`, and `process.argv` in `src/` outside `src/cli.ts`, backed by `tests/cli-output-ownership.test.ts`.

- [x] **ARCH #4: Reduced endpoint registry scope.** A nine-agent design review found that one TypeScript registry could not replace `docs/testrail-endpoints.json` and Gate D. That inventory tracks external TestRail documentation independently of the SDK. The original charter remains recorded as unreachable. Shipped two targeted simplifications instead:
  1. Replaced 29 `.slice(a, b)` calls with separate read and write exports per resource. `defineActions()` preserves literal `apiEndpoint` types. The `.d.ts` bundle grew by 19 KB instead of the proposed 203 KB.
  2. Removed `ActionSpec.pagination`, `PaginationSpec`, and drift Gate E by moving pagination metadata into `src/cli/metadata/paginated-endpoints.ts` keyed by `apiEndpoint`, verified by `_PaginatedEndpointsAreSurfaced`, `_ActionEndpointsAreLiterals`, and a runtime test.
  Also hardened `scripts/action-metadata-parser.ts` to unwrap `satisfies` expressions and throw on unreadable initializers, non-literal `resource`/`action`/`apiEndpoint` fields, or array spread elements.
