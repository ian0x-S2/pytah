# Changelog

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
