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
  overrides: [
    {
      // Every Lexical node defines createDOM/updateDOM/exportDOM/decorate as
      // instance methods overriding the base class; `static` would break the
      // editor's dispatch.
      files: ["src/components/editor/core/nodes/**"],
      rules: {
        "class-methods-use-this": "off",
        // Node files are inherently cyclic (converters reference $create
        // factories that reference the class): no linear order exists.
        "no-use-before-define": "off",
        // `extends DecoratorNode` Lexical nodes are not React class
        // components; converting them would break the editor.
        "react/prefer-function-component": "off",
      },
    },
    {
      // `cleanup` <-> `onScrollEnd`/`handleUserInterrupt` are mutually
      // recursive by design; no definition order satisfies the rule.
      files: ["src/components/editor/plugins/toc/hooks.ts"],
      rules: {
        "no-use-before-define": "off",
      },
    },
    {
      // Lexical's `dispatchCommand` requires an explicit payload argument;
      // the one-argument call does not typecheck.
      files: [
        "src/components/editor/plugins/block-type-toolbar/plugin.tsx",
        "src/components/editor/plugins/full-toolbar/plugin.tsx",
      ],
      rules: {
        "no-useless-undefined": "off",
      },
    },
  ],
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
