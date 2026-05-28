import { ACTIONS } from './metadata.js';
import type { ActionSpec } from './metadata/types.js';

/**
 * Renders the `--help` text from `ACTIONS` at module load.
 *
 * PR-C promoted `ACTIONS` to the registry: each `ActionSpec` carries the
 * full surface metadata used to derive one help line. Adding a new
 * `resource:action` to `src/cli/metadata/{resource}.ts` now updates HELP
 * automatically — no parallel edit to `src/cli/index.ts` required.
 *
 * Sections are grouped by predicate over `ActionSpec`:
 *   - Read actions:        isWrite=false, not destructive, not file I/O
 *   - Metadata actions:    a hand-listed set of instance-level reference reads
 *   - Write actions:       isWrite=true, not destructive, not file I/O
 *   - Configuration:       configuration + configuration-group resources
 *   - Attachment:          attachment resource (mixed read/write/destructive/file I/O)
 *   - BDD:                 bdd resource (text I/O for get, file input for add)
 *
 * The trailing blocks ("Binary stdio", "Meta", "Auth", "Options",
 * destructive notes) are not per-action and stay hand-written as static
 * constants here.
 */

// ── Resources whose actions are grouped into the "Metadata" section ──────────
//
// Instance-level reference-data getters (priorities, statuses, roles, …).
// Surfaced as a separate section so users browsing `--help` can find them
// in one spot rather than scrolling the larger Read block.
const METADATA_RESOURCES: ReadonlySet<string> = new Set([
    'case-field',
    'case-status',
    'case-type',
    'priority',
    'result-field',
    'role',
    'status',
    'template',
]);

// ── Resources whose actions live in their own dedicated sections ─────────────
//
// Excluded from the generic Read / Write / Metadata sections so they don't
// appear twice (configuration mixes write + destructive; attachment mixes
// every kind of I/O; bdd is text-I/O for get and file-input for add).
const CONFIGURATION_RESOURCES: ReadonlySet<string> = new Set(['configuration', 'configuration-group']);
const SPECIAL_RESOURCES: ReadonlySet<string> = new Set(['attachment', 'bdd']);

function isReadAction(spec: ActionSpec): boolean {
    return spec.isWrite === false && spec.destructive !== true && spec.fileInput !== true && spec.fileOutput !== true;
}

function isWriteAction(spec: ActionSpec): boolean {
    // Includes destructive non-file writes (e.g., `case delete`, `run close`)
    // — they share the body / dry-run / soft semantics of the rest of the
    // Write section. File I/O writes live under the Attachment / BDD blocks.
    return spec.isWrite === true && spec.fileInput !== true && spec.fileOutput !== true;
}

/**
 * Renders the positional path-params for a spec as `<name>` placeholders,
 * joined by spaces. Empty when the spec has no positional params.
 */
function pathParamsText(spec: ActionSpec): string {
    if (spec.pathParams.length === 0) return '';
    return spec.pathParams.map((p) => `<${p.name}>`).join(' ');
}

/**
 * Builds the trailing argv hint for a spec — body source, file I/O, gates.
 * Returns an empty string when there is nothing to hint at (most read actions).
 */
export function actionArgvHint(spec: ActionSpec): string {
    const parts: string[] = [];
    if (spec.bodySchema !== undefined) {
        // Every body-bearing ActionSpec ships an explicit `helpExample`; the
        // fallback covers a future action added without one.
        parts.push(spec.helpExample ?? "--data '{...}' | --data-file <path> | stdin");
    }
    if (spec.fileInput === true) {
        parts.push('--file <path|-> [--filename <name>]');
    }
    if (spec.fileOutput === true) {
        parts.push('--out <path|-> [--force]');
    }
    if (spec.destructive === true) {
        parts.push('--yes');
    }
    // Destructive no-body actions (e.g., `project delete`, `plan delete-entry`)
    // sometimes carry an informational note that the old hand-written HELP
    // included (version gates, "highest blast radius", UUID-id semantics).
    // Emit `helpExample` after `--yes` so these notes survive the migration.
    if (spec.destructive === true && spec.bodySchema === undefined && spec.helpExample !== undefined) {
        parts.push(spec.helpExample);
    }
    return parts.join(' ');
}

/**
 * Renders a single action as one indented help line.
 *
 *   "  resource    action <id> hint   summary"
 *
 * Indentation widths are tuned to match the existing layout: resource
 * column padded to 20 chars, action padded to 22 chars. The summary follows
 * the argv shape on the same line so users can see the full usage at a
 * glance without horizontal scrolling for the common cases.
 */
function renderActionLine(spec: ActionSpec): string {
    const path = pathParamsText(spec);
    const hint = actionArgvHint(spec);
    const usage = [spec.action, path, hint].filter((s) => s !== '').join(' ');
    // Two-column layout: resource (20) | usage … summary.
    const resourceCol = spec.resource.padEnd(20);
    return `  ${resourceCol}${usage}\n      ${spec.summary}`;
}

