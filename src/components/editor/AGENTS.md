# Editor Feature Context

This directory contains the editor feature built on Lexical. It can borrow good interaction ideas from products like Notion, but the primary goal is a strong editor experience, not a clone.

Follow the root `AGENTS.md` first. This local file adds feature-specific context so changes stay maintainable as the editor grows.

## Goals

- Keep the editor copy-paste ready for HTML and Markdown workflows
- Improve the editor itself first: editing ergonomics, content fidelity, and maintainability
- Use outside inspiration selectively without chasing visual or behavioral clone parity
- Keep behavior modular and easy to extend with new block types and slash commands
- Prefer declarative configuration over large monolithic plugin files
- Keep Lexical mutations close to the plugin or feature module that owns them

## Architecture

Current structure:

- `editor.tsx`
  - composition root for the editor experience
  - wires core state, shell UI, plugin composition, import/export controls, and output panels
- `core/`
  - non-React editor foundations and shared feature types
  - `actions.ts`
    - editor-level actions for reset/import/copy flows
  - `config.ts`
    - Lexical config factory and registered nodes
  - `constants.ts`
    - placeholder text, example content, and feature constants
  - `theme.ts`
    - Lexical theme classes
  - `types.ts`
    - public editor types shared across the feature
  - `utils.ts`
    - serialization and content-loading helpers
- `ui/`
  - React composition and presentational editor surfaces outside plugin feature folders
  - `content.tsx`
    - editor content area and Lexical plugin wiring below the composer root
  - `chrome.tsx`
    - shell/header/footer/output primitives
  - `panels.tsx`
    - action bar and output panel composition
- `plugins/`
  - isolated Lexical behaviors
  - `core/`
    - low-level editor lifecycle plugins used across the editor surface
    - `editable.tsx`
    - `editor-state.tsx`
    - `focus-on-mount.tsx`
    - `horizontal-rule.tsx`
    - `seed-content.tsx`

Preferred plugin structure for complex plugins:

- `plugins/<feature>/types.ts`
  - shared feature-specific types
- `plugins/<feature>/commands.ts` or `options.ts`
  - declarative config for menus and labels
- `plugins/<feature>/executors.ts` or `utils.ts`
  - Lexical mutations and selection helpers
- `plugins/<feature>/plugin.tsx`
  - React/Lexical integration layer only

Current examples:
- `plugins/slash-command/*`
- `plugins/image/*`
- `plugins/youtube/*`
- `plugins/collapsible/*`
- `plugins/draggable-block/*`
- `plugins/layout/*`
- `plugins/block-type-toolbar/*`
- `plugins/floating-toolbar/*`
- `plugins/link-behavior/*`
- `plugins/table-behavior/*`
- `plugins/markdown/*`

Layout feature conventions:
- `core/nodes/layout/container-node.ts`
  - grid container node that stores `templateColumns`
- `core/nodes/layout/item-node.ts`
  - per-column shadow root node for editable column content
- `plugins/layout/constants.ts`
  - official layout preset labels and template strings
- `plugins/layout/commands.ts`
  - custom layout insertion command
- `plugins/layout/utils.ts`
  - helpers that build column structures in the Lexical tree
- `plugins/layout/plugin.tsx`
  - command registration layer only

Image feature conventions:
- `core/nodes/image/node.tsx`
  - custom image node with HTML and JSON serialization plus mutable alt/size state
- `plugins/image/commands.ts`
  - insertion command payload for image creation
- `plugins/image/component.tsx`
  - interactive image rendering, node selection, inline metadata editing, and handle-based resize preview
- `plugins/image/plugin.tsx`
  - command registration plus paste/drop file insertion behavior

YouTube feature conventions:
- `core/nodes/youtube/node.tsx`
  - decorator block node that stores the video id and round-trips through HTML `iframe[data-lexical-youtube]`
- `plugins/youtube/commands.ts`
  - insertion command payload for YouTube embeds
- `plugins/youtube/plugin.tsx`
  - command registration that inserts the embed block and trailing paragraph
