import type { theme_palette, theme_styles } from "@twinkleplop/core";

/**
 * Nord for twinkleplop (local theme, not an upstream package).
 *
 * Token colors are copied verbatim from the official arcticicestudio
 * Nord VS Code theme (`displayName: Nord`, `name: nord`, `type: dark`):
 * Frost `#81A1C1` for keywords/operators/tags/JSDoc tags, `#88C0D0`
 * for functions/headings/links/INI section headers, `#8FBCBB` for
 * types/classes/attributes/quote markers/fenced blocks; Aurora
 * `#A3BE8C` strings, `#EBCB8B` regex/escapes/diffs-changed, `#BF616A`
 * diffs-deleted, `#B48EAD` numbers, `#D08770` decorators; Snow Storm
 * `#D8DEE9` base text / `#ECEFF4` punctuation; Polar Night `#616E88`
 * comments. Dark bg `#2E3440` (= `editor.background`), base text
 * `#D8DEE9` (= `editor.foreground`).
 *
 * Scope-to-role map (TextMate scope -> twinkleplop role): `keyword`,
 * `keyword.operator`, `storage`, `constant.language`,
 * `punctuation.definition.tag`, `punctuation.terminator`,
 * `punctuation.section.embedded`, `variable.language` -> keyword/operator
 * blues; `entity.name.tag` -> `tag` AND `tag_name` (HTML/XML tag names
 * share the blue tag rule); `entity.name.function`, `support.function`,
 * `markup.heading`, link scopes -> `function` cyan; `entity.name.class`,
 * `support.type`, `entity.other.attribute-name`,
 * `beginning.punctuation.definition.quote` -> teal family;
 * `meta.preprocessor` -> `directive`; `string` -> `string` green;
 * `constant.numeric` -> `number` purple; `string.regexp`,
 * `constant.character` -> `regex`/`escape` yellow; `comment` ->
 * `comment` gray upright (the reference sets `fontStyle` only for
 * emphasis/strong/italic/underline, never for comments).
 *
 * Keys with no direct TextMate scope use the closest analog: object-literal
 * keys and units fall back to base text, template expressions and `#`
 * sigils follow the blue template-punctuation rule, task markers and prompt
 * prefixes follow the frost family.
 *
 * Block chrome (not grammar tokens): `background_color` feeds
 * `--editor-code-bg` via `EditorContent` (= `editor.background`
 * `#2E3440`), the `CodeNode` foreground is `identifier`
 * (= `editor.foreground` `#D8DEE9`), and the custom `gutter` entry
 * (= `editorLineNumber.foreground` `#4C566A`) paints the line-number
 * gutter in `line-numbers.tsx` — other families fall back to the muted
 * class when their palette carries no `gutter` key.
 *
 * The reference ships dark only, but twinkleplop themes always carry
 * both variants: light keeps the same hues on Snow Storm
 * (`background_color` `#ECEFF4`, base text `#2E3440`) shaded toward
 * black until every token holds 6.0:1 contrast — AA with margin (the
 * 4.5 floor sat on the minimum) — e.g. keyword `#81A1C1` → `#495B6F`,
 * string `#A3BE8C` → `#505E44`. Tokens already above the floor (base
 * text, punctuation, `#4C566A` markers) stay verbatim, so each hue
 * family collapses to one shaded hex. Identifiers stay one step off
 * base text (`#D8DEE9` dark / `#3B4252` light) and muted markers use
 * `#616E88` dark / `#4C566A` light.
 *
 * Fidelity is intentional on dark: several official tokens sit below
 * WCAG AA, so `nord-dark` is exempt from contrast tests and pinned by
 * reference instead — see `registry.test.ts`. `nord-light` trades exact
 * hues for readability and is pinned by the 6.0 floor instead. Tag brackets/terminators resolve to the blue
 * `operator` entry via `token-roles.ts` (matching
 * `punctuation.definition.tag` and `punctuation.terminator`);
 * everything else keeps its raw grammar role.
 */

