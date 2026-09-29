import { motion, useReducedMotion } from "framer-motion";
import { BoldIcon, CheckIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Isometric editor stack. Four opaque plates tell the product story
 * bottom-up: an empty compose canvas, lego node blocks, the live document
 * surface with its caret and `/` trigger, and the floating toolbar. Hovering
 * explodes the stack apart with a spring.
 */
const LAYERS = [
  { key: "base", lift: 0 },
  { key: "nodes", lift: 32 },
  { key: "surface", lift: 64 },
  { key: "toolbar", lift: 96 },
];

export function HoverLayerStack({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  const layerVariants = {
    lift: (lift: number) => ({
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { damping: 22, stiffness: 200, type: "spring" as const },
      z: lift,
    }),
    // rest keeps the stack slightly open (45%) so every plate peeks out;
    // hover explodes it to full depth. Near-critically damped drop so the
    // settling overshoot never dips below the base plane.
    rest: (lift: number) => ({
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { damping: 28, stiffness: 200, type: "spring" as const },
      z: lift * 0.45,
    }),
  };

  return (
    <motion.div
      animate="rest"
      className={cn("relative max-w-full cursor-pointer", className)}
      initial="rest"
      style={{ perspective: 1200 }}
      whileHover="lift"
      whileTap="lift"
    >
      <div
        aria-hidden="true"
        className="absolute inset-6 rounded-full bg-foreground/10 blur-3xl"
      />
      <div
        style={{
          transform: "rotateX(55deg) rotateZ(-45deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="relative size-32 sm:size-36"
          style={{ transformStyle: "preserve-3d" }}
        >
          {LAYERS.map((layer, i) => (
            <motion.div
              className={cn(
                "absolute inset-0 rounded-xl border shadow-lg",
                i === 0 ? "border-border bg-muted" : "border-border bg-card"
              )}
              custom={layer.lift}
              key={layer.key}
              style={{ transformStyle: "preserve-3d" }}
              variants={layerVariants}
            >
              {i === 0 && (
                <div
                  aria-hidden="true"
                  className="absolute inset-4 rounded-lg border border-dashed border-foreground/25"
                />
              )}
              {i === 1 && (
                <div
                  aria-hidden="true"
                  className="grid h-full grid-cols-2 content-center gap-1.5 p-4"
                >
                  <div className="h-6 rounded-md bg-foreground/15" />
                  <div className="h-6 rounded-md bg-foreground/25" />
                  <div className="h-6 rounded-md bg-foreground/70" />
                  <div className="h-6 rounded-md bg-foreground/15" />
                </div>
              )}
              {i === 2 && (
                <div
                  aria-hidden="true"
                  className="flex h-full flex-col justify-center gap-1.5 p-3"
                >
                  <div className="flex items-center gap-1">
                    <div className="size-1.5 rounded-full bg-foreground/30" />
                    <div className="size-1.5 rounded-full bg-foreground/30" />
                    <div className="size-1.5 rounded-full bg-foreground/30" />
                    <div className="ml-1 h-1.5 w-8 rounded-full bg-foreground/15" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-1/2 rounded-full bg-foreground/70" />
                    <div className="h-3.5 w-px animate-pulse bg-foreground" />
                  </div>
                  <div className="h-1.5 w-3/4 rounded-full bg-foreground/25" />
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1/3 rounded-full bg-foreground/20" />
                    <div className="flex size-4 items-center justify-center rounded-full border border-foreground/30 font-mono text-xs leading-none text-muted-foreground">
                      /
                    </div>
                  </div>
                </div>
              )}
              {i === 3 && (
                <div
                  aria-hidden="true"
                  className="flex h-full items-center justify-center p-2"
                >
                  <div className="flex items-center gap-1 rounded-lg bg-foreground px-2 py-1 shadow-md">
                    <BoldIcon className="size-3 text-background" />
                    <ItalicIcon className="size-3 text-background" />
                    <UnderlineIcon className="size-3 text-background" />
                    <div className="h-3 w-px bg-background/30" />
                    <CheckIcon className="size-3 text-background" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default HoverLayerStack;
