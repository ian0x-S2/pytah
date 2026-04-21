import type { NodeKey } from "lexical";

export type TocHeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface TocHeadingStyle {
  indent: string;
  size: string;
  weight: string;
}

export interface TocState {
  activeKey: NodeKey | null;
  selectedHeadingKey: NodeKey | null;
}
