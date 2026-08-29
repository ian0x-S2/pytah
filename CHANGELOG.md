# Changelog

## 0.1.2

### Fixed

- The floating selection toolbar no longer overflows the browser viewport.
  The toolbar is anchored at the selection midpoint with
  `translate(-50%, -100%)`; the rendered box is now measured and clamped
  against the viewport edges (8px margin) in a pre-paint layout pass, so
  selections at the start/end of a line or at the very top of the viewport
  keep the toolbar fully on screen.
- The TOC rail and popover are compact, height-capped outlines again. The
  collapsed mini-bars rail caps at `max-h-[45vh]` (previously it grew with
  the heading count) and the hover popover caps at `55vh` (previously
  `70vh`), both scrolling via wheel/touch with the scrollbar hidden through
  a new `scrollbar-hidden` utility shipped in `editor.css` — the old
  `scrollbar-thin` classes required `tailwind-scrollbar`, which the registry
  never declared, so they were dead code. Spacing, dash widths, popover
  nesting steps and the active-dash treatment (now a flat color swap, no
  scale/shadow pop) are densified throughout.

## 0.1.1

### Fixed

- **Open latency eliminated for seeded editors** (upstream of a consumer
  report measuring first content paint at ~3.1s):
  - `initialMarkdown`/`initialHtml` are now converted inside the composer's
    first editor state (`initialConfig.editorState`) instead of a post-mount
    effect. The first paint already contains the document — no empty-editor
    flash and no second full-document update. The post-mount seeding path
    remains for standalone `EditorStatePlugin` usage (new opt-in
    `seededViaConfig` prop); `emitInitialSnapshot` parity is preserved by
    emitting the initial snapshot once from the already-populated state.
  - `CodeHighlightPlugin` arms Shiki highlighting one frame after mount
    (double `requestAnimationFrame`). Code-heavy documents now paint as plain
    code text immediately; tokenization and per-node re-splicing land off the
    click-to-content critical path. One frame passes before Tab-capture inside
    code blocks is active.
  - The editable region opts out of native spellchecking
    (`spellCheck={false}` on `ContentEditable`). WebKitGTK boots its enchant
    broker on the first spellcheck-enabled region and, with no enchant
    backend installed, probes every provider serially on the web-process main
    thread — a ~2s first-mount freeze invisible to JS profilers. Consumers
    that want red squiggles can re-enable spellchecking per instance.

## 0.1.0

### Added

- **Selective snapshot serialization** via the new `features.snapshot` flag bag
  on `Editor`:
  - `snapshot.html` / `snapshot.markdown` / `snapshot.text` (all default
    `true`) — a disabled output is skipped entirely (never computed) and
    surfaces as `""` on the `EditorSnapshot`. Markdown-only consumers no longer
    pay for per-keystroke HTML serialization.
  - `snapshot.emitInitialSnapshot` (default `true`) — the programmatic seed
    update that loads `initialMarkdown`/`initialHtml` is tagged with
    Lexical's `$addUpdateTag("pytah-seed")`; when this option is `false`, the
    tagged update no longer triggers `onChange`/`onSnapshotReady`, so the first
    emission happens on the first real edit.
  - With `snapshot.text: false`, the per-change text serialization and its
    state update are skipped as well.
- The outputs panel copy handlers serialize on demand when their output is
  disabled, so copy-as-HTML/Markdown still works with the panel rendered.
- `readEditorSnapshot(editor, transformers, options?)` accepts an options bag
  to skip disabled outputs (`EditorSnapshotOutputs`).

### Changed

- `initialMarkdown` / `initialHtml` are now **initial-only by contract**: the
  seed is captured once per mount and never re-applied when prop identities
  change. Consumers should remount via `key` to load different initial content;
  re-seeding in place previously replaced live state and reset the caret.
- The demo seed-content plugin (`editor-seed-content`) tags its seed update
  with the same `pytah-seed` tag.

### Fixed

- The slash menu no longer steals the caret from the editor when it opens:
  focus landing inside the popup bounces back to the editor root
  (`rootElement.focus({ preventScroll: true })`).
- The table-of-contents mini-bars no longer stretch to full height on
  heading-heavy documents (`max-h-[70vh]` with a thin scrollbar).
