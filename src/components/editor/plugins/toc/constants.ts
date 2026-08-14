import type { TocHeadingStyle } from "./types";

export const OBSERVER_ROOT_MARGIN = "0px 0px -70% 0px";
export const ACTIVE_HEADING_TOP_OFFSET = 8;

export const HEADING_STYLES: Record<string, TocHeadingStyle> = {
  h1: { indent: "pl-1", size: "text-[12.5px]", weight: "font-medium" },
  h2: { indent: "pl-3.5", size: "text-[12.5px]", weight: "font-normal" },
  h3: { indent: "pl-6", size: "text-[12px]", weight: "font-normal" },
  h4: { indent: "pl-8.5", size: "text-[11.5px]", weight: "font-normal" },
  h5: { indent: "pl-11", size: "text-[11.5px]", weight: "font-normal" },
  h6: { indent: "pl-13.5", size: "text-[11.5px]", weight: "font-normal" },
};

export const DEFAULT_HEADING_STYLE = HEADING_STYLES.h3;
export const DEFAULT_SCROLL_TOP_OFFSET = 24;
