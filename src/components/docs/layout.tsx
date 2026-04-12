import { CodeIcon, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
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
    <span className="hidden items-center text-muted-foreground text-xs tabular-nums sm:inline-flex">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function NavLink({ href, icon: Icon, label }: DocsPageDefinition) {
  const [isActive] = useRoute(href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} render={<Link href={href} />}>
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DocsSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center px-2 py-1">
          <Link className="font-semibold text-foreground text-lg" href="/">
            Pytah
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <ScrollArea className="h-full">
          {DOCS_PAGE_GROUPS.map((group) => (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.pages.map((page) => (
                    <NavLink key={page.href} {...page} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/demo" />}>
              <PlayIcon />
              <span>Live Demo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                // biome-ignore lint/a11y/useAnchorContent: content is injected by useRender at runtime
                <a
                  href="https://github.com"
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              <CodeIcon />
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
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-border border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <SidebarTrigger className="-ml-1" />
          {pageLabel ? (
            <span className="min-w-0 flex-1 truncate font-medium text-foreground text-sm">
              {pageLabel}
            </span>
          ) : (
            <span className="flex-1" />
          )}
          <div className="flex items-center gap-2">
            <LocalClock />
            <Link
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              href="/demo"
            >
              <PlayIcon className="size-3.5" />
              <span>Demo</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="mx-auto w-full max-w-4xl overflow-x-clip px-4 py-10 sm:px-6 md:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
