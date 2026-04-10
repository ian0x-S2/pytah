import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { SLASH_COMMANDS } from "./commands";
import {
  filterSlashCommands,
  getFirstCommandId,
  getNeighborCommandId,
  getSelectedCommandIndex,
  getSlashQueryMatch,
  hasSelectedCommand,
  SLASH_QUERY_PATTERN,
} from "./utils";

describe("slash command utils", () => {
  test("filters commands by label and keyword", () => {
    deepStrictEqual(
      filterSlashCommands(SLASH_COMMANDS, "hea").map(({ id }) => id),
      ["h1", "h2", "h3"]
    );
    deepStrictEqual(
      filterSlashCommands(SLASH_COMMANDS, "embed").map(({ id }) => id),
      ["youtube"]
    );
  });

  test("returns stable navigation ids", () => {
    const commands = filterSlashCommands(SLASH_COMMANDS, "");
    const firstId = getFirstCommandId(commands);

    strictEqual(firstId, "paragraph");
    strictEqual(getSelectedCommandIndex(commands, "quote") > -1, true);
    strictEqual(getNeighborCommandId(commands, "paragraph", "up"), "paragraph");
    strictEqual(getNeighborCommandId(commands, "paragraph", "down"), "h1");
    strictEqual(hasSelectedCommand(commands, "table"), true);
    strictEqual(hasSelectedCommand(commands, ""), false);
  });

  test("matches only valid slash queries", () => {
    strictEqual(SLASH_QUERY_PATTERN.test("/table"), true);
    strictEqual(getSlashQueryMatch("/table"), "table");
    strictEqual(getSlashQueryMatch("/"), "");
    strictEqual(getSlashQueryMatch("hello /table"), null);
    strictEqual(getSlashQueryMatch("/table now"), null);
  });
});
