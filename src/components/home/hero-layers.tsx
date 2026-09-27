import { MousePointer2Icon } from "lucide-react";
import { Component, Suspense, lazy, useEffect, useMemo, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

import { useTheme } from "@/components/theme-context";
import { cn } from "@/lib/utils";

import { HERO_LAYER_COPY, heroPalette } from "./hero-layer-content";
import type { HeroLayerId, HeroPalette } from "./hero-layer-content";

/**
 * Isometric document-layer stack (Tier-A WebGL art). The reference DNA —
 * floating planes, satellite format chips on hairline connectors, a cursor —
 * rendered in the locked monochrome system: ink strokes, one filled base
 * tile, lowercase canonical extensions. Alive through product content, not
 * decoration: a Markdown skeleton on the middle plane, a live slash hint
 * with a blinking caret on the top plane, one slow float.
 *
 * Faces are SVG → texture skins (crisp at any DPR); geometry, edges and
 * motion are real Three.js, lazy-loaded so the landing shell stays lean —
 * the static SVG twin below covers loading, reduced-motion and no-WebGL.
 * Hovering a tile fans it out of the stack — top tile to the left, the
 * ones below to the right — with a tooltip. The
 * palette is re-baked from the resolved theme, so the stack follows the
 * theme toggle.
 */

const HeroLayersCanvas = lazy(async () => {
  const module = await import("./hero-layers-canvas");
  return { default: module.HeroLayersCanvas };
});

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      setReduced(query.matches);
    };

    query.addEventListener("change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}

class WebGLBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const STATIC_MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

function staticTile(cx: number, cy: number, rx = 120, ry = 68): string {
  return `${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}`;
}

/** Static SVG twin of the stack: loading cover, fallback and reference. */
function HeroLayersStatic({ palette }: { palette: HeroPalette }) {
  return (
    <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 400 500">
      <polygon fill={palette.extrusion} points={staticTile(200, 404)} />
      <polygon
        fill={palette.baseFill}
        points={staticTile(200, 392)}
        stroke={palette.baseGlyph}
        strokeOpacity={0.5}
      />
      <text
        fill={palette.baseGlyph}
        fontFamily={STATIC_MONO}
        fontSize={34}
        textAnchor="middle"
        x={200}
        y={404}
      >
        {"{}"}
      </text>
      <text
        fill={palette.baseGlyph}
        fontFamily={STATIC_MONO}
        fontSize={13}
        opacity={0.8}
        textAnchor="middle"
        x={200}
        y={442}
      >
        .mdx
      </text>

      <polygon
        fill={palette.wash}
        fillOpacity={0.05}
        points={staticTile(200, 272)}
        stroke={palette.glyph}
        strokeOpacity={0.5}
      />
      <rect
        fill={palette.glyph}
        height={8}
        opacity={0.5}
        rx={4}
        width={90}
        x={155}
        y={238}
      />
      <rect
        fill={palette.glyph}
        height={6}
        opacity={0.2}
        rx={3}
        width={140}
        x={130}
        y={256}
      />
      <rect
        fill={palette.glyph}
        height={6}
        opacity={0.2}
        rx={3}
        width={120}
        x={140}
        y={270}
      />
      <rect
        fill={palette.glyph}
        height={6}
        opacity={0.2}
        rx={3}
        width={100}
        x={150}
        y={284}
      />
      <text
        fill={palette.muted}
        fontFamily={STATIC_MONO}
        fontSize={13}
        textAnchor="middle"
        x={200}
        y={322}
      >
        .md
      </text>

      <polygon
        fill="none"
        points={staticTile(200, 152)}
        stroke={palette.glyph}
        strokeOpacity={0.5}
      />
      <text
        fontFamily={STATIC_MONO}
        fontSize={17}
        textAnchor="middle"
        x={200}
        y={159}
      >
        <tspan fill={palette.glyph} fontWeight={700}>
          /
        </tspan>
        <tspan dx={4} fill={palette.muted}>
          table
        </tspan>
      </text>
    </svg>
  );
}

export function HeroLayers({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const palette = useMemo(() => heroPalette(resolvedTheme), [resolvedTheme]);
  const reducedMotion = usePrefersReducedMotion();
  const webgl =
    typeof window !== "undefined" && "WebGLRenderingContext" in window;
  const [hoveredId, setHoveredId] = useState<HeroLayerId | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const tooltipStyle = {
    "--hero-tip-x": `${pointer.x + 14}px`,
    "--hero-tip-y": `${pointer.y + 14}px`,
  } as CSSProperties;

  return (
    <figure
      aria-label="Isometric stack of document layers: slash commands, markdown and MDX"
      className={cn("lg:col-span-5", className)}
    >
      <div
        aria-hidden={webgl}
        className={cn(
          "relative mx-auto aspect-[4/5] w-full max-w-[400px]",
          hoveredId && "cursor-pointer"
        )}
        onPointerLeave={() => {
          setHoveredId(null);
        }}
        onPointerMove={handlePointerMove}
      >
        {webgl ? (
          <WebGLBoundary fallback={<HeroLayersStatic palette={palette} />}>
            <Suspense fallback={<HeroLayersStatic palette={palette} />}>
              <HeroLayersCanvas
                hoveredId={hoveredId}
                onHover={setHoveredId}
                palette={palette}
                reducedMotion={reducedMotion}
              />
            </Suspense>
          </WebGLBoundary>
        ) : (
          <HeroLayersStatic palette={palette} />
        )}

        {hoveredId && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-(--hero-tip-y) left-(--hero-tip-x) z-10 rounded-md border border-border bg-popover px-2 py-1 font-mono text-xs whitespace-nowrap text-popover-foreground shadow-md"
            style={tooltipStyle}
          >
            {HERO_LAYER_COPY[hoveredId]}
          </div>
        )}

        <MousePointer2Icon
          className="absolute top-[11%] left-[74%] size-4 text-foreground"
          fill="currentColor"
        />
      </div>
    </figure>
  );
}
