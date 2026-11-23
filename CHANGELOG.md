# Changelog

## Unreleased

### Added

- `Editor` now accepts an `onError` prop to handle Lexical runtime and `initialJson` seed errors explicitly instead of silently swallowing or rethrowing.
- `Editor` now accepts `weblinkFaviconResolver?: false | ((hostname: string) => string | undefined)` to opt out of or replace the default external Google favicon service on weblink cards.
- Standalone theme compatibility (`useResolvedTheme()`): the editor now automatically observes the `.dark` class on `document.documentElement` when rendered outside Pytah's `<ThemeProvider>`, working cleanly alongside `next-themes` or custom theme setups.
- Weblink Markdown export transformers (`WEBLINK_BLOCK_MARKDOWN_TRANSFORMER` and `WEBLINK_INLINE_MARKDOWN_TRANSFORMER`) so inline and card weblinks export as `[title](url)` Markdown links instead of disappearing during Markdown serialization.
- Callout `info` slash command (`/info`) and block-type toolbar options for all five callout variants (`callout`, `info`, `tip`, `warning`, `caution`).
- Tokyo Night code-block theme (`tokyo-night`): added the Tokyo Night theme family (`@shikijs/themes/tokyo-night`), selectable from the code-block chrome theme picker.
- Callout and alert blocks (`editor-callout`): added support for callout containers with five semantic types (`note`, `tip`, `info`, `warning`, `caution`), contextual SVG indicators, customizable emojis, block-type toolbar options, and slash commands (`/callout`, `/info`, `/tip`, `/warning`, `/caution`). Supports bidirectional round-trip conversion to GitHub Flavored Markdown alerts (`> [!NOTE]`, etc.) via a multiline transformer.
- Lossless JSON AST state and persistence: `Editor` now accepts `initialJson` (`string | SerializedEditorState | Record<string, unknown>`) for instant synchronous document seeding from a persisted Lexical JSON AST. Document snapshots now include `snapshot.json` by default alongside markdown, HTML, and text. Added selective snapshot gating via `features.snapshot.json` (defaults to `true`), a JSON content loader (`loadEditorJsonContent`), and an `onCopyJson` action.
- Smart link paste: pasting a URL over highlighted text wraps the selected text in a link instead of overwriting it with plain text. Normalizes naked `www.` URLs to `https://` and supports standard link schemes. Falls through to standard paste when the selection is collapsed or when the clipboard contains files or multiline text.
- Link paste format menu and weblink cards (`WeblinkNode`): pasting a URL with a collapsed caret triggers a floating format menu anchored beneath the inserted link with 5 options: `Paste inline link`, `Inline – Weblink`, `Small card – Weblink`, `Wide card – Weblink`, and `Remove link`. Includes immediate client-side metadata resolution, keyboard navigation (ArrowUp/ArrowDown, Enter, Escape, typing dismissal), format switching via an inline card dropdown menu, and a `linkPasteMenu` feature flag in `EditorFeatureFlags` (enabled by default).
- Modular server-side metadata fetching for weblinks (`weblinkMetadataFetcher`): `Editor` now supports asynchronous OpenGraph and rich metadata enrichment for weblink cards via a custom fetcher function or API route string (`weblinkMetadataFetcher="/api/metadata"`). Provides pluggable adapters including `createEndpointWeblinkFetcher`, `createMetascraperAdapter`, and `createCachedWeblinkFetcher` (with in-flight deduplication, TTL eviction, and `forceRefresh`).
- The floating selection toolbar gained a "⋮" overflow menu at the end of the row, grouping super/subscript (with an active-state check), text alignment (left/center/right/justify, with active-state check), and indent/outdent into a dropdown so the toolbar stays a single row.
- `BlockTypeDrop` accepts a `variant` prop (`"full"` or `"compact"`) and a `showInsert` prop so the full top toolbar no longer duplicates the Insert popover entries inside the block-type dropdown.

### Changed

