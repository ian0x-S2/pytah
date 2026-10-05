import type { MDXComponents } from "mdx/types.js";

import { FeatureTable, TransformersTable } from "./data-tables";
import {
  InlineCode,
  InterfaceSource,
  MarkedSource,
  MDXAnchor,
  MDXBlockquote,
  MDXCodeBlock,
  MDXH1,
  MDXH2,
  MDXH3,
  MDXListItem,
  MDXOrderedList,
  MDXParagraph,
  MDXTable,
  MDXUnorderedList,
} from "./mdx-components";
import { Callout, CodeBlock, FileTree } from "./primitives";

/**
 * Element mapping for docs MDX pages. Lives in a plain `.ts` module (no JSX,
 * no locally defined components) so the component file keeps a Fast
 * Refresh-safe boundary: `mdx-components.tsx` exports only components, this
 * module exports only the mapping object.
 */
export const docsMdxComponents: MDXComponents = {
  Callout,
  CodeBlock,
  FeatureTable,
  FileTree,
  InterfaceSource,
  MarkedSource,
  TransformersTable,
  a: MDXAnchor,
  blockquote: MDXBlockquote,
  code: InlineCode,
  h1: MDXH1,
  h2: MDXH2,
  h3: MDXH3,
  li: MDXListItem,
  ol: MDXOrderedList,
  p: MDXParagraph,
  pre: MDXCodeBlock,
  table: MDXTable,
  ul: MDXUnorderedList,
};
