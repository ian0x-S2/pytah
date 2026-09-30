import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { EMPTY_POSITION } from "./floating-link-editor-position";
import {
  FLOATING_LINK_EDITOR_INITIAL_STATE,
  floatingLinkEditorReducer,
} from "./floating-link-editor-reducer";
import type { FloatingLinkEditorState } from "./floating-link-editor-reducer";
import { LINK_PLACEHOLDER_URL } from "./utils";

const ANCHORED_POSITION = { left: 120, top: 240 };

const linkedState = (
  overrides: Partial<FloatingLinkEditorState> = {}
): FloatingLinkEditorState => ({
  ...FLOATING_LINK_EDITOR_INITIAL_STATE,
  isLink: true,
  linkText: "collectui",
  linkUrl: LINK_PLACEHOLDER_URL,
  position: ANCHORED_POSITION,
  ...overrides,
});

describe("floatingLinkEditorReducer", () => {
  test("keeps edit mode when a sync arrives with an empty position", () => {
    // Explicit open (toolbar link toggle / Cmd+K) followed by a sync whose
    // position read came back empty — e.g. the native selection was lost in
    // a toolbar-mousedown focus transition. The URL input must stay open.
    const opened = floatingLinkEditorReducer(linkedState(), {
      payload: {
        editedLinkText: "collectui",
        editedLinkUrl: LINK_PLACEHOLDER_URL,
      },
      type: "open-edit-mode",
    });
    strictEqual(opened.isLinkEditMode, true);

    const synced = floatingLinkEditorReducer(opened, {
      payload: {
        isLink: true,
        linkText: "collectui",
        linkUrl: LINK_PLACEHOLDER_URL,
        position: EMPTY_POSITION,
      },
      type: "sync",
    });

    strictEqual(synced.isLink, true);
    strictEqual(synced.isLinkEditMode, true);
    deepStrictEqual(synced.position, ANCHORED_POSITION);
    strictEqual(synced.editedLinkUrl, LINK_PLACEHOLDER_URL);
    strictEqual(synced.editedLinkText, "collectui");
  });

  test("adopts a fresh non-empty position from sync", () => {
    const next = { left: 10, top: 20 };
    const synced = floatingLinkEditorReducer(linkedState(), {
      payload: {
        isLink: true,
        linkText: "collectui",
        linkUrl: LINK_PLACEHOLDER_URL,
        position: next,
      },
      type: "sync",
    });

    deepStrictEqual(synced.position, next);
  });

  test("sync refreshes the text draft only while not editing", () => {
    const synced = floatingLinkEditorReducer(linkedState(), {
      payload: {
        isLink: true,
        linkText: "fresh text",
        linkUrl: LINK_PLACEHOLDER_URL,
        position: ANCHORED_POSITION,
      },
      type: "sync",
    });
    strictEqual(synced.linkText, "fresh text");
    strictEqual(synced.editedLinkText, "fresh text");

    const opened = floatingLinkEditorReducer(synced, {
      payload: { editedLinkText: "draft" },
      type: "open-edit-mode",
    });
    const resynced = floatingLinkEditorReducer(opened, {
      payload: {
        isLink: true,
        linkText: "fresh text",
        linkUrl: LINK_PLACEHOLDER_URL,
        position: ANCHORED_POSITION,
      },
      type: "sync",
    });
    strictEqual(resynced.editedLinkText, "draft");
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

  test("a selection leaving the link still closes the editor", () => {
    const opened = floatingLinkEditorReducer(linkedState(), {
      type: "open-edit-mode",
    });

    const synced = floatingLinkEditorReducer(opened, {
      payload: {
        isLink: false,
        linkText: "",
        linkUrl: "",
        position: EMPTY_POSITION,
      },
      type: "sync",
    });

    strictEqual(synced.isLink, false);
  });

  test("explicit close actions keep working", () => {
    const opened = floatingLinkEditorReducer(
      FLOATING_LINK_EDITOR_INITIAL_STATE,
      {
        payload: { editedLinkUrl: LINK_PLACEHOLDER_URL },
        type: "open-edit-mode",
      }
    );
    strictEqual(
      floatingLinkEditorReducer(opened, { type: "close-edit-mode" })
        .isLinkEditMode,
      false
    );
    const closed = floatingLinkEditorReducer(opened, {
      type: "close-link-editor",
    });
    strictEqual(closed.isLink, false);
    strictEqual(closed.isLinkEditMode, false);
  });
});
