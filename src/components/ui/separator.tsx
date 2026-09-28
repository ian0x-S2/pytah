"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      /*
       * Vertical separators take their height from the caller (`h-4`, `h-5`,
       * …) and are centered by the parent's `items-center`. The primitive
       * previously shipped `data-vertical:self-stretch`, which — combined
       * with a definite height — made flexbox fall back to `flex-start`
       * alignment and pushed toolbar separators to the top of their row.
       */
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px",
        className
      )}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  );
}

export { Separator };
