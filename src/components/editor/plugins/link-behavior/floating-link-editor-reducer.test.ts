// State-machine coverage for the floating link editor. Plugin-level DOM
// coverage (popover mounting, virtual anchoring, hover bridging) does not
// live in this suite: any test file that pulls the editor's React/popover
// graph into the happy-dom runner shifts top-level await timing enough to
// break sibling DOM files (register collisions and `describe() inside
// another test`, see oven-sh/bun#5090). It is verified end-to-end against a
// real browser via a throwaway CDP script instead — hover a link, assert
// the chip appears under it, click Edit, type, press Enter.
import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import {
  FLOATING_LINK_EDITOR_INITIAL_STATE,
  floatingLinkEditorReducer,
} from "./floating-link-editor-reducer";
import type {
  FloatingLinkEditorState,
  FloatingLinkPreviewTarget,
} from "./floating-link-editor-reducer";
import { LINK_PLACEHOLDER_URL } from "./utils";

const ANCHOR = {
  bottom: 260,
  height: 20,
  left: 120,
  right: 260,
  top: 240,
  width: 140,
  x: 120,
  y: 240,
};

const NEXT_ANCHOR = { ...ANCHOR, left: 300, top: 400 };

const HOVER_TARGET: FloatingLinkPreviewTarget = {
  anchor: ANCHOR,
  linkKey: "1",
  linkText: "collectui",
  linkUrl: "https://collectui.com",
};

const linkedState = (
  overrides: Partial<FloatingLinkEditorState> = {}
): FloatingLinkEditorState => ({
  ...FLOATING_LINK_EDITOR_INITIAL_STATE,
  anchor: ANCHOR,
  isLink: true,
  linkText: "collectui",
  linkUrl: LINK_PLACEHOLDER_URL,
  ...overrides,
});

const syncPayload = (
  overrides: Partial<
    Parameters<typeof floatingLinkEditorReducer>[1] extends never
      ? never
      : {
          anchor: FloatingLinkEditorState["anchor"];
          isLink: boolean;
          linkText: string;
          linkUrl: string;
        }
  > = {}
) => ({
  anchor: ANCHOR,
  isLink: true,
  linkText: "collectui",
  linkUrl: LINK_PLACEHOLDER_URL,
  ...overrides,
});

