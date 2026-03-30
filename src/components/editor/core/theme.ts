import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
  root: "outline-none min-h-[200px] px-1",
  paragraph: "mb-1 leading-7 text-foreground",
  heading: {
    h1: "text-4xl font-extrabold tracking-tight mb-4 mt-8 text-foreground first:mt-0",
    h2: "text-3xl font-semibold tracking-tight mb-3 mt-6 text-foreground first:mt-0",
    h3: "text-2xl font-semibold tracking-tight mb-2 mt-4 text-foreground first:mt-0",
  },
  quote:
    "border-l-2 border-foreground/20 pl-4 italic text-muted-foreground my-3",
  list: {
    ul: "list-disc ml-6 mb-2",
    ol: "list-decimal ml-6 mb-2",
    listitem: "mb-0.5",
    nested: {
      listitem: "list-none",
    },
    listitemChecked:
      "mb-0.5 list-none before:mr-2 before:inline-flex before:size-4 before:items-center before:justify-center before:rounded-sm before:border before:border-primary before:bg-primary before:text-[10px] before:text-primary-foreground before:content-['✓']",
    listitemUnchecked:
      "mb-0.5 list-none before:mr-2 before:inline-flex before:size-4 before:items-center before:justify-center before:rounded-sm before:border before:border-border before:bg-background before:content-['']",
  },
  link: "text-primary underline underline-offset-4 cursor-pointer hover:text-primary/80",
  image: "block",
  layoutContainer:
    "my-4 grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 md:gap-4",
  layoutItem:
    "min-w-0 rounded-lg border border-dashed border-border/80 bg-background/80 p-3",
  table:
    "my-4 w-full border-collapse overflow-hidden rounded-lg border border-border text-sm",
  tableAddColumns: "bg-muted hover:bg-muted/80",
  tableAddRows: "bg-muted hover:bg-muted/80",
  tableCell:
    "relative min-w-32 border border-border px-3 py-2 align-top outline-none [&_*]:mb-0",
  tableCellActionButton:
    "rounded-full border border-border bg-background shadow-sm hover:bg-muted",
  tableCellActionButtonContainer: "absolute right-1.5 top-1.5 z-10",
  tableCellHeader:
    "min-w-32 border border-border bg-muted/60 px-3 py-2 text-left font-semibold align-top outline-none [&_*]:mb-0",
  tableRow: "even:bg-muted/10",
  tableScrollableWrapper:
    "editor-table-scroll-wrapper my-4 w-full overflow-x-auto",
  tableCellSelected: "!border-primary bg-primary/10",
  tableSelection: "bg-primary/10",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline underline-offset-4",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-muted text-foreground px-1.5 py-0.5 rounded-md font-mono text-[0.875em]",
  },
  code: "bg-muted rounded-lg p-4 font-mono text-sm my-3 block overflow-x-auto",
};
