/**
 * Pure rendering helpers for the skill generator. Extracted from
 * generate-skill.ts so tests can import these without triggering the
 * script's top-level filesystem side effects.
 */

interface ActionLike {
    resource: string;
    action: string;
    isWrite: boolean;
    bodySchema?: unknown;
    fileInput?: boolean;
    fileOutput?: boolean;
    outputKind?: 'binary' | 'text';
    destructive?: boolean;
    pathParams: readonly { name: string }[];
}

/** Maps a (resource, action) pair to its exported schema variable name. */
const SCHEMA_NAMES: ReadonlyMap<string, string> = new Map([
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
    ['label:update', 'UpdateLabelPayloadSchema'],
    ['test:update-labels', 'UpdateTestLabelsPayloadSchema'],
    ['test:update-labels-bulk', 'UpdateTestsLabelsPayloadSchema'],
]);

export function schemaNameFor(spec: { resource: string; action: string }): string {
    return SCHEMA_NAMES.get(`${spec.resource}:${spec.action}`) ?? '(body)';
}

function renderPathArgs(spec: ActionLike): string {
    if (spec.pathParams.length === 0) return '-';
    // Wrap each `<arg>` in a backtick code span so Markdown renderers
    // don't interpret the angle brackets as an HTML tag (which would
    // make the arg invisible or trigger HTML sanitization). The code
    // span keeps the placeholder visible AND verbatim.
    return spec.pathParams.map((p) => `\`<${p.name}>\``).join(' ');
}

function inputLabel(spec: ActionLike): string {
    if (spec.fileInput === true) return 'file';
    if (spec.fileOutput === true) {
        const kind = spec.outputKind === 'text' ? 'text' : 'binary';
        return `out:${kind}`;
    }
    if (!spec.isWrite) return '-';
    if (spec.bodySchema === undefined) {
        if (spec.destructive === true) return 'none+yes';
        return 'none';
    }
    return schemaNameFor(spec);
}

function modeLabel(spec: ActionLike): string {
    if (spec.destructive === true) return 'D';
    return spec.isWrite ? 'W' : 'R';
}

