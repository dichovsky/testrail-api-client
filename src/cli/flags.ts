/**
 * Primitive CLI flag catalog.
 *
 * This module owns syntax only: argv spelling, primitive parse type, defaults,
 * and the projection key used by the next seam. Action applicability belongs
 * to ActionSpec and is resolved after resource/action dispatch.
 */

export type ActionCapability =
    'body' | 'destructive' | 'file-input' | 'file-output' | 'pagination' | 'pagination-request' | 'write';

interface CliFlagBase {
    readonly scope: 'global' | 'action' | 'meta' | 'action-meta';
    readonly capability?: ActionCapability;
    readonly handlerKey?: string;
    readonly paginationKey?: string;
    readonly valueName?: string;
}

type CliFlagDefinition = CliFlagBase &
    ({ readonly type: 'string'; readonly default?: string } | { readonly type: 'boolean'; readonly default?: boolean });

function defineFlagCatalog<const Catalog extends Readonly<Record<string, CliFlagDefinition>>>(
    catalog: Catalog,
): Catalog {
    return catalog;
}

/**
 * `scope: global` means the flag is accepted by every API action. `meta`
 * flags are consumed by install/uninstall commands before ActionSpec
 * resolution. Action-scoped flags are either explicitly named by an action or
 * admitted through a capability derived from its ActionSpec.
 */
export const FLAG_CATALOG = defineFlagCatalog({
    'base-url': { type: 'string', scope: 'global' },
    email: { type: 'string', scope: 'global', valueName: 'email' },
    'user-email': { type: 'string', scope: 'action', handlerKey: 'userEmail', valueName: 'email' },
    // --api-key was removed in v3.0 because argv is observable. Keep the
    // boolean stdin selector, while the credential itself never enters argv.
    'api-key-stdin': { type: 'boolean', default: false, scope: 'global' },
    format: { type: 'string', default: 'json', scope: 'global' },
    timeout: { type: 'string', scope: 'global' },
    'strict-responses': { type: 'boolean', default: false, scope: 'global' },
    quiet: { type: 'boolean', default: false, scope: 'global' },
    help: { type: 'boolean', default: false, scope: 'global' },
    version: { type: 'boolean', default: false, scope: 'global' },

    'project-id': { type: 'string', scope: 'action', handlerKey: 'projectId', valueName: 'id' },
    'suite-id': { type: 'string', scope: 'action', handlerKey: 'suiteId' },
    'section-id': { type: 'string', scope: 'action', handlerKey: 'sectionId' },
    'run-id': { type: 'string', scope: 'action', handlerKey: 'runId', valueName: 'id' },
    'type-id': { type: 'string', scope: 'action', handlerKey: 'typeId' },
    'priority-id': { type: 'string', scope: 'action', handlerKey: 'priorityId' },
    'template-id': { type: 'string', scope: 'action', handlerKey: 'templateId' },
    'milestone-id': { type: 'string', scope: 'action', handlerKey: 'milestoneId' },
    'created-after': { type: 'string', scope: 'action', handlerKey: 'createdAfter' },
    'created-before': { type: 'string', scope: 'action', handlerKey: 'createdBefore' },
    'created-by': { type: 'string', scope: 'action', handlerKey: 'createdBy' },
    'updated-after': { type: 'string', scope: 'action', handlerKey: 'updatedAfter' },
    'updated-before': { type: 'string', scope: 'action', handlerKey: 'updatedBefore' },
    'updated-by': { type: 'string', scope: 'action', handlerKey: 'updatedBy' },
    'label-id': { type: 'string', scope: 'action', handlerKey: 'labelId' },
    refs: { type: 'string', scope: 'action', handlerKey: 'refs' },
    filter: { type: 'string', scope: 'action', handlerKey: 'filter' },
    'include-plan-runs': { type: 'boolean', default: false, scope: 'action', handlerKey: 'includePlanRuns' },
    'is-completed': { type: 'string', scope: 'action', handlerKey: 'isCompleted' },
    'is-started': { type: 'string', scope: 'action', handlerKey: 'isStarted' },
    'with-data': { type: 'string', scope: 'action', handlerKey: 'withData' },

    limit: {
        type: 'string',
        scope: 'action',
        capability: 'pagination-request',
        paginationKey: 'limit',
    },
    offset: {
        type: 'string',
        scope: 'action',
        capability: 'pagination-request',
        paginationKey: 'offset',
    },
    page: { type: 'boolean', default: false, scope: 'action', capability: 'pagination', paginationKey: 'page' },
    all: { type: 'boolean', default: false, scope: 'action', capability: 'pagination', paginationKey: 'all' },
    'page-size': {
        type: 'string',
        scope: 'action',
        capability: 'pagination-request',
        paginationKey: 'pageSize',
    },
    'start-offset': {
        type: 'string',
        scope: 'action',
        capability: 'pagination-request',
        paginationKey: 'startOffset',
    },
    'max-pages': {
        type: 'string',
        scope: 'action',
        capability: 'pagination',
        paginationKey: 'maxPages',
    },
    'max-items': {
        type: 'string',
        scope: 'action',
        capability: 'pagination',
        paginationKey: 'maxItems',
    },
    'max-duration-ms': {
        type: 'string',
        scope: 'action',
        capability: 'pagination',
        paginationKey: 'maxDurationMs',
    },
    'max-bytes': {
        type: 'string',
        scope: 'action',
        capability: 'pagination',
        paginationKey: 'maxBytes',
    },

    'status-id': { type: 'string', scope: 'action', handlerKey: 'statusId' },
    'defects-filter': { type: 'string', scope: 'action', handlerKey: 'defectsFilter' },
    data: { type: 'string', scope: 'action', capability: 'body' },
    'data-file': { type: 'string', scope: 'action', capability: 'body' },
    'dry-run': { type: 'boolean', default: false, scope: 'action', capability: 'write' },
    file: {
        type: 'string',
        scope: 'action',
        capability: 'file-input',
        handlerKey: 'file',
        valueName: 'path|-',
    },
    filename: { type: 'string', scope: 'action', capability: 'file-input', handlerKey: 'filename' },
    out: {
        type: 'string',
        scope: 'action',
        capability: 'file-output',
        handlerKey: 'out',
        valueName: 'path|-',
    },
    force: { type: 'boolean', default: false, scope: 'action-meta', capability: 'file-output' },
    yes: { type: 'boolean', default: false, scope: 'action', capability: 'destructive' },
    soft: {
        type: 'boolean',
        default: false,
        scope: 'action',
        capability: 'destructive',
        handlerKey: 'soft',
    },
    'keep-in-cases': { type: 'string', scope: 'action', handlerKey: 'keepInCases' },
    interval: { type: 'string', scope: 'action', handlerKey: 'interval' },
    once: { type: 'boolean', default: false, scope: 'action', handlerKey: 'once' },

    global: { type: 'boolean', default: false, scope: 'meta' },
    'print-path': { type: 'boolean', default: false, scope: 'meta' },
});

