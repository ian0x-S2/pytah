# Pytah

[Repository](https://github.com/ian0x-S2/pytah) · [Issues](https://github.com/ian0x-S2/pytah/issues)

Pytah is a rich text editor reference implementation and modular shadcn registry built with React, Lexical, shadcn/Base UI, and Tailwind CSS v4.

This repository is intentionally both:

- a playground and docs app for exploring the editor experience
- the canonical source for the editor code and registry output

The project goal is editor quality and copy/paste ergonomics, with a DX direction that treats the editor as a lego-like system: the default experience should work out of the box, but consumers should be able to swap surfaces, toggle built-in behavior, and add plugins or nodes without patching internals.

## Choose Your Path

If you want to use the editor in another app:

- start with `/docs/overview`
- then read `/docs/getting-started` and `/docs/composition`

If you want to contribute to the editor core in this repository:

- read [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- then use `/docs/contributing` and `/docs/architecture`

## Installing the Editor

The registry ships a lean core item plus one optional item per content feature (`editor-image`, `editor-tables`, `editor-excalidraw`, ...), each carrying only its own dependencies. Configure the namespace once and add what you need:

```bash
bunx shadcn@latest add @pytah/editor        # lean core
bunx shadcn@latest add @pytah/editor-full   # or everything
```

Installed features are composed through descriptors:

```tsx
import { imageFeature } from "@/components/editor/plugins/image/feature";

<Editor extraFeatures={[imageFeature]} />
```

Full walkthrough in [`AGENT_GUIDE.md`](./AGENT_GUIDE.md).

## Quick Start

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
- `/docs/overview` for the project mental model and onboarding

## Highlights

- Lexical-based rich editor with HTML and Markdown output
- Copy/paste-oriented authoring flows
- Slash command, floating toolbar, draggable blocks, tables, embeds, and layouts
- Modular registry: a lean core editor plus one optional install per content feature
- Ready-made editor experience plus public composition hooks
- In-app docs sourced from the real implementation

## Mental Model

The main public surface is `src/components/editor/editor.tsx`.

Pytah supports three levels of use:

1. Ready-made product editor
2. Composable editor with public extension points
3. Raw Lexical integration when you need full control

Key public extension points:

- `features`: enable or disable core behavior plugins (history, toolbars, slash command, ...)
- `chrome`: show or hide default shell pieces like header, footer, action bar, and outputs
- `slots`: replace visual surfaces without editing internals
- `pluginSlots`: mount extra plugins around the built-in stack
- `extraNodes`: register additional Lexical nodes
- `extraFeatures`: compose installed content features (images, tables, drawings, ...) and contribute whole custom capabilities without editing internals
- `namespace`: customize the Lexical namespace

```tsx
<Editor
  chrome={{ header: false, outputs: false }}
  features={{ floatingToolbar: false, slashCommand: true }}
  pluginSlots={{ afterEditable: <MyPlugin /> }}
  extraNodes={[MyNode]}
  extraFeatures={[myFeature]}
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

## Scripts

```bash
bun run dev            # start Vite dev server
bun run build          # generate registry output, type-check, and build production bundle
bun run check          # run Ultracite checks
bun run fix            # auto-fix formatting/lint issues
bun run preview        # preview the production build
bun run registry:build # regenerate shadcn registry files under public/r/
bun run registry:smoke # rebuild the registry and run the install smoke test
bun run deps:check     # check dependency drift
bun run deps:validate  # validate dependency updates end-to-end
bun run lint           # run ESLint
bun run test           # run editor tests (bun test)
```

## Documentation

The documentation site lives inside the app and treats the source code as the canonical reference.

Start with:

- `/docs/overview`
- `/docs/getting-started`
- `/docs/contributing`
- `/docs/architecture`
- `/docs/plugins`
- `/docs/api`
- `/docs/components`
- `/docs/theming`

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
