import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";

import type { HeroLayerId, HeroPalette } from "./hero-layer-content";
import type { HeroTextures } from "./hero-layer-textures";
import { loadHeroTextures } from "./hero-layer-textures";
import { HeroLayersScene } from "./hero-layers-scene";

export interface HeroLayersCanvasProps {
  hoveredId: HeroLayerId | null;
  onHover: (id: HeroLayerId | null) => void;
  palette: HeroPalette;
  reducedMotion: boolean;
}

/**
 * Lazy-loaded WebGL half of the hero stack (Three.js + R3F + textures).
 * Splitting it out of the landing shell keeps the initial bundle lean; the
 * static SVG twin covers the loading window. The previous texture batch
 * stays mounted while the next one bakes so theme toggles never flash.
 */
export function HeroLayersCanvas({
  hoveredId,
  onHover,
  palette,
  reducedMotion,
}: HeroLayersCanvasProps) {
  const [textures, setTextures] = useState<HeroTextures | null>(null);

  useEffect(() => {
    let cancelled = false;
    let disposeBatch: (() => void) | undefined;

    const bake = async () => {
      try {
        const { dispose, textures: next } = await loadHeroTextures(palette);
        if (cancelled) {
          dispose();
          return;
        }
        disposeBatch = dispose;
        setTextures(next);
      } catch {
        // Texture baking failed — the canvas stays empty over the static twin.
      }
    };

    void bake();

    return () => {
      cancelled = true;
      disposeBatch?.();
    };
  }, [palette]);

  return (
    <Canvas
      camera={{ position: [5, 4.3, 5], zoom: 100 }}
      dpr={[1, 1.75]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#000000", 0);
      }}
      onPointerMissed={() => {
        onHover(null);
      }}
      orthographic
    >
      {textures && (
        <HeroLayersScene
          hoveredId={hoveredId}
          onHover={onHover}
          palette={palette}
          reducedMotion={reducedMotion}
          textures={textures}
        />
      )}
    </Canvas>
  );
}
