/** Shape of a single color entry in the palette. */
export interface ColorSwatch {
  /** Human-readable label (used as aria-label on the swatch button). */
  label: string;
  /** CSS color value, e.g. "#ef4444". */
  value: string;
}

/**
 * Default color palette shared by the text color and background color pickers.
 *
 * To customise the available swatches, edit this array — the order determines
 * the rendering order in the grid. Both pickers import this constant as their
 * default, but each `<ColorSwatches>` instance also accepts a custom `palette`
 * prop if you need diverging sets.
 */
export const COLOR_PALETTE: ColorSwatch[] = [
  { label: "Black", value: "#1a1a1a" },
  { label: "Dark gray", value: "#525252" },
  { label: "Gray", value: "#a3a3a3" },
  { label: "White", value: "#ffffff" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Pink", value: "#ec4899" },
  { label: "Light red", value: "#fca5a5" },
  { label: "Light yellow", value: "#fde68a" },
  { label: "Light green", value: "#bbf7d0" },
  { label: "Light blue", value: "#bfdbfe" },
];
