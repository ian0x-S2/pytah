import { deepStrictEqual, ok } from "node:assert/strict";
import { describe, test } from "node:test";

import { HERO_LAYER_COPY, heroPalette } from "./hero-layer-content";
import type { HeroLayerId } from "./hero-layer-content";

describe("hero-layer-content", () => {
  test("every layer id has tooltip copy", () => {
    const ids: HeroLayerId[] = ["markdown", "mdx", "slash"];

    for (const id of ids) {
      ok(HERO_LAYER_COPY[id].length > 0, `missing copy for ${id}`);
    }
    deepStrictEqual(Object.keys(HERO_LAYER_COPY).toSorted(), ids.toSorted());
  });

  test("palettes expose the same keys in both themes", () => {
    const light = heroPalette("light");
    const dark = heroPalette("dark");

    deepStrictEqual(
      Object.keys(light).toSorted(),
      Object.keys(dark).toSorted()
    );
    for (const value of Object.values(light)) {
      ok(typeof value === "string" || typeof value === "number");
    }
  });

  test("base tile inverts between themes", () => {
    const light = heroPalette("light");
    const dark = heroPalette("dark");

    ok(light.baseFill !== dark.baseFill);
    ok(light.baseGlyph !== dark.baseGlyph);
  });
});
