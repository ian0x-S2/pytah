import { ArrowRightIcon, CodeIcon, PlayIcon } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/docs/theme-toggle";
import { HeroCube3D } from "@/components/home/hero-cube-3d";
import { Button } from "@/components/ui/button";
import { REPOSITORY_URL } from "@/lib/site";

const features = [
  {
    tag: "Architecture",
    title: "Lego-like Composition",
    description:
      "Modular Lexical architecture. Enable, replace, or omit plugins, floating toolbars, and node types with clean React props.",
    href: "/docs/overview",
  },
  {
    tag: "Workflows",
    title: "Lossless Copy & Paste",
    description:
      "Bi-directional Markdown and HTML conversion that preserves callouts, tables, checklists, and code formatting with zero friction.",
    href: "/docs/features/markdown-support",
  },
  {
    tag: "Design System",
    title: "shadcn/ui Native",
    description:
      "Engineered with Base UI primitives and Tailwind CSS v4 tokens. Seamless dark mode, zero CSS runtime overhead, and instant theming.",
    href: "/docs/overview",
  },
];

const highlights = [
  "Lexical Engine",
  "React 19 Ready",
  "Tailwind CSS v4",
  "Zero Lock-in",
];

export function HomePage() {
  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground selection:bg-foreground selection:text-background">
      {/* Subtle top ambient lighting */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_75%_45%_at_50%_-10%,hsl(var(--foreground)/0.05),transparent)]" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link
            className="flex items-center gap-2 font-semibold text-sm tracking-tight transition-opacity hover:opacity-80"
            href="/"
          >
            <span>Pytah</span>
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/docs/overview">
              <Button size="sm" variant="ghost">
                Docs
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="sm" variant="ghost">
                <PlayIcon className="size-3.5" />
                Demo
              </Button>
            </Link>
            <a href={REPOSITORY_URL} rel="noopener noreferrer" target="_blank">
              <Button size="sm" variant="ghost">
                <CodeIcon className="size-3.5" />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </a>
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative mx-auto flex max-w-6xl flex-col px-6 pt-12 pb-24 sm:px-8 sm:pt-20">
        {/* Side-by-side Hero Block */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column — Main text block */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-transparent px-3.5 py-1 text-muted-foreground text-xs shadow-xs transition-colors hover:border-foreground/20 hover:text-foreground">
              <span className="size-1.5 rounded-full bg-foreground/80" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                shadcn registry item · React & Lexical
              </span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 font-semibold text-4xl text-foreground leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
              The rich text editor
              <br />
              <span className="font-normal text-muted-foreground">
                crafted for React.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-xl text-balance text-base text-muted-foreground leading-relaxed sm:text-lg">
              A fully composable, copy-paste ready Lexical editor engineered
              with shadcn/ui and Tailwind CSS. Built for speed, developer
              ergonomics, and lossless Markdown & HTML workflows.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/docs/overview">
                <Button
                  className="h-10 px-5 font-medium text-sm shadow-xs"
                  size="default"
                >
                  Get Started
                  <ArrowRightIcon className="size-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  className="h-10 px-5 font-medium text-sm"
                  size="default"
                  variant="outline"
                >
                  <PlayIcon className="size-3.5" />
                  Live Demo
                </Button>
              </Link>
            </div>

            {/* Highlights Bar */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {highlights.map((item) => (
                <span
                  className="rounded-md border border-border/50 bg-transparent px-3 py-1 font-mono text-[11px] text-muted-foreground"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column — 3D React-Three-Fiber Cube */}
          <div className="flex items-center justify-center lg:col-span-5">
            <div className="relative flex size-64 items-center justify-center sm:size-80 lg:size-96">
              {/* Subtle ambient circle backing */}
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--foreground)/0.03),transparent_70%)]" />
              <HeroCube3D className="size-full" />
            </div>
          </div>
        </div>

        {/* Transparent Clean Feature Cards */}
        <div className="mt-24 grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Link
              className="group relative flex flex-col justify-between rounded-2xl border border-border/50 bg-transparent p-7 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-border"
              href={feature.href}
              key={feature.title}
            >
              <div>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  {feature.tag}
                </span>

                <h3 className="mt-4 font-semibold text-base text-foreground tracking-tight">
                  {feature.title}
                </h3>

                <p className="mt-2.5 text-muted-foreground text-xs leading-relaxed sm:text-sm">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors group-hover:text-foreground">
                <span>Learn more</span>
                <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border/40 border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-center text-muted-foreground text-xs sm:flex-row sm:px-8 sm:text-left">
          <p>Built with Lexical, shadcn/ui, and Tailwind CSS v4.</p>
          <div className="flex items-center gap-6">
            <Link
              className="transition-colors hover:text-foreground"
              href="/docs/overview"
            >
              Documentation
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="/demo"
            >
              Live Demo
            </Link>
            <a
              className="transition-colors hover:text-foreground"
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
