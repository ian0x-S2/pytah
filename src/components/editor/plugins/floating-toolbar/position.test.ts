import { deepStrictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import {
  clampFloatingToolbarPosition,
  TOOLBAR_VIEWPORT_MARGIN,
} from "./position";

const TOOLBAR = { height: 40, width: 300 };
const VIEWPORT = { height: 600, width: 1200 };

describe("clampFloatingToolbarPosition", () => {
  test("keeps a mid-viewport anchor untouched", () => {
    deepStrictEqual(
      clampFloatingToolbarPosition({
        position: { left: 600, top: 300 },
        toolbar: TOOLBAR,
        viewport: VIEWPORT,
      }),
      { left: 600, top: 300 }
    );
  });

  test("clamps the left viewport edge (selection at line start)", () => {
    // Raw anchor 20px from the left edge would push half the toolbar
    // (~150px) off screen; the clamp keeps the box inside with a margin.
    deepStrictEqual(
      clampFloatingToolbarPosition({
        position: { left: 20, top: 300 },
        toolbar: TOOLBAR,
        viewport: VIEWPORT,
      }),
      { left: TOOLBAR.width / 2 + TOOLBAR_VIEWPORT_MARGIN, top: 300 }
    );
  });

  test("clamps the right viewport edge (selection at line end)", () => {
    deepStrictEqual(
      clampFloatingToolbarPosition({
        position: { left: 1190, top: 300 },
        toolbar: TOOLBAR,
        viewport: VIEWPORT,
      }),
      {
        left: VIEWPORT.width - TOOLBAR.width / 2 - TOOLBAR_VIEWPORT_MARGIN,
        top: 300,
      }
    );
  });

  test("clamps the top viewport edge so the toolbar stays visible", () => {
    // Toolbar renders with translate(-100%) above the anchor; an anchor
    // near the viewport top would push the whole toolbar off screen.
    deepStrictEqual(
      clampFloatingToolbarPosition({
        position: { left: 600, top: 20 },
        toolbar: TOOLBAR,
        viewport: VIEWPORT,
      }),
      { left: 600, top: TOOLBAR.height + TOOLBAR_VIEWPORT_MARGIN }
    );
  });

  test("pins to the left margin when the viewport is narrower than the toolbar", () => {
    deepStrictEqual(
      clampFloatingToolbarPosition({
        position: { left: 100, top: 300 },
        toolbar: TOOLBAR,
        viewport: { height: 600, width: 200 },
      }),
      { left: TOOLBAR.width / 2 + TOOLBAR_VIEWPORT_MARGIN, top: 300 }
    );
  });

  test("respects a custom margin", () => {
    deepStrictEqual(
      clampFloatingToolbarPosition({
        margin: 0,
        position: { left: 100, top: 20 },
        toolbar: TOOLBAR,
        viewport: VIEWPORT,
      }),
      { left: TOOLBAR.width / 2, top: TOOLBAR.height }
    );
  });
});
