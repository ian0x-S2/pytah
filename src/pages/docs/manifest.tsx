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
  PlugIcon,
  SlashIcon,
  TableIcon,
  ToggleLeftIcon,
  VideoIcon,
  WrenchIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { ApiPage } from "./api";
import { ArchitecturePage } from "./architecture";
import { ComponentsPage } from "./components";
import { CompositionPage } from "./composition";
import { ContributingPage } from "./contributing";
import { GettingStartedPage } from "./getting-started";
import { CollapsibleGuidePage } from "./guides/collapsible";
import { DraggableBlockGuidePage } from "./guides/draggable-block";
import { FloatingToolbarGuidePage } from "./guides/floating-toolbar";
import { ImageGuidePage } from "./guides/image";
import { LayoutGuidePage } from "./guides/layout";
import { LinkBehaviorGuidePage } from "./guides/link-behavior";
import { SlashCommandGuidePage } from "./guides/slash-command";
import { TableBehaviorGuidePage } from "./guides/table-behavior";
import { YouTubeGuidePage } from "./guides/youtube";
import { OverviewPage } from "./overview";
import { PluginsPage } from "./plugins";
import { ThemingPage } from "./theming";

type DocsIcon = ComponentType<{ className?: string }>;
type DocsPageComponent = ComponentType;

export interface DocsPageDefinition {
  component: DocsPageComponent;
  group: "core" | "extension-guides" | "feature-guides";
  href: string;
  icon: DocsIcon;
  label: string;
  slug: string;
}

export interface DocsPageGroup {
  id: DocsPageDefinition["group"];
  label: string;
  pages: DocsPageDefinition[];
}

const createDocsPage = ({
  component,
  group,
  icon,
  label,
  slug,
}: Omit<DocsPageDefinition, "href">): DocsPageDefinition => {
  return {
    component,
    group,
    href: `/docs/${slug}`,
    icon,
    label,
    slug,
  };
};

export const DOCS_PAGES = [
  createDocsPage({
    component: OverviewPage,
    group: "core",
    icon: CompassIcon,
    label: "Overview",
    slug: "overview",
  }),
  createDocsPage({
    component: GettingStartedPage,
    group: "core",
    icon: BookOpenIcon,
    label: "Getting Started",
    slug: "getting-started",
  }),
  createDocsPage({
    component: ContributingPage,
    group: "core",
    icon: WrenchIcon,
    label: "Contributing",
    slug: "contributing",
  }),
  createDocsPage({
    component: CompositionPage,
    group: "core",
    icon: BlocksIcon,
    label: "Composition",
    slug: "composition",
  }),
  createDocsPage({
    component: ArchitecturePage,
    group: "core",
    icon: LayoutIcon,
    label: "Architecture",
    slug: "architecture",
  }),
  createDocsPage({
    component: ApiPage,
    group: "core",
    icon: CodeIcon,
    label: "API",
    slug: "api",
  }),
  createDocsPage({
    component: ComponentsPage,
    group: "core",
    icon: BoxIcon,
    label: "Components",
    slug: "components",
  }),
  createDocsPage({
    component: PluginsPage,
    group: "core",
    icon: PlugIcon,
    label: "Plugins",
    slug: "plugins",
  }),
  createDocsPage({
    component: ThemingPage,
    group: "core",
    icon: PaletteIcon,
    label: "Theming",
    slug: "theming",
  }),
  createDocsPage({
    component: FloatingToolbarGuidePage,
    group: "feature-guides",
    icon: LayoutIcon,
    label: "Floating Toolbar",
    slug: "guides/floating-toolbar",
  }),
  createDocsPage({
    component: LinkBehaviorGuidePage,
    group: "feature-guides",
    icon: LinkIcon,
    label: "Link Behavior",
    slug: "guides/link-behavior",
  }),
  createDocsPage({
    component: TableBehaviorGuidePage,
    group: "feature-guides",
    icon: TableIcon,
    label: "Table Behavior",
    slug: "guides/table-behavior",
  }),
  createDocsPage({
    component: DraggableBlockGuidePage,
    group: "feature-guides",
    icon: GripVerticalIcon,
    label: "Draggable Block",
    slug: "guides/draggable-block",
  }),
  createDocsPage({
    component: ImageGuidePage,
    group: "extension-guides",
    icon: ImageIcon,
    label: "Image Block",
    slug: "guides/image",
  }),
  createDocsPage({
    component: SlashCommandGuidePage,
    group: "extension-guides",
    icon: SlashIcon,
    label: "Slash Command",
    slug: "guides/slash-command",
  }),
  createDocsPage({
    component: CollapsibleGuidePage,
    group: "extension-guides",
    icon: ToggleLeftIcon,
    label: "Collapsible Block",
    slug: "guides/collapsible",
  }),
  createDocsPage({
    component: LayoutGuidePage,
    group: "extension-guides",
    icon: BoxIcon,
    label: "Layout Block",
    slug: "guides/layout",
  }),
  createDocsPage({
    component: YouTubeGuidePage,
    group: "extension-guides",
    icon: VideoIcon,
    label: "YouTube Embed",
    slug: "guides/youtube",
  }),
] as const satisfies DocsPageDefinition[];

export const DOCS_PAGE_GROUPS: DocsPageGroup[] = [
  {
    id: "core",
    label: "Core Docs",
    pages: DOCS_PAGES.filter((page) => page.group === "core"),
  },
  {
    id: "feature-guides",
    label: "Feature Guides",
    pages: DOCS_PAGES.filter((page) => page.group === "feature-guides"),
  },
  {
    id: "extension-guides",
    label: "Extension Guides",
    pages: DOCS_PAGES.filter((page) => page.group === "extension-guides"),
  },
];

export const DOCS_PAGE_BY_SLUG = Object.fromEntries(
  DOCS_PAGES.map((page) => [page.slug, page])
) as Record<string, DocsPageDefinition>;

export const getDocsPageByPath = (path: string) => {
  return (
    DOCS_PAGES.find(
      (page) => path === page.href || path.startsWith(`${page.href}/`)
    ) ?? null
  );
};
