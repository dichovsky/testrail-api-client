/**
 * Pure rendering helpers for the skill generator. Extracted from
 * generate-skill.js so tests can import these without triggering the
 * script's top-level filesystem side effects.
 */

/** Maps a (resource, action) pair to its exported schema variable name. */
const SCHEMA_NAMES = new Map([
    ['case:add', 'AddCasePayloadSchema'],
    ['case:add-bulk', 'AddCasesBulkPayloadSchema'],
    ['case:update', 'UpdateCasePayloadSchema'],
    ['case:update-bulk', 'UpdateCasesPayloadSchema'],
    ['case:delete-bulk', 'DeleteCasesPayloadSchema'],
    ['case:copy-to-section', 'CopyCasesToSectionPayloadSchema'],
    ['case:move-to-section', 'MoveCasesToSectionPayloadSchema'],
    ['case-field:add', 'AddCaseFieldPayloadSchema'],
    ['run:add', 'AddRunPayloadSchema'],
    ['run:update', 'UpdateRunPayloadSchema'],
    ['result:add', 'AddResultPayloadSchema'],
    ['result:add-bulk', 'AddResultsForCasesPayloadSchema'],
    ['result:add-bulk-by-test', 'AddResultsPayloadSchema'],
    ['result:add-by-test', 'AddResultPayloadSchema'],
    ['plan:add', 'AddPlanPayloadSchema'],
    ['plan:update', 'UpdatePlanPayloadSchema'],
    ['plan:add-entry', 'AddPlanEntryPayloadSchema'],
    ['plan:add-run-to-entry', 'AddRunToPlanEntryPayloadSchema'],
    ['plan:update-entry', 'UpdatePlanEntryPayloadSchema'],
    ['plan:update-run-in-entry', 'UpdateRunInPlanEntryPayloadSchema'],
    ['section:add', 'AddSectionPayloadSchema'],
    ['section:update', 'UpdateSectionPayloadSchema'],
    ['section:move', 'MoveSectionPayloadSchema'],
    ['project:add', 'AddProjectPayloadSchema'],
    ['project:update', 'UpdateProjectPayloadSchema'],
    ['suite:add', 'AddSuitePayloadSchema'],
    ['suite:update', 'UpdateSuitePayloadSchema'],
    ['milestone:add', 'AddMilestonePayloadSchema'],
    ['milestone:update', 'UpdateMilestonePayloadSchema'],
    ['variable:add', 'AddVariablePayloadSchema'],
    ['variable:update', 'UpdateVariablePayloadSchema'],
    ['group:add', 'AddGroupPayloadSchema'],
    ['group:update', 'UpdateGroupPayloadSchema'],
    ['dataset:add', 'AddDatasetPayloadSchema'],
    ['dataset:update', 'UpdateDatasetPayloadSchema'],
    ['shared-step:add', 'AddSharedStepPayloadSchema'],
    ['shared-step:update', 'UpdateSharedStepPayloadSchema'],
    ['configuration-group:add', 'AddConfigurationGroupPayloadSchema'],
    ['configuration-group:update', 'UpdateConfigurationGroupPayloadSchema'],
    ['configuration:add', 'AddConfigurationPayloadSchema'],
    ['configuration:update', 'UpdateConfigurationPayloadSchema'],
    ['user:add', 'UserAddPayloadSchema'],
    ['user:update', 'UserUpdatePayloadSchema'],
]);

export function schemaNameFor(spec) {
    return SCHEMA_NAMES.get(`${spec.resource}:${spec.action}`) ?? '(body)';
}

function renderPathArgs(spec) {
    if (spec.pathParams.length === 0) return '-';
    // Wrap each `<arg>` in a backtick code span so Markdown renderers
    // don't interpret the angle brackets as an HTML tag (which would
    // make the arg invisible or trigger HTML sanitization). The code
    // span keeps the placeholder visible AND verbatim.
    return spec.pathParams.map((p) => `\`<${p.name}>\``).join(' ');
}

function inputLabel(spec) {
    if (spec.fileInput === true) return 'file';
    if (spec.fileOutput === true) {
        const kind = spec.outputKind === 'text' ? 'text' : 'binary';
        return `out:${kind}`;
    }
    if (!spec.isWrite) return '-';
    if (!spec.bodySchema) {
        if (spec.destructive === true) return 'none+yes';
        return 'none';
    }
    return schemaNameFor(spec);
}