export const light: theme_palette = {
  array_table_header: "#475e5e",
  attr_name: "#475e5e",
  attr_sigil: "#495b6f",
  attribute: "#475e5e",
  autolink: "#425e67",
  autolink_close: "#425e67",
  autolink_open: "#425e67",
  background_color: "#eceff4",
  bit: "#6a5266",
  block_scalar_header: "#475e5e",
  blockquote_marker: "#475e5e",
  bold: "#2e3440",
  bold_close: "#2e3440",
  bold_open: "#2e3440",
  boolean: "#495b6f",
  builtin: "#425e67",
  carriage_return: "inherit",
  changed: "#67583a",
  changed_marker: "#67583a",
  class_name: "#475e5e",
  code: "#475e5e",
  code_block: "#2e3440",
  code_close: "#475e5e",
  code_fence: "#475e5e",
  code_language: "#475e5e",
  code_open: "#475e5e",
  comment: "#4c566a",
  constant: "#495b6f",
  css_variable: "#2e3440",
  datetime: "#6a5266",
  decorator: "#7c4e41",
  deleted: "#8a454c",
  deleted_marker: "#8a454c",
  directive: "#415b7b",
  doc_marker: "#4c566a",
  doctype: "#415b7b",
  entity: "#67583a",
  escape: "#67583a",
  expression: "#495b6f",
  format: "#505e44",
  front_matter_marker: "#4c566a",
  function: "#425e67",
  gutter: "#4c566a",
  hard_break: "#4c566a",
  hash: "#495b6f",
  heading: "#425e67",
  heading_marker: "#495b6f",
  hr: "#4c566a",
  identifier: "#3b4252",
  inserted: "#505e44",
  inserted_marker: "#505e44",
  italic: "#2e3440",
  italic_close: "#2e3440",
  italic_open: "#2e3440",
  keyword: "#495b6f",
  label: "#475e5e",
  lifetime: "#475e5e",
  link_text: "#425e67",
  link_text_close: "#425e67",
  link_text_open: "#425e67",
  list_marker: "#495b6f",
  namespace: "#475e5e",
  newline: "inherit",
  null: "#495b6f",
  number: "#6a5266",
  operator: "#495b6f",
  output: "#2e3440",
  parameter: "#3b4252",
  plain_scalar: "#505e44",
  prompt: "#2e3440",
  prompt_prefix: "#475e5e",
  property: "#2e3440",
  punctuation: "#2e3440",
  raw_code_block: "#2e3440",
  raw_front_matter: "#2e3440",
  raw_json: "#2e3440",
  raw_markup: "#2e3440",
  raw_script: "#2e3440",
  raw_shell: "#2e3440",
  raw_style: "#2e3440",
  raw_svelte_expression: "#2e3440",
  regex: "#67583a",
  selector: "#495b6f",
  selector_class: "#475e5e",
  selector_id: "#475e5e",
  selector_pseudo: "#495b6f",
  space: "inherit",
  strike: "#4c566a",
  strike_close: "#4c566a",
  strike_open: "#4c566a",
  string: "#505e44",
  string_escape: "#67583a",
  svelte_block: "#495b6f",
  svelte_directive: "#475e5e",
  tab: "inherit",
  tag: "#495b6f",
  tag_name: "#495b6f",
  task_marker: "#425e67",
  template: "#505e44",
  type: "#475e5e",
  unit: "#2e3440",
  url: "#425e67",
  url_link: "#425e67",
  url_title: "#425e67",
  variable: "#3b4252",
  variant: "#475e5e",
};

