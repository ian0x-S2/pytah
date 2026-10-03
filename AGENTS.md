# AGENTS.md

## Workflow

- Use **bun only**: `bun install`, `bun run <script>`, `bun x <cli>`. Never `npm`, `npx`, `pnpm` or `yarn` unless the user asks.
- Format/lint with `bun x ultracite fix` (check: `bun x ultracite check`, setup: `bun x ultracite doctor`). Oxlint + Oxfmt auto-fix most issues, so spend your attention on logic, naming, architecture, edge cases and UX/accessibility.
- Write accessible, type-safe code: explicit types where they help, `unknown` over `any`, no magic numbers, no `console.log`/`debugger`/`alert`, throw `Error` objects, avoid barrel files, ref as a prop (React 19, no `forwardRef`).
- Tests: assertions inside `it()`/`test()`, async/await (no `done`), no `.only`/`.skip`, flat suites.
- The `lexical/` submodule must be in `.gitignore` before committing.

## Changelog

- Every user-facing **editor** change (behavior, props, defaults, fixes) gets an entry in `CHANGELOG.md` under `## Unreleased`, grouped `Added` / `Changed` / `Fixed` / `Removed`, matching existing style.
- No entry for UI-only changes: visual restyles, layout/spacing/geometry tweaks, visible-label additions or any other polish with zero behavioral diff. No entry either for home page, responsive tweaks, marketing or internal ones (refactors, lint, tests, docs).
- On release: rename `Unreleased` to the new version and bump `package.json` `version` to match.

## Project

Vite + React + TypeScript app whose main product is a rich **Lexical** editor built on shadcn/Base UI primitives. Goal: editor quality and copy/paste ergonomics (HTML and Markdown), not cloning Notion. The long-term DX goal is a **lego-like editor**: prefer small composable building blocks and explicit extension points over hardcoding behavior into one monolith.

- `src/app.tsx`: app shell and editor mounting
- `src/components/editor/`: the main product surface
- `src/components/ui/`: shared shadcn/Base UI primitives
- `src/lib/`: low-level utilities

## Editor architecture

- `editor/editor.tsx` is the composition root. Keep the split between the ready-made `Editor` and the lower-level surfaces it wires together.
- Prefer additive extension points (feature flags, slots, extra plugin mounts, extra node registration) over one-off booleans or forking the editor tree. For each new capability ask: default behavior, or optional piece consumers can enable/replace/omit? Overrides must work through public props, never by editing `ui/content.tsx` or `core/config.ts`.
- Layout: foundations in `core/`, React composition in `ui/`, Lexical behaviors in `plugins/`.
  - Complex plugins live in `plugins/<feature>/`; `plugin.tsx` is the orchestration entrypoint. When it grows, move floating UI, selection math, menus, dialogs and action helpers into sibling files.
  - Nodes are feature-first: `core/nodes/<feature>/` (simple names: `container-node.ts`, `item-node.ts`, `node.tsx`), with node-only DOM/serialization helpers inside. Align `plugins/<feature>/` with `core/nodes/<feature>/`.
  - Keep declarative config separate from Lexical mutation logic and React wiring.
- Avoid deprecated Lexical React helpers when core Lexical or `@lexical/extension` equivalents exist.

### Feature registry

- Built-in capabilities are `EditorFeature` descriptors in `core/features.tsx` (flag name, owned nodes, behavior plugin, markdown transformers, slash-command ids). This is the single source of truth for what the default editor ships.
- `core/config.ts` and `ui/content.tsx` both derive from it. A toggled flag toggles nodes, plugin, transformers and slash commands **together**, never piecemeal.
- **Add a built-in feature**: add an `EditorFeature` to `EDITOR_FEATURES`, a flag in `EditorFeatureFlags` and a default in `DEFAULT_EDITOR_FEATURES`. Never hardcode plugin mounts, node registrations, transformers or slash commands in scattered files.
- **Add a consumer feature without touching internals**: `extraFeatures` prop with `ExtraEditorFeature` descriptors (id, plugin, nodes, transformers, slashCommandIds).
- Always-on plugins (history/list/code/link/horizontal-rule/editable/editor-state) and flag-only toggles (markdownShortcuts, tabIndentation) stay mounted in `ui/content.tsx`. Only features owning nodes, transformers or slash commands belong in the registry.

### Feature contract workflow (humans and agents)

- Before a new feature that adds built-in behavior, custom nodes or changes public composition, start from `docs/process/feature-rfc-template.md`.
- Fill the architecture contract in `.github/pull_request_template.md`; review against `docs/process/architecture-review-rubric.md`.
- A feature is not complete until these are checked explicitly: ownership layer, public extension point, optional/default behavior, slash-command impact, tests, docs impact, `AGENTS.md` impact.

## Editor invariants

