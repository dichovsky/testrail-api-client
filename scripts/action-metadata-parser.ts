import ts from 'typescript';
import type { ActionEntry, PaginationMetadata } from './mapping-renderer.js';

/**
 * Extract the mapping-relevant subset of each per-resource `*Actions` array.
 * Kept side-effect free so the parser and its nested pagination handling can
 * be tested without running the filesystem-writing mapping generator.
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

    function paginationValue(node: ts.Node): PaginationMetadata | undefined {
        if (!ts.isObjectLiteralExpression(node)) return undefined;
        const values: Record<string, string | boolean> = {};
        for (const field of node.properties) {
            if (!ts.isPropertyAssignment(field) || !ts.isIdentifier(field.name)) continue;
            const value = literalValue(field.initializer);
            if (value !== undefined) values[field.name.text] = value;
        }
        if (
            (values['response'] === 'envelope' || values['response'] === 'nested-envelope') &&
            typeof values['requestControls'] === 'boolean' &&
            typeof values['collectionKey'] === 'string'
        ) {
            return {
                response: values['response'],
                requestControls: values['requestControls'],
                collectionKey: values['collectionKey'],
            };
        }
        return undefined;
    }

    function pushEntry(el: ts.ObjectLiteralExpression): void {
        const entry: Record<string, string | boolean> = {};
        let pagination: PaginationMetadata | undefined;
        for (const prop of el.properties) {
            if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
            if (prop.name.text === 'pagination') {
                pagination = paginationValue(prop.initializer);
                continue;
            }
            const value = literalValue(prop.initializer);
            if (value !== undefined) entry[prop.name.text] = value;
        }
        const resource = entry['resource'];
        const action = entry['action'];
        const apiEndpoint = entry['apiEndpoint'];
        if (typeof resource === 'string' && typeof action === 'string' && typeof apiEndpoint === 'string') {
            actions.push({
                resource,
                action,
                apiEndpoint,
                ...(entry['skillRecipeExempt'] === true ? { skillRecipeExempt: true } : {}),
                ...(pagination !== undefined ? { pagination } : {}),
            });
        }
    }

    function visit(node: ts.Node): void {
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text.endsWith('Actions') &&
            node.initializer !== undefined
        ) {
            let arrayNode: ts.Node = node.initializer;
            while (ts.isAsExpression(arrayNode)) arrayNode = arrayNode.expression;
            if (ts.isArrayLiteralExpression(arrayNode)) {
                for (const element of arrayNode.elements) {
                    if (ts.isObjectLiteralExpression(element)) pushEntry(element);
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sf);
    return actions;
}
