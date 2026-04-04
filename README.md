# Pytah

Rich text editor playground and reference implementation built with React, Lexical, shadcn/Base UI, and Tailwind CSS v4.

The project goal is editor quality and copy/paste ergonomics, with a DX direction that treats the editor as a lego-like system: the default experience should work out of the box, but consumers should be able to swap surfaces, toggle built-in behavior, and add plugins or nodes without patching internals.

## Highlights

- Lexical-based rich editor with HTML and Markdown output
- Copy/paste-oriented authoring flows
- Slash command, floating toolbar, draggable blocks, tables, embeds, and layouts
- Ready-made editor experience plus public composition hooks
- In-app docs sourced from the real implementation

## Stack

- React 19
- TypeScript
- Vite
- Lexical
- shadcn/Base UI primitives
- Tailwind CSS v4
- Ultracite / Biome
- Lefthook

## Getting Started

Install dependencies:

```bash
bun install
```

Start the dev server:

```bash
bun run dev
```

Open the app locally and use:

- `/demo` for the editor playground
- `/docs/getting-started` for implementation docs

## Scripts

```bash
bun run dev      # start Vite dev server
bun run build    # type-check and build production bundle
bun run check    # run Ultracite checks
bun run fix      # auto-fix formatting/lint issues
bun run preview  # preview the production build
```

## Editor DX

The main public surface is `src/components/editor/editor.tsx`.

The editor now supports two modes of use:

1. Ready-made product editor
2. Composable lego-like editor

Key public extension points:

- `features`: enable or disable built-in behavior plugins
- `chrome`: show or hide default shell pieces like header, footer, action bar, and outputs
- `slots`: replace visual surfaces without editing internals
- `pluginSlots`: mount extra plugins around the built-in stack
- `extraNodes`: register additional Lexical nodes
- `namespace`: customize the Lexical namespace

Example:

```tsx
<Editor
  chrome={{ header: false, outputs: false }}
  features={{ floatingToolbar: false, slashCommand: true }}
  pluginSlots={{ afterEditable: <MyPlugin /> }}
  extraNodes={[MyNode]}
  toolbar="full"
/>
```

## Project Structure

```text
src/
├── app.tsx
├── components/
│   ├── editor/
│   │   ├── core/      # config, types, composition, nodes, utilities
│   │   ├── plugins/   # Lexical behaviors and feature plugins
│   │   ├── ui/        # React composition and chrome
│   │   └── editor.tsx # ready-made public editor surface
│   └── ui/            # shared shadcn/Base UI primitives
├── lib/
│   └── utils.ts
└── pages/
    ├── demo.tsx
    └── docs/
```

## Documentation

The documentation site lives inside the app and treats the source code as the canonical reference.

Start with:

- `/docs/getting-started`
- `/docs/architecture`
- `/docs/plugins`

Feature guides are available under `/docs/guides/*`.

## Development Notes

- `bun run check` should stay clean
- `bun run build` should keep passing after editor changes
- prefer extension points over hardcoded forks when adding editor capabilities
- keep editable and read-only modes working
- preserve HTML and Markdown copy/paste quality

## Git Hooks

`lefthook` is installed through the `prepare` script.

Current pre-commit behavior runs `bun x ultracite fix` on supported files.

## Repository Notes

- the `lexical/` submodule is intentionally ignored by git
- docs should prefer sourcing real code from `src/` instead of duplicating implementation snippets