export function renderSection(title: string, predicate: (spec: ActionSpec) => boolean): string {
    const lines = ACTIONS.filter(predicate).map(renderActionLine);
    if (lines.length === 0) return '';
    return `${title}\n${lines.join('\n')}`;
}

/**
 * Read actions: everything where `isWrite === false`, excluding the
 * dedicated metadata / configuration / attachment / bdd resources.
 */
function renderReadSection(): string {
    return renderSection(
        'Read actions:',
        (spec) =>
            isReadAction(spec) &&
            !METADATA_RESOURCES.has(spec.resource) &&
            !CONFIGURATION_RESOURCES.has(spec.resource) &&
            !SPECIAL_RESOURCES.has(spec.resource),
    );
}

function renderMetadataSection(): string {
    // Read-only listing only — the rare write actions on these resources
    // (e.g., `case-field add`) belong with the rest of the writes.
    return renderSection('Metadata actions:', (spec) => METADATA_RESOURCES.has(spec.resource) && isReadAction(spec));
}

function renderWriteSection(): string {
    return renderSection(
        'Write actions (body via --data | --data-file | stdin):',
        (spec) =>
            isWriteAction(spec) && !CONFIGURATION_RESOURCES.has(spec.resource) && !SPECIAL_RESOURCES.has(spec.resource),
    );
}

function renderConfigurationSection(): string {
    return renderSection('Configuration actions (project → config_groups → configs):', (spec) =>
        CONFIGURATION_RESOURCES.has(spec.resource),
    );
}

function renderAttachmentSection(): string {
    return renderSection('Attachment actions (binary file I/O):', (spec) => spec.resource === 'attachment');
}

function renderBddSection(): string {
    return renderSection('BDD actions (Gherkin .feature text I/O):', (spec) => spec.resource === 'bdd');
}

// ── Static trailing blocks (not per-action) ──────────────────────────────────
//
// These describe global flags, env vars, and operational semantics that
// apply across many actions rather than belonging to any one. Kept as
// hand-written constants because there is no per-spec data to derive
// from — the wording is reference documentation, not auto-derived listings.

const BINARY_STDIO_BLOCK = `Binary stdio (Unix-convention '-' sentinel):
  --file -    Read binary upload payload from stdin (must be piped; not a TTY).
              Capped at 100 MiB with a 30s wall-clock deadline so a stalled
              producer cannot hold the pipe open. Cannot be combined with
              --data, --data-file, or --api-key-stdin (each owns stdin).
              Pass --filename to label the upload (default: 'stdin').
              Example: curl -s https://… | testrail attachment add-to-case 42 --file - --filename crash.png
  --out -     Stream the downloaded payload to stdout as raw bytes; the JSON
              ack is routed to stderr so stdout stays pure binary. Rejects
              --format table (binary is binary). Emits a TTY warning to
              stderr if stdout is a terminal — use 'xxd' or '> file' instead.
              Example: testrail attachment get 17 --out - | hexdump -C`;

const META_BLOCK = `Meta:
  install-skill [--global] [--force] [--print-path]
                                    Install the testrail-cli skill to
                                    ./.claude/skills/testrail-cli (default)
                                    or ~/.claude/skills/testrail-cli (--global)
  uninstall-skill [--global]        Remove a previously-installed testrail-cli
                                    skill. ONLY removes the skill file (and
                                    its empty parent dir); does NOT touch
                                    .continue/rules/testrail.md or AGENTS.md
                                    (separate lifecycle — remove manually).`;

const AUTH_BLOCK = `Auth (env var preferred — argv is visible to other processes):
  TESTRAIL_BASE_URL / --base-url <url>
  TESTRAIL_EMAIL    / --email <email>
  TESTRAIL_API_KEY  (recommended) | echo "$KEY" | testrail ... --api-key-stdin
                    NOTE: --api-key (argv) was removed in v3.0 — see CHANGELOG.
  TESTRAIL_ALLOW_DESTRUCTIVE=1
                    REQUIRED (in addition to --yes) to execute destructive
                    actions (see the destructive list under --yes below).
                    Accepts EXACTLY the string '1' — not 'true' / 'yes' /
                    'on'. Failure exits with code 2 (distinct from the
                    generic exit code 1) so CI can branch on "blocked by
                    env gate" vs "invalid argv / auth / 4xx". --dry-run
                    bypasses this gate (preview hits no API).`;

