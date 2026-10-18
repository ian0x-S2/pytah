"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $isElementNode,
  $isParagraphNode,
} from "lexical";
import { useEffect, useState } from "react";

import { WeblinkInlineCard } from "./card-inline";
import { WeblinkSmallCard } from "./card-small";
import { WeblinkWideCard } from "./card-wide";
import { WeblinkFormatMenu } from "./format-menu";
import { useWeblinkMetadataFetcher } from "./metadata";
import type { WeblinkNode } from "./node";
import type { WeblinkFormat, WeblinkMetadata } from "./types";

interface WeblinkComponentProps {
  description?: string;
  format: WeblinkFormat;
  icon?: string;
  image?: string;
  nodeKey: string;
  title: string;
  url: string;
}

function updateWeblinkNodeMetadata(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  nodeKey: string,
  meta: Partial<WeblinkMetadata>
) {
  editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if (node && "setTitle" in node && typeof node.setTitle === "function") {
      const weblink = node as unknown as WeblinkNode;
      if (meta.title && meta.title.trim().length > 0) {
        weblink.setTitle(meta.title.trim());
      }
      if (meta.description && meta.description.trim().length > 0) {
        weblink.setDescription(meta.description.trim());
      }
      if (meta.image && meta.image.trim().length > 0) {
        weblink.setImage(meta.image.trim());
      }
      if (meta.icon && meta.icon.trim().length > 0) {
        weblink.setIcon(meta.icon.trim());
      }
    }
  });
}

export function WeblinkComponent({
  description,
  format,
  icon,
  image,
  nodeKey,
  title,
  url,
}: WeblinkComponentProps) {
  const [editor] = useLexicalComposerContext();
  const fetcher = useWeblinkMetadataFetcher();
  const [isLoading, setIsLoading] = useState(false);
  const isEditable = editor.isEditable();

  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./u, "");
    } catch {
      return url;
    }
  })();

  useEffect(() => {
    if (!fetcher || !isEditable) {
      return;
    }

    if (description && image) {
      return;
    }

    const controller = new AbortController();
    let isCancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const meta = await fetcher(url, { signal: controller.signal });
        if (!isCancelled && meta) {
          updateWeblinkNodeMetadata(editor, nodeKey, meta);
        }
      } catch {
        // Silently ignore network or abort errors
      }
      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    void run();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [fetcher, isEditable, description, image, url, editor, nodeKey]);

  const handleRefreshMetadata = async () => {
    if (!fetcher) {
      return;
    }
    setIsLoading(true);
    try {
      const meta = await fetcher(url);
      if (meta) {
        updateWeblinkNodeMetadata(editor, nodeKey, meta);
      }
    } catch {
      // Ignore
    }
    setIsLoading(false);
  };

  const handleSetFormat = (nextFormat: WeblinkFormat) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !node.isAttached()) {
        return;
      }
      if ("setFormat" in node && typeof node.setFormat === "function") {
        node.setFormat(nextFormat);
      }
      const parent = node.getParent();
      if (nextFormat === "inline") {
        if (!parent || !$isParagraphNode(parent)) {
          const paragraph = $createParagraphNode();
          node.replace(paragraph);
          paragraph.append(node);
          const space = $createTextNode(" ");
          paragraph.append(space);
          space.select();
        }
      } else if (parent && $isParagraphNode(parent)) {
        if (
          parent.getChildrenSize() === 1 ||
          parent.getTextContent().trim() === ""
        ) {
          parent.replace(node);
        } else {
          parent.insertAfter(node);
        }
        const trailing = $createParagraphNode();
        node.insertAfter(trailing);
        trailing.select();
      }
    });
  };

  const handleRemoveNode = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !node.isAttached()) {
        return;
      }
      const parent = node.getParent();
      const next = node.getNextSibling();
      const prev = node.getPreviousSibling();
      node.remove();
      if (next && $isElementNode(next)) {
        next.selectStart();
      } else if (prev && $isElementNode(prev)) {
        prev.selectEnd();
      } else if (parent && $isElementNode(parent)) {
        parent.selectEnd();
      }
    });
  };

  const formatMenu = isEditable ? (
    <WeblinkFormatMenu
      isLoading={isLoading}
      onRefreshMetadata={handleRefreshMetadata}
      onRemoveNode={handleRemoveNode}
      onSetFormat={handleSetFormat}
      showRefresh={Boolean(fetcher)}
      url={url}
    />
  ) : null;

  if (format === "inline") {
    return (
      <WeblinkInlineCard
        domain={domain}
        icon={icon}
        isEditable={isEditable}
        title={title}
        url={url}
      />
    );
  }

  if (format === "small") {
    return (
      <WeblinkSmallCard
        description={description}
        domain={domain}
        formatMenu={formatMenu}
        icon={icon}
        isEditable={isEditable}
        isLoading={isLoading}
        title={title}
        url={url}
      />
    );
  }

  // format === "wide"
  return (
    <WeblinkWideCard
      description={description}
      domain={domain}
      formatMenu={formatMenu}
      icon={icon}
      image={image}
      isEditable={isEditable}
      isLoading={isLoading}
      title={title}
      url={url}
    />
  );
}
