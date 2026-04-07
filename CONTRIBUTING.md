# Contributing to Pytah

Pytah is a rich text editor reference implementation and shadcn registry item built with React, Lexical, shadcn/Base UI, and Tailwind CSS v4.

This repository serves two audiences:

- teams that want to evaluate or embed the editor in another app
- contributors who want to evolve the editor core, docs, and registry output

If you only want to install the editor into your own app, start with `/docs/getting-started` in the local docs site. This guide is for changing the repository itself.

## Local development

Install dependencies and start the app:

```bash
bun install
bun run dev
```

Use these routes while you work:

- `/demo` to exercise the editor behavior directly
- `/docs/overview` for the repo mental model
- `/docs/contributing` for the contributor workflow in the app docs
- `/docs/architecture` when tracing which layer owns a feature

## Repository mental model

`src/components/editor/editor.tsx` is the public composition root for the editor.

Use this rule of thumb when deciding where to change code:

| If you need to change... | Start here | Why |
| --- | --- | --- |
| the public editor API or top-level wiring | `src/components/editor/editor.tsx` and `src/components/editor/core/types.ts` | This is where product defaults and public extension points meet |
| built-in editor behavior | `src/components/editor/plugins/<feature>/` | Plugins own Lexical commands, listeners, and behavior-specific UI |
| the editor chrome or React surfaces | `src/components/editor/ui/` | This layer owns toolbars, panels, and content composition |
| a custom Lexical node | `src/components/editor/core/nodes/<feature>/` | Nodes and related helpers stay feature-local |
| source-driven docs | `src/pages/docs/`, `README.md`, and this file | Repo context should stay consistent across entry points |

## Default change checklist

Before opening a PR, keep these invariants intact:

- editable and read-only modes must both keep working
- HTML and Markdown copy/paste quality must remain intact
- new capabilities should prefer public extension points over one-off internal forks
- docs should stay aligned with the real source when API or architecture changes

Run the standard validation flow:

```bash
bun run check
bun run build
```

## Registry and dependency workflow

Use these when your change affects the shipped registry output or dependency compatibility:

```bash
bun run registry:build
bun run registry:smoke
bun run deps:check
bun run deps:validate
```

- `registry:build` regenerates the shadcn registry files under `public/r/`
- `registry:smoke` rebuilds the registry and runs the install smoke test
- `deps:check` shows dependency drift
- `deps:validate` runs the validation flow after dependency updates

## Standards and source of truth

- `README.md` explains what the repository is and where to start
- in-app docs under `src/pages/docs/` are the consumer-facing reference
- `AGENTS.md` contains the deeper architecture rules and coding conventions
- docs should prefer sourcing real code from `src/` instead of copying implementation snippets by hand
