import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import type * as React from "react";

import { cn } from "@/lib/utils";

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        "pointer-events-none flex touch-none p-px opacity-0 transition-opacity select-none data-hovering:pointer-events-auto data-hovering:opacity-100 data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-0 data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:border-t data-[orientation=horizontal]:border-t-transparent data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:border-l data-[orientation=vertical]:border-l-transparent",
        className
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="relative flex-1 rounded-full bg-border"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

function ScrollArea({
  className,
  viewportClassName,
  viewportProps,
  viewportRender,
  hideHorizontalScrollbar = false,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  viewportClassName?: string;
  /**
   * Extra props merged onto the viewport, winning over ScrollArea defaults.
   * Useful in `viewportRender` mode to restore semantics the merge would
   * otherwise clobber (e.g. a listbox role).
   */
  viewportProps?: Omit<
    React.ComponentProps<"div">,
    "children" | "className" | "ref"
  >;
  /**
   * Renders the viewport as another scrollable primitive (e.g. a select list
   * or a cmdk list) so that primitive keeps owning keyboard navigation and
   * scroll-into-view while the shared custom scrollbar is used. The element
   * already carries its children; `children` is ignored in this mode.
   */
  viewportRender?: React.ReactElement;
  /**
   * Clips horizontal overflow on the viewport and skips rendering the
   * horizontal scrollbar. The `!important` class wins over the Base UI
   * default inline `overflow: scroll`, which a plain utility cannot
   * override. Use for menus and lists that must only ever scroll
   * vertically.
   */
  hideHorizontalScrollbar?: boolean;
}) {
  const viewportOverflowClassName = hideHorizontalScrollbar
    ? "overflow-x-hidden!"
    : undefined;

  return (
    <ScrollAreaPrimitive.Root
      className={cn("relative overflow-hidden", className)}
      data-slot="scroll-area"
      {...props}
    >
      {viewportRender ? (
        <ScrollAreaPrimitive.Viewport
          className={cn(
            "size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
            viewportOverflowClassName,
            viewportClassName
          )}
          data-slot="scroll-area-viewport"
          {...viewportProps}
          render={viewportRender}
        />
      ) : (
        <ScrollAreaPrimitive.Viewport
          className={cn(
            "size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
            viewportOverflowClassName,
            viewportClassName
          )}
          data-slot="scroll-area-viewport"
          {...viewportProps}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
      )}
      <ScrollBar />
      {!hideHorizontalScrollbar && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export { ScrollArea, ScrollBar };
