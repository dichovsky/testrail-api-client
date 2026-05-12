# BACKLOG

Deferred work items captured during the v2.1.0 skill-publishing design
(`SKILL-PLAN.md`). Each item is intentionally **not** in v2.1.0; this file is
the registry that prevents silent scope creep and gives future PRs a starting
point.

Conventions:

- `[ ]` open · `[x]` shipped · `[~]` partially shipped · `[!]` decided **won't
  do** (kept for the explicit "no")
- **Effort**: S (≤½ day) · M (1–2 days) · L (1+ week)
- **Trigger**: what would justify pulling this into a release

---

## CLI write surface — structural setup

These map to existing `TestRailClient` methods but aren't exposed in the v2.1
CLI. v2.1 ships only the 6 actions that cover _author cases_ and _publish
results_; structural setup is rare per-project work that humans typically do
once via the TestRail UI.

- [ ] **`project add` / `project update`** — `addProject` / `updateProject`. **Effort:** S. **Trigger:** multi-tenant agent provisioning workflows.
- [ ] **`suite add` / `suite update`** — `addSuite` / `updateSuite`. **Effort:** S. **Trigger:** agents bootstrapping greenfield TestRail projects.
- [ ] **`section add` / `section update`** — `addSection` / `updateSection`. **Effort:** S. **Trigger:** agents authoring large batches of cases that need new sections.
- [ ] **`milestone add` / `milestone update`** — `addMilestone` / `updateMilestone`. **Effort:** S. **Trigger:** release-coordination automations.
- [ ] **`user add` / `user update`** — `addUser` / `updateUser`. **Effort:** S. **Trigger:** identity-provisioning workflows. Note: TestRail 7.3+ only.
- [ ] **`plan add` / `plan update` / `plan add-entry`** — `addPlan` / `updatePlan` / `addPlanEntry`. **Effort:** M. **Trigger:** test-plan-driven CI workflows; richer payload than runs.

## CLI write surface — destructive operations

Deliberately omitted from v2.1 to keep agents away from irrecoverable actions
without explicit human review. Programmatic API still exposes them.

