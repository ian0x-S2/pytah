/* Hallmark · pre-emit critique: P5 H4 E5 S4 R5 V5 */
/* Hallmark · genre: modern-minimal · macrostructure: Split Studio · H2 knobs: ratio=7/5, right=iso-layers, divider=hairline · F3 knobs: columns=3(key/val/cta), rules=every-row, numbers=tabular · F4 knobs: numbering=01/02/03, layout=vertical-stack, connector=none · theme: monochrome-shadcn · design-system: design.md · designed-as-app · nav: N9 · footer: Ft2 · radius: sm-only · contrast: caveat (muted ≈3.4:1, stock token) · honest: pass (46) · chrome: pass (47) · tokens: pass (48) · responsive: pass (49) · mobile: pass (34, 49, 50-57) */
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Link } from "wouter";

import { ThemeToggle } from "@/components/docs/theme-toggle";
import { HeroLayers } from "@/components/home/hero-layers";
import { Button } from "@/components/ui/button";
import { REPOSITORY_URL } from "@/lib/site";

const specRows = [
  {
    cta: "Read composition",
    description:
      "Enable, replace, or omit plugins, floating toolbars, and node types with clean React props. Extra features compose through descriptors.",
    href: "/docs/composition",
    tag: "Composition",
    title: "Lego-like composition",
  },
  {
    cta: "Read markdown support",
    description:
      "Bi-directional Markdown and HTML conversion that preserves callouts, tables, checklists, and code formatting with zero friction.",
    href: "/docs/features/markdown-support",
    tag: "Workflows",
    title: "Lossless copy & paste",
  },
  {
    cta: "Read the overview",
    description:
      "Base UI primitives and Tailwind CSS v4 tokens. Dark mode, zero CSS runtime overhead, and instant theming out of the box.",
    href: "/docs/overview",
    tag: "Design system",
    title: "shadcn/ui native",
  },
];

const pathSteps = [
  {
    description: "The mental model and onboarding path.",
    href: "/docs/overview",
    index: "01",
    title: "Overview",
  },
  {
    description: "Install the registry item and render your first editor.",
    href: "/docs/getting-started",
    index: "02",
    title: "Getting started",
  },
  {
    description: "Toggle built-ins and compose extra features.",
    href: "/docs/composition",
    index: "03",
    title: "Composition",
  },
];

