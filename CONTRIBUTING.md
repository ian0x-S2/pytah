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

## Canonical contributor reference

The in-app docs are the canonical source for contributor guidance that tends to drift:

- `/docs/overview` for the repository mental model
- `/docs/architecture` for layer ownership and internal structure
- `/docs/contributing` for the day-to-day workflow and validation expectations

Keep those pages up to date first when contributor guidance changes. This file is the GitHub entry point, not the detailed source of truth.

Run the standard validation flow:

```bash
bun run check
bun run build
```

## Feature contract workflow

When adding a new editor feature, use these repository artifacts to keep humans and AI agents aligned on the same architecture contract:

- PR checklist: `.github/pull_request_template.md`
- feature proposal template: `docs/process/feature-rfc-template.md`
- review rubric: `docs/process/architecture-review-rubric.md`

Use the RFC template before implementation when the feature changes public composition, adds custom nodes, or introduces a new built-in behavior. Use the rubric during review to verify folder ownership, extension-point usage, feature gating, and slash-command consistency.

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