- Scoped `katex/dist/katex.min.css` directly into `MathComponent` (`@pytah/editor-math`) instead of the global app stylesheet so base editor installs stay KaTeX-free while equations still render synchronously on frame 0.
- Removed the demo-only `@pytah/editor-seed-content` item from `@pytah/editor-full`'s `registryDependencies` (it remains installable standalone); registry items no longer pin host `react`/`react-dom` peer versions or duplicate base dependencies across feature items, and base `@pytah/editor` now declares `tw-animate-css`.
- `Editor` in `minimal` mode without an `onChange` callback skips per-keystroke HTML/JSON/Markdown snapshot serialization automatically.
- Removed the global `window.__editor` leak from `Editor` and replaced the module-global slash command runner map with per-editor `EditorCommandsContext` so multiple `<Editor />` instances on the same page stay completely isolated.
- `applyToolbarLink` now commits URL, link text, and caret movement in a single Lexical update (one Undo entry) and returns `false` with inline validation feedback instead of silently removing the link when an invalid URL is submitted.
- The link hover preview chip renders through a shadcn `HoverCard` (`components/ui/hover-card.tsx`) with a real `border-border` outline (`editor-floating-no-ring`), while the floating link edit card renders as a Base UI modal `Popover` that locks page scroll while open.
- The floating link interaction follows the Google-Docs flow: hovering a link shows a compact preview chip anchored under the hovered link, while clicking a link places the caret without opening a card. Clicking **Edit**, using the toolbar link button, or pressing Cmd/Ctrl+K opens the edit card.
- The floating selection toolbar hides itself when the Link button opens the link card, and returns on the next selection change.
- Editor radii are capped at `rounded-md` (`var(--radius-md, 0.5rem)`) across all `--editor-*-radius` tokens and editor UI surfaces.

### Fixed

