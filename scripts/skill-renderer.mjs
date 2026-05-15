/**
 * Pure rendering helpers for the skill generator. Extracted from
 * generate-skill.js so tests can import these without triggering the
 * script's top-level filesystem side effects.
 */

/** Maps a (resource, action) pair to its exported schema variable name. */
const SCHEMA_NAMES = new Map([
    ['case:add', 'AddCasePayloadSchema'],
    ['case:update', 'UpdateCasePayloadSchema'],
    ['case:update-bulk', 'UpdateCasesPayloadSchema'],
    ['case:delete-bulk', 'DeleteCasesPayloadSchema'],
    ['case:copy-to-section', 'CopyCasesToSectionPayloadSchema'],
    ['case:move-to-section', 'MoveCasesToSectionPayloadSchema'],
    ['run:add', 'AddRunPayloadSchema'],
    ['result:add', 'AddResultPayloadSchema'],
    ['result:add-bulk', 'AddResultsForCasesPayloadSchema'],
    ['result:add-bulk-by-test', 'AddResultsPayloadSchema'],
    ['plan:add', 'AddPlanPayloadSchema'],
    ['plan:update', 'UpdatePlanPayloadSchema'],
    ['plan:add-entry', 'AddPlanEntryPayloadSchema'],
]);

export function schemaNameFor(spec) {
    return SCHEMA_NAMES.get(`${spec.resource}:${spec.action}`) ?? '(body)';
}

function renderPathArgs(spec) {
    if (spec.pathParams.length === 0) return '—';
    return spec.pathParams.map((p) => `\`<${p.name}>\``).join(' ');
}

function bodyLabel(spec) {
    if (spec.fileInput === true) return '`--file <path>`';
    if (spec.fileOutput === true) return '`--out <path>` (binary)';
    if (!spec.isWrite) return '—';
    if (!spec.bodySchema) {
        if (spec.destructive === true) return '— (no body, requires `--yes`)';
        return '— (no body)';
    }
    return `\`${schemaNameFor(spec)}\``;
}

export function renderCommandTable(actions) {
    const rows = actions.map(
        (spec) =>
            `| ${spec.resource} | ${spec.action} | ${renderPathArgs(spec)} | ${bodyLabel(spec)} | ${spec.summary} |`,
    );
    return ['| Resource | Action | Path args | Body | Description |', '| --- | --- | --- | --- | --- |', ...rows].join(
        '\n',
    );
}

function describeType(field) {
    // Unwrap z.optional() / z.nullable() to the inner type.
    let f = field;
    while (f?._zod?.def?.type === 'optional' || f?._zod?.def?.type === 'nullable' || f?._zod?.def?.innerType) {
        f = f._zod?.def?.innerType ?? f.unwrap?.() ?? f;
        if (!f?._zod) break;
    }
    const t = f?._zod?.def?.type ?? 'unknown';
    switch (t) {
        case 'string':
            return 'string';
        case 'number':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'array': {
            const inner = f._zod?.def?.element;
            return inner ? `${describeType(inner)}[]` : 'unknown[]';
        }
        case 'record':
            return 'Record<string, unknown>';
        case 'object':
            return 'object';
        default:
            return t;
    }
}

function renderSchemaFields(schema) {
    // Zod v4 passthrough() returns ZodObject; `.shape` (or `_zod.def.shape`)
    // holds the field map.
    const shape = schema?._zod?.def?.shape ?? schema?.shape;
    if (!shape) return '_(schema shape not introspectable)_';

    const fields = Object.entries(shape).map(([key, field]) => {
        const type = describeType(field);
        const optional = field?._zod?.def?.type === 'optional' || field?.isOptional?.() === true;
        const suffix = optional ? '?' : ' (required)';
        return `    "${key}": "${type}${suffix}"`;
    });
    return ['```jsonc', '{', fields.join(',\n'), '}', '```'].join('\n');
}

export function renderPayloadSchemas(actions) {
    const writes = actions.filter((a) => a.isWrite && a.bodySchema);
    return writes
        .map((spec) =>
            [
                `### \`${schemaNameFor(spec)}\` (used by \`${spec.resource} ${spec.action}\`)`,
                '',
                renderSchemaFields(spec.bodySchema),
            ].join('\n'),
        )
        .join('\n\n');
}

/**
 * Replace the content between `<!-- GENERATED:name -->` and
 * `<!-- /GENERATED:name -->` markers. Throws if either marker is missing
 * or if they appear in the wrong order — catching the most common drift
 * cause (developer hand-edits the file and removes a sentinel).
 */
export function replaceSection(content, name, body) {
    const open = `<!-- GENERATED:${name} -->`;
    const close = `<!-- /GENERATED:${name} -->`;
    const openIdx = content.indexOf(open);
    const closeIdx = content.indexOf(close);
    if (openIdx === -1 || closeIdx === -1) {
        throw new Error(`Sentinels for section "${name}" not found in skill/SKILL.md`);
    }
    if (closeIdx < openIdx) {
        throw new Error(`Sentinels for section "${name}" are in the wrong order`);
    }
    const before = content.slice(0, openIdx + open.length);
    const after = content.slice(closeIdx);
    return `${before}\n${body}\n${after}`;
}