- Copy/paste for HTML and Markdown must keep working; editable and read-only modes must both work.
- Slash commands are a core UX surface: keep highlight, initial focus and scroll in sync. Ids come from `resolveSlashCommandIds` (enabled features only); no manual list sync.
- Markdown transformers are feature-scoped and passed via the resolved `transformers` set. Never hardcode the full list in `core/utils.ts` or `ui/content.tsx`.
- Snapshot serialization is gated by `features.snapshot` (html/markdown/text, default all on); disabled outputs are never computed and surface as `""`.
- The mount seed (`initialMarkdown`/`initialHtml`) is captured **once per mount** and applied synchronously via the composer's `initialConfig.editorState` (tagged `pytah-seed`, suppressed from `onChange` when `emitInitialSnapshot: false`). Never re-seed on prop identity changes; consumers remount via `key`.
- Never read layout (`getBoundingClientRect`, `getElementByKey` for positioning) or call `scrollIntoView` synchronously after `editor.update` inside a Lexical command listener. The update is nested and the DOM commits only after the listener returns; do post-commit DOM work in the update's `onUpdate` callback.
- After drag-and-drop, scroll only if the dropped block is outside the viewport.

## UI conventions

- **className contract**: every public editor component accepts `className?: string` merged via `cn(defaults, className)`. `Editor` also exposes `contentClassName` (threaded to `ContentEditable`).
- **Toolbar**: `EditorTopToolbar` uses `editor-toolbar` (aligns with the content column), action bar uses `editor-actionbar`. Single-icon actions use `size="icon-sm"`, never text labels for format/alignment/indent. Always `aria-label` on icon-only buttons. Active item in dropdown lists is marked with a right-aligned `<CheckIcon className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground" />`.
- **Floating surfaces** (toolbars, popovers, link editors) use the `editor-floating` class (plain CSS in `core/tokens.css`, not a Tailwind `@utility`). Its radius comes from `--editor-floating-radius`, capped at `rounded-md`. Animate in with `fade-in-0 zoom-in-95 animate-in duration-100`. Padding stays Tailwind (`p-1.5` toolbar, `p-2` panels, `p-4` dialogs).
- **Radius cap**: no editor surface renders larger than `rounded-md`. Use `rounded-md`/`rounded-sm` (or `rounded-[min(var(--radius-md),Npx)]` when a size must cap below it); never `rounded-lg`/`xl`/`2xl`/`3xl` in classes, and never an `--editor-*-radius` token that resolves to `lg` or larger. Cap tokens as `var(--radius-md, 0.5rem)` so corners follow the consumer theme.
- **Anchored floating UI**: derive vertical centering from `Math.round((anchorRect.height - elementSize) / 2)`, never a hard offset. Keep 4-6px between element and anchor edge. Icon is ~50-55% of button size (`size-2.5` in `size-5`).
- **Separator**: `<Separator orientation="vertical" className="mx-0.5 h-4" />` only to group semantically distinct controls in one row, not as decoration.
- **Scrolling**: every scrollable surface uses `components/ui/scroll-area.tsx`.
  - If another primitive owns scrolling (select, cmdk), render it as the viewport via `viewportRender` and restate clobbered semantics (e.g. `role="listbox"`) via `viewportProps`.
  - `pre` blocks and the TOC keep `scrollbar-hidden` by design. Lexical-owned DOM (table wrapper, code block) is styled natively in `core/tokens.css`.
  - `shadcn/no-restyle`: put frames (border/rounded/bg/shadow) on a wrapper div and padding/typography on an inner div, never on `ScrollArea` or `viewportClassName`.

## Design tokens (`core/tokens.css`)

`--editor-*` variables are the single source of truth for editor styling; consumers override them. Never scatter Tailwind literals for things a token covers. Families: content, toolbar/chrome/shell, floating, table, image/handles, code, collapsible, layout, math, youtube/embed, type scale. Read the file for exact names.

- Aliases must keep an explicit oklch fallback so a `shadcn update` degrades to a pinned value instead of `unset`.
- Density: `:root` = comfortable; `<Editor density="compact">` sets `data-density="compact"` (single density per page).
- Token migrations must have **zero visual diff** and close with the checklist: light/dark x comfortable/compact x editable/read-only, across canvas, toolbar (basic/full), floating toolbar, slash, link editor, table menu + selection, image + resizer + dialogs. The **radius cap is the one intentional exception**: collapsing `lg`+ radii to `var(--radius-md, 0.5rem)` deliberately shrinks corners, so run the same checklist to confirm the smaller corners land cleanly rather than to prove a no-op.
- Slash/TOC popovers and the Excalidraw preview intentionally keep custom/translucent variants.

## Docs (`src/pages/docs/`)

- Pages are `.mdx` with frontmatter `title`, `description`, `group` (`core` | `feature-guides` | `extension-guides`), `icon` (name from `ICON_BY_NAME` in `docs/manifest.tsx`), `label`, `order`. Slug and sidebar derive from the file path: adding a page = adding a file, never edit the manifest.
- MDX renders through `src/components/docs/mdx-components.tsx` (`Callout`, `CodeBlock`, `FileTree`, `FeatureTable`, `TransformersTable`, `InterfaceSource`, `MarkedSource`). Heading anchors are automatic; never hand-write `<SectionHeading id>`.
- Source code is the canonical reference: import real code with `?raw` instead of duplicating snippets. Never hardcode feature/transformer/node/slash-command lists; use `<FeatureTable/>` and `<TransformersTable/>`. Keep prose manual, but don't copy implementation code, prop shapes, command registries or token definitions that already exist in `src/`.
- Architecture changes must update the nearest relevant `AGENTS.md`. If a feature README duplicates agent context, `AGENTS.md` is the source of truth.
