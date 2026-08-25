import type { Transformer } from "@lexical/markdown";
import { IMAGE_MARKDOWN_TRANSFORMER } from "@/components/editor/core/nodes/image/transformer";
import {
  MATH_BLOCK_MARKDOWN_TRANSFORMER,
  MATH_INLINE_MARKDOWN_TRANSFORMER,
} from "@/components/editor/core/nodes/math/transformers";
import { YOUTUBE_MARKDOWN_TRANSFORMER } from "@/components/editor/core/nodes/youtube/transformer";
import { collapsibleFeature } from "@/components/editor/plugins/collapsible/feature";
import { seedContentFeature } from "@/components/editor/plugins/core/seed-content-feature";
import { draggableBlocksFeature } from "@/components/editor/plugins/draggable-block/feature";
import { excalidrawFeature } from "@/components/editor/plugins/excalidraw/feature";
import { imageFeature } from "@/components/editor/plugins/image/feature";
import { layoutFeature } from "@/components/editor/plugins/layout/feature";
import { BUILTIN_MARKDOWN_TRANSFORMERS } from "@/components/editor/plugins/markdown/transformers";
import { mathFeature } from "@/components/editor/plugins/math/feature";
import { tableFeature } from "@/components/editor/plugins/table-behavior/feature";
import { tocFeature } from "@/components/editor/plugins/toc/feature";
import { youtubeFeature } from "@/components/editor/plugins/youtube/feature";

const EDITOR_MARKDOWN_TRANSFORMERS = [
  ...BUILTIN_MARKDOWN_TRANSFORMERS,
  IMAGE_MARKDOWN_TRANSFORMER,
  MATH_INLINE_MARKDOWN_TRANSFORMER,
  MATH_BLOCK_MARKDOWN_TRANSFORMER,
  YOUTUBE_MARKDOWN_TRANSFORMER,
];

export interface DocsFeatureRow {
  editableOnly: boolean;
  flag: string;
  hasNodes: boolean;
  hasPlugin: boolean;
  slashCommandIds: readonly string[];
  transformerCount: number;
}

const INSTALLED_FEATURES = [
  collapsibleFeature,
  seedContentFeature,
  draggableBlocksFeature,
  excalidrawFeature,
  imageFeature,
  layoutFeature,
  mathFeature,
  tableFeature,
  tocFeature,
  youtubeFeature,
];

export const docsFeatureRows: DocsFeatureRow[] = INSTALLED_FEATURES.map(
  (feature) => ({
    editableOnly: feature.editableOnly ?? false,
    flag: feature.id,
    hasNodes: Boolean(feature.nodes?.length),
    hasPlugin: Boolean(feature.plugin),
    slashCommandIds: (feature.slashCommands ?? []).map(
      (contribution) => contribution.command.id
    ),
    transformerCount: feature.transformers?.length ?? 0,
  })
);

export interface DocsTransformerRow {
  kind: Transformer["type"];
  markdown: string;
  name: string;
}

const TRANSFORMER_LABELS: Record<string, { markdown: string; name: string }> = {
  "^(#{1,6})\\s": { markdown: "# ", name: "Heading" },
  "^>\\s": { markdown: "> ", name: "Quote" },
  "^(\\s*)[-*+]\\s": { markdown: "- ", name: "Bullet List" },
  "^(\\d{1,})\\.\\s": { markdown: "1. ", name: "Numbered List" },
  "^---\\s?$": { markdown: "---", name: "Horizontal Rule" },
  "^(\\s*)(?:[-*+]\\s)?\\s?(\\[(\\s|x)?\\])\\s": {
    markdown: "- [ ] ",
    name: "Checklist",
  },
  "!\\[([^\\]]*)\\]\\(([^)\\s]+)\\)$": {
    markdown: "![alt](url)",
    name: "Image",
  },
  "^https?:\\/\\/\\S+$": { markdown: "https://…", name: "YouTube URL" },
  "\\$([^$]+)\\$": { markdown: "$math$", name: "Inline Math" },
};

const TRANSFORMER_TAG_LABELS: Record<
  string,
  { markdown: string; name: string }
> = {
  "**": { markdown: "**text**", name: "Bold" },
  "*": { markdown: "*text*", name: "Italic" },
  "***": { markdown: "***text***", name: "Bold Italic" },
  ___: { markdown: "___text___", name: "Bold Italic" },
  __: { markdown: "__text__", name: "Bold" },
  _: { markdown: "_text_", name: "Italic" },
  "~~": { markdown: "~~text~~", name: "Strikethrough" },
  "==": { markdown: "==text==", name: "Highlight" },
  "`": { markdown: "`code`", name: "Inline Code" },
};

const describeTransformer = (transformer: Transformer): DocsTransformerRow => {
  if (transformer.type === "text-format") {
    const label = TRANSFORMER_TAG_LABELS[transformer.tag];
    return {
      kind: transformer.type,
      markdown: label?.markdown ?? transformer.tag,
      name: label?.name ?? "Text Format",
    };
  }

  if (transformer.type === "text-match") {
    if (transformer.trigger === "$") {
      return {
        kind: transformer.type,
        markdown: "$math$",
        name: "Inline Math",
      };
    }
    return {
      kind: transformer.type,
      markdown: transformer.regExp.source,
      name: "Inline Transform",
    };
  }

  if (transformer.type === "multiline-element") {
    const startSource = transformer.regExpStart.source;
    if (startSource.includes("$$")) {
      return {
        kind: transformer.type,
        markdown: "$$ … $$",
        name: "Math Block",
      };
    }
    if (startSource.includes("```")) {
      return { kind: transformer.type, markdown: "```", name: "Code Block" };
    }
    if (startSource.includes("\\|")) {
      return { kind: transformer.type, markdown: "| a | b |", name: "Table" };
    }
    return { kind: transformer.type, markdown: startSource, name: "Multiline" };
  }

  const label = TRANSFORMER_LABELS[transformer.regExp.source];
  return {
    kind: transformer.type,
    markdown: label?.markdown ?? transformer.regExp.source,
    name: label?.name ?? "Block Transform",
  };
};

export const docsTransformerRows: DocsTransformerRow[] =
  EDITOR_MARKDOWN_TRANSFORMERS.map(describeTransformer);
