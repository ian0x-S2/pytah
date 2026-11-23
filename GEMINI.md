# Ultracite Code Standards & Project Rules

This project uses **Ultracite** backed by **Oxlint + Oxfmt** for fast, strict linting and formatting. For full editor architecture, feature registry, design tokens, and docs conventions, `AGENTS.md` is the canonical source of truth.

## Quick Reference

- **Package manager**: Use **bun only** (`bun install`, `bun run <script>`, `bun x <cli>`). Never `npm`, `npx`, `pnpm`, or `yarn`.
- **Format / auto-fix**: `bun x ultracite fix`
- **Check lint & formatting**: `bun x ultracite check` (or `bun run check`)
- **Diagnose setup**: `bun x ultracite doctor`
- **Run editor tests**: `bun run test`

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Modern TypeScript

- Use explicit types where they enhance clarity; prefer `unknown` over `any`
- Use `as const` for immutable values and literal types; leverage narrowing over type assertions
- Extract named constants instead of magic numbers
- Prefer `for...of` loops, optional chaining (`?.`), nullish coalescing (`??`), template literals, and `const` by default
- Use `async`/`await` with `try`/`catch` instead of promise chains; always `await` promises
- Throw `Error` objects; remove `console.log`, `debugger`, and `alert` from production code

### React 19 & Accessibility

- **React Compiler**: This project has the React Compiler enabled. Avoid manual `useMemo`, `useCallback`, and `React.memo` unless explicitly required by external libraries or specific edge cases.
- Use React 19 ref-as-prop (never `React.forwardRef`)
- Use function components, top-level hooks, stable keys, semantic HTML (`<button>`, `<nav>`, `<dialog>`), and `aria-label` on icon-only buttons
- Add `rel="noopener noreferrer"` when using `target="_blank"` on external links; sanitize all user-provided URLs via `src/components/editor/core/url.ts`
- Avoid barrel files; prefer feature-local relative imports inside `src/components/editor/*`

### Testing

- Write assertions inside `it()` or `test()` blocks using `async`/`await` (no `done` callbacks)
- Keep test suites flat; never commit `.only` or `.skip`

## Editor UI Conventions (Summary — see `AGENTS.md` for full contract)

- **className contract**: public editor components accept `className?: string` merged with `cn(defaults, className)`
- **Radius cap**: no editor surface renders larger than `rounded-md` (`var(--radius-md, 0.5rem)`); never use `rounded-lg`/`xl`/`2xl`/`3xl` in editor code
- **Floating surfaces**: use the `editor-floating` token class from `core/tokens.css` with `fade-in-0 zoom-in-95 animate-in duration-100`
- **Design tokens**: use `--editor-*` variables from `core/tokens.css` with explicit `oklch(...)` fallbacks on aliases
- **Scrolling**: use `components/ui/scroll-area.tsx` for React scrollable surfaces (wrappers own borders/bg, inner divs own padding)
- **Git hygiene**: keep the `lexical/` submodule ignored in `.gitignore`