export type CliFlagName = keyof typeof FLAG_CATALOG;

export type ActionFlagName = {
    [Name in CliFlagName]: (typeof FLAG_CATALOG)[Name]['scope'] extends 'action' | 'action-meta' ? Name : never;
}[CliFlagName];

export type ActionSpecFlagName = ActionFlagName;

type HandlerFlagArgs = {
    [
        Name in CliFlagName as (typeof FLAG_CATALOG)[Name] extends {
            readonly handlerKey: infer Key extends string;
        }
            ? Key
            : never
    ]?: (typeof FLAG_CATALOG)[Name]['type'] extends 'boolean' ? boolean : string;
};

export type CliHandlerArgs = HandlerFlagArgs & { readonly pathParams: readonly string[] };

export type RawCliPaginationArgs = {
    readonly [
        Name in CliFlagName as (typeof FLAG_CATALOG)[Name] extends {
            readonly paginationKey: infer Key extends string;
        }
            ? Key
            : never
    ]?: unknown;
};

interface CliParseOption {
    readonly type: 'string' | 'boolean';
    readonly default?: string | boolean;
}

function buildCliOptions(): Readonly<Record<CliFlagName, CliParseOption>> {
    return Object.fromEntries(
        Object.entries(FLAG_CATALOG).map(([name, definition]) => [
            name,
            {
                type: definition.type,
                ...('default' in definition && { default: definition.default }),
            },
        ]),
    ) as Readonly<Record<CliFlagName, CliParseOption>>;
}

