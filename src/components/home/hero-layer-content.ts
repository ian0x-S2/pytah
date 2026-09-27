/**
 * Static content behind the hero layer stack: layer ids, tooltip copy and the
 * monochrome palette per theme. Pure module — no Three.js import so the
 * landing shell stays lean while the WebGL scene lazy-loads.
 */

export type HeroLayerId = "markdown" | "mdx" | "slash";

export const HERO_LAYER_COPY: Record<HeroLayerId, string> = {
  markdown: ".md — living skeleton",
  mdx: ".mdx — components in prose",
  slash: "/table — slash commands",
};

export interface HeroPalette {
  /** Edge strokes, caret and strong glyphs. */
  glyph: string;
  /** Secondary text inside faces. */
  muted: string;
  /** Translucent wash behind the markdown skeleton. */
  wash: string;
  washOpacity: number;
  /** Skeleton bars (fill + opacities). */
  bar: string;
  barStrongOpacity: number;
  barOpacity: number;
  /** Filled base tile. */
  baseFill: string;
  baseGlyph: string;
  /** Extruded block under each tile — stepped away from the app background. */
  extrusion: string;
}

export function heroPalette(theme: "light" | "dark"): HeroPalette {
  return theme === "dark"
    ? {
        bar: "#fafafa",
        barOpacity: 0.22,
        barStrongOpacity: 0.55,
        baseFill: "#fafafa",
        baseGlyph: "#0a0a0a",
        extrusion: "#404040",
        glyph: "#fafafa",
        muted: "#a1a1a1",
        wash: "#ffffff",
        washOpacity: 0.08,
      }
    : {
        bar: "#09090b",
        barOpacity: 0.18,
        barStrongOpacity: 0.5,
        baseFill: "#09090b",
        baseGlyph: "#fafafa",
        extrusion: "#d4d4d8",
        glyph: "#09090b",
        muted: "#71717a",
        wash: "#09090b",
        washOpacity: 0.05,
      };
}