function modeLabel(spec) {
    if (spec.destructive === true) return 'D';
    return spec.isWrite ? 'W' : 'R';
}

export function renderCommandTable(actions) {
    const rows = actions.map(
        (spec) =>
            `| \`${spec.resource} ${spec.action}\` | ${modeLabel(spec)} | ${renderPathArgs(spec)} | ${inputLabel(spec)} |`,
    );
    return ['| Cmd | Mode | Args | Input |', '| --- | --- | --- | --- |', ...rows].join('\n');
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

function readSchemaFields(schema) {
    const shape = schema?._zod?.def?.shape ?? schema?.shape;
    if (!shape) return null;

    return Object.entries(shape).map(([key, field]) => {
        const type = describeType(field);
        const optional = field?._zod?.def?.type === 'optional' || field?.isOptional?.() === true;
        return { key, type, optional };
    });
}

function schemaNameToAnchor(schemaName) {
    return schemaName.toLowerCase();
}

function renderPayloadIndexEntry(spec) {
    const schemaName = schemaNameFor(spec);
    const fields = readSchemaFields(spec.bodySchema);
    if (!fields) {
        return `- {s: ${schemaName}, a: "${spec.resource} ${spec.action}", req: "schema_shape_unavailable", opt: "schema_shape_unavailable", ref: "./reference/payload-schemas.yaml#${schemaNameToAnchor(schemaName)}"}`;
    }
    const req = fields
        .filter((f) => !f.optional)
        .map((f) => f.key)
        .join(', ');
    const optCount = fields.filter((f) => f.optional).length;
    const reqLabel = req.length > 0 ? `[${req}]` : '[]';
    return `- {s: ${schemaName}, a: "${spec.resource} ${spec.action}", req: ${reqLabel}, opt: ${optCount}, ref: "./reference/payload-schemas.yaml#${schemaNameToAnchor(schemaName)}"}`;
}

function renderReferenceEntry(schemaName, actions, fields) {
    const actionLine = `[${actions.map((a) => `"${a}"`).join(', ')}]`;
    if (!fields) {
        return [
            `  ${schemaName}:`,
            `    actions: ${actionLine}`,
            '    req: "schema_shape_unavailable"',
            '    opt: "schema_shape_unavailable"',
            '',
        ].join('\n');
    }

    const req = fields.filter((f) => !f.optional).map((f) => `${f.key}:${f.type}`);
    const opt = fields.filter((f) => f.optional).map((f) => `${f.key}:${f.type}`);
    const reqLines = req.length > 0 ? ['    req:', ...req.map((v) => `      - "${v}"`)] : ['    req: []'];
    const optLines = opt.length > 0 ? ['    opt:', ...opt.map((v) => `      - "${v}"`)] : ['    opt: []'];
    return [`  ${schemaName}:`, `    actions: ${actionLine}`, ...reqLines, ...optLines, ''].join('\n');
}

export function renderPayloadSchemas(actions) {
    const writes = actions.filter((a) => a.isWrite && a.bodySchema);
    const lines = ['```yaml', '# compact schema index', 'schemas:'];
    for (const spec of writes) {
        lines.push(renderPayloadIndexEntry(spec));
    }
    lines.push('```');
    return lines.join('\n');
}

export function renderPayloadSchemaReference(actions) {
    const writes = actions.filter((a) => a.isWrite && a.bodySchema);
    const merged = new Map();
    for (const spec of writes) {
        const schemaName = schemaNameFor(spec);
        const action = `${spec.resource} ${spec.action}`;
        if (!merged.has(schemaName)) {
            merged.set(schemaName, { actions: [action], fields: readSchemaFields(spec.bodySchema) });
            continue;
        }
        merged.get(schemaName).actions.push(action);
    }
    const lines = [
        '# Generated by scripts/generate-skill.js. Do not edit by hand.',
        '# Full payload field map for skill/SKILL.md schema index.',
        'schemas:',
    ];
    for (const [schemaName, entry] of merged) {
        lines.push(renderReferenceEntry(schemaName, entry.actions, entry.fields));
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
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