export const CLI_OPTIONS = buildCliOptions();

export type CliOptionName = CliFlagName;

export interface CliOptionDocumentationEntry {
    readonly value?: string;
    readonly scope: string;
    readonly description: string;
}

/**
 * Human-facing option guidance. The keyed record makes documentation
 * completeness a compile-time invariant with the executable flag catalog.
 */
export const CLI_OPTION_DOCUMENTATION: Readonly<Record<CliOptionName, CliOptionDocumentationEntry>> = {
    'base-url': {
        value: '<url>',
        scope: 'All API commands',
        description: 'TestRail base URL; overrides TESTRAIL_BASE_URL.',
    },
    email: {
        value: '<email>',
        scope: 'All API commands',
        description: 'Authentication email; overrides TESTRAIL_EMAIL. It is not the user lookup filter.',
    },
    'user-email': {
        value: '<email>',
        scope: 'user get-by-email',
        description: 'Email address of the user to look up without changing the authentication identity.',
    },
    'api-key-stdin': {
        scope: 'All API commands',
        description:
            'Read one API key from piped stdin. It cannot share stdin with a JSON body or --file -; prefer TESTRAIL_API_KEY.',
    },
    format: {
        value: '<json|table|yaml|csv>',
        scope: 'Commands that emit structured output',
        description: 'Select output format; default json. Binary/text --out files are not reformatted.',
    },
    timeout: {
        value: '<ms>',
        scope: 'All API commands',
        description: 'Request timeout in milliseconds; overrides TESTRAIL_TIMEOUT. Default 30000, maximum 300000.',
    },
    'strict-responses': {
        scope: 'All API commands',
        description: 'Fail on the first response-schema mismatch instead of emitting advisory warnings.',
    },
    quiet: {
        scope: 'All commands',
        description: 'Suppress normal output and advisory warnings; rely on the exit code.',
    },
    help: { scope: 'Top level', description: 'Print CLI help and exit.' },
    version: { scope: 'Top level', description: 'Print the package CLI version and exit.' },
    'project-id': {
        value: '<id>',
        scope: 'case, suite, run, plan, milestone, shared-step, user, and bdd lists; case delete-bulk',
        description: 'Select the TestRail project for actions whose endpoint does not carry project_id positionally.',
    },
    'suite-id': {
        value: '<ids>',
        scope: 'case, section, bdd, and run list actions',
        description: 'Filter by suite. run list accepts comma-separated IDs; other consumers require one ID.',
    },
    'section-id': { value: '<id>', scope: 'case list; bdd list', description: 'Filter results to one section.' },
    'run-id': { value: '<id>', scope: 'result list', description: 'Select the run whose results should be listed.' },
    'type-id': { value: '<ids>', scope: 'case list', description: 'Filter by comma-separated case type IDs.' },
    'priority-id': { value: '<ids>', scope: 'case list', description: 'Filter by comma-separated priority IDs.' },
    'template-id': { value: '<ids>', scope: 'case list', description: 'Filter by comma-separated template IDs.' },
    'milestone-id': {
        value: '<ids>',
        scope: 'case, run, and plan list actions',
        description: 'Filter by comma-separated milestone IDs.',
    },
    'created-after': {
        value: '<timestamp>',
        scope: 'case, run, plan, and shared-step lists; result list',
        description: 'Return entities created after this Unix timestamp.',
    },
    'created-before': {
        value: '<timestamp>',
        scope: 'case, run, plan, and shared-step lists; result list',
        description: 'Return entities created before this Unix timestamp.',
    },
    'created-by': {
        value: '<ids>',
        scope: 'case, run, plan, and shared-step lists; result list',
        description: 'Filter by comma-separated creator user IDs.',
    },
    'updated-after': {
        value: '<timestamp>',
        scope: 'case list; shared-step list',
        description: 'Return entities updated after this Unix timestamp.',
    },
    'updated-before': {
        value: '<timestamp>',
        scope: 'case list; shared-step list',
        description: 'Return entities updated before this Unix timestamp.',
    },
    'updated-by': { value: '<ids>', scope: 'case list', description: 'Filter by comma-separated updater user IDs.' },
    'label-id': {
        value: '<ids>',
        scope: 'case, bdd, and test list actions',
        description: 'Filter by comma-separated label IDs.',
    },
    refs: {
        value: '<refs>',
        scope: 'case, bdd, run, plan, and shared-step list actions',
        description:
            'Filter by references. case and bdd lists accept comma-separated TestRail 10.7 refs; run, plan, and shared-step lists accept one reference.',
    },
    filter: { value: '<text>', scope: 'case list', description: 'Filter by case-title substring.' },
    'include-plan-runs': { scope: 'run list', description: 'Include runs owned by test plans.' },
    'is-completed': {
        value: '<true|false|1|0>',
        scope: 'project, run, plan, and milestone list actions',
        description: 'Filter by completion state.',
    },
    'is-started': {
        value: '<true|false|1|0>',
        scope: 'milestone list',
        description: 'Filter milestones by started state.',
    },
    'with-data': {
        value: '<0|1>',
        scope: 'test get',
        description: 'Request the enriched test projection with 1, or the ordinary response with 0.',
    },
    limit: {
        value: '<n>',
        scope: 'Supported list actions in default or --page mode',
        description: 'Maximum items requested from one response; incompatible with --all.',
    },
    offset: {
        value: '<n>',
        scope: 'Supported list actions in default or --page mode',
        description: 'Zero-based response offset; incompatible with --all.',
    },
    page: {
        scope: 'Registered paginated list actions',
        description: 'Return one strict page envelope with items and pagination metadata; incompatible with --all.',
    },
    all: {
        scope: 'Registered paginated list actions',
        description:
            'Follow validated continuations and return one bounded item array; incompatible with --page/--limit/--offset.',
    },
    'page-size': {
        value: '<n>',
        scope: '--all on request-controlled paginated actions',
        description: 'Per-request page size; default and maximum 250.',
    },
    'start-offset': {
        value: '<n>',
        scope: '--all on request-controlled paginated actions',
        description: 'Initial aggregate offset; default 0.',
    },
    'max-pages': { value: '<n>', scope: '--all', description: 'Maximum pages fetched; default 100.' },
    'max-items': { value: '<n>', scope: '--all', description: 'Maximum accumulated items; default 25000.' },
    'max-duration-ms': {
        value: '<ms>',
        scope: '--all',
        description: 'Aggregate wall-clock deadline; default and maximum 300000.',
    },
    'max-bytes': {
        value: '<bytes>',
        scope: '--all',
        description: 'Maximum serialized aggregate size; default 104857600, hard maximum 1073741824.',
    },
    'status-id': {
        value: '<ids>',
        scope: 'test list; result list/list-for-test/list-for-case',
        description: 'Filter by comma-separated TestRail status IDs.',
    },
    'defects-filter': {
        value: '<text>',
        scope: 'result list/list-for-test/list-for-case',
        description: 'Filter results whose defects field contains the supplied substring.',
    },
    data: {
        value: '<json>',
        scope: 'Body-bearing write actions',
        description:
            'Provide an inline JSON body. Exactly one of --data, --data-file, or piped JSON stdin is required.',
    },
    'data-file': {
        value: '<path>',
        scope: 'Body-bearing write actions',
        description: 'Read the JSON body from a file; useful for large payloads and secrets.',
    },
    'dry-run': {
        scope: 'Write and file-output actions; run watch',
        description: 'Validate and preview locally without an API call. It bypasses destructive confirmation gates.',
    },
    file: {
        value: '<path|->',
        scope: 'Attachment uploads; bdd add/update',
        description: "Read upload content from a file, or from piped stdin with '-'.",
    },
    filename: {
        value: '<name>',
        scope: 'File-input actions',
        description: 'Override the uploaded filename; defaults to the local basename or stdin.',
    },
    out: {
        value: '<path|->',
        scope: 'attachment get; bdd get',
        description: "Write downloaded bytes/text to a file, or stream them to stdout with '-'.",
    },
    force: {
        scope: 'File-output actions; install-skill',
        description: 'Overwrite an existing output file or installed SKILL.md.',
    },
    yes: {
        scope: 'Destructive actions',
        description: 'Per-invocation confirmation; real destructive calls also require TESTRAIL_ALLOW_DESTRUCTIVE=1.',
    },
    soft: {
        scope: 'case delete/delete-bulk; run, section, and suite delete',
        description:
            'Request TestRail server-side deletion preview. It still calls the API and requires both destructive gates.',
    },
    'keep-in-cases': {
        value: '<true|false|1|0>',
        scope: 'shared-step delete',
        description:
            'Choose whether deleted shared-step content remains in referencing cases; TestRail defaults to true.',
    },
    interval: {
        value: '<seconds>',
        scope: 'run watch',
        description: 'Polling interval; default 30, minimum 5, maximum 600.',
    },
    once: { scope: 'run watch', description: 'Poll once and exit instead of waiting for completion.' },
    global: {
        scope: 'install-skill; uninstall-skill',
        description: 'Use the user-level skill directory instead of the current project.',
    },
    'print-path': {
        scope: 'install-skill',
        description: 'Print the bundled SKILL.md path and exit without installing.',
    },
};

