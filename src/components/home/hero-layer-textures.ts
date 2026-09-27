import { SRGBColorSpace, TextureLoader } from "three";
import type { Texture } from "three";

import type { HeroPalette } from "./hero-layer-content";

/**
 * SVG face artwork for the hero layer stack. Each plane in the Three.js scene
 * is skinned with one of these SVG → texture maps so labels, the markdown
 * skeleton and the braces glyph stay crisp at any DPR while the geometry,
 * edges and hover motion are real 3D.
 */

const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

function slashSvg(palette: HeroPalette): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect x="0" y="0" width="512" height="512" fill="${palette.wash}" opacity="${palette.washOpacity}"/><text x="236" y="282" text-anchor="middle" font-family="${MONO}" font-size="54"><tspan font-weight="700" fill="${palette.glyph}">/</tspan><tspan dx="12" fill="${palette.muted}">table</tspan></text></svg>`;
}

function markdownSvg(palette: HeroPalette): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect x="0" y="0" width="512" height="512" fill="${palette.wash}" opacity="${palette.washOpacity}"/><rect x="96" y="118" width="212" height="18" rx="9" fill="${palette.bar}" opacity="${palette.barStrongOpacity}"/><rect x="96" y="156" width="320" height="12" rx="6" fill="${palette.bar}" opacity="${palette.barOpacity}"/><rect x="96" y="182" width="272" height="12" rx="6" fill="${palette.bar}" opacity="${palette.barOpacity}"/><rect x="96" y="208" width="224" height="12" rx="6" fill="${palette.bar}" opacity="${palette.barOpacity}"/><text x="256" y="452" text-anchor="middle" font-family="${MONO}" font-size="34" fill="${palette.muted}">.md</text></svg>`;
}

function mdxSvg(palette: HeroPalette): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect x="0" y="0" width="512" height="512" fill="${palette.baseFill}"/><text x="256" y="300" text-anchor="middle" font-family="${MONO}" font-size="112" fill="${palette.baseGlyph}">{}</text><text x="256" y="452" text-anchor="middle" font-family="${MONO}" font-size="34" opacity="0.8" fill="${palette.baseGlyph}">.mdx</text></svg>`;
}

const textureLoader = new TextureLoader();

function renderSvg(svg: string): Promise<Texture> {
  const url = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  );

  const load = async (): Promise<Texture> => {
    try {
      const texture = await textureLoader.loadAsync(url);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 4;
      return texture;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return load();
}

export interface HeroTextures {
  markdown: Texture;
  mdx: Texture;
  slash: Texture;
}

export async function loadHeroTextures(
  palette: HeroPalette
): Promise<{ dispose: () => void; textures: HeroTextures }> {
  const [slash, markdown, mdx] = await Promise.all([
    renderSvg(slashSvg(palette)),
    renderSvg(markdownSvg(palette)),
    renderSvg(mdxSvg(palette)),
  ]);

  const textures = { markdown, mdx, slash };

  return {
    dispose: () => {
      for (const texture of Object.values(textures)) {
        texture.dispose();
      }
    },
    textures,
  };
}
