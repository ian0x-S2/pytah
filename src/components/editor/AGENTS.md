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
- `plugins/block-type-toolbar/*`
- `plugins/floating-toolbar/*`
- `plugins/link-behavior/*`
- `plugins/table-behavior/*`
- `plugins/markdown/*`

## Maintenance Rules

- Keep editor foundations in `core/`, editor rendering/composition in `ui/`, and Lexical behavior in `plugins/`
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
- Tables and checklists should stay first-class editing blocks, not hacked-in visual widgets
- Editor should remain usable in editable and read-only modes
