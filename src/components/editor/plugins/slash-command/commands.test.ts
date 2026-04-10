import { deepStrictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { resolveEditorFeatures } from "../../core/composition";
import { getEnabledSlashCommands } from "./commands";

describe("slash command feature gating", () => {
  test("removes commands whose backing features are disabled", () => {
    const commands = getEnabledSlashCommands(
      resolveEditorFeatures({
        collapsible: false,
        images: false,
        layouts: false,
        tables: false,
        youtube: false,
      })
    );

    deepStrictEqual(
      commands.map(({ id }) => id),
      [
        "paragraph",
        "h1",
        "h2",
        "h3",
        "quote",
        "code",
        "bullet",
        "number",
        "check",
        "hr",
      ]
    );
  });
});