export const KNOWN_FLAGS: ReadonlySet<string> = new Set(Object.keys(FLAG_CATALOG));

export function isCliFlagName(value: string): value is CliFlagName {
    return KNOWN_FLAGS.has(value);
}

export type CliFlagTypeValidationResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

/** Reject parseArgs' permissive missing/inline-value representations. */
export function validateSuppliedFlagTypes(
    values: Readonly<Record<string, unknown>>,
    suppliedFlags: readonly string[],
): CliFlagTypeValidationResult {
    for (const supplied of suppliedFlags) {
        if (!isCliFlagName(supplied)) continue;
        const definition: CliFlagDefinition = FLAG_CATALOG[supplied];
        const value = values[supplied];
        if (definition.type === 'string' && typeof value !== 'string') {
            return { ok: false, error: `--${supplied} requires a value.` };
        }
        if (definition.type === 'boolean' && typeof value !== 'boolean') {
            return {
                ok: false,
                error: `--${supplied} does not take a value; pass the flag without \`=\`.`,
            };
        }
    }
    return { ok: true };
}

export function getCliFlagUsage(name: CliFlagName): string {
    const definition: CliFlagDefinition = FLAG_CATALOG[name];
    if (definition.type === 'boolean') return `--${name}`;
    return `--${name} <${definition.valueName ?? 'value'}>`;
}