- **URL & media sanitization (`core/url.ts`)**: fixed `sanitizeHrefUrl` catch-clause bypass that returned unvalidated strings for malformed URLs, fixed `normalizeEditorLinkUrl` prepending `mailto:` to `mailto:` and `javascript:alert('a@b')` inputs, hardened `parseYouTubeUrl` with a strict hostname allowlist and 11-character ID validation, validated `YouTubeNode` IDs on `importDOM`/`importJSON`, sanitized `ImageNode` and `WeblinkNode` URLs/assets (blocking `javascript:`, `file:`, and `data:image/svg+xml`), and added MIME allowlist + 5 MB size limit on image uploads.
- **YouTube & Image insertion flows**: fixed `YouTubeInsertDialog` calling `parseYouTubeUrl` on submit (previously passed raw URLs straight as `videoId`), added multi-image paste/drop support, added broken-image fallback rendering, fixed image resizer Undo/Redo by clearing imperative inline dimensions on finish/cancel/unmount, and prevented non-destructive toolbar/slash dialog cancellation from wiping existing paragraphs.
- **Weblink reliability**: prevented metadata fetches in read-only mode, tagged metadata hydration with `HISTORY_MERGE_TAG` so it never pollutes Undo, guarded against infinite re-fetch loops, prevented caching `null`/aborted metadata responses, supported `forceRefresh` cache bypass, passed format menu to inline weblink cards, and reset broken icon/image error states when URLs change.
- **Code highlight & overlays**: added failed-load tracking to stop infinite Shiki retry loops, tagged async `markDirty` with `HISTORY_MERGE_TAG`, preserved per-endpoint cross-block selections during re-tokenization, discovered nested code blocks via `$nodesOfType(CodeNode)`, batched line-number measurements with rAF coalescing and density invalidation, and included leading/trailing `LineBreakNode`s in scoped `Ctrl/Cmd+A`.
- **Callout, Math, Excalidraw, Collapsible & Layout blocks**: fixed Callout Enter-to-exit and `collapseAtStart` paragraph nesting, preserved inline markdown & multi-paragraph round-trips in Callout markdown import/export, fixed Math single-line `$$...$$`, unclosed `$$`, currency `$5 and $10` false positives, and inline↔block reparenting, restored Excalidraw persisted dimensions on `importDOM` with real scene-signature dirty tracking and dynamic-import error fallback, fixed Collapsible read-only toggling and standard `<details><summary>` import normalization, and added CSS `repeat()` column counting plus structural transforms and arrow-key escape to Layout containers.
- **Markdown tables & images**: escaped/unescaped `\|` pipes in `TABLE_MARKDOWN_TRANSFORMER` and `\]` brackets in `IMAGE_MARKDOWN_TRANSFORMER`, and normalized cell/alt newlines on export.
- **Toolbars, Link Editor, Slash Command, Drag-and-Drop, Tables & TOC**: wired live `CAN_UNDO`/`CAN_REDO` disabled state and active alignment indicators across toolbars, prevented floating toolbar focus loss on blur and clamped bottom viewport overflow, isolated hover link surfaces and block drags across multi-editor pages, fixed `decideInsertAfter` midpoint splitting, fixed hover chip teleporting onto caret links and edit-card URL input focus stealing, hid table menus on cross-table selections or horizontally scrolled-out cells, restored fallback paragraphs on table deletion, fixed TOC `IntersectionObserver` under StrictMode, rapid-click listener cleanup, scroll-safe `tocTop` measurement, and keyboard focus handoff into the TOC popover.
- Table cell action menu keyboard navigation: refactored the table cell action menu into a Base UI `DropdownMenu` with full arrow-key and Tab/Shift+Tab cycling and focus restoration.
- Pasting over a selected code block (including URLs) inserts plain text cleanly without escaping or wrapping code in links.
- Typing GitHub Alert callout markdown shortcuts (`> [!TIP]`, `[!NOTE]`, etc.) converts into `CalloutNode` on Enter/Space.
- Switching code-block theme families tokenizes once per block per pass instead of once per token child, and toggling light/dark recolors tokens synchronously via `--editor-code-token-*` CSS variables with zero re-tokenization.
- Reopening the slash menu resets the highlight to the first item, and arrow navigation walks the filtered list cleanly without swallowing keys when no results match.
- Clicking an image or Excalidraw block after select-all reliably mounts resize handles via `NodeSelection` membership tracking.
- Pressing `Ctrl/Cmd+A` inside a code block selects only that block's content.
- Portaled the Excalidraw drawing surface to `document.body`, added Excalidraw clipboard JSON paste support, and restored editor focus on close.
- Reconciled stale Lexical link selection when closing the floating link edit card so subsequent checklist ticks do not yank focus back into the link.
- Fixed `h6` heading size (`1.0625rem`), footer stats spacing (`gap-2`), compact/comfortable geometry spacing, density-responsive code-block overlays, TOC popover click-persistence, and link hover-bridge timing.
- Fixed editing link display text via single-step `splice` preserving formatting/styles, capped floating link surface widths on narrow viewports, fixed StrictMode animation-frame ref cleanup, and centered vertical toolbar separators.

## 0.1.2

### Fixed

- The floating selection toolbar no longer overflows the browser viewport. The toolbar is anchored at the selection midpoint with `translate(-50%, -100%)`; the rendered box is now measured and clamped against the viewport edges (8px margin) in a pre-paint layout pass, so selections at the start/end of a line or at the very top of the viewport keep the toolbar fully on screen.
- The TOC rail and popover are compact, height-capped outlines again. The collapsed mini-bars rail caps at `max-h-[45vh]` (previously it grew with the heading count) and the hover popover caps at `55vh` (previously `70vh`), both scrolling via wheel/touch with the scrollbar hidden through a new `scrollbar-hidden` utility shipped in `editor.css` — the old `scrollbar-thin` classes required `tailwind-scrollbar`, which the registry never declared, so they were dead code. Spacing, dash widths, popover nesting steps and the active-dash treatment (now a flat color swap, no scale/shadow pop) are densified throughout.

