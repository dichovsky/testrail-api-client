# TASKS

Atomic, prioritized backlog of all known gaps, bugs, and improvements.

**Priority scale:**

- **P0** — Critical: correctness bugs affecting existing behaviour
- **P1** — High: missing write operations for already-supported entities
- **P2** — Medium: missing API surface (filters, pagination, lookup endpoints)
- **P3** — Low: entirely new feature domains not yet started
- **P4** — Maintenance: types, exports, test quality, tooling

---

## P2 — Medium (Filters, Lookup Endpoints, API Completeness)

### TASK-012 · Add filter parameters to `getCases()` [In Progress]

**Category:** Feature / Cases  
**Description:**  
`GET /get_cases/{project_id}` supports additional filters: `type_id`, `priority_id`, `template_id`, `milestone_id`, `created_after`, `created_before`, `updated_after`, `updated_before`, `limit`, `offset`. None are currently exposed.

**Acceptance Criteria:**

- [ ] `getCases(projectId, options?: GetCasesOptions)` signature updated
- [ ] `GetCasesOptions` interface with all supported filter fields added to `types.ts` and exported
- [ ] Filters appended to query string only when provided
- [ ] Unit tests for various filter combinations

---

## P3 — Low (New Feature Domains)

---

## P4 — Maintenance

---
