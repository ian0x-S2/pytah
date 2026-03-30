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
  - wires plugins, shell UI, import/export controls, and output panels
- `editor-config.ts`
  - Lexical config factory and registered nodes
- `editor-constants.ts`
  - placeholder text, example content, and feature constants
- `editor-types.ts`
  - public editor types shared across the feature
- `editor-utils.ts`
  - serialization and content-loading helpers
- `editor-actions.ts`
  - editor-level action helpers for reset/import/copy flows
- `editor-ui.tsx`
  - presentational editor shell/header/footer/output UI
- `editor-panels.tsx`
  - editor action bar and output panel composition
- `editor-content.tsx`
  - editor content area and Lexical plugin wiring below the composer root
- `plugins/`
  - isolated Lexical behaviors

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

- Keep complex feature data in typed config files instead of inline arrays inside components
- Keep Lexical tree mutations in small pure helpers when possible
- Keep editor composition concerns in `editor.tsx`, content wiring in `editor-content.tsx`, and panel/layout concerns in `editor-panels.tsx` or `editor-ui.tsx`
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
