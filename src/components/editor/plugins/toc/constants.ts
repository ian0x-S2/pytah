import type { TocHeadingStyle } from "./types";

export const OBSERVER_ROOT_MARGIN = "0px 0px -70% 0px";
export const ACTIVE_HEADING_TOP_OFFSET = 120;

export const HEADING_STYLES: Record<string, TocHeadingStyle> = {
  h1: { indent: "pl-0", size: "text-[13px]", weight: "font-medium" },
  h2: { indent: "pl-3", size: "text-[13px]", weight: "font-normal" },
  h3: { indent: "pl-6", size: "text-[12px]", weight: "font-normal" },
  h4: { indent: "pl-9", size: "text-[11px]", weight: "font-normal" },
  h5: { indent: "pl-12", size: "text-[11px]", weight: "font-normal" },
  h6: { indent: "pl-15", size: "text-[11px]", weight: "font-normal" },
};

export const DEFAULT_HEADING_STYLE = HEADING_STYLES.h3;
export const DEFAULT_SCROLL_TOP_OFFSET = 24;
