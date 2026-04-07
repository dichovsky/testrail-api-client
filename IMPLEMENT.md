# Agent Protocol — Autonomous Task Execution

**Mode:** Parallel agents, race conditions assumed. Claim tasks atomically via TASKS.md before implementation.

---

## Main Loop (Repeat)

1. **Sync** → 2. **Discover** → 3. **Claim** → 4. **Branch** → 5. **Implement** → 6. **Validate** → 7. **PR** → STOP

---

## Step 1 — Sync (Retry 5x, backoff: 1s→2s→4s→8s→16s)

```bash
git checkout dev && git pull origin dev
```

Fail after retries → STOP.

---

## Step 2 — Discover

Open TASKS.md. Select FIRST task with unchecked items (`- [ ]`) that does NOT include "In Progress", "Blocked", or "Done". If none: EXIT.

---

## Step 3 — Claim (Atomic Critical Section)

Edit header from `### TASK-XXX · Title` to `### TASK-XXX · Title [In Progress by agent-XXXXXX]`.

```bash
git add TASKS.md
git commit -m "chore(tasks): claim TASK-XXX"
git push origin dev || retry loop (STEP 1)
git pull origin dev
```

Verify claim present; if not → abandon and restart.

**Agent ID:** Generate `agent-<6-char-random>` at session start.

---

## Step 4 — Branch

Create: `<type>/task-XXX-<slug>` where type ∈ {feat, fix, refactor, test, docs, chore}.
Example: `fix/task-002-section-id`. Checkout branch.

---

## Step 5 — Implement (Strict Scope)

- Implement only what task requires; no unrelated changes
- Follow existing patterns and API contracts
- Add/update tests as needed
- Tech stack: TypeScript + Vitest

**Example:** Removing field from type → DO NOT change function signatures unless required.

---

## Step 6 — Validate (Hard Gate)

Run:
```bash
npm run build    # TS compile
npm test         # Vitest
npm run lint     # ESLint if exists
```

Retry up to 3x with auto-fixes, backoff 1s→2s→4s. If still failing → Mark BLOCKED in TASKS.md: `[Blocked: <reason> by agent-XXXXXX]`, commit to dev, push, return to loop.

---

## Step 7 — Commit & Push

Use Conventional Commits: `fix(types): remove section_id from AddCasePayload`.

```bash
git push -u origin HEAD
```

---

## Step 8 — PR (STOP POINT)

Create via GitHub CLI (`gh pr create`).

**Title:** `TASK-XXX: <exact task title>`

**Description must include:**
- Summary of changes
- Why change was needed
- Acceptance criteria checklist
- Confirmation: tests pass, no type errors

**DO NOT merge.** Update TASKS.md to `[Done]`. STOP.

---

## Multi-Agent Coordination

TASKS.md acts as distributed lock: **Claim = Lock**, **Git push = Acquisition**. Race resolution via atomic git operations; loser restarts loop. Guarantees no duplicate work or state corruption.

---

## Failure Modes

| Case | Action |
|------|--------|
| Merge conflict | `git pull --rebase`, resolve, continue |
| Task unclear | Mark `[Blocked: needs clarification]`, commit, continue |
| CI failure post-PR | ONE fix commit; if still failing → leave PR as-is |

---

## Constraints

- One task per branch
- One PR per task
- No scope creep
- No force pushes or history rewriting
- Prefer small diffs

---

## Termination

Stop when no available tasks or repeated system failures.