## 0.1.1

### Fixed

- **Open latency eliminated for seeded editors** (upstream of a consumer report measuring first content paint at ~3.1s):
  - `initialMarkdown`/`initialHtml` are now converted inside the composer's first editor state (`initialConfig.editorState`) instead of a post-mount effect. The first paint already contains the document — no empty-editor flash and no second full-document update. The post-mount seeding path remains for standalone `EditorStatePlugin` usage (new opt-in `seededViaConfig` prop); `emitInitialSnapshot` parity is preserved by emitting the initial snapshot once from the already-populated state.
  - `CodeHighlightPlugin` arms Shiki highlighting one frame after mount (double `requestAnimationFrame`). Code-heavy documents now paint as plain code text immediately; tokenization and per-node re-splicing land off the click-to-content critical path. One frame passes before Tab-capture inside code blocks is active.
  - The editable region opts out of native spellchecking (`spellCheck={false}` on `ContentEditable`). WebKitGTK boots its enchant broker on the first spellcheck-enabled region and, with no enchant backend installed, probes every provider serially on the web-process main thread — a ~2s first-mount freeze invisible to JS profilers. Consumers that want red squiggles can re-enable spellchecking per instance.

## 0.1.0

### Added

- **Selective snapshot serialization** via the new `features.snapshot` flag bag on `Editor`:
  - `snapshot.html` / `snapshot.markdown` / `snapshot.text` (all default `true`) — a disabled output is skipped entirely (never computed) and surfaces as `""` on the `EditorSnapshot`. Markdown-only consumers no longer pay for per-keystroke HTML serialization.
  - `snapshot.emitInitialSnapshot` (default `true`) — the programmatic seed update that loads `initialMarkdown`/`initialHtml` is tagged with Lexical's `$addUpdateTag("pytah-seed")`; when this option is `false`, the tagged update no longer triggers `onChange`/`onSnapshotReady`, so the first emission happens on the first real edit.
  - With `snapshot.text: false`, the per-change text serialization and its state update are skipped as well.
- The outputs panel copy handlers serialize on demand when their output is disabled, so copy-as-HTML/Markdown still works with the panel rendered.
- `readEditorSnapshot(editor, transformers, options?)` accepts an options bag to skip disabled outputs (`EditorSnapshotOutputs`).

### Changed

- **Fine-grained Shiki syntax highlighting**: migrated code-block syntax highlighting in both the Lexical editor (`plugins/code-highlight/`) and docs (`<CodeBlock>`) to a fine-grained Shiki bundle (`shiki/core`, `shiki/engine/javascript`, `@shikijs/themes/*`, and `@shikijs/langs/*`), removing `@lexical/code-shiki` and all 24 `@twinkleplop/*` packages. A singleton `HighlighterCore` backed by the pure-JavaScript RegExp engine starts with zero grammars/themes loaded and dynamically imports only the pre-selected theme families (`github`, `catppuccin`, `nord`, `everforest`, `tokyo-night`) and the 21 supported languages on demand. Dual-variant families (`github`, `catppuccin`, `everforest`) preload their light and dark sibling themes together for synchronous `.dark` mode switches, while single-variant dark themes (`nord`, `tokyo-night`) stay pinned to dark across both app modes with zero re-tokenization on mode flips.
- `initialMarkdown` / `initialHtml` are now **initial-only by contract**: the seed is captured once per mount and never re-applied when prop identities change. Consumers should remount via `key` to load different initial content; re-seeding in place previously replaced live state and reset the caret.
- The demo seed-content plugin (`editor-seed-content`) tags its seed update with the same `pytah-seed` tag.

### Fixed

- The slash menu no longer steals the caret from the editor when it opens: focus landing inside the popup bounces back to the editor root (`rootElement.focus({ preventScroll: true })`).
- The table-of-contents mini-bars no longer stretch to full height on heading-heavy documents (`max-h-[70vh]` with a thin scrollbar).
