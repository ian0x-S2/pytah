# Design — Pytah

A locked design system for this app. Every page redesign reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## Genre

modern-minimal (Stripe / Linear school: dev-tool register, monochrome, restrained, technical copy).

## Macrostructure family

- Marketing pages (home): **Split Studio** — H2 split diptych hero (text left, isometric document-layer stack right) + F3 tabular spec sheet + F4 step sequence + C3 typographic close.
- App pages (demo): **Workbench** — function carries the page, no enrichment.
- Content pages (docs): **Long Document** — typography only, prose with hairline frames for code/tables and left-rule annotations for callouts.

## Theme

Preserves the existing shadcn monochrome tokens (`src/index.css` `:root` / `.dark`). Accent IS ink — no chromatic floods.

- `--color-paper` oklch(1 0 0)
- `--color-paper-2` oklch(0.97 0 0)
- `--color-ink` oklch(0.145 0 0)
- `--color-ink-2` oklch(0.556 0 0)
- `--color-rule` oklch(0.922 0 0)
- `--color-accent` oklch(0.205 0 0) (accent IS ink)
- `--color-focus` oklch(0.708 0 0)

## Typography

- Display: Geist Variable, weight 600, style normal (roman — italic headers banned)
- Body: Geist Variable, weight 400
- Mono: ui-monospace stack (`font-mono`), tabular-nums for figures
- Display tracking: -0.02em
- Case: sentence case only — no `uppercase` / `capitalize` styling anywhere in the app. Acronyms (`UI`, `CSS`, `API`) and code identifiers keep their canonical spelling; everything else capitalizes the first letter only.
- Type scale anchor: hero `text-4xl sm:text-5xl xl:text-6xl`, leading 1.08

## Spacing

4-point named scale via Tailwind utilities. Section rhythm: `pt-12/sm:pt-20` hero, `mt-16/sm:mt-24` between major blocks, hairline rules as dividers — never equal-whitespace-only rhythm.

## Motion

- Easings: `cubic-bezier(0.16, 1, 0.3, 1)` / 200–300 ms, `transform` + `opacity` only
- Reveal pattern: none — the page is composed, content is just there
- Reduced-motion fallback: opacity-only, ≤ 150 ms
- No `transition-all`, no hover-scale, no overshoot easings

## Microinteractions stance

- Silent success; toasts only for failures / invisible effects
- One hover signal per element (colour or 1 px translate, never both + shadow)
- Focus rings appear instantly, never animated
- Hover tooltips delay 800 ms · focus tooltips 0 ms

## CTA voice

- Primary CTA: filled (`bg-primary text-primary-foreground`), `rounded-sm`, `h-10 px-5`, short label + arrow icon
- Secondary CTA: outline (`variant="outline"`), `rounded-sm`, same height
- Tertiary: typographic link (word + arrow + 1 px underline, no box)
- Labels never wrap: `whitespace-nowrap` on every CTA

## Radius (sm-only contract)

Site + docs use **only** `rounded-sm`. `rounded-full` is banned everywhere on these surfaces — including badge pills, status dots (2 px squares instead), ambient wrappers, buttons, panels, code blocks, tables, and callouts. `rounded-2xl / rounded-xl / rounded-lg / rounded-md` must not appear in `src/pages/home.tsx`, `src/components/docs/*`, or `src/pages/docs-page.tsx`. The global `--radius` token is untouched here; the editor separately caps its own `--editor-*` radius tokens at `rounded-md` (see the radius cap rule in `AGENTS.md`), so the two contracts don't collide.

## Per-page allowances

- Marketing pages MAY use one Tier-A proof panel (home only): the isometric layer stack — a real Three.js scene whose faces are shared SVG artwork, with a static SVG twin for loading, reduced-motion and no-WebGL. The three planes carry product content (composed pieces, the shadcn/Base UI kit, the `pytah` editor surface), never decoration. No Lottie, no photo placeholders.
- App pages MUST NOT use enrichment — function carries the page.
- Content pages: typography only.

## What pages MUST share

- The wordmark (`Pytah`) + sharp `docs` tag
- The monochrome accent and its placement (≤ 5 % per viewport)
- Geist display + body, mono for labels/figures
- The CTA voice (sm radius, matched heights, single-line labels)
- Hairline-rule section rhythm (rule + gap, never gap alone)

## What pages MAY differ on

- Macrostructure within the page-type family above
- Hero proof content (install panel on home, none on docs)
- F-block choice (F3 spec sheet on home, prose tables on docs)

## Exports

### tokens.css (site scope)

```css
:root {
  --color-paper: oklch(1 0 0);
  --color-paper-2: oklch(0.97 0 0);
  --color-ink: oklch(0.145 0 0);
  --color-ink-2: oklch(0.556 0 0);
  --color-rule: oklch(0.922 0 0);
  --color-accent: oklch(0.205 0 0);
  --color-accent-ink: oklch(0.985 0 0);
  --color-focus: oklch(0.708 0 0);

  --font-display: "Geist Variable", sans-serif;
  --font-body: "Geist Variable", sans-serif;

  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-2xl: 4.5rem;
  --space-3xl: 7rem;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-short: 220ms;
  --radius-card: 0.375rem;
  --radius-pill: 0.375rem;
  --radius-input: 0.375rem;
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(1 0 0);
  --color-ink: oklch(0.145 0 0);
  --color-accent: oklch(0.205 0 0);
  --font-display: "Geist Variable", sans-serif;
  --font-body: "Geist Variable", sans-serif;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper": { "$value": "oklch(1 0 0)", "$type": "color" },
    "ink": { "$value": "oklch(0.145 0 0)", "$type": "color" },
    "accent": { "$value": "oklch(0.205 0 0)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Geist Variable", "$type": "fontFamily" },
    "body": { "$value": "Geist Variable", "$type": "fontFamily" }
  },
  "radius": {
    "card": { "$value": "0.375rem", "$type": "dimension" },
    "pill": { "$value": "0.375rem", "$type": "dimension" },
    "input": { "$value": "0.375rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  /* base token untouched (0.625rem in src/index.css); sm-only radius on
     site/docs is achieved via rounded-sm utilities, which override the
     shared primitives through tailwind-merge */
  --radius: 0.625rem;
}
```
