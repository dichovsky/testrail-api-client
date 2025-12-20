import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/*.js", "**/*.d.ts", "dist/**/*", "coverage/**/*"],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    // This preset enables type-aware rules using parserOptions.project; we've evaluated the performance impact and consider it acceptable for this codebase.
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            project: "./tsconfig.eslint.json",
        },
    },

    rules: {
        // TypeScript specific rules
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-unsafe-argument": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-unsafe-return": "error",
        "@typescript-eslint/prefer-as-const": "error",
        "@typescript-eslint/prefer-readonly": "error",
        "@typescript-eslint/require-await": "error",
        "@typescript-eslint/restrict-template-expressions": "error",
        "@typescript-eslint/strict-boolean-expressions": "error",
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        
        // Code quality rules
        "prefer-const": "error",
        "no-var": "error",
        "eqeqeq": "error",
        "no-console": "warn",
        "no-debugger": "error",
        "no-alert": "error",
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
        "no-proto": "error",
        "no-iterator": "error",
        "no-caller": "error",
        "no-extend-native": "error",
        
        // Security rules
        "no-new-wrappers": "error",
        "no-constructor-return": "error",
        
        // Performance rules
        "no-await-in-loop": "warn",
        
        // Style rules
        "prefer-template": "error",
        "object-shorthand": "error",
        "prefer-arrow-callback": "error",
        
        // Legacy overrides (removed)
        "@typescript-eslint/no-var-requires": "off", // Not applicable for ES modules
    },
}, {
    // Less strict rules for test files
    files: ["tests/**/*"],
    rules: {
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
    },
}];