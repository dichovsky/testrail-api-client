# BACKLOG

> **Agent Rules:** Write short descriptions. When you complete a task, remove it from this file. Then append it to `docs/archive/BACKLOG-ARCHIVE.md`.

Archive file: [`docs/archive/BACKLOG-ARCHIVE.md`](docs/archive/BACKLOG-ARCHIVE.md). The archive file stores detailed notes and completed items.

## 🔒 Security

## 📚 Spec Parity

- [ ] **TestRail 10.8-10.10 gaps** — Nine missing operations, the 500-item page size, cursor pagination, new list filters, and new response fields. Global `get_users` pagination is implemented in the current source. See [Known gaps](docs/TESTRAIL-10.7.0-COMPATIBILITY.md#known-gaps-against-testrail-108-1010-checked-2026-11-21). **Trigger:** a user on TestRail 10.8 or newer needs one of these features.

## 🏗️ Architecture

## 🤖 Skill

- [ ] **Localization (non-English)** — Translate the skill file. **Effort:** L (translation and per-language generator). **Trigger:** documented non-English users.
- [ ] **Multi-version skill management** — Support side-by-side skill installations for multiple package versions. **Effort:** M. **Trigger:** monorepos that pin multiple versions.
- [ ] **Claude Code plugin marketplace publish** — Publish to a separate distribution channel. **Effort:** M (process and metadata). **Trigger:** an official Claude Code marketplace is available.

## 🧪 QA

- [ ] **Run each recipe command through the CLI** — Extract the `testrail` commands from `skill/reference/recipes.md`. Run each command with `--dry-run` or a mocked `fetch`. Check the exit code. **Effort:** M. **Trigger:** a recipe command that the CLI rejects.
