import { deepStrictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { computeNextSize, type ResizeState } from "./resize-geometry";

const createState = (overrides: Partial<ResizeState> = {}): ResizeState => ({
  currentHeight: 0,
  currentWidth: 0,
  direction: "se",
  isResizing: true,
  ratio: 2,
  startHeight: 200,
  startWidth: 400,
  startX: 0,
  startY: 0,
  ...overrides,
});

describe("computeNextSize", () => {
  test("corner drag locks the aspect ratio", () => {
    const size = computeNextSize(createState(), 100, 0, 1, 800);
    deepStrictEqual(size, { height: 250, width: 500 });
  });

  test("west corner drag grows in the opposite direction", () => {
    const size = computeNextSize(
      createState({ direction: "nw" }),
      -100,
      0,
      1,
      800
    );
    deepStrictEqual(size, { height: 250, width: 500 });
  });

  test("north edge drag resizes height only", () => {
    const size = computeNextSize(
      createState({ direction: "n" }),
      999,
      -80,
      1,
      800
    );
    deepStrictEqual(size, { height: 280, width: 400 });
  });

  test("south edge drag resizes height only", () => {
    const size = computeNextSize(
      createState({ direction: "s" }),
      999,
      60,
      1,
      800
    );
    deepStrictEqual(size, { height: 260, width: 400 });
  });

  test("east edge drag resizes width only", () => {
    const size = computeNextSize(
      createState({ direction: "e" }),
      150,
      999,
      1,
      800
    );
    deepStrictEqual(size, { height: 200, width: 550 });
  });

  test("width clamps to the container maximum on edges and corners", () => {
    const edge = computeNextSize(
      createState({ direction: "e" }),
      9999,
      0,
      1,
      600
    );
    deepStrictEqual(edge.width, 600);

    const corner = computeNextSize(createState(), 9999, 0, 1, 600);
    deepStrictEqual(corner.width, 600);
    deepStrictEqual(corner.height, 300);
  });

  test("edge drags respect minimum sizes", () => {
    const height = computeNextSize(
      createState({ direction: "s" }),
      0,
      -9999,
      1,
      800
    );
    deepStrictEqual(height.height, 40);

    const width = computeNextSize(
      createState({ direction: "w" }),
      9999,
      0,
      1,
      800
    );
    deepStrictEqual(width.width, 100);
  });
});
