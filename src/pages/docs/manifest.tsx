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
  type LucideIcon,
  PaletteIcon,
  PlugIcon,
  SlashIcon,
  TableIcon,
  ToggleLeftIcon,
  VideoIcon,
  WrenchIcon,
} from "lucide-react";
import type { ComponentType } from "react";

const ICON_BY_NAME = {
  Blocks: BlocksIcon,
  BookOpen: BookOpenIcon,
  Box: BoxIcon,
  Code: CodeIcon,
  Compass: CompassIcon,
  GripVertical: GripVerticalIcon,
  Image: ImageIcon,
  Layout: LayoutIcon,
  Link: LinkIcon,
  Palette: PaletteIcon,
  Plug: PlugIcon,
  Slash: SlashIcon,
  Table: TableIcon,
  ToggleLeft: ToggleLeftIcon,
  Video: VideoIcon,
  Wrench: WrenchIcon,
} as const satisfies Record<string, LucideIcon>;

type DocsIcon = LucideIcon;
type DocsPageComponent = ComponentType<{
  components?: Record<string, unknown>;
}>;
type DocsPageGroupId = "core" | "feature-guides" | "extension-guides";

export interface DocsPageDefinition {
  component: DocsPageComponent;
  description: string;
  frontmatter: DocsFrontmatter;
  group: DocsPageGroupId;
  href: string;
  icon: DocsIcon;
  label: string;
  order: number;
  slug: string;
  title: string;
}

export interface DocsPageGroup {
  id: DocsPageGroupId;
  label: string;
  pages: DocsPageDefinition[];
}

interface DocsMdxModule {
  default: DocsPageComponent;
  frontmatter: DocsFrontmatter;
}

const RELATIVE_PATH_REGEX = /^\.\//;
const MDX_EXTENSION_REGEX = /\.mdx$/;

const mdxModules = import.meta.glob<DocsMdxModule>("./**/*.mdx", {
  eager: true,
});

const createDocsPage = (
  path: string,
  mod: DocsMdxModule
): DocsPageDefinition => {
  const frontmatter = mod.frontmatter;
  const slug = path
    .replace(RELATIVE_PATH_REGEX, "")
    .replace(MDX_EXTENSION_REGEX, "");
  const icon =
    ICON_BY_NAME[frontmatter.icon as keyof typeof ICON_BY_NAME] ?? BookOpenIcon;

  return {
    component: mod.default,
    description: frontmatter.description,
    frontmatter,
    group: frontmatter.group,
    href: `/docs/${slug}`,
    icon,
    label: frontmatter.label,
    order: frontmatter.order ?? 100,
    slug,
    title: frontmatter.title,
  };
};

export const DOCS_PAGES: DocsPageDefinition[] = Object.entries(mdxModules)
  .map(([path, mod]) => createDocsPage(path, mod))
  .sort((a, b) => a.order - b.order);

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
