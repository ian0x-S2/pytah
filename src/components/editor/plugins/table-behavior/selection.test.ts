import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import {
  areSelectionCountsEqual,
  DEFAULT_SELECTION_COUNTS,
  resolveNextMenuIndex,
  resolveSelectionCounts,
} from "./selection";

describe("table behavior selection utils", () => {
  test("resolveNextMenuIndex navigates forward and wraps to start", () => {
    const itemCount = 7;
    strictEqual(resolveNextMenuIndex(0, itemCount, false), 1);
    strictEqual(resolveNextMenuIndex(5, itemCount, false), 6);
    strictEqual(resolveNextMenuIndex(6, itemCount, false), 0);
  });

  test("resolveNextMenuIndex navigates backward and wraps to end", () => {
    const itemCount = 7;
    strictEqual(resolveNextMenuIndex(6, itemCount, true), 5);
    strictEqual(resolveNextMenuIndex(1, itemCount, true), 0);
    strictEqual(resolveNextMenuIndex(0, itemCount, true), 6);
  });

  test("resolveNextMenuIndex handles empty or single item counts", () => {
    strictEqual(resolveNextMenuIndex(0, 0, false), 0);
    strictEqual(resolveNextMenuIndex(0, 1, false), 0);
    strictEqual(resolveNextMenuIndex(0, 1, true), 0);
  });

  test("areSelectionCountsEqual compares row and column dimensions", () => {
    strictEqual(
      areSelectionCountsEqual({ columns: 2, rows: 3 }, { columns: 2, rows: 3 }),
      true
    );
    strictEqual(
      areSelectionCountsEqual({ columns: 2, rows: 3 }, { columns: 1, rows: 3 }),
      false
    );
    strictEqual(
      areSelectionCountsEqual({ columns: 2, rows: 3 }, { columns: 2, rows: 1 }),
      false
    );
  });

  test("resolveSelectionCounts falls back to default on non-table selection", () => {
    deepStrictEqual(resolveSelectionCounts(null), DEFAULT_SELECTION_COUNTS);
  });
});
