import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
  code: "editor-code-block",
  // Token colors are CSS vars (`--editor-code-token-*`) set per resolved
  // code theme by `EditorContent` — see `getCodeBlockTokenVars` in the code
  // theme registry. The twinkleplop tokenizer bakes that var reference
  // into every CodeHighlightNode's inline style, so there is no class map
  // to maintain here and a `.dark` flip recolors with zero Lexical work.
  collapsibleContainer: "editor-collapsible-container shadow-xs",
  collapsibleContent: "editor-collapsible-content [&>p:last-child]:mb-0",
  collapsibleTitle:
    "editor-collapsible-title marker:content-none [&::-webkit-details-marker]:hidden [&>p]:mb-0 before:absolute before:left-4 before:top-1/2 before:-translate-y-1/2 before:text-xs before:text-muted-foreground before:transition-transform before:content-['▸'] data-[open=true]:before:rotate-90",
  embedBlock: {
    base: "editor-embed",
    focus: "outline-none",
  },
  heading: {
    h1: "editor-h1 first:mt-0 text-foreground",
    h2: "editor-h2 first:mt-0 text-foreground",
    h3: "editor-h3 first:mt-0 text-foreground",
    h4: "editor-h4 first:mt-0 text-foreground",
    h5: "editor-h5 first:mt-0 text-foreground",
    h6: "editor-h6 first:mt-0 text-foreground",
  },
  hr: "my-6 h-px cursor-pointer border-0 bg-border transition-colors",
  hrSelected: "bg-primary h-0.5",
  image: "block",
  layoutContainer: "editor-layout-container",
  layoutItem: "editor-layout-item",
  // Already token-based (primary + underline tokens); no owned geometry.
  link: "text-primary underline underline-offset-4 cursor-pointer hover:text-primary/80",
  list: {
    listitem: "editor-listitem",
    listitemChecked:
      "editor-listitem list-none outline-none focus:outline-none focus-visible:outline-none before:mr-2 before:inline-flex before:size-4 before:items-center before:justify-center before:rounded-sm before:border before:border-primary before:bg-primary before:text-[10px] before:text-primary-foreground before:content-['✓']",
    listitemUnchecked:
      "editor-listitem list-none outline-none focus:outline-none focus-visible:outline-none before:mr-2 before:inline-flex before:size-4 before:items-center before:justify-center before:rounded-sm before:border before:border-border before:bg-background before:content-['']",
    nested: {
      listitem: "list-none",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
  },
  paragraph: "editor-paragraph text-foreground",
  quote: "editor-quote",
  root: "outline-none min-h-[200px] px-1",
  table: "editor-table",
  tableAddColumns: "bg-muted hover:bg-muted/80",
  tableAddRows: "bg-muted hover:bg-muted/80",
  tableCell: "editor-table-cell [&_*]:mb-0",
  tableCellActionButton:
    "rounded-full border border-border bg-background shadow-sm hover:bg-muted",
  tableCellActionButtonContainer: "absolute right-1.5 top-1.5 z-10",
  tableCellHeader: "editor-table-header [&_*]:mb-0",
  tableCellSelected: "editor-table-selected",
  tableRow: "editor-table-row-striped-even",
  tableScrollableWrapper:
    "editor-table-scroll-wrapper my-4 w-full overflow-x-auto",
  tableSelection: "bg-primary/10",
  text: {
    bold: "font-bold",
    code: "editor-inline-code text-foreground",
    highlight: "rounded-sm bg-highlight px-0.5 text-highlight-foreground",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline underline-offset-4",
    // Tailwind's `underline` and `line-through` both set `text-decoration-line`,
    // so Lexical's combined format needs a single utility that applies both lines.
    underlineStrikethrough:
      "[text-decoration-line:underline_line-through] underline-offset-4",
  },
};
