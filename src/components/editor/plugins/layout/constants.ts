export interface LayoutPreset {
  description: string;
  label: string;
  value: string;
}

export const DEFAULT_LAYOUT_TEMPLATE = "1fr 1fr";

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    description: "Two equal columns",
    label: "2 columns (equal width)",
    value: "1fr 1fr",
  },
  {
    description: "Sidebar plus content",
    label: "2 columns (25% - 75%)",
    value: "1fr 3fr",
  },
  {
    description: "Three equal columns",
    label: "3 columns (equal width)",
    value: "1fr 1fr 1fr",
  },
  {
    description: "Three balanced columns",
    label: "3 columns (25% - 50% - 25%)",
    value: "1fr 2fr 1fr",
  },
  {
    description: "Four equal columns",
    label: "4 columns (equal width)",
    value: "1fr 1fr 1fr 1fr",
  },
];
