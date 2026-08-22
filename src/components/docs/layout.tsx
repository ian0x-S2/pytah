import { CodeIcon, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { REPOSITORY_URL } from "@/lib/site";
import {
  DOCS_PAGE_GROUPS,
  type DocsPageDefinition,
  getDocsPageByPath,
} from "@/pages/docs/manifest";
import { ThemeToggle } from "./theme-toggle";

function LocalClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="hidden items-center font-mono text-[11px] text-muted-foreground tabular-nums sm:inline-flex">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function NavLink({ href, icon: Icon, label }: DocsPageDefinition) {
  const [isActive] = useRoute(href);

  return (
    <SidebarMenuItem className="my-0.5">
      <SidebarMenuButton
        className="h-7 rounded-md px-2 text-[12px] tracking-tight transition-colors hover:text-foreground"
        isActive={isActive}
        render={<Link href={href} />}
      >
        <Icon className="size-3.5" />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DocsSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="border-border/40 border-b">
        <div className="flex h-10 items-center justify-between px-2">
          <Link
            className="flex items-center gap-2 font-semibold text-foreground text-xs tracking-tight transition-opacity hover:opacity-80"
            href="/"
          >
            <span>Pytah</span>
            <span className="rounded border border-border/70 px-1 py-0.2 font-mono text-[9.5px] text-muted-foreground">
              docs
            </span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden px-1">
        <ScrollArea className="h-full">
          <div className="space-y-3 py-2">
            {DOCS_PAGE_GROUPS.map((group) => (
              <SidebarGroup className="p-0" key={group.id}>
                <SidebarGroupLabel className="h-5 px-2 font-mono text-[9.5px] text-muted-foreground/75 uppercase tracking-wider">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {group.pages.map((page) => (
                      <NavLink key={page.href} {...page} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-border/40 border-t p-1.5">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-7 rounded-md px-2 text-[11.5px]"
              render={<Link href="/demo" />}
            >
              <PlayIcon className="size-3" />
              <span>Live Demo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-7 rounded-md px-2 text-[11.5px]"
              render={
                // biome-ignore lint/a11y/useAnchorContent: content is injected by useRender at runtime
                <a
                  href={REPOSITORY_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              <CodeIcon className="size-3" />
              <span>Source</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function useCurrentPageLabel() {
  const [path] = useLocation();
  return getDocsPageByPath(path)?.label ?? null;
}

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const pageLabel = useCurrentPageLabel();
  return (
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset className="relative min-h-screen bg-background selection:bg-foreground selection:text-background">
        {/* Top ambient lighting matching Home Page */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_75%_45%_at_50%_-10%,hsl(var(--foreground)/0.04),transparent)]" />

        {/* Sticky Header matching Home Page styling */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-border/40 border-b bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 text-muted-foreground transition-colors hover:text-foreground" />
            <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs sm:text-sm">
              <Link
                className="transition-colors hover:text-foreground"
                href="/"
              >
                Pytah
              </Link>
              <span>/</span>
              <span className="text-foreground">Docs</span>
              {pageLabel ? (
                <>
                  <span>/</span>
                  <span className="truncate font-semibold text-foreground">
                    {pageLabel}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LocalClock />
            <Link href="/demo">
              <Button size="sm" variant="ghost">
                <PlayIcon className="size-3.5" />
                <span className="hidden sm:inline">Demo</span>
              </Button>
            </Link>
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Docs Content Area */}
        <div className="relative mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
