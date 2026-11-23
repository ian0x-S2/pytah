---
applyTo: "**/*.{ts,tsx,js,jsx}"
---

# Ultracite Code Standards

This project uses **Ultracite** backed by **Oxlint + Oxfmt** for automated linting and formatting. See `AGENTS.md` for complete project architecture, editor invariants, design tokens, and documentation rules.

## Quick Reference

- **Package manager**: Bun only (`bun install`, `bun run <script>`, `bun x <cli>`).
- **Format / auto-fix**: `bun x ultracite fix`
- **Check**: `bun x ultracite check` (or `bun run check`)
- **Diagnose setup**: `bun x ultracite doctor`
- **Tests**: `bun run test`

## Core Standards

- **Type safety**: explicit types where helpful, `unknown` over `any`, `as const`, named constants over magic numbers.
- **Modern TS**: `const` by default, `for...of`, `?.` / `??`, template literals, `async`/`await` (no `.then()` chains), throw `Error` objects, no `console.log`/`debugger`/`alert`.
- **React 19 + Compiler**: function components, ref-as-prop (no `forwardRef`), avoid unnecessary manual `useMemo`/`useCallback`/`React.memo`, semantic HTML & accessible ARIA attributes.
- **Security**: `rel="noopener noreferrer"` on `target="_blank"`, sanitize user-supplied URLs via `src/components/editor/core/url.ts`.
- **Tests**: assertions inside `it()`/`test()`, `async`/`await`, flat suites, no `.only`/`.skip`.
- **Architecture**: follow `AGENTS.md` (feature-first folders, `extraFeatures` descriptors, `editor-floating` + `rounded-md` radius cap, `--editor-*` design tokens with `oklch` fallbacks).
