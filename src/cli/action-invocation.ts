import {
    getCapabilityFlags,
    getCliFlagUsage,
    getGlobalActionFlags,
    isCliFlagName,
    projectHandlerArgs,
    projectPaginationArgs,
    validateSuppliedFlagTypes,
    type CliFlagName,
    type CliHandlerArgs,
} from './flags.js';
import type { ActionSpec } from './metadata/types.js';
import { validateCliPagination, type CliPaginationParsed } from './pagination.js';

export interface ActionInvocation {
    readonly spec: ActionSpec;
    readonly args: CliHandlerArgs;
    readonly pagination: CliPaginationParsed;
}

export type ActionInvocationResult =
    { readonly ok: true; readonly invocation: ActionInvocation } | { readonly ok: false; readonly error: string };

export type MetaCommandName = 'install-skill' | 'uninstall-skill';

const META_COMMAND_FLAGS = {
    'install-skill': ['global', 'force', 'print-path', 'quiet'],
    'uninstall-skill': ['global', 'quiet'],
} as const satisfies Readonly<Record<MetaCommandName, readonly CliFlagName[]>>;

/**
 * Compile the flags accepted by one action from explicit semantics plus
 * structural capabilities. This is the single action-applicability interface;
 * handlers no longer decide whether an unrelated known flag is ignored.
 */
export function getAllowedActionFlags(spec: ActionSpec): ReadonlySet<CliFlagName> {
    const allowed = new Set<CliFlagName>(getGlobalActionFlags());
    for (const flag of spec.flags ?? []) allowed.add(flag.name);

    const addCapability = (capability: Parameters<typeof getCapabilityFlags>[0]): void => {
        for (const flag of getCapabilityFlags(capability)) allowed.add(flag);
    };

    if (spec.pagination !== undefined) {
        addCapability('pagination');
        if (spec.pagination.requestControls) addCapability('pagination-request');
    }
    if (spec.itemsRequestControls === true) addCapability('pagination-request');
    if (spec.bodySchema !== undefined) addCapability('body');
    if (spec.fileInput === true) addCapability('file-input');
    if (spec.fileOutput === true) addCapability('file-output');
    if (spec.isWrite || spec.fileOutput === true) addCapability('write');
    if (spec.destructive === true) addCapability('destructive');

    return allowed;
}

/** Reject known-but-irrelevant flags before a meta command can mutate disk. */
export function validateMetaCommandFlags(
    command: MetaCommandName,
    suppliedFlags: readonly string[],
): { readonly ok: true } | { readonly ok: false; readonly error: string } {
    const allowed = new Set<CliFlagName>(META_COMMAND_FLAGS[command]);
    for (const supplied of suppliedFlags) {
        if (!isCliFlagName(supplied)) continue;
        if (!allowed.has(supplied)) {
            return { ok: false, error: `--${supplied} is not supported by ${command}.` };
        }
    }
    return { ok: true };
}

function hasRequiredFlagValue(values: Readonly<Record<string, unknown>>, name: CliFlagName): boolean {
    const value = values[name];
    return typeof value === 'boolean' ? value : typeof value === 'string' && value.trim() !== '';
}

/**
 * Resolve argv into the typed handler and pagination projections. Call this
 * after dispatch, but before stdin, auth, client construction, or handler work.
 */
export function resolveActionInvocation(options: {
    readonly spec: ActionSpec;
    readonly values: Readonly<Record<string, unknown>>;
    readonly suppliedFlags: readonly string[];
    readonly pathParams: readonly string[];
    readonly dryRun: boolean;
}): ActionInvocationResult {
    const flagTypes = validateSuppliedFlagTypes(options.values, options.suppliedFlags);
    if (!flagTypes.ok) return flagTypes;

    const fileIsStdin = options.values['file'] === '-';
    const outIsStdout = options.values['out'] === '-';

    // Preserve the precise stdio diagnostics at the same pre-auth seam. They
    // are more useful than the generic applicability error for the sentinel.
    if (fileIsStdin && options.spec.fileInput !== true) {
        return {
            ok: false,
            error: "--file '-' is only valid for attachment upload actions, 'bdd add', and 'bdd update'.",
        };
    }
    if (fileIsStdin && (options.values['data'] !== undefined || options.values['data-file'] !== undefined)) {
        return { ok: false, error: "--file '-' cannot be combined with --data or --data-file (stdin has one source)." };
    }
    if (fileIsStdin && options.values['api-key-stdin'] === true) {
        return { ok: false, error: "--file '-' cannot be combined with --api-key-stdin (stdin has one consumer)." };
    }
    if (outIsStdout && options.spec.fileOutput !== true) {
        return {
            ok: false,
            error: "--out '-' is only valid for actions that download binary content (attachment get, bdd get).",
        };
    }
    if (outIsStdout && options.values['format'] === 'table') {
        return { ok: false, error: '--out - streams raw binary; --format table is meaningless and was rejected.' };
    }

    const paginationArgs = projectPaginationArgs(options.values);
    // Paginated endpoints validate their mode-specific request-control rules
    // before the generic applicability pass. This lets response-driven
    // endpoints preserve explicit legacy items-mode controls without admitting
    // those controls to page/all projections.
    const paginationValidation =
        options.spec.pagination === undefined ? undefined : validateCliPagination(options.spec, paginationArgs);
    if (paginationValidation !== undefined && !paginationValidation.ok) return paginationValidation;

    const allowed = getAllowedActionFlags(options.spec);
    for (const supplied of options.suppliedFlags) {
        // Unknown spellings have a dedicated earlier gate with stable wording.
        if (!isCliFlagName(supplied)) continue;
        if (!allowed.has(supplied)) {
            return {
                ok: false,
                error: `--${supplied} is not supported by ${options.spec.resource} ${options.spec.action}.`,
            };
        }
    }

    for (const flag of options.spec.flags ?? []) {
        if (flag.required === true && !hasRequiredFlagValue(options.values, flag.name)) {
            return {
                ok: false,
                error: `${options.spec.resource} ${options.spec.action} requires ${getCliFlagUsage(flag.name)}.`,
            };
        }
    }

    if (
        options.suppliedFlags.includes('soft') &&
        options.spec.destructive === true &&
        (options.spec.softMode ?? 'reject') === 'reject' &&
        !options.dryRun
    ) {
        return {
            ok: false,
            error: `${options.spec.resource} ${options.spec.action} does not support --soft.`,
        };
    }

    const validatedPagination = paginationValidation ?? validateCliPagination(options.spec, paginationArgs);
    if (!validatedPagination.ok) return validatedPagination;

    return {
        ok: true,
        invocation: {
            spec: options.spec,
            args: projectHandlerArgs(options.values, options.pathParams),
            pagination: validatedPagination.parsed,
        },
    };
}
