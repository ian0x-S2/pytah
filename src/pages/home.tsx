/* Hallmark · pre-emit critique: P5 H4 E5 S4 R5 V5 */
/* Hallmark · genre: modern-minimal · macrostructure: Split Studio · H2 knobs: ratio=7/5, right=iso-layers, divider=hairline · F3 knobs: columns=3(key/val/cta), rules=every-row, numbers=tabular · F4 knobs: numbering=01/02/03, layout=vertical-stack, connector=none · theme: monochrome-shadcn · design-system: design.md · designed-as-app · nav: N9 · footer: Ft2 · radius: sm-only · contrast: caveat (muted ≈3.4:1, stock token) · honest: pass (46) · chrome: pass (47) · tokens: pass (48) · responsive: pass (49) · mobile: pass (34, 49, 50-57) */
import { ArrowRightIcon, MenuIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

import { ThemeToggle } from "@/components/docs/theme-toggle";
import { HoverLayerStack } from "@/components/pixel-perfect/hover-layer-stack";
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

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function HomeMobileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={className ?? "relative shrink-0 sm:hidden"} ref={rootRef}>
      <Button
        aria-controls="home-mobile-menu"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="rounded-sm transition-colors"
        onClick={() => setOpen((value) => !value)}
        size="icon-sm"
        variant="ghost"
      >
        {open ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
      </Button>

      {open ? (
        <nav
          aria-label="Mobile"
          className="absolute top-full right-0 z-50 mt-2 w-52 animate-in overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 fade-in-0 zoom-in-95"
          id="home-mobile-menu"
        >
          <Link
            className="flex items-center rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            href="/docs/overview"
            onClick={close}
          >
            Get started
          </Link>
          <Link
            className="flex items-center rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted"
            href="/demo"
            onClick={close}
          >
            Live demo
          </Link>
          <a
            className="flex items-center rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted"
            href={REPOSITORY_URL}
            onClick={close}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      ) : null}
    </div>
  );
}

