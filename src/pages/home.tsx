import { ArrowRightIcon, BoxIcon, PaletteIcon, PlayIcon } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/docs/theme-toggle";
import { Button } from "@/components/ui/button";

function FeatureCard({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-3 inline-flex rounded-lg bg-muted p-2.5">
        <Icon className="size-5 text-foreground" />
      </div>
      <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-border border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-bold text-foreground text-xl">Pytah</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/docs/getting-started">
              <Button size="sm" variant="outline">
                Docs
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="sm">
                <PlayIcon className="size-4" />
                Demo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="mb-4 font-bold text-4xl text-foreground tracking-tight md:text-5xl">
            Copy-paste rich text editor
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            A Notion-style block editor built with{" "}
            <strong className="text-foreground">Lexical</strong> and{" "}
            <strong className="text-foreground">shadcn/ui</strong>. Fully
            themeable, copy-paste ready, and designed for reuse.
          </p>
          <div className="flex items-center justify-center gap-3">
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
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              description="Drop the editor into any React + shadcn/ui project. Copy the components, install Lexical, and you're ready."
              icon={BoxIcon}
              title="Copy-Paste Ready"
            />
            <FeatureCard
              description="All styling flows through ShadCN design tokens. Swap themes by replacing CSS variables -- zero refactoring."
              icon={PaletteIcon}
              title="Fully Themeable"
            />
            <FeatureCard
              description="Slash commands, floating toolbar, drag-and-drop blocks, tables, images, collapsibles, and more."
              icon={PlayIcon}
              title="Rich Feature Set"
            />
          </div>
        </section>

        <section className="border-border border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-3 font-semibold text-2xl text-foreground tracking-tight">
              Minimal dependencies
            </h2>
            <p className="mb-6 text-muted-foreground">
              The editor requires only two runtime families beyond React itself.
            </p>
            <div className="flex justify-center gap-6">
              <div className="rounded-lg border border-border bg-background px-6 py-4 shadow-sm">
                <p className="font-mono font-semibold text-foreground text-sm">
                  lexical
                </p>
                <p className="text-muted-foreground text-xs">
                  Editor framework
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-6 py-4 shadow-sm">
                <p className="font-mono font-semibold text-foreground text-sm">
                  shadcn/ui
                </p>
                <p className="text-muted-foreground text-xs">UI primitives</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-border border-t py-8">
        <p className="text-center text-muted-foreground text-sm">
          Built with Lexical, shadcn/ui, Base UI, and Tailwind CSS v4.
        </p>
      </footer>
    </div>
  );
}
