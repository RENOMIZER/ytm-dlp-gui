import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  {
    rules: {
      curly: ["error", "multi-line"],
      eqeqeq: "error",
      "func-style": ["error", "expression"],
      "dot-notation": "error",
      "no-unused-vars": ["warn", { "varsIgnorePattern": "^_" }]
    }
  }
];