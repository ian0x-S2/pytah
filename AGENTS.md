# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

## Package Manager

- Always use `bun` for this repository.
- Use `bun install` for dependencies.
- Use `bun run <script>` for package scripts.
- Use `bun x <cli>` for one-off CLIs.
- Do not default to `npm`, `npx`, `pnpm`, or `yarn` unless the user explicitly asks for them or a tool only works with them.

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.

---

## Project Context

This repository is a Vite + React + TypeScript application centered on a rich editor experience built with Lexical plus shadcn/Base UI primitives. Inspiration from Notion is acceptable, but the goal is editor quality and copy/paste ergonomics rather than cloning Notion.

The long-term DX goal is a lego-like editor: contributors should prefer exposing small, composable editor building blocks and explicit extension points over hardcoding more behavior into a single monolithic editor surface.

### Project Architecture

- `src/app.tsx`
  - app-level shell and editor mounting
- `src/components/editor/`
  - main feature area of the project
  - the editor is the primary product surface right now
- `src/components/ui/`
  - shared shadcn/Base UI primitives used by the editor and app shell
- `src/lib/`
  - shared low-level utilities

### Editor Architecture Rules

- `src/components/editor/editor.tsx` is the composition root for the editor experience
- preserve a clear split between the ready-made `Editor` experience and the lower-level composition surfaces it wires together
- prefer additive extension points such as feature flags, slots, extra plugin mounts, and extra node registration before introducing new one-off booleans or forks of the editor tree
- when adding a new editor capability, ask first whether it should be a default product behavior or an optional lego piece that consumers can enable, replace, or omit
- keep the default editor opinionated, but make that opinion easy to override through public props instead of requiring edits inside `ui/content.tsx` or `core/config.ts`
- keep editor foundations in `src/components/editor/core/`, React composition in `src/components/editor/ui/`, and Lexical behaviors in `src/components/editor/plugins/`
- complex plugins should live in `src/components/editor/plugins/<feature>/`
- keep `plugin.tsx` as the orchestration entrypoint for a feature; when a plugin grows, move floating UI, selection math, menus, dialogs, and action helpers into neighboring files inside the same feature folder instead of letting one plugin file absorb everything
- keep `src/components/editor/core/nodes/` feature-first: prefer `core/nodes/<feature>/...` over a flat list of unrelated node files
- if a feature owns two or more related Lexical nodes, group them under the same `core/nodes/<feature>/` folder and use simple filenames such as `container-node.ts`, `content-node.ts`, `item-node.ts`, or `node.tsx`
- keep node-only DOM helpers and serialization helpers inside the same node feature folder
- align `plugins/<feature>/` with `core/nodes/<feature>/` whenever the feature owns custom nodes
- keep declarative config separate from Lexical mutation logic and React wiring
- if a built-in behavior plugin can be meaningfully omitted by consumers, wire it through `EditorFeatureFlags` instead of leaving it permanently mounted; when slash commands depend on those plugins, keep the available command list in sync with the enabled features
- prefer feature-local relative imports inside `src/components/editor/*`
- avoid barrel files
- avoid deprecated Lexical React helpers when core Lexical or `@lexical/extension` equivalents exist

### Feature Contract Workflow

- this workflow applies to human contributors and AI agents
- before implementing a new editor feature, start from `docs/process/feature-rfc-template.md` when the change adds built-in behavior, custom nodes, or changes public composition
- when opening or preparing a PR, fill the architecture contract in `.github/pull_request_template.md`
- during review, validate the change with `docs/process/architecture-review-rubric.md`
- a feature is not considered complete unless its ownership layer, public extension point, optional/default behavior, slash-command impact, tests, docs impact, and `AGENTS.md` impact were checked explicitly

### Editor UI/UX Conventions

These patterns are established and must be kept consistent across all editor components.

#### className override contract

Every public editor component must accept `className?: string` and merge it via `cn(defaults, className)`. This lets callers override specific utilities without losing defaults.

The `Editor` component additionally exposes `contentClassName?: string`, which is threaded down to the `ContentEditable` surface via the same `cn()` pattern so consumers can override padding, min-height, font size, etc.

```tsx
// correct
function EditorFoo({ className }: { className?: string }) {
  return <div className={cn("default-classes", className)} />;
}
```

#### Toolbar layout

- The top toolbar (`EditorTopToolbar`) uses `px-8 py-2` so its content aligns with the editor text column (`px-8`)
- The toolbar background is `bg-muted/20` — a subtle tint that visually separates it from the content area without hard contrast
- Toolbar action buttons that represent a single icon use `size="icon-sm"` (28px) — never text labels for format/alignment/indent actions
- Always provide `aria-label` on icon-only buttons
- Active state in dropdown lists is indicated by a `<CheckIcon className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground" />` on the right, not by background color alone

#### Floating surfaces (toolbars, popovers, link editors)

Use this set of classes for any floating panel that appears over editor content:

```
rounded-xl bg-popover shadow-lg ring-1 ring-border
```

- `rounded-xl` — softer than `rounded-lg`, feels more premium
- `shadow-lg` — enough elevation to read clearly over content
- `ring-1 ring-border` — uses the semantic border token, not `ring-foreground/10`
- Animate in with `fade-in-0 zoom-in-95 animate-in duration-100`

#### Positional anchoring for floating UI

When a floating element is anchored to a DOM rectangle (e.g. table cell, selection):

- **Vertical centering**: always derive `top` from `Math.round((anchorRect.height - elementSize) / 2)` rather than a hard pixel offset — hard offsets break when cells/rows resize
- **Edge inset**: leave at minimum 4–6px between the floating element and the nearest edge of its anchor; never let the element butt against the cell boundary
- **Icon-to-button ratio**: keep icon size at roughly 50–55% of the button size (e.g. `size-2.5` icon in a `size-5` button) so there is visible padding inside the hit target

#### Separator usage

Use `<Separator orientation="vertical" className="mx-0.5 h-4" />` to divide logical groups within a single floating row (e.g. between a URL display and its action buttons). Avoid using it as decoration — only when grouping semantically distinct controls.

---

### Working Memory For This Project

When changing this codebase, keep these facts in mind:

- the editor must stay copy/paste ready for HTML and Markdown workflows
- editor DX is a first-class product concern: changes should move the codebase toward reusable, lego-like composition rather than tighter coupling
- slash command behavior is a core UX surface and must keep highlight, initial focus and scroll synchronization correct
- editable and read-only modes must both remain functional
- default composition should remain easy to use, but advanced consumers should be able to opt out of chrome, swap surfaces, and add plugins or nodes without patching internals
- `src/pages/docs/` should treat the application source as the canonical reference for code examples and API shapes
- when docs need to show real code, prefer importing source with `?raw` or reading from shared exported metadata instead of duplicating snippets manually
- keep prose and editorial explanation in docs manual, but avoid copying implementation code, prop shapes, command registries, or token definitions when they already exist elsewhere in `src/`
- architecture changes should update the nearest relevant `AGENTS.md` so future work keeps the same mental model
- if a feature-specific README duplicates agent context, prefer `AGENTS.md` as the durable source of truth
- the `lexical/` submodule must be ignored by git (ensure it's in `.gitignore` before committing)