export function HomePage() {
  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground selection:bg-foreground selection:text-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-ambient-home" />

      {/* N9 edge-aligned minimal: wordmark left, actions right, no link row */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link
            className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
            href="/"
          >
            <span>Pytah</span>
            <span className="hidden rounded-sm border border-border/70 px-1 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
              registry
            </span>
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link className="hidden sm:block" href="/demo">
              <Button
                className="rounded-sm whitespace-nowrap transition-colors"
                size="sm"
                variant="ghost"
              >
                Demo
              </Button>
            </Link>
            <a href={REPOSITORY_URL} rel="noopener noreferrer" target="_blank">
              <Button
                aria-label="GitHub"
                className="rounded-sm whitespace-nowrap transition-colors"
                size="sm"
                variant="ghost"
              >
                <span className="hidden sm:inline">GitHub</span>
                <ArrowUpRightIcon className="size-3.5" />
              </Button>
            </a>
            <Link href="/docs/overview">
              <Button
                className="rounded-sm whitespace-nowrap transition-colors"
                size="sm"
              >
                Get started
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </Link>
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-6xl flex-col px-6 pt-12 pb-24 sm:px-8 sm:pt-20">
        {/* H2 split diptych: text left, proof panel right */}
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start text-left lg:col-span-7">
            <h1 className="min-w-0 text-4xl leading-display font-semibold tracking-tight wrap-anywhere text-foreground sm:text-5xl xl:text-6xl">
              The rich text editor
              <br />
              <span className="font-normal text-muted-foreground">
                crafted for React.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-balance text-muted-foreground sm:text-lg">
              A fully composable, copy-paste ready Lexical editor engineered
              with shadcn/ui and Tailwind CSS. Built for speed, developer
              ergonomics, and lossless Markdown & HTML workflows.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/docs/overview">
                <Button
                  className="h-10 rounded-sm px-5 whitespace-nowrap shadow-xs transition-colors"
                  size="default"
                >
                  Get started
                  <ArrowRightIcon className="size-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  className="h-10 rounded-sm px-5 whitespace-nowrap transition-colors"
                  size="default"
                  variant="outline"
                >
                  Live demo
                </Button>
              </Link>
            </div>

            <dl className="mt-10 grid w-full max-w-xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-border/50 bg-border/50 sm:grid-cols-4">
              {[
                ["Engine", "Lexical"],
                ["UI", "React 19"],
                ["CSS", "Tailwind v4"],
                ["Lock-in", "Zero"],
              ].map(([term, value]) => (
                <div className="bg-background px-3 py-2.5" key={term}>
                  <dt className="font-mono text-xs tracking-wider text-muted-foreground">
                    {term}
                  </dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Proof: isometric document-layer stack (Tier-A WebGL) */}
          <HeroLayers />
        </div>

        <hr className="mt-16 border-border/40 sm:mt-24" />

        {/* F3 tabular spec sheet: hairline rows, no cards */}
        <section className="mt-10 sm:mt-12" aria-label="What ships">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            What ships
          </h2>
          <div className="mt-6 overflow-hidden rounded-sm border border-border/50">
            <ul className="divide-y divide-border/40">
              {specRows.map((row) => (
                <li
                  className="grid grid-cols-1 gap-2 px-4 py-5 transition-colors hover:bg-muted/15 sm:grid-cols-12 sm:items-baseline sm:gap-4 sm:px-5"
                  key={row.title}
                >
                  <span className="font-mono text-xs tracking-wider text-muted-foreground sm:col-span-3">
                    {row.tag}
                  </span>
                  <div className="sm:col-span-6">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      {row.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {row.description}
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground sm:col-span-3 sm:justify-end"
                    href={row.href}
                  >
                    {row.cta}
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* F4 step sequence: genuinely ordinal docs path */}
        <section className="mt-16 sm:mt-20" aria-label="Choose your path">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Choose your path
          </h2>
          <ol className="mt-6 overflow-hidden rounded-sm border border-border/50">
            {pathSteps.map((step, index) => (
              <li
                className="flex items-baseline gap-4 border-border/40 px-4 py-4 transition-colors not-last:border-b hover:bg-muted/15 sm:gap-6 sm:px-5"
                key={step.href}
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-xs text-muted-foreground tabular-nums"
                >
                  {step.index}
                </span>
                <div className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <Link
                    className="text-sm font-semibold tracking-tight whitespace-nowrap text-foreground underline-offset-4 transition-colors hover:underline"
                    href={step.href}
                  >
                    {step.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {step.description}
                    {index === pathSteps.length - 1 ? null : (
                      <span aria-hidden="true"> →</span>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* C3 typographic close: one link, no box */}
        <div className="mt-16 sm:mt-20">
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
            href="/docs/overview"
          >
            Start with the overview
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </main>

      {/* Ft2 inline single line */}
      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <p>
            <span className="font-semibold text-foreground">Pytah</span>
            <span aria-hidden="true"> · </span>
            Built with Lexical, shadcn/ui, and Tailwind CSS v4.
          </p>
          <div className="flex items-center gap-5">
            <Link
              className="whitespace-nowrap transition-colors hover:text-foreground"
              href="/docs/overview"
            >
              Documentation
            </Link>
            <Link
              className="whitespace-nowrap transition-colors hover:text-foreground"
              href="/demo"
            >
              Live demo
            </Link>
            <a
              className="whitespace-nowrap transition-colors hover:text-foreground"
              href={REPOSITORY_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
