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
  settings: jsPluginSettings,
});
