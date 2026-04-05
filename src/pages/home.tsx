import { ArrowRightIcon, PlayIcon } from "lucide-react";
import { Link } from "wouter";
import ditheredImg from "@/assets/dithered.png";
import { ThemeToggle } from "@/components/docs/theme-toggle";
import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col">
      {/* Header — floats over layout, no border */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5">
          <span className="font-semibold text-base text-foreground tracking-wide">
            Pytah
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/docs/getting-started">
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
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Mobile image banner — hidden on desktop */}
        <div className="relative h-[45vh] overflow-hidden lg:hidden">
          <img
            alt="Pytah — rich text editor"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-50"
            height={1120}
            src={ditheredImg}
            width={843}
          />
          {/* Bottom fade into background */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Left — content */}
        <div className="flex flex-1 flex-col justify-start px-6 pt-8 pb-14 sm:px-8 lg:justify-center lg:py-0 lg:pt-0">
          <p className="mb-4 font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Open source · Lexical · shadcn/ui
          </p>

          <h1 className="mb-5 font-semibold text-4xl text-foreground leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
            Rich text editor
            <br />
            <span className="text-muted-foreground">copy-paste ready.</span>
          </h1>

          <p className="mb-10 max-w-sm text-muted-foreground text-sm leading-relaxed">
            A Lexical-powered block editor with slash commands, floating
            toolbar, drag-and-drop, tables, images, and more. Drop it into any
            React + shadcn/ui project.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/docs/getting-started">
              <Button size="lg">
                Get Started
                <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                <PlayIcon className="size-4" />
                Try the Editor
              </Button>
            </Link>
          </div>
        </div>

        {/* Right — full-bleed image panel, desktop only */}
        <div className="relative hidden shrink-0 overflow-hidden lg:flex lg:w-[36%] xl:w-[38%]">
          <img
            alt="Pytah — rich text editor"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-50"
            height={1120}
            src={ditheredImg}
            width={843}
          />
          {/* Left-edge fade into content side */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 sm:px-8 lg:absolute lg:bottom-0 lg:left-0">
        <p className="text-muted-foreground text-xs">
          Built with Lexical, shadcn/ui, and Tailwind CSS v4.
        </p>
      </footer>
    </div>
  );
}
