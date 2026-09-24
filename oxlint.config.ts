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
        "src/components/editor/editor.tsx",
        "src/components/editor/plugins/block-type-toolbar/plugin.tsx",
        "src/components/editor/plugins/block-type-toolbar/utils.ts",
        "src/components/editor/plugins/floating-toolbar/plugin.tsx",
        "src/components/editor/plugins/markdown/transformers.test.ts",
        "src/pages/demo.tsx",
        "src/components/editor/plugins/full-toolbar/plugin.tsx",
      ],
      rules: {
        "no-useless-undefined": "off",
      },
    },
    {
      // Floating editor chrome owns its own dense appearance (measured
      // popovers, custom paddings); the page-oriented restyle contract
      // does not fit these components — same rationale as the ui/ exemption.
      files: ["src/components/editor/**"],
      rules: {
        "shadcn/no-restyle": "off",
      },
    },
    {
      // Remaining inline styles are dynamic (measured positions, preset
      // geometry, theme-driven colors) with no static class equivalent.
      files: [
        "src/components/docs/primitives.tsx",
        "src/components/editor/plugins/excalidraw/image.tsx",
        "src/components/editor/plugins/floating-toolbar/plugin.tsx",
        "src/components/editor/plugins/layout/preset-dialog.tsx",
        "src/components/editor/plugins/link-behavior/floating-link-editor.tsx",
        "src/components/editor/plugins/table-behavior/plugin.tsx",
        "src/components/editor/ui/color-swatches.tsx",
      ],
      rules: {
        "shadcn/no-inline-styles": "off",
      },
    },
    {
      // Test idioms: flush utilities, stub signatures, fixture URLs and
      // sequential poll loops must keep exact timing/semantics.
      files: ["src/**/*.test.{ts,tsx}"],
      rules: {
        "eslint/no-await-in-loop": "off",
        "eslint/no-script-url": "off",
        "node/callback-return": "off",
        "promise/avoid-new": "off",
        "promise/prefer-await-to-callbacks": "off",
      },
    },
    {
      // Registry scripts are sequential by design (deterministic output,
      // shared server/ports); promisified callback APIs have no equivalent.
      files: ["scripts/**"],
      rules: {
        "eslint/no-await-in-loop": "off",
        "promise/avoid-new": "off",
      },
    },
    {
      // Lexical decorate() needs the runtime component in the node and the
      // runtime $is guard in the component; neither direction is type-only.
      files: [
        "src/components/editor/core/nodes/excalidraw/node.tsx",
        "src/components/editor/core/nodes/image/node.tsx",
        "src/components/editor/core/nodes/math/node.tsx",
        "src/components/editor/plugins/excalidraw/component.tsx",
        "src/components/editor/plugins/image/component.tsx",
        "src/components/editor/plugins/math/component.tsx",
      ],
      rules: {
        "import/no-cycle": "off",
      },
    },
    {
      // KaTeX output is sanitized math markup; rendering requires inner HTML.
      files: ["src/components/editor/plugins/math/component.tsx"],
      rules: {
        "react/no-danger": "off",
      },
    },
    {
      // The exported SVG lives outside React ownership (excalidraw runtime);
      // attribute/style writes are the DOM API, not state misuse.
      files: ["src/components/editor/plugins/excalidraw/image.tsx"],
      rules: {
        "react-doctor/no-direct-state-mutation": "off",
        "react/immutability": "off",
      },
    },
    {
      // Variant factories are public API consumed across the app.
      files: ["src/components/ui/button.tsx", "src/components/ui/toggle.tsx"],
      rules: {
        "react-doctor/only-export-components": "off",
      },
    },
    {
      // Element-mapping table is data, not components.
      files: ["src/components/docs/mdx-components.tsx"],
      rules: {
        "react-doctor/only-export-components": "off",
      },
    },
    {
      // Deliberate setter-less mount-capture cells; a dummy setter would
      // only trade this lint for an unused variable.
      files: [
        "src/components/editor/editor.tsx",
        "src/components/editor/plugins/core/editor-state.tsx",
        "src/components/ui/sidebar.tsx",
      ],
      rules: {
        "react/hook-use-state": "off",
      },
    },
    {
      // The beforematch DOM API requires a callback property assignment.
      files: ["src/components/editor/core/nodes/collapsible/dom-utils.ts"],
      rules: {
        "promise/prefer-await-to-callbacks": "off",
      },
    },
    {
      // Documented intent (see biome-ignore): migrating to the async Cookie
      // Store API changes runtime semantics.
      files: ["src/components/ui/sidebar.tsx"],
      rules: {
        "unicorn/no-document-cookie": "off",
      },
    },
    {
      // Inline shell closes over toc props by design of the documented
      // slots.shell extension surface; hoisting changes reconciliation.
      files: ["src/components/editor/plugins/toc/editor-with-toc.tsx"],
      rules: {
        "react/no-unstable-nested-components": "off",
      },
    },
    {
      // YouTube embeds require scripts; dropping allow-scripts or
      // allow-same-origin breaks playback, so the maximal compatible
      // sandbox stands.
      files: ["src/components/editor/core/nodes/youtube/node.tsx"],
      rules: {
        "react/iframe-missing-sandbox": "off",
      },
    },
    {
      // three.js material props, not CSS: theme tokens do not apply.
      files: ["src/components/home/hero-cube-3d.tsx"],
      rules: {
        "shadcn/no-raw-colors": "off",
      },
    },
    {
      // Full-screen canvas editor with custom Escape semantics (the canvas
      // keeps its own); native dialog would change focus/backdrop behavior.
      files: ["src/components/editor/plugins/excalidraw/modal.tsx"],
      rules: {
        "react-doctor/prefer-html-dialog": "off",
      },
    },
    {
      // Single cohesive cmdk overlay; splitting risks item identity and
      // scroll behavior of this core UX surface.
      files: ["src/components/editor/plugins/slash-command/plugin.tsx"],
      rules: {
        "react-doctor/no-giant-component": "off",
      },
    },
    {
      // Correct ARIA listbox pattern (roving tabindex, aria-selected,
      // container key handler); native select cannot render the options.
      files: ["src/components/editor/plugins/full-toolbar/insert-popover.tsx"],
      rules: {
        "jsx-a11y/interactive-supports-focus": "off",
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      // KaTeX-rendered element acts as button with Enter/Space handling;
      // it cannot be a native button (KaTeX owns the inner HTML).
      files: ["src/components/editor/plugins/math/component.tsx"],
      rules: {
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      // Escape-capturing wrapper and dialog semantics are intentional
      // (canvas keeps its own Escape); see biome-ignore justifications.
      files: ["src/components/editor/plugins/excalidraw/modal.tsx"],
      rules: {
        "jsx-a11y/no-noninteractive-element-interactions": "off",
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      // Hover-intent container for the outline popover; see biome-ignore.
      files: ["src/components/editor/plugins/toc/sidebar.tsx"],
      rules: {
        "jsx-a11y/no-noninteractive-element-interactions": "off",
      },
    },
    {
      // Docs/marketing theme intentionally diverges from the default
      // shadcn density (custom sidebar density, hero spacing): tracked as
      // design-system debt to resolve via explicit variants, not by
      // stripping classes and changing the rendered output.
      files: [
        "src/components/docs/layout.tsx",
        "src/pages/demo.tsx",
        "src/pages/home.tsx",
      ],
      rules: {
        "shadcn/no-restyle": "off",
      },
    },
    {
      // Canonical FileReader promisification; no equivalent API exists.
      files: ["src/components/editor/plugins/image/utils.ts"],
      rules: {
        "promise/avoid-new": "off",
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
    // `twinkleplop` is the theme class from `@twinkleplop/theme-github`
    // (plain CSS import, not a Tailwind utility).
    "shadcn/no-unknown-classes": [
      "error",
      {
        allow: [
          "ContentEditable__root",
          "editor-draggable-block-menu",
          "twinkleplop",
        ],
      },
    ],
  },
  settings: jsPluginSettings,
});
