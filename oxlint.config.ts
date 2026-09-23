import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";

// react-doctor only: skip eslint-plugin-github and eslint-plugin-sonarjs to
// stay on the fast native path plus a single JS plugin pass. Tests run on
// node:test (not vitest/jest), so no test-framework preset is extended.
const jsPlugins = selectJsPlugins(["react-doctor"]);

export default defineConfig({
  extends: [core, react, shadcn, jsPlugins],
  ignorePatterns: core.ignorePatterns,
  jsPlugins: [...(jsPlugins.jsPlugins ?? []), ...(shadcn.jsPlugins ?? [])],
  rules: {
    // Lexical's idiom is `export function $createXNode/$isXNode` factories;
    // function declarations also hoist across the node files' circular
    // imports, so the preset's "expression" style does not fit this codebase.
    "func-style": "off",
    // Plugins export `export function *Plugin` components and memo-wrapped
    // arrows (`export const X = memo(({...}) => ...)`); neither converts
    // mechanically, so the arrow-function component style is not enforced.
    "react/function-component-definition": "off",
    // `ContentEditable__root` (Lexical playground convention) and
    // `editor-draggable-block-menu` are unstyled JS hooks, not design tokens:
    // an empty `@utility` is a Tailwind build error, so they are allowlisted.
    "shadcn/no-unknown-classes": [
      "error",
      { allow: ["ContentEditable__root", "editor-draggable-block-menu"] },
    ],
  },
  settings: jsPluginSettings,
});
