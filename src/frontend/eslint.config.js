// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
    // ✅ TypeScript files
    {
        files: ["**/*.ts"],
        extends: [
            eslint.configs.recommended,
            tseslint.configs.recommended,
            tseslint.configs.stylistic,
            angular.configs.tsRecommended,
        ],
        processor: angular.processInlineTemplates,
        rules: {
            // ✅ KEEP your selector rules
            "@angular-eslint/directive-selector": [
                "error",
                {
                    type: "attribute",
                    prefix: "app",
                    style: "camelCase",
                },
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "app",
                    style: "kebab-case",
                },
            ],

            // ✅ TEMPORARY RELAXATIONS (IMPORTANT)
            "@angular-eslint/prefer-inject": "off",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },

    // ✅ HTML templates
    {
        files: ["**/*.html"],
        extends: [
            angular.configs.templateRecommended,
            angular.configs.templateAccessibility,
        ],
        rules: {
            // ✅ Allow *ngIf / *ngFor for now
            "@angular-eslint/template/prefer-control-flow": "off",
        },
    },
]);
