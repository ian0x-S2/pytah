import {
  BlocksIcon,
  BookOpenIcon,
  BoxIcon,
  CodeIcon,
  CompassIcon,
  GripVerticalIcon,
  ImageIcon,
  LayoutIcon,
  LinkIcon,
  PaletteIcon,
  PlayIcon,
  PlugIcon,
  SlashIcon,
  TableIcon,
  ToggleLeftIcon,
  VideoIcon,
  WrenchIcon,
} from "lucide-react";
import { Link, useRoute } from "wouter";
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
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/docs/overview", icon: CompassIcon, label: "Overview" },
  {
    href: "/docs/getting-started",
    icon: BookOpenIcon,
    label: "Getting Started",
  },
  { href: "/docs/contributing", icon: WrenchIcon, label: "Contributing" },
  { href: "/docs/composition", icon: BlocksIcon, label: "Composition" },
  { href: "/docs/architecture", icon: LayoutIcon, label: "Architecture" },
  { href: "/docs/api", icon: CodeIcon, label: "API" },
  { href: "/docs/components", icon: BoxIcon, label: "Components" },
  { href: "/docs/plugins", icon: PlugIcon, label: "Plugins" },
  { href: "/docs/theming", icon: PaletteIcon, label: "Theming" },
];

const FEATURE_GUIDE_ITEMS: NavItem[] = [
  {
    href: "/docs/guides/floating-toolbar",
    icon: LayoutIcon,
    label: "Floating Toolbar",
  },
  {
    href: "/docs/guides/link-behavior",
    icon: LinkIcon,
    label: "Link Behavior",
  },
  {
    href: "/docs/guides/table-behavior",
    icon: TableIcon,
    label: "Table Behavior",
  },
  {
    href: "/docs/guides/draggable-block",
    icon: GripVerticalIcon,
    label: "Draggable Block",
  },
];

const EXTENSION_GUIDE_ITEMS: NavItem[] = [
  { href: "/docs/guides/image", icon: ImageIcon, label: "Image Block" },
  {
    href: "/docs/guides/slash-command",
    icon: SlashIcon,
    label: "Slash Command",
  },
  {
    href: "/docs/guides/collapsible",
    icon: ToggleLeftIcon,
    label: "Collapsible Block",
  },
  { href: "/docs/guides/layout", icon: BoxIcon, label: "Layout Block" },
  { href: "/docs/guides/youtube", icon: VideoIcon, label: "YouTube Embed" },
];

function NavLink({ href, icon: Icon, label }: NavItem) {
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
        <div className="flex items-center justify-between px-2 py-1">
          <Link className="font-semibold text-foreground text-lg" href="/">
            Pytah
          </Link>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <ScrollArea className="h-full">
          <SidebarGroup>
            <SidebarGroupLabel>Core Docs</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Feature Guides</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {FEATURE_GUIDE_ITEMS.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Extension Guides</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {EXTENSION_GUIDE_ITEMS.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
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

export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset>
        <header className="flex h-10 shrink-0 items-center gap-2 border-border border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
