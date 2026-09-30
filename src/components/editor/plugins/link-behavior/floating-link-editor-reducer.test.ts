// State-machine coverage for the floating link editor. Plugin-level DOM
// coverage (popover mounting, virtual anchoring, outside-press dismissal)
// intentionally does not live in this suite: any test file that pulls the
// editor's React/popover graph into the happy-dom runner shifts top-level
// await timing enough to break sibling DOM files (register collisions and
// `describe() inside another test`, see oven-sh/bun#5090). It is verified
// end-to-end against a real browser via a throwaway CDP script instead —
// select text, click Link, assert the popover appears ~6px under the
// selection and survives Enter/Esc/outside-press.
import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import {
  FLOATING_LINK_EDITOR_INITIAL_STATE,
  floatingLinkEditorReducer,
} from "./floating-link-editor-reducer";
import type { FloatingLinkEditorState } from "./floating-link-editor-reducer";
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

describe("floatingLinkEditorReducer", () => {
  test("keeps edit mode when a sync arrives with a null anchor", () => {
    // Explicit open (toolbar link toggle / Cmd+K) followed by a sync whose
    // anchor read came back null — e.g. the native selection was lost in a
    // toolbar-mousedown focus transition. The URL input must stay open.
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
        anchor: null,
        isLink: true,
        linkText: "collectui",
        linkUrl: LINK_PLACEHOLDER_URL,
      },
      type: "sync",
    });

    strictEqual(synced.isLink, true);
    strictEqual(synced.isLinkEditMode, true);
    deepStrictEqual(synced.anchor, ANCHOR);
    strictEqual(synced.editedLinkUrl, LINK_PLACEHOLDER_URL);
    strictEqual(synced.editedLinkText, "collectui");
  });

  test("adopts a fresh anchor from sync", () => {
    const next = { ...ANCHOR, left: 10, top: 20 };
    const synced = floatingLinkEditorReducer(linkedState(), {
      payload: {
        anchor: next,
        isLink: true,
        linkText: "collectui",
        linkUrl: LINK_PLACEHOLDER_URL,
      },
      type: "sync",
    });

    deepStrictEqual(synced.anchor, next);
  });

  test("an identical anchor keeps state identity", () => {
    const synced = floatingLinkEditorReducer(linkedState(), {
      payload: {
        anchor: { ...ANCHOR },
        isLink: true,
        linkText: "collectui",
        linkUrl: LINK_PLACEHOLDER_URL,
      },
      type: "sync",
    });

    strictEqual(synced.anchor, ANCHOR);
  });

  test("sync refreshes the text draft only while not editing", () => {
    const synced = floatingLinkEditorReducer(linkedState(), {
      payload: {
        anchor: ANCHOR,
        isLink: true,
        linkText: "fresh text",
        linkUrl: LINK_PLACEHOLDER_URL,
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
        anchor: ANCHOR,
        isLink: true,
        linkText: "fresh text",
        linkUrl: LINK_PLACEHOLDER_URL,
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
      payload: { anchor: null, isLink: false, linkText: "", linkUrl: "" },
      type: "sync",
    });

    strictEqual(synced.isLink, false);
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
