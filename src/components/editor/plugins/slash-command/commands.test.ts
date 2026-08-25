import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { computeResolvedSlashCommands } from "../../core/features";
import { CORE_SLASH_COMMANDS } from "./commands";

describe("core slash commands", () => {
  test("ids are unique", () => {
    const ids = CORE_SLASH_COMMANDS.map(({ id }) => id);
    strictEqual(new Set(ids).size, ids.length);
  });

  test("ships the base block types plus divider and table", () => {
    deepStrictEqual(
      CORE_SLASH_COMMANDS.map(({ id }) => id),
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
        "table",
        "hr",
      ]
    );
  });

  test("every core command resolves to a runnable entry", () => {
    const resolved = computeResolvedSlashCommands();

    for (const command of CORE_SLASH_COMMANDS) {
      const entry = resolved.find(
        (candidate) => candidate.command.id === command.id
      );
      strictEqual(Boolean(entry), true, `missing entry: ${command.id}`);
      strictEqual(typeof entry?.run, "function");
    }
  });

  test("feature entries are appended after the core block types", () => {
    const resolved = computeResolvedSlashCommands([
      {
        id: "fake",
        slashCommands: [
          {
            command: {
              description: "Fake",
              icon: (() => null) as never,
              id: "math",
              keywords: [],
              label: "Fake Math",
            },
            run: () => undefined,
          },
        ],
      },
    ]);

    deepStrictEqual(
      resolved.map((entry) => entry.command.id),
      [...CORE_SLASH_COMMANDS.map((command) => command.id), "math"]
    );
  });
});
