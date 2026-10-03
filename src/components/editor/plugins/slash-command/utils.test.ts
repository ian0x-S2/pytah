import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { CORE_SLASH_COMMANDS } from "./commands";
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
      filterSlashCommands([...CORE_SLASH_COMMANDS], "hea").map(({ id }) => id),
      ["h1", "h2", "h3"]
    );
    deepStrictEqual(
      filterSlashCommands([...CORE_SLASH_COMMANDS], "divider").map(
        ({ id }) => id
      ),
      ["hr"]
    );
  });

  test("returns stable navigation ids", () => {
    const commands = filterSlashCommands([...CORE_SLASH_COMMANDS], "");
    const firstId = getFirstCommandId(commands);

    strictEqual(firstId, "paragraph");
    strictEqual(getSelectedCommandIndex(commands, "quote") > -1, true);
    strictEqual(getNeighborCommandId(commands, "paragraph", "up"), "paragraph");
    strictEqual(getNeighborCommandId(commands, "paragraph", "down"), "h1");
    strictEqual(hasSelectedCommand(commands, "table"), true);
    strictEqual(hasSelectedCommand(commands, ""), false);
  });

  test("moves off a stale selection on the first key press", () => {
    const commands = filterSlashCommands([...CORE_SLASH_COMMANDS], "hea");

    const staleId = "paragraph";
    strictEqual(hasSelectedCommand(commands, staleId), false);
    // Effective highlight is the first filtered item ("h1"); the first
    // arrow-down must land on the *second* item, not re-sync to "h1".
    strictEqual(getNeighborCommandId(commands, staleId, "down"), "h2");
    strictEqual(getNeighborCommandId(commands, staleId, "up"), "h3");
  });

  test("matches only valid slash queries", () => {
    strictEqual(SLASH_QUERY_PATTERN.test("/table"), true);
    strictEqual(getSlashQueryMatch("/table"), "table");
    strictEqual(getSlashQueryMatch("/"), "");
    strictEqual(getSlashQueryMatch("hello /table"), null);
    strictEqual(getSlashQueryMatch("/table now"), null);
  });
});
