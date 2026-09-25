import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
  // legacy-literal (v1.1): code blocks move to --editor-code-* tokens.
  code: "!bg-muted rounded-lg p-4 font-mono text-sm my-3 block overflow-x-auto dark:!bg-muted/50",
  codeHighlight: {
    atrule: "text-sky-700 dark:text-sky-300",
    attr: "text-sky-700 dark:text-sky-300",
    boolean: "text-pink-700 dark:text-pink-300",
    builtin: "text-emerald-700 dark:text-emerald-300",
    cdata: "text-slate-500 dark:text-slate-400",
    char: "text-emerald-700 dark:text-emerald-300",
    class: "text-rose-700 dark:text-rose-300",
    "class-name": "text-rose-700 dark:text-rose-300",
    comment: "text-slate-500 italic dark:text-slate-400",
    constant: "text-pink-700 dark:text-pink-300",
    deleted: "text-pink-700 dark:text-pink-300",
    doctype: "text-slate-500 dark:text-slate-400",
    entity: "text-amber-700 dark:text-amber-300",
    function: "text-rose-700 dark:text-rose-300",
    important: "text-orange-700 dark:text-orange-300",
    inserted: "text-emerald-700 dark:text-emerald-300",
    keyword: "text-sky-700 dark:text-sky-300",
    namespace: "text-orange-700 dark:text-orange-300",
    number: "text-pink-700 dark:text-pink-300",
    operator: "text-amber-700 dark:text-amber-300",
    prolog: "text-slate-500 dark:text-slate-400",
    property: "text-pink-700 dark:text-pink-300",
    punctuation: "text-slate-500 dark:text-slate-400",
    regex: "text-orange-700 dark:text-orange-300",
    selector: "text-emerald-700 dark:text-emerald-300",
    string: "text-emerald-700 dark:text-emerald-300",
    symbol: "text-pink-700 dark:text-pink-300",
    tag: "text-pink-700 dark:text-pink-300",
    unchanged: "text-foreground",
    url: "text-amber-700 dark:text-amber-300",
    variable: "text-orange-700 dark:text-orange-300",
  },
  // legacy-literal (v1.1): collapsible + layout move to tokens.
  collapsibleContainer:
    "group/collapsible my-4 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs",
  collapsibleContent: "px-4 py-3 pl-10 text-foreground [&>p:last-child]:mb-0",
  collapsibleTitle:
    "relative block cursor-pointer list-none border-b border-border/70 px-4 py-3 pl-10 font-medium outline-none marker:content-none [&::-webkit-details-marker]:hidden [&>p]:mb-0 before:absolute before:left-4 before:top-1/2 before:-translate-y-1/2 before:text-xs before:text-muted-foreground before:transition-transform before:content-['▸'] data-[open=true]:before:rotate-90",
  embedBlock: {
    base: "my-4",
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
  // legacy-literal (v1.1): layout + link move to tokens.
  layoutContainer:
    "my-4 grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 md:gap-4",
  layoutItem:
    "min-w-0 rounded-lg border border-dashed border-border/80 bg-background/80 p-3",
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
    code: "bg-muted text-foreground px-1.5 py-0.5 rounded-md font-mono text-[0.875em]",
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