const OPTIONS_BLOCK = `Options:
  --api-key-stdin       Read API key from stdin (single line; mutually
                        exclusive with stdin-piped JSON body). Use the
                        TESTRAIL_API_KEY env var when possible.
  --data <json>         Inline JSON body for write actions
  --data-file <path>    Read JSON body from file
  --dry-run             Validate payload but don't call the API
  --format json|table|yaml|csv
                        Output format (default: json). yaml emits a YAML 1.2
                        document with 2-space indent and double-quoted strings
                        where ambiguity demands it; csv emits RFC 4180 with
                        CRLF line terminators, sorted union of top-level keys
                        as headers, and nested objects/arrays JSON-stringified
                        into the cell (no dot-path flattening).
  --quiet               Suppress output; use exit code 0/1
  --status-id <ids>     Comma-separated TestRail status IDs (test list / result list-for-test / result list-for-case; e.g. 1,5)
  --defects-filter <s>  Substring filter on the result 'defects' field (result list-for-test / list-for-case)
  --file <path>         Binary file to upload (attachment add-to-* actions)
  --filename <name>     Override the upload filename (default: basename of --file)
  --out <path>          Local path to write the downloaded attachment to (attachment get)
  --force               Overwrite an existing --out file, or an existing SKILL.md (install-skill)
  --yes                 Required to execute destructive actions (attachment delete, case delete, case delete-bulk, run close, run delete, section delete, suite delete, milestone delete, project delete, plan close, plan delete, plan delete-entry, plan delete-run-from-entry, variable delete, group delete, dataset delete, shared-step delete, configuration delete, configuration-group delete)
  --soft                Server-side preview for soft-capable deletes:
                          case delete, case delete-bulk, run delete,
                          section delete, suite delete.
                        TestRail returns counts without deleting; distinct
                        from --dry-run which makes NO API call.
                        Rejected (TestRail has no --soft support) on:
                          milestone delete, project delete,
                          plan close, plan delete, plan delete-entry,
                          plan delete-run-from-entry, variable delete,
                          group delete, dataset delete, shared-step delete,
                          configuration delete, configuration-group delete.
  --interval <seconds>  run watch poll interval (default: 30; min: 5; max: 600)
  --once                run watch: poll once and exit instead of running until is_completed
  --global              install-skill: install to ~/.claude/skills/ (default: ./.claude/skills/)
  --print-path          install-skill: print bundled SKILL.md path and exit
  --help                Show this help
  --version             Print version`;

const SEMANTICS_BLOCK = `For body-bearing write actions, exactly one body source is required
(--data | --data-file | stdin). Stdin is auto-detected when input is piped
(process.stdin.isTTY === false). The following write actions take NO body
(any --data / --data-file / stdin is ignored): run close, attachment delete,
case delete, run delete, suite delete, section delete, milestone delete,
project delete, plan close, plan delete, plan delete-entry,
plan delete-run-from-entry, variable delete, group delete, dataset delete, shared-step delete,
configuration delete, configuration-group delete — they accept only positional id(s) (one for most
actions; plan delete-entry and attachment add-to-plan-entry take two:
<plan_id> <entry_id>) and the optional --soft flag on the soft-capable
deletes. Attachment upload actions take a binary file via --file <path>
and do not accept --data/--data-file/stdin.
Destructive actions (attachment delete, case delete, case delete-bulk, run close,
run delete, section delete, suite delete, milestone delete, project delete,
plan close, plan delete, plan delete-entry, plan delete-run-from-entry,
variable delete, group delete, dataset delete, shared-step delete,
configuration delete, configuration-group delete)
require BOTH --yes AND the TESTRAIL_ALLOW_DESTRUCTIVE=1 env var. Either gate
alone is insufficient — this two-gate model is intentional (env var is
process-wide audit-friendly; --yes is per-invocation explicit). Pass
--dry-run to preview without making the API call; --yes is optional in
dry-run mode (dry-run wins; the env var is NOT required for preview).
'run close' and 'plan close' are irreversible — TestRail offers no reopen
for either. For soft-capable deletes (case/run/section/suite + case delete-bulk),
pass --soft for a server-side preview that returns affected-entity counts
without deleting; this still hits the API and remains gated by --yes
AND TESTRAIL_ALLOW_DESTRUCTIVE=1.`;

const HEADER = 'testrail <resource> <action> [args] [options]';

/**
 * Builds the full `--help` text by composing each per-section emitter with
 * the static trailing blocks. The leading newline matches the pre-PR-C
 * layout (the original template literal opened with a newline).
 */
export function buildHelpText(): string {
    const sections = [
        HEADER,
        '',
        renderReadSection(),
        '',
        renderMetadataSection(),
        '',
        renderWriteSection(),
        '',
        renderConfigurationSection(),
        '',
        renderAttachmentSection(),
        '',
        renderBddSection(),
        '',
        BINARY_STDIO_BLOCK,
        '',
        META_BLOCK,
        '',
        AUTH_BLOCK,
        '',
        OPTIONS_BLOCK,
        '',
        SEMANTICS_BLOCK,
    ];
    return sections.join('\n');
}
