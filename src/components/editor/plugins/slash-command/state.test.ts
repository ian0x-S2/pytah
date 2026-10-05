import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { CORE_SLASH_COMMANDS } from "./commands";
import { createInitialSlashCommandState, slashCommandReducer } from "./state";

const COMMANDS = [...CORE_SLASH_COMMANDS];

describe("slash command state", () => {
  test("reopening the menu highlights the first command again", () => {
    const opened = slashCommandReducer(
      createInitialSlashCommandState("paragraph"),
      { payload: { firstCommandId: "paragraph", query: "" }, type: "open" }
    );
    const moved = slashCommandReducer(opened, {
      payload: { commands: COMMANDS, direction: "down" },
      type: "move-selected-command",
    });
    strictEqual(moved.rawSelectedCommandId, "h1");

    const closed = slashCommandReducer(moved, {
      payload: { isOpen: false },
      type: "patch",
    });
    strictEqual(closed.isOpen, false);

    const reopened = slashCommandReducer(closed, {
      payload: { firstCommandId: "paragraph", query: "" },
      type: "open",
    });

    strictEqual(reopened.isOpen, true);
    strictEqual(reopened.rawSelectedCommandId, "paragraph");
  });

  test("typing while the menu stays open keeps the highlight", () => {
    const opened = slashCommandReducer(
      createInitialSlashCommandState("paragraph"),
      { payload: { firstCommandId: "paragraph", query: "" }, type: "open" }
    );
    const moved = slashCommandReducer(opened, {
      payload: { commands: COMMANDS, direction: "down" },
      type: "move-selected-command",
    });

    const narrowed = slashCommandReducer(moved, {
      payload: { firstCommandId: "paragraph", query: "h" },
      type: "open",
    });

    strictEqual(narrowed.query, "h");
    strictEqual(narrowed.rawSelectedCommandId, "h1");
  });

  test("an unchanged open action keeps the same state reference", () => {
    const opened = slashCommandReducer(
      createInitialSlashCommandState("paragraph"),
      { payload: { firstCommandId: "paragraph", query: "" }, type: "open" }
    );

    strictEqual(
      slashCommandReducer(opened, {
        payload: { firstCommandId: "paragraph", query: "" },
        type: "open",
      }),
      opened
    );
  });
});