export const dark: theme_palette = {
  array_table_header: "#8fbcbb",
  attr_name: "#8fbcbb",
  attr_sigil: "#81a1c1",
  attribute: "#8fbcbb",
  autolink: "#88c0d0",
  autolink_close: "#88c0d0",
  autolink_open: "#88c0d0",
  background_color: "#2e3440",
  bit: "#b48ead",
  block_scalar_header: "#8fbcbb",
  blockquote_marker: "#8fbcbb",
  bold: "#d8dee9",
  bold_close: "#d8dee9",
  bold_open: "#d8dee9",
  boolean: "#81a1c1",
  builtin: "#88c0d0",
  carriage_return: "inherit",
  changed: "#ebcb8b",
  changed_marker: "#ebcb8b",
  class_name: "#8fbcbb",
  code: "#8fbcbb",
  code_block: "#d8dee9",
  code_close: "#8fbcbb",
  code_fence: "#8fbcbb",
  code_language: "#8fbcbb",
  code_open: "#8fbcbb",
  comment: "#616e88",
  constant: "#81a1c1",
  css_variable: "#d8dee9",
  datetime: "#b48ead",
  decorator: "#d08770",
  deleted: "#bf616a",
  deleted_marker: "#bf616a",
  directive: "#5e81ac",
  doc_marker: "#616e88",
  doctype: "#5e81ac",
  entity: "#ebcb8b",
  escape: "#ebcb8b",
  expression: "#81a1c1",
  format: "#a3be8c",
  front_matter_marker: "#616e88",
  function: "#88c0d0",
  gutter: "#4c566a",
  hard_break: "#616e88",
  hash: "#81a1c1",
  heading: "#88c0d0",
  heading_marker: "#81a1c1",
  hr: "#616e88",
  identifier: "#d8dee9",
  inserted: "#a3be8c",
  inserted_marker: "#a3be8c",
  italic: "#d8dee9",
  italic_close: "#d8dee9",
  italic_open: "#d8dee9",
  keyword: "#81a1c1",
  label: "#8fbcbb",
  lifetime: "#8fbcbb",
  link_text: "#88c0d0",
  link_text_close: "#88c0d0",
  link_text_open: "#88c0d0",
  list_marker: "#81a1c1",
  namespace: "#8fbcbb",
  newline: "inherit",
  null: "#81a1c1",
  number: "#b48ead",
  operator: "#81a1c1",
  output: "#d8dee9",
  parameter: "#d8dee9",
  plain_scalar: "#a3be8c",
  prompt: "#d8dee9",
  prompt_prefix: "#8fbcbb",
  property: "#d8dee9",
  punctuation: "#eceff4",
  raw_code_block: "#d8dee9",
  raw_front_matter: "#d8dee9",
  raw_json: "#d8dee9",
  raw_markup: "#d8dee9",
  raw_script: "#d8dee9",
  raw_shell: "#d8dee9",
  raw_style: "#d8dee9",
  raw_svelte_expression: "#d8dee9",
  regex: "#ebcb8b",
  selector: "#81a1c1",
  selector_class: "#8fbcbb",
  selector_id: "#8fbcbb",
  selector_pseudo: "#81a1c1",
  space: "inherit",
  strike: "#616e88",
  strike_close: "#616e88",
  strike_open: "#616e88",
  string: "#a3be8c",
  string_escape: "#ebcb8b",
  svelte_block: "#81a1c1",
  svelte_directive: "#8fbcbb",
  tab: "inherit",
  tag: "#81a1c1",
  tag_name: "#81a1c1",
  task_marker: "#88c0d0",
  template: "#a3be8c",
  type: "#8fbcbb",
  unit: "#d8dee9",
  url: "#88c0d0",
  url_link: "#88c0d0",
  url_title: "#88c0d0",
  variable: "#d8dee9",
  variant: "#8fbcbb",
};

export const light_styles: theme_styles = {
  autolink: ["underline"],
  bold: ["bold"],
  italic: ["italic"],
  link_text: ["underline"],
  strike: ["strikethrough"],
  url: ["underline"],
  url_link: ["underline"],
  url_title: ["underline"],
};

export const dark_styles: theme_styles = {
  autolink: ["underline"],
  bold: ["bold"],
  italic: ["italic"],
  link_text: ["underline"],
  strike: ["strikethrough"],
  url: ["underline"],
  url_link: ["underline"],
  url_title: ["underline"],
};