- `plugins/youtube/utils.ts`
  - URL parsing helpers shared by slash command and markdown import

Collapsible feature conventions:
- `core/nodes/collapsible/container-node.ts`
  - root details-like node that stores expanded state and serializes to HTML `<details>`
- `core/nodes/collapsible/title-node.ts`
  - editable summary row that toggles the container and routes Enter into the body
- `core/nodes/collapsible/content-node.ts`
  - expandable body shadow root for nested editor content
- `plugins/collapsible/commands.ts`
  - insertion command payloads for collapsible blocks
- `plugins/collapsible/utils.ts`
  - helper builders that replace or insert collapsible structures in the Lexical tree
- `plugins/collapsible/plugin.tsx`
  - command registration, structural transforms, and keyboard behavior

Draggable block feature conventions:
- `plugins/draggable-block/plugin.tsx`
  - block-level drag handle wiring around `@lexical/react` draggable block support
  - owns floating handle anchor resolution and drop target indicator rendering

Table behavior module conventions:
- `plugins/table-behavior/actions.ts`
  - row/column insertion and deletion operations
- `plugins/table-behavior/selection.ts`
  - current table selection derivation for contextual controls
- `plugins/table-behavior/types.ts`
  - local table interaction state types
- `plugins/table-behavior/plugin.tsx`
  - contextual table controls and Lexical table integration

## Maintenance Rules

- Keep editor foundations in `core/`, editor rendering/composition in `ui/`, and Lexical behavior in `plugins/`
- Keep `core/nodes/` feature-first: use `core/nodes/<feature>/...` instead of a flat node file list
- If a feature has two or more related nodes, place them in the same `core/nodes/<feature>/` folder with simple filenames like `container-node.ts`, `item-node.ts`, or `node.tsx`
- Keep node-only DOM helpers, serialization helpers, and feature-local node utilities in the same node feature folder
- Align `plugins/<feature>/` with `core/nodes/<feature>/` whenever the feature owns custom Lexical nodes
- Keep complex feature data in typed config files instead of inline arrays inside components
- Keep Lexical tree mutations in small pure helpers when possible
- Keep `editor.tsx` thin and focused on orchestration
- Prefer relative imports for files inside `src/components/editor/*`
- Avoid deprecated Lexical React helpers when `@lexical/extension` or core Lexical APIs exist
- If a plugin grows beyond one responsibility, split it into a feature folder
- Update this file when the feature architecture changes materially

## UX Invariants

- Slash command highlight must stay synced with keyboard navigation and scroll position
- Slash menu should open focused on the first filtered item
- Exported HTML and Markdown must stay in sync with editor state
- Links should stay valid, auto-detect when obvious, and remain usable in both editable and read-only modes
- Images should round-trip through HTML `<img>` and Markdown `![alt](src)` without losing source or alt text
- Images may enter through slash command URL/file flows, paste, or drag and drop, while still landing as real editor nodes
- Editable image blocks should support node selection, keyboard removal, and handle-based resize that previews imperatively during drag and commits once at the end, without affecting read-only mode
- YouTube embeds should round-trip through HTML iframe export/import and Markdown as canonical YouTube URLs without losing the video id
- Top-level editor blocks should remain reorderable through the drag handle without breaking editable or read-only behavior
- Tables and checklists should stay first-class editing blocks, not hacked-in visual widgets
- Collapsible sections should stay real Lexical structure with editable title and body, not decorator-only UI wrappers
- Columns layouts should stay editable as real Lexical structure, not visual wrappers without import/export support
- Table controls should act on the current cell context, float around the active table, and make row/column structure editable in-place
- Table edge controls should prefer low-noise affordances: render full-length top and right rails that match the table width/height, with a single add trigger traveling along those rails for column and row actions
- Table edge trigger positioning should track the active cell context so insertion affordances feel anchored to the current row/column, not just the table center, while keeping full-edge hover strips for discoverability
- Editor should remain usable in editable and read-only modes
