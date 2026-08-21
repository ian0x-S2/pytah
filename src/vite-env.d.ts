/// <reference types="vite/client" />

interface DocsFrontmatter {
  badge?: string;
  description: string;
  group: "core" | "feature-guides" | "extension-guides";
  icon: string;
  label: string;
  order?: number;
  title: string;
}

declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXComponent: ComponentType;
  export const frontmatter: DocsFrontmatter;
  export default MDXComponent;
}
