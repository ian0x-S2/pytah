import { deepStrictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { resolveEditorFeatures } from "../../core/composition";
import { resolveSlashCommandIds } from "../../core/features";
import { getSlashCommandsForIds } from "./commands";

describe("slash command id resolution", () => {
  test("collects ids for enabled features", () => {
    const ids = resolveSlashCommandIds(
      resolveEditorFeatures({
        collapsible: false,
        images: false,
        layouts: false,
        math: false,
        tables: false,
        youtube: false,
      })
    );

    deepStrictEqual(ids, []);
  });

  test("includes ids contributed by enabled features", () => {
    const ids = resolveSlashCommandIds(
      resolveEditorFeatures({
        collapsible: true,
        images: false,
        layouts: false,
        math: false,
        tables: true,
        youtube: false,
      })
    );

    deepStrictEqual(ids, ["collapsible", "table"]);
  });
});

describe("slash command filtering", () => {
  test("always includes base commands plus enabled feature ids", () => {
    const commands = getSlashCommandsForIds(["math", "table"]);

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
        "math",
        "table",
      ]
    );
  });

  test("keeps base commands even when no feature ids are supplied", () => {
    const commands = getSlashCommandsForIds([]);

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
