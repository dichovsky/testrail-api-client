import ts from 'typescript';
import type { ActionEntry } from './mapping-renderer.js';

/**
 * Extract the mapping-relevant subset of each per-resource `*Actions` array.
 * Kept side-effect free so the parser can be tested without running the
 * filesystem-writing mapping generator.
 */
export function collectActionsFromSource(source: string, filePath: string): ActionEntry[] {
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
    const actions: ActionEntry[] = [];

    function literalValue(node: ts.Node): string | boolean | undefined {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
        if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
        return undefined;
    }

    function pushEntry(el: ts.ObjectLiteralExpression): void {
        const entry: Record<string, string | boolean> = {};
        for (const prop of el.properties) {
            if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
            const value = literalValue(prop.initializer);
            if (value !== undefined) entry[prop.name.text] = value;
        }
        const resource = entry['resource'];
        const action = entry['action'];
        const apiEndpoint = entry['apiEndpoint'];
        if (typeof resource !== 'string' || typeof action !== 'string' || typeof apiEndpoint !== 'string') {
            // Same reasoning as the array-shape check in `visit()`: an entry whose
            // resource/action/apiEndpoint is not a plain string literal (a
            // const reference, a template with substitutions, a spread) used to
            // be dropped here with no signal, shrinking the set every gate
            // tests membership against.
            throw new Error(
                `${filePath}: an ActionSpec entry has a non-literal resource/action/apiEndpoint ` +
                    `(resource=${JSON.stringify(resource)}, action=${JSON.stringify(action)}, ` +
                    `apiEndpoint=${JSON.stringify(apiEndpoint)}). Gates C, C2 and D would skip it silently.`,
            );
        }
        actions.push({
            resource,
            action,
            apiEndpoint,
            ...(entry['skillRecipeExempt'] === true ? { skillRecipeExempt: true } : {}),
        });
    }

    function visit(node: ts.Node): void {
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text.endsWith('Actions') &&
            node.initializer !== undefined
        ) {
            // `[...] as const satisfies readonly ActionSpec[]` parses as
            // SatisfiesExpression(AsExpression(ArrayLiteral)). Unwrapping only
            // `as` used to leave the satisfies wrapper in place, the array
            // literal went unseen, and this function returned [] — which gates
            // C, C2-reverse and D read as "nothing to check" and pass.
            let arrayNode: ts.Node = node.initializer;
            for (;;) {
                if (
                    ts.isAsExpression(arrayNode) ||
                    ts.isSatisfiesExpression(arrayNode) ||
                    ts.isParenthesizedExpression(arrayNode)
                ) {
                    arrayNode = arrayNode.expression;
                    continue;
                }
                // `defineActions([...])` — the one wrapper these files use, which
                // keeps `apiEndpoint` literal without spelling every entry's full
                // shape into the emitted declarations. Any OTHER call falls
                // through to the refusal below rather than being guessed at.
                if (
                    ts.isCallExpression(arrayNode) &&
                    ts.isIdentifier(arrayNode.expression) &&
                    arrayNode.expression.text === 'defineActions' &&
                    arrayNode.arguments.length > 0 &&
                    arrayNode.arguments[0] !== undefined
                ) {
                    arrayNode = arrayNode.arguments[0];
                    continue;
                }
                break;
            }
            if (!ts.isArrayLiteralExpression(arrayNode)) {
                // Refuse rather than skip. Every gate downstream is a
                // set-membership test over what this returns, so an
                // unrecognised declaration makes them vacuous instead of
                // failing — the one outcome worse than a parse error.
                throw new Error(
                    `${filePath}: cannot read \`${node.name.text}\` — expected an array literal, found ` +
                        `${ts.SyntaxKind[arrayNode.kind]}. The mapping gates would silently check nothing. ` +
                        `Teach collectActionsFromSource this shape before using it.`,
                );
            }
            for (const element of arrayNode.elements) {
                if (ts.isObjectLiteralExpression(element)) {
                    pushEntry(element);
                    continue;
                }
                // Same failure class as the array-shape check, one level down:
                // a spread would contribute entries this parser cannot see, so
                // every gate would test membership against a short list.
                throw new Error(
                    `${filePath}: \`${node.name.text}\` contains a non-literal element ` +
                        `(${ts.SyntaxKind[element.kind]}). Gates C, C2 and D would check a shorter list ` +
                        `than the array actually holds.`,
                );
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sf);
    return actions;
}