export function getGlobalActionFlags(): readonly CliFlagName[] {
    return (Object.keys(FLAG_CATALOG) as CliFlagName[]).filter((name) => FLAG_CATALOG[name].scope === 'global');
}

export function getCapabilityFlags(capability: ActionCapability): readonly CliFlagName[] {
    return (Object.keys(FLAG_CATALOG) as CliFlagName[]).filter((name) => {
        const definition: CliFlagDefinition = FLAG_CATALOG[name];
        return definition.capability === capability;
    });
}

/** Project only handler-owned values. Pagination has its own typed seam. */
export function projectHandlerArgs(
    values: Readonly<Record<string, unknown>>,
    pathParams: readonly string[],
): CliHandlerArgs {
    const projected: Record<string, unknown> = { pathParams };
    for (const name of Object.keys(FLAG_CATALOG) as CliFlagName[]) {
        const definition: CliFlagDefinition = FLAG_CATALOG[name];
        if (definition.handlerKey === undefined) continue;
        const value = values[name];
        if (definition.type === 'string' && typeof value === 'string') {
            projected[definition.handlerKey] = value;
        } else if (definition.type === 'boolean' && value === true) {
            projected[definition.handlerKey] = true;
        }
    }
    return projected as CliHandlerArgs;
}

export function projectPaginationArgs(values: Readonly<Record<string, unknown>>): RawCliPaginationArgs {
    const projected: Record<string, unknown> = {};
    for (const name of Object.keys(FLAG_CATALOG) as CliFlagName[]) {
        const definition: CliFlagDefinition = FLAG_CATALOG[name];
        if (definition.paginationKey !== undefined && values[name] !== undefined) {
            projected[definition.paginationKey] = values[name];
        }
    }
    return projected;
}
