import {
  BookOpenIcon,
  BoxIcon,
  CodeIcon,
  LayoutIcon,
  PaletteIcon,
  PlayIcon,
  PlugIcon,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/docs/getting-started",
    icon: BookOpenIcon,
    label: "Getting Started",
  },
  { href: "/docs/architecture", icon: LayoutIcon, label: "Architecture" },
  { href: "/docs/components", icon: BoxIcon, label: "Components" },
  { href: "/docs/plugins", icon: PlugIcon, label: "Plugins" },
  { href: "/docs/theming", icon: PaletteIcon, label: "Theming" },
];

function NavLink({ href, icon: Icon, label }: NavItem) {
  const [isActive] = useRoute(href);

  return (
    <Link
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      href={href}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-border border-r bg-background">
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <Link className="font-semibold text-foreground text-lg" href="/">
          Pytah
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      <div className="border-border border-t px-3 py-3">
        <Link
          className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          href="/demo"
        >
          <PlayIcon className="size-4" />
          Live Demo
        </Link>
        <a
          className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          href="https://github.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          <CodeIcon className="size-4" />
          Source
        </a>
      </div>
    </aside>
  );
}

export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