export function renderCommandTable(actions: readonly ActionLike[]): string {
    const rows = actions.map(
        (spec) =>
            `| \`${spec.resource} ${spec.action}\` | ${modeLabel(spec)} | ${renderPathArgs(spec)} | ${inputLabel(spec)} |`,
    );
    return ['| Cmd | Mode | Args | Input |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

// Zod v4 internal shape — we use `unknown` + narrowing to avoid `any`.
interface ZodDefLike {
    type?: string;
    innerType?: unknown;
    element?: unknown;
    shape?: Record<string, unknown>;
}

interface ZodNodeLike {
    _zod?: { def?: ZodDefLike };
    shape?: Record<string, unknown>;
    isOptional?: () => boolean;
    unwrap?: () => unknown;
}

function isZodNodeLike(value: unknown): value is ZodNodeLike {
    return typeof value === 'object' && value !== null;
}

function describeType(field: unknown): string {
    // Unwrap z.optional() / z.nullable() to the inner type.
    let f: unknown = field;
    while (isZodNodeLike(f) && f._zod !== undefined) {
        const defType = f._zod?.def?.type;
        if (defType !== 'optional' && defType !== 'nullable' && f._zod?.def?.innerType === undefined) break;
        const inner = f._zod?.def?.innerType;
        if (inner !== undefined) {
            f = inner;
        } else if (isZodNodeLike(f) && typeof f.unwrap === 'function') {
            f = f.unwrap();
        } else {
            break;
        }
        if (!isZodNodeLike(f)) break;
    }
    const t = isZodNodeLike(f) ? (f._zod?.def?.type ?? 'unknown') : 'unknown';
    switch (t) {
        case 'string':
            return 'string';
        case 'number':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'array': {
            const inner = isZodNodeLike(f) ? f._zod?.def?.element : undefined;
            return inner !== undefined ? `${describeType(inner)}[]` : 'unknown[]';
        }
        case 'record':
            return 'Record<string, unknown>';
        case 'object':
            return 'object';
        default:
            return typeof t === 'string' ? t : 'unknown';
    }
}

interface FieldDescriptor {
    key: string;
    type: string;
    optional: boolean;
}

function readSchemaFields(schema: unknown): FieldDescriptor[] | null {
    if (!isZodNodeLike(schema)) return null;
    const shape: Record<string, unknown> | undefined = schema._zod?.def?.shape ?? schema.shape;
    if (shape === undefined) return null;

    return Object.entries(shape).map(([key, field]) => {
        const type = describeType(field);
        const optional =
            (isZodNodeLike(field) && field._zod?.def?.type === 'optional') ||
            (isZodNodeLike(field) && typeof field.isOptional === 'function' && field.isOptional() === true);
        return { key, type, optional };
    });
}

function schemaNameToAnchor(schemaName: string): string {
    return schemaName.toLowerCase();
}

function renderPayloadIndexEntry(spec: ActionLike): string {
    const schemaName = schemaNameFor(spec);
    const fields = readSchemaFields(spec.bodySchema);
    if (fields === null) {
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

function renderReferenceEntry(schemaName: string, actions: string[], fields: FieldDescriptor[] | null): string {
    const actionLine = `[${actions.map((a) => `"${a}"`).join(', ')}]`;
    if (fields === null) {
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

export function renderPayloadSchemas(actions: readonly ActionLike[]): string {
    const writes = actions.filter((a) => a.isWrite && a.bodySchema !== undefined);
    const lines = ['```yaml', '# compact schema index', 'schemas:'];
    for (const spec of writes) {
        lines.push(renderPayloadIndexEntry(spec));
    }
    lines.push('```');
    return lines.join('\n');
}

export function renderPayloadSchemaReference(actions: readonly ActionLike[]): string {
    const writes = actions.filter((a) => a.isWrite && a.bodySchema !== undefined);
    const merged = new Map<string, { actions: string[]; fields: FieldDescriptor[] | null }>();
    for (const spec of writes) {
        const schemaName = schemaNameFor(spec);
        const action = `${spec.resource} ${spec.action}`;
        const existing = merged.get(schemaName);
        if (existing === undefined) {
            merged.set(schemaName, { actions: [action], fields: readSchemaFields(spec.bodySchema) });
            continue;
        }
        existing.actions.push(action);
    }
    const lines = [
        '# Generated by scripts/generate-skill.ts. Do not edit by hand.',
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
export function replaceSection(content: string, name: string, body: string): string {
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

/**
 * Replace the `version:` value inside the YAML frontmatter block (the
 * region between the first two `---` delimiter lines, tolerating a
 * trailing `\r` so a CRLF checkout is handled the same as LF) with the
 * given version string. Throws if the frontmatter delimiters can't be
 * found, or if no `version:` line exists inside the block.
 */
export function replaceFrontmatterVersion(content: string, version: string): string {
    const lines = content.split('\n');
    const isDelimiter = (line: string): boolean => line === '---' || line === '---\r';
    const delimiterIndices: number[] = [];
    for (let i = 0; i < lines.length && delimiterIndices.length < 2; i++) {
        if (isDelimiter(lines[i] as string)) delimiterIndices.push(i);
    }
    if (delimiterIndices.length < 2) {
        throw new Error('YAML frontmatter delimiters ("---") not found in skill/SKILL.md');
    }
    const [openIdx, closeIdx] = delimiterIndices as [number, number];
    if (openIdx !== 0) {
        throw new Error('YAML frontmatter must start at the first line of skill/SKILL.md');
    }

    let versionLineIdx = -1;
    for (let i = openIdx + 1; i < closeIdx; i++) {
        if (lines[i]?.startsWith('version:') === true) {
            versionLineIdx = i;
            break;
        }
    }
    if (versionLineIdx === -1) {
        throw new Error('No "version:" line found inside the YAML frontmatter block');
    }

    // Preserve this line's own CRLF-vs-LF ending so a CRLF checkout doesn't
    // end up with one LF-only line mixed into an otherwise-CRLF file.
    const line = lines[versionLineIdx] as string;
    const eol = line.endsWith('\r') ? '\r' : '';
    const body = eol.length > 0 ? line.slice(0, -1) : line;
    const colonIdx = body.indexOf(':');
    const prefix = body.slice(0, colonIdx + 1);
    const rest = body.slice(colonIdx + 1);
    const leadingWhitespace = /^\s*/.exec(rest)?.[0] ?? '';
    lines[versionLineIdx] = `${prefix}${leadingWhitespace}${version}${eol}`;

    return lines.join('\n');
}