describe("floatingLinkEditorReducer", () => {
  test("starts closed", () => {
    strictEqual(FLOATING_LINK_EDITOR_INITIAL_STATE.surface, "closed");
    strictEqual(FLOATING_LINK_EDITOR_INITIAL_STATE.hoverTarget, null);
  });

  test("hover-link opens the preview surface with the target", () => {
    const state = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      { payload: HOVER_TARGET, type: "hover-link" }
    );

    strictEqual(state.surface, "preview");
    deepStrictEqual(state.hoverTarget, HOVER_TARGET);
    deepStrictEqual(state.anchor, ANCHOR);
    strictEqual(state.editedLinkText, "collectui");
    strictEqual(state.editedLinkUrl, "https://collectui.com");
  });

  test("hovering the same link with the same rect is a no-op", () => {
    const preview = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      { payload: HOVER_TARGET, type: "hover-link" }
    );
    const rehovered = floatingLinkEditorReducer(preview, {
      payload: { ...HOVER_TARGET, anchor: { ...ANCHOR } },
      type: "hover-link",
    });

    strictEqual(rehovered, preview);
  });

  test("hovering another link re-targets the chip", () => {
    const preview = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      { payload: HOVER_TARGET, type: "hover-link" }
    );
    const next = floatingLinkEditorReducer(preview, {
      payload: { ...HOVER_TARGET, anchor: NEXT_ANCHOR, linkKey: "2" },
      type: "hover-link",
    });

    strictEqual(next.hoverTarget?.linkKey, "2");
    deepStrictEqual(next.anchor, NEXT_ANCHOR);
  });

  test("unhover-link closes the preview", () => {
    const preview = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      { payload: HOVER_TARGET, type: "hover-link" }
    );
    const closed = floatingLinkEditorReducer(preview, {
      type: "unhover-link",
    });

    strictEqual(closed.surface, "closed");
    strictEqual(closed.hoverTarget, null);
    strictEqual(closed.anchor, null);
  });

  test("edit mode survives unhover-link (card is not hover-driven)", () => {
    const preview = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      { payload: HOVER_TARGET, type: "hover-link" }
    );
    const editing = floatingLinkEditorReducer(preview, {
      payload: { editedLinkUrl: "https://github.com" },
      type: "open-edit-mode",
    });
    const unhovered = floatingLinkEditorReducer(editing, {
      type: "unhover-link",
    });

    strictEqual(unhovered.surface, "edit");
    strictEqual(unhovered.hoverTarget, null);
    strictEqual(unhovered.isLinkEditMode, true);
  });

  test("the chip's Edit click promotes preview to edit mode", () => {
    const preview = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      { payload: HOVER_TARGET, type: "hover-link" }
    );
    const editing = floatingLinkEditorReducer(preview, {
      payload: {
        editedLinkText: "collectui",
        editedLinkUrl: "https://collectui.com",
      },
      type: "open-edit-mode",
    });

    strictEqual(editing.surface, "edit");
    strictEqual(editing.isLinkEditMode, true);
    strictEqual(editing.editedLinkUrl, "https://collectui.com");
  });

  test("sync keeps the edit card open while the caret stays in the link", () => {
    const editing = floatingLinkEditorReducer(
      linkedState({ isLinkEditMode: true, surface: "edit" }),
      { payload: syncPayload(), type: "sync" }
    );

    strictEqual(editing.surface, "edit");
    strictEqual(editing.isLinkEditMode, true);
  });

  test("sync closes the edit card when the selection leaves the link", () => {
    const editing = floatingLinkEditorReducer(
      linkedState({ isLinkEditMode: true, surface: "edit" }),
      {
        payload: syncPayload({ isLink: false, linkText: "", linkUrl: "" }),
        type: "sync",
      }
    );

    strictEqual(editing.surface, "closed");
    strictEqual(editing.isLinkEditMode, false);
    strictEqual(editing.isLink, false);
  });

  test("sync never re-opens a closed surface (no Escape re-open loop)", () => {
    // Escape closed the card but the caret is still inside the link.
    const closed = linkedState({ anchor: null, surface: "closed" });
    const synced = floatingLinkEditorReducer(closed, {
      payload: syncPayload(),
      type: "sync",
    });

    strictEqual(synced.surface, "closed");
    strictEqual(synced.isLink, true);
  });

  test("sync keeps an open preview when the caret is outside the link", () => {
    // The chip is hover-driven: moving the caret away must not kill it.
    const preview = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      { payload: HOVER_TARGET, type: "hover-link" }
    );
    const synced = floatingLinkEditorReducer(preview, {
      payload: syncPayload({
        isLink: false,
        linkText: "",
        linkUrl: "",
      }),
      type: "sync",
    });

    strictEqual(synced.surface, "preview");
    deepStrictEqual(synced.hoverTarget, HOVER_TARGET);
  });

  test("close-link-editor resets every surface", () => {
    const editing = floatingLinkEditorReducer(
      linkedState({ isLinkEditMode: true, surface: "edit" }),
      { type: "close-link-editor" }
    );

    strictEqual(editing.surface, "closed");
    strictEqual(editing.isLinkEditMode, false);
    strictEqual(editing.anchor, null);

    const preview = floatingLinkEditorReducer(
      linkedState({
        hoverTarget: HOVER_TARGET,
        surface: "preview",
      }),
      { type: "close-link-editor" }
    );
    strictEqual(preview.surface, "closed");
    strictEqual(preview.hoverTarget, null);
  });

  test("keeps edit mode when a sync arrives with a null anchor before adoption", () => {
    // Explicit open (toolbar link toggle / Cmd+K) whose anchor read came
    // back null — e.g. the native selection was lost in a toolbar-mousedown
    // focus transition. The card must survive until a real anchor arrives.
    const opened = floatingLinkEditorReducer(linkedState(), {
      payload: {
        editedLinkText: "collectui",
        editedLinkUrl: LINK_PLACEHOLDER_URL,
      },
      type: "open-edit-mode",
    });
    strictEqual(opened.isLinkEditMode, true);

    const synced = floatingLinkEditorReducer(opened, {
      payload: syncPayload({ anchor: null }),
      type: "sync",
    });

    strictEqual(synced.surface, "edit");
    strictEqual(synced.isLinkEditMode, true);
  });

  test("set-edited-link-text updates the draft", () => {
    const opened = floatingLinkEditorReducer(linkedState(), {
      type: "open-edit-mode",
    });
    const updated = floatingLinkEditorReducer(opened, {
      payload: "new label",
      type: "set-edited-link-text",
    });
    strictEqual(updated.editedLinkText, "new label");
  });

  test("close-link-editor clears link state and the anchor", () => {
    const opened = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      {
        payload: { editedLinkUrl: LINK_PLACEHOLDER_URL },
        type: "open-edit-mode",
      }
    );
    const closed = floatingLinkEditorReducer(opened, {
      type: "close-link-editor",
    });
    strictEqual(closed.isLink, false);
    strictEqual(closed.isLinkEditMode, false);
    strictEqual(closed.anchor, null);
  });
});
