import { ACTIONS } from './metadata.js';
import type { ActionSpec } from './metadata/types.js';
import {
    CLI_OPTION_DOCUMENTATION,
    getCliFlagUsage,
    type CliOptionDocumentationEntry,
    type CliOptionName,
} from './flags.js';

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
 * The trailing blocks ("Binary stdio", "Meta", "Auth", and destructive
 * notes) stay hand-written. The option inventory is rendered from
 * `CLI_OPTION_DOCUMENTATION`, the same registry used by the bundled skill.
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
    'dynamic-filter-field',
    'priority',
    'result-field',
    'role',
    'status',
    'template',
    'version',
]);

// ── Resources whose actions live in their own dedicated sections ─────────────
//
// Excluded from the generic Read / Write / Metadata sections so they don't
// appear twice (configuration mixes write + destructive; attachment mixes
// every kind of I/O; bdd is text-I/O for get and file-input for add/update).
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
    for (const flag of spec.flags ?? []) {
        // File I/O has a richer structural hint below that includes the
        // optional companion flag while still containing the required usage.
        if (flag.required === true && flag.name !== 'file' && flag.name !== 'out') {
            parts.push(getCliFlagUsage(flag.name));
        }
    }
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
    if (spec.destructive === true && spec.softMode === 'optional') {
        parts.push('[--soft]');
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
 * column padded to 20 chars with at least one separator, action padded to 22
 * chars. The summary follows
 * the argv shape on the same line so users can see the full usage at a
 * glance without horizontal scrolling for the common cases.
 */
function renderActionLine(spec: ActionSpec): string {
    const path = pathParamsText(spec);
    const hint = actionArgvHint(spec);
    const usage = [spec.action, path, hint].filter((s) => s !== '').join(' ');
    // Two-column layout: resource (20) | usage … summary.
    const resourceCol = `${spec.resource} `.padEnd(20);
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
// These describe env vars and operational semantics that apply across many
// actions rather than belonging to any one. The complete option inventory is
// rendered separately from the typed registry in flags.ts.

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
                    bypasses this gate (preview hits no API).
  TESTRAIL_STRICT_RESPONSES=1|0
                    Fail closed on response-schema drift when set to exactly
                    '1'. '0', empty, or unset keeps privacy-safe advisory
                    warnings. Other non-empty values are rejected.`;

function optionUsage(name: CliOptionName, documentation: CliOptionDocumentationEntry): string {
    return `--${name}${documentation.value === undefined ? '' : ` ${documentation.value}`}`;
}

/** Render the complete live option inventory from the shared typed registry. */
export function renderOptionsBlock(): string {
    const entries = Object.entries(CLI_OPTION_DOCUMENTATION) as [CliOptionName, CliOptionDocumentationEntry][];
    const usages = entries.map(([name, documentation]) => optionUsage(name, documentation));
    const width = Math.max(...usages.map((usage) => usage.length));
    const lines = entries.map(([name, documentation]) => {
        const usage = optionUsage(name, documentation);
        return `  ${usage.padEnd(width)}  [${documentation.scope}] ${documentation.description}`;
    });
    return ['Options:', ...lines].join('\n');
}

function actionNames(predicate: (spec: ActionSpec) => boolean): string {
    return ACTIONS.filter(predicate)
        .map((spec) => `${spec.resource} ${spec.action}`)
        .join(', ');
}

const DESTRUCTIVE_ACTIONS = actionNames((spec) => spec.destructive === true);
const SOFT_OPTIONAL_ACTIONS = actionNames((spec) => spec.destructive === true && spec.softMode === 'optional');
const SOFT_REJECTED_ACTIONS = actionNames(
    (spec) => spec.destructive === true && (spec.softMode ?? 'reject') === 'reject',
);
const NO_BODY_WRITES = actionNames((spec) => spec.isWrite && spec.bodySchema === undefined && spec.fileInput !== true);

const SEMANTICS_BLOCK = `For body-bearing write actions, exactly one body source is required
(--data | --data-file | stdin). Stdin is auto-detected when input is piped
(process.stdin.isTTY !== true) and neither --data nor --data-file is supplied.
The following write actions take NO body
(explicit --data / --data-file is rejected): ${NO_BODY_WRITES} — they accept only positional id(s) (one for most
actions; plan delete-entry and attachment add-to-plan-entry take two:
<plan_id> <entry_id>) and the optional --soft flag on the soft-capable
deletes. Attachment upload actions take a binary file via --file <path>
and do not accept --data/--data-file/stdin.
Destructive actions (${DESTRUCTIVE_ACTIONS})
require BOTH --yes AND the TESTRAIL_ALLOW_DESTRUCTIVE=1 env var. Either gate
alone is insufficient — this two-gate model is intentional (env var is
process-wide audit-friendly; --yes is per-invocation explicit). Pass
--dry-run to preview without making the API call; --yes is optional in
dry-run mode (dry-run wins; the env var is NOT required for preview).
'run close' and 'plan close' are irreversible — TestRail offers no reopen
for either. For soft-capable deletes (${SOFT_OPTIONAL_ACTIONS}),
pass --soft for a server-side preview that returns affected-entity counts
without deleting; this still hits the API and remains gated by --yes
AND TESTRAIL_ALLOW_DESTRUCTIVE=1. All other destructive actions reject
--soft (${SOFT_REJECTED_ACTIONS}).`;

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
        renderOptionsBlock(),
        '',
        SEMANTICS_BLOCK,
    ];
    return sections.join('\n');
}