export function HomePage() {
  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground selection:bg-foreground selection:text-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-105 bg-ambient-home" />

      {/* N9 edge-aligned minimal: wordmark left, actions right, no link row */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-8">
          <Link
            className="flex min-w-0 shrink-0 items-center gap-2 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
            href="/"
          >
            <span>Pytah</span>
            <span className="hidden rounded-sm border border-border/70 px-1 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
              registry
            </span>
          </Link>

          <div className="flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-2">
            {/* Desktop nav: inline actions */}
            <nav
              aria-label="Primary"
              className="hidden min-w-0 items-center gap-0.5 sm:flex sm:gap-2"
            >
              <Link className="shrink-0" href="/demo">
                <Button
                  className="rounded-sm px-2 whitespace-nowrap transition-colors sm:px-2.5"
                  size="sm"
                  variant="ghost"
                >
                  Demo
                </Button>
              </Link>
              <a
                className="shrink-0"
                href={REPOSITORY_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Button
                  aria-label="GitHub repository"
                  className="rounded-sm px-2 whitespace-nowrap transition-colors sm:px-2.5"
                  size="sm"
                  variant="ghost"
                >
                  <GithubIcon className="size-3.5" />
                  GitHub
                </Button>
              </a>
              <Link className="shrink-0" href="/docs/overview">
                <Button
                  className="rounded-sm px-2 whitespace-nowrap transition-colors sm:px-2.5"
                  size="sm"
                  variant="ghost"
                >
                  Get started
                </Button>
              </Link>
            </nav>

            {/* Mobile: theme + hamburger, everything else lives in the menu */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>
            <HomeMobileMenu />
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-6xl min-w-0 flex-col px-4 pt-10 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
        {/* H2 split diptych: text left, proof panel right */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-10 sm:gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex min-w-0 flex-col items-start text-left lg:col-span-7">
            <h1 className="max-w-full min-w-0 text-4xl leading-display font-semibold tracking-tight text-balance break-words text-foreground sm:text-5xl xl:text-6xl">
              The rich text editor
              <br className="hidden sm:block" />{" "}
              <span className="font-normal text-muted-foreground">
                crafted for React.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-balance text-muted-foreground sm:mt-5 sm:text-lg">
              A fully composable, copy-paste ready Lexical editor engineered
              with shadcn/ui and Tailwind CSS. Built for speed, developer
              ergonomics, and lossless Markdown & HTML workflows.
            </p>

            <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link className="w-full sm:w-auto" href="/docs/overview">
                <Button
                  className="h-11 w-full justify-center rounded-sm px-5 whitespace-nowrap shadow-xs transition-colors sm:h-10 sm:w-auto"
                  size="default"
                >
                  Get started
                </Button>
              </Link>
              <Link className="w-full sm:w-auto" href="/demo">
                <Button
                  className="h-11 w-full justify-center rounded-sm px-5 whitespace-nowrap transition-colors sm:h-10 sm:w-auto"
                  size="default"
                  variant="outline"
                >
                  Live demo
                </Button>
              </Link>
            </div>

            <dl className="mt-8 grid w-full max-w-xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-border/50 bg-border/50 sm:mt-10 sm:grid-cols-4">
              {[
                ["Engine", "Lexical"],
                ["UI", "React 19"],
                ["CSS", "Tailwind v4"],
                ["Lock-in", "Zero"],
              ].map(([term, value]) => (
                <div className="min-w-0 bg-background px-3 py-2.5" key={term}>
                  <dt className="truncate font-mono text-xs tracking-wider text-muted-foreground">
                    {term}
                  </dt>
                  <dd className="mt-1 truncate text-sm font-medium tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Proof: isometric editor stack (hover to explode) */}
          <figure
            aria-label="Isometric stack of editor layers: compose canvas, node blocks, document surface and floating toolbar"
            className="flex min-h-56 w-full min-w-0 flex-col items-center justify-end gap-5 overflow-hidden pt-4 pb-4 sm:min-h-80 sm:gap-8 sm:pt-10 lg:col-span-5 lg:mt-8 lg:pt-12"
          >
            <div className="mb-1 scale-90 sm:scale-110">
              <HoverLayerStack />
            </div>
            <figcaption className="px-4 text-center font-mono text-xs text-balance text-muted-foreground">
              compose · type · format · ship
            </figcaption>
          </figure>
        </div>

        <hr className="mt-12 border-border/40 sm:mt-24" />

        {/* F3 tabular spec sheet: hairline rows, no cards */}
        <section className="mt-8 sm:mt-12" aria-label="What ships">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            What ships
          </h2>
          <div className="mt-4 overflow-hidden rounded-sm border border-border/50 sm:mt-6">
            <ul className="divide-y divide-border/40">
              {specRows.map((row) => (
                <li
                  className="grid min-w-0 grid-cols-1 gap-1.5 px-4 py-5 transition-colors hover:bg-muted/15 sm:grid-cols-12 sm:items-baseline sm:gap-4 sm:px-5"
                  key={row.title}
                >
                  <span className="font-mono text-xs tracking-wider text-muted-foreground sm:col-span-3">
                    {row.tag}
                  </span>
                  <div className="min-w-0 sm:col-span-6">
                    <h3 className="text-sm font-semibold tracking-tight break-words text-foreground">
                      {row.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                      {row.description}
                    </p>
                  </div>
                  <Link
                    className="mt-1 inline-flex items-center gap-1 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground sm:col-span-3 sm:mt-0 sm:justify-end sm:py-0 sm:text-xs"
                    href={row.href}
                  >
                    {row.cta}
                    <ArrowRightIcon className="size-3.5 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* F4 step sequence: genuinely ordinal docs path */}
        <section className="mt-12 sm:mt-20" aria-label="Choose your path">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Choose your path
          </h2>
          <ol className="mt-4 overflow-hidden rounded-sm border border-border/50 sm:mt-6">
            {pathSteps.map((step) => (
              <li
                className="flex min-w-0 items-baseline gap-3 border-border/40 px-4 py-4 transition-colors not-last:border-b hover:bg-muted/15 sm:gap-6 sm:px-5"
                key={step.href}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums"
                >
                  {step.index}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <Link
                    className="min-w-0 shrink-0 text-sm font-semibold tracking-tight break-words text-foreground underline-offset-4 transition-colors hover:underline"
                    href={step.href}
                  >
                    {step.title}
                  </Link>
                  <span className="min-w-0 text-xs break-words text-muted-foreground sm:text-right">
                    {step.description}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {/* Ft2 inline single line */}
      <footer className="border-t border-border/40 py-8 sm:py-6">
        <div className="mx-auto flex max-w-6xl min-w-0 flex-col items-center justify-between gap-4 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:gap-3 sm:px-8 sm:text-left">
          <p className="max-w-md min-w-0 text-balance">
            <span className="font-semibold text-foreground">Pytah</span>
            <span aria-hidden="true"> · </span>
            Built with Lexical, shadcn/ui, and Tailwind CSS v4.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 sm:justify-end sm:gap-x-5 sm:gap-y-2">
            <Link
              className="rounded-sm px-2 py-2 whitespace-nowrap transition-colors hover:text-foreground sm:px-0 sm:py-0"
              href="/docs/overview"
            >
              Documentation
            </Link>
            <Link
              className="rounded-sm px-2 py-2 whitespace-nowrap transition-colors hover:text-foreground sm:px-0 sm:py-0"
              href="/demo"
            >
              Live demo
            </Link>
            <a
              className="inline-flex items-center gap-1.5 rounded-sm px-2 py-2 whitespace-nowrap transition-colors hover:text-foreground sm:px-0 sm:py-0"
              href={REPOSITORY_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GithubIcon className="size-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
