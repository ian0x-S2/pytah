# RFC 001 — Split the editor registry into per-feature installable items

- **Status:** implemented
- **Date:** 2026-08-25
- **Scope:** `scripts/generate-registry.mjs`, `core/features.tsx`, new `plugins/<feature>/feature.ts` descriptors, docs, `AGENT_GUIDE.md`

## Problem

Today the editor ships as one shadcn registry item (`public/r/editor.json`) backed by one statically-imported feature registry (`core/features.tsx`). This causes two consumer-facing problems:

1. **No install-time granularity.** `shadcn add .../editor.json` copies every plugin/node folder and installs every dependency, including heavy ones (`@excalidraw/excalidraw`, `katex`). The shadcn CLI has no item flags (`--table`), so there is no supported way to install "the editor without excalidraw".
2. **Flags do not shrink the bundle.** `features={{ excalidraw: false }}` correctly gates runtime behavior (nodes, plugins, transformers, slash commands), but because `core/features.tsx` statically imports every plugin and node, tree-shaking cannot remove any of it. Opting out costs nothing today.

Consumers either accept the full dependency graph or hand-delete files from their local copy without a documented contract.

## Ownership

- **Packaging:** `scripts/generate-registry.mjs` — already derives the registry item from the source tree; emitting multiple items extends its existing job.
- **Composition:** `core/features.tsx` — remains the source of truth for what *core* ships; removable content features move out of it.
- **Feature layer:** each `plugins/<feature>/feature.ts` — a feature folder already owns its plugin and its nodes under `core/nodes/<feature>/`, so the descriptor that binds them belongs in the same folder.

## Product Shape

- Content features become **optional lego pieces** installed as separate registry items and wired through the existing `extraFeatures` prop. No new prop is introduced.
- Core keeps only always-on behavior: history, markdown shortcuts, tab indentation, link editing, floating toolbar, draggable blocks, focus on mount, seed content, slash command infra, built-in markdown transformers.
- `EditorFeatureFlags` loses the removable keys (`images`, `youtube`, `excalidraw`, `math`, `collapsible`, `layouts`, `tables`). This is a **breaking change** for consumers who toggled them; migration is explicit composition:

```tsx
// before (monolith)
<Editor />

// after (opt-in composition)
import { imageFeature } from "@/components/editor/plugins/image/feature";
import { tableFeature } from "@/components/editor/plugins/table-behavior/feature";

<Editor extraFeatures={[imageFeature, tableFeature]} />
```

- `chrome`, `slots`, `pluginSlots`, `extraNodes` are untouched.

## Feature Structure

One descriptor per feature, colocated with the feature it describes:

```ts
// plugins/excalidraw/feature.ts
export const excalidrawFeature: ExtraEditorFeature = {
  id: "excalidraw",
  plugin: ExcalidrawPlugin,
  nodes: [ExcalidrawNode],
  slashCommandIds: ["excalidraw"],
};
```

Registry items produced by the generator:

| Item | Files | Extra deps |
| --- | --- | --- |
| `editor` | core plugins, ui primitives, theme files, lib utils | shared lexical set |
| `editor-image` | `plugins/image/`, `core/nodes/image/`, image transformer | — |
| `editor-youtube` | `plugins/youtube/`, `core/nodes/youtube/`, youtube transformer | — |
| `editor-excalidraw` | `plugins/excalidraw/`, `core/nodes/excalidraw/` | `@excalidraw/excalidraw` |
| `editor-math` | `plugins/math/`, `core/nodes/math/`, math transformers | `katex` |
| `editor-collapsible` | `plugins/collapsible/`, `core/nodes/collapsible/` | — |
| `editor-layouts` | `plugins/layout/`, `core/nodes/layout/` | — |
| `editor-tables` | `plugins/table-behavior/` only | — |
| `editor-toc` | `plugins/toc/` incl. `EditorWithToc` wrapper | — |
| `editor-draggable-blocks` | `plugins/draggable-block/` | — |
| `editor-seed-content` | `plugins/core/seed-content*` | — |
| `editor-full` | *(meta item, no files)* | resolves all feature items |

Also moved out of the default stack per review: **seed content**,
**draggable blocks** (self-gates on editability) and the **TOC sidebar**
(`tocFeature` descriptor or the `EditorWithToc` slots-based composition).
Core behavior flags are now exactly: `history`, `markdownShortcuts`,
`tabIndentation`, `floatingToolbar`, `floatingLinkEditor`, `focusOnMount`,
`slashCommand`.

**Paste-fidelity exception:** the base `TableNode` registration, `@lexical/table`, and the table markdown transformer stay in core so HTML/markdown paste of tables never drops content for consumers who skipped the *behavior* item. For other opted-out features, paste fidelity degrades by design (an `<img>` pastes as text/skipped when `editor-image` is absent) — this is documented, intentional behavior.

## Command and Composition Impact

- Slash commands need no structural change: the menu already renders only ids resolved from enabled features, and `resolveSlashCommandIdsWithExtras` merges extra ids today. The `SlashCommandId` union stays complete; executors live with their features.
- The ready-made `Editor` API does not change shape; `extraFeatures` becomes the primary path for content features.
- Docs impact:
  - `AGENT_GUIDE.md`: install matrix per method (base + à la carte items).
  - `getting-started.mdx` / `plugins.mdx`: composition examples updated to explicit `extraFeatures`.
  - `<FeatureTable/>` derives from `core/features.tsx`, which shrinks — verify the rendered table still tells the full story or gains an extras section.
  - Feature guides gain a one-line "install" callout naming their registry item.

### Alternatives considered

- **Custom CLI wrapper with flags** (`pytah add --no-excalidraw`): reinvents shadcn resolution and must track upstream CLI changes. Rejected.
- **Single item + generated variants of `features.tsx`**: magic codegen that diverges from the copied-code ownership model. Rejected.
- **Lazy/dynamic imports inside `features.tsx`**: Lexical nodes require synchronous registration at config time. Rejected.

## Command Execution Ownership

Feature slash contributions (`{ command, run }`) are registered at mount time
into a runtime runner registry (`plugins/slash-command/executors.ts`). Core
surfaces — the slash menu and both toolbars — execute through that registry,
so no core file imports a feature module statically. Dialog flows moved into
their features: image/youtube/layout plugins treat incomplete insert-command
payloads as "open my own dialog".

## Validation

- Implemented validation (2026-08-25): smoke matrix green for base-only and all-features installs; 60 unit tests passing. Original plan:
  - descriptor contract test: every exported feature descriptor has a unique `id`, a defined plugin, valid `slashCommandIds`;
  - resolver tests move from flag-based fixtures to extras-only fixtures;
  - existing `features.test.ts` assertions about `DEFAULT_EDITOR_FEATURES` shrink to the core set.
- Registry: `bun run registry:smoke` extended to a small matrix — base-only build passes; base + each single feature builds; base + all features builds.
- Manual behavior: read-only mode renders opted-in nodes; copy/paste round-trips markdown + html for installed features; paste of tables still works with `editor-tables` absent.
- Read-only impact: none beyond current gating; extras mount identically in both modes (content features are not `editableOnly`).

## Acceptance Criteria

- A consumer can install the base editor without excalidraw/katex and get a compiling app.
- Installing a feature item pulls the base automatically and contributes exactly its nodes/plugin/transformers/slash commands through `extraFeatures`.
- No consumer needs to patch internals (`features.tsx`, `config.ts`) for normal customization.
- Feature-first folder ownership is preserved: descriptor, plugin, and nodes stay inside the feature folders.
- The repo's own docs/demo app composes all features explicitly, proving the extension point covers the default experience.