- [ ] **`case delete`** — `deleteCase`. **Effort:** S. **Trigger:** explicit user demand; consider gating behind `--yes` or a confirmation env var.
- [ ] **`run delete`** — `deleteRun`. **Effort:** S. **Trigger:** same.
- [ ] **`suite delete` / `section delete` / `milestone delete` / `project delete`** — corresponding client methods. **Effort:** S each. **Trigger:** same.
- [ ] **`result delete`** — N/A (TestRail API doesn't support deleting individual results). Will not implement.

## CLI write surface — bulk operations

v2.1 ships `result add-bulk` because results are inherently many-per-run.
Other bulk endpoints are deferred.

- [ ] **`case add-bulk`** — multi-case authoring in one call. **Effort:** M (payload validation, partial-failure semantics). **Trigger:** agents generating cases from large spec files.
- [ ] **`run add-bulk`** — N/A (TestRail API doesn't expose bulk run creation). Won't implement.

## CLI feature extensions

- [ ] **Output format: `yaml`** — `--format yaml`. **Effort:** S (requires a dep or hand-rolled emitter). **Trigger:** Kubernetes-adjacent workflows.
- [ ] **Output format: `csv`** — `--format csv`. **Effort:** S. **Trigger:** spreadsheet-import use cases.
- [ ] **Attachment upload** — `addAttachmentToCase`, `addAttachmentToResult`, etc. CLI subcommand `attachment upload <target> <file>`. **Effort:** M (multipart body handling; CLI doesn't currently send anything but JSON). **Trigger:** screenshot/log evidence in CI.
- [ ] **Attachment download** — `getAttachment`. **Effort:** S. **Trigger:** same.
- [ ] **Watch mode** — `testrail run watch <run_id>` polling until completion. **Effort:** M. **Trigger:** CI orchestrators waiting on async test execution.
- [!] **Interactive prompts** — `--interactive` mode for human input. **Won't do.** Conflicts with agent/scripting target audience; humans should use the TestRail web UI.
- [!] **Telemetry / usage analytics** — **Won't do.** Conflicts with zero-dependency ethos; user-hostile.

## Skill scope expansion

- [ ] **Programmatic TypeScript API recipes in the skill** — current skill is CLI-only by design (Q2). **Effort:** M (substantial content; would double skill length). **Trigger:** real demand from agents that import the package rather than shell out.
- [ ] **Cursor rules file (`.cursor/rules/testrail.mdc`)** — same content as `SKILL.md`, Cursor format. **Effort:** S (port + new generator output). **Trigger:** documented user request from Cursor users.
- [ ] **Continue rules** — same. **Effort:** S. **Trigger:** same.
- [ ] **Generic `AGENTS.md`** — a flat markdown variant for arbitrary agents. **Effort:** S (mostly the same content). **Trigger:** user request.
- [ ] **Localization (non-English)** — translate skill body. **Effort:** L (translation + per-language generator). **Trigger:** documented non-English user base.

## `install-skill` enhancements

- [!] **Symlink install option** — **Won't do** (Q11). Windows permission issues; broken-symlink edge cases; install is fast enough to rerun on update.
- [!] **`postinstall` auto-install hook** — **Won't do** (Q11). Anti-pattern: runs without consent, breaks CI, hits users who don't use Claude Code.
- [ ] **`testrail uninstall-skill`** — remove installed skill file. **Effort:** S. **Trigger:** user feedback that manual `rm` is friction.
- [ ] **Multi-version skill management** — e.g., side-by-side skill installs for multiple installed package versions. **Effort:** M. **Trigger:** monorepos pinning different versions.
- [ ] **Claude Code plugin marketplace publish** — separate distribution channel. **Effort:** M (process + metadata). **Trigger:** if a Claude Code marketplace launches that makes this the canonical distribution mechanism.

## Drift detection — beyond generator diff

The v2.1 plan locks in hybrid generation with `<!-- GENERATED -->` sentinels +
`prepublishOnly` diff check. Stronger guarantees are deferred.

- [ ] **Snapshot test for recipe code blocks** — parse SKILL.md, extract fenced `bash` blocks, run each against the binary with `fetch` mocked, assert exit codes. **Effort:** M. **Trigger:** a regression where a recipe drifts despite the schema-level generator catching most things.
- [ ] **Generator runs in CI separately from `pretest`** — explicit GitHub Action that fails the PR with a clear "run `npm run skill`" message. **Effort:** S. **Trigger:** contributor confusion about the existing `pretest` failure message.

## Quality / verification

- [ ] **Coverage delta enforcement** — fail CI if coverage drops below 98% (currently a soft target). **Effort:** S (Vitest config). **Trigger:** a PR that lands with regressed coverage.
- [ ] **CLI fuzz tests** — random JSON bodies into write actions, assert Zod rejection. **Effort:** M. **Trigger:** real-world payload-shape bugs.

---

## Decision Log

Items below have explicit **won't do** status from v2.1 design. Listed here so
future contributors don't re-propose them without new information.

| Item                                            | Decided in      | Reason                                                                        |
| ----------------------------------------------- | --------------- | ----------------------------------------------------------------------------- |
| Postinstall hook                                | Q2              | User-hostile; ignorable via `--ignore-scripts`; conflicts with zero-dep ethos |
| Symlink install                                 | Q11             | Windows permission issues; broken-symlink edge cases                          |
| Interactive CLI prompts                         | Q13             | Conflicts with agent/scripting target audience                                |
| Telemetry                                       | Q13 calibration | Conflicts with zero-dep ethos                                                 |
| Value coercion in payload schemas               | Q8              | Honest fail-fast > silent fix; surfaces agent bugs                            |
| Programmatic API recipes in the CLI skill       | Q2              | Skill stays focused; `README` + `CODEMAP` cover programmatic use              |
| Cursor / Continue / generic agent formats in v1 | Q1              | One well-supported format > three half-baked ones                             |

When pulling an item out of "won't do", document the new information that
changed the calculus.
