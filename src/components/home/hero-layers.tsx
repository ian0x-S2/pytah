import { BracesIcon, MousePointer2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Isometric document-layer stack (Tier-A pure CSS art). The reference DNA —
 * floating planes, satellite format chips on hairline connectors, a cursor —
 * rendered in the locked monochrome system: ink strokes, one filled base
 * tile, lowercase canonical extensions. Alive through product content, not
 * decoration: a Markdown skeleton on the middle plane, a live slash hint
 * with a blinking caret on the top plane, one slow float. All motion is
 * `motion-safe` only — reduced-motion users get the composed static stack.
 */
export function HeroLayers({ className }: { className?: string }) {
  return (
    <figure
      aria-label="Isometric stack of document layers: markdown, MDX, HTML and TSX"
      className={cn("lg:col-span-5", className)}
    >
      <div className="motion-safe:animate-hero-float">
        <div
          aria-hidden="true"
          className="relative mx-auto aspect-[4/5] w-full max-w-[400px] [perspective:1400px]"
        >
          <div className="absolute inset-0 [transform:rotateX(55deg)_rotateZ(45deg)] [transform-style:preserve-3d]">
            {/* Top plane — live slash hint */}
            <div className="absolute top-[4%] left-1/2 aspect-square w-[44%] -translate-x-1/2 [transform:translateZ(130px)] border border-foreground/25 bg-transparent">
              <div className="absolute inset-0 flex items-center justify-center gap-1 font-mono text-xs">
                <span className="font-semibold text-foreground">/</span>
                <span className="text-muted-foreground">table</span>
                <span className="h-4 w-1.5 rounded-sm bg-foreground motion-safe:animate-caret-blink" />
              </div>
            </div>

            {/* Middle plane — markdown skeleton */}
            <div className="absolute top-[30%] left-1/2 aspect-square w-[44%] -translate-x-1/2 [transform:translateZ(65px)] border border-foreground/35 bg-foreground/[0.04]">
              <div className="absolute inset-x-[18%] top-[20%] space-y-1.5">
                <div className="h-1.5 w-2/3 rounded-sm bg-foreground/50" />
                <div className="h-1 rounded-sm bg-foreground/20" />
                <div className="h-1 w-5/6 rounded-sm bg-foreground/20" />
                <div className="h-1 w-2/3 rounded-sm bg-foreground/20" />
              </div>
              <span className="absolute inset-x-0 bottom-[8%] text-center font-mono text-xs tracking-wide text-muted-foreground">
                .md
              </span>
            </div>

            {/* Base plane — filled, with extruded edge beneath */}
            <div className="absolute top-[56%] left-1/2 aspect-square w-[44%] -translate-x-1/2 [transform:translateZ(-16px)] border border-foreground/10 bg-foreground/15" />
            <div className="absolute top-[56%] left-1/2 aspect-square w-[44%] -translate-x-1/2 [transform:translateZ(0px)] border border-primary bg-primary text-primary-foreground">
              <BracesIcon className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2" />
              <span className="absolute inset-x-0 bottom-[8%] text-center font-mono text-xs tracking-wide opacity-80">
                .mdx
              </span>
            </div>

            {/* Left satellite — HTML, floating above the middle plane */}
            <div className="absolute top-[47%] right-[72%] flex [transform:translateZ(100px)] items-center">
              <div className="flex aspect-square w-12 items-center justify-center border border-border/70 bg-background font-mono text-xs text-muted-foreground">
                .html
              </div>
              <div className="h-px w-8 bg-foreground/25" />
            </div>

            {/* Right satellite — TSX, floating above the base plane */}
            <div className="absolute top-[65%] left-[72%] flex [transform:translateZ(45px)] items-center">
              <div className="h-px w-8 bg-foreground/25" />
              <div className="flex aspect-square w-12 items-center justify-center border border-border/70 bg-background font-mono text-xs text-muted-foreground">
                .tsx
              </div>
            </div>
          </div>

          <MousePointer2Icon
            className="absolute top-[11%] left-[74%] size-4 text-foreground"
            fill="currentColor"
          />
        </div>
      </div>
    </figure>
  );
}
