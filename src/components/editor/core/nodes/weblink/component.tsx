"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $isElementNode,
  $isParagraphNode,
  $isRootNode,
  HISTORY_MERGE_TAG,
} from "lexical";
import { useEffect, useRef, useState } from "react";

import { sanitizeHrefUrl } from "../../url";
import { WeblinkInlineCard } from "./card-inline";
import { WeblinkSmallCard } from "./card-small";
import { WeblinkWideCard } from "./card-wide";
import { WeblinkFormatMenu } from "./format-menu";
import {
  useWeblinkFaviconResolver,
  useWeblinkMetadataFetcher,
} from "./metadata";
import type { WeblinkNode } from "./node";
import type { WeblinkFormat, WeblinkMetadata } from "./types";
import { isDefaultGoogleFavicon, resolveWeblinkFavicon } from "./utils";

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
  editor.update(
    () => {
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
    },
    { tag: HISTORY_MERGE_TAG }
  );
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
  const isEditable = useLexicalEditable();
  const fetcher = useWeblinkMetadataFetcher();
  const faviconResolver = useWeblinkFaviconResolver();
  const [isLoading, setIsLoading] = useState(false);
  const fetchedKeyRef = useRef<string | null>(null);
  const refreshControllerRef = useRef<AbortController | null>(null);

  const safeHref = sanitizeHrefUrl(url);

  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./u, "");
    } catch {
      return url;
    }
  })();

  const resolvedIcon = (() => {
    if (faviconResolver === false && isDefaultGoogleFavicon(icon)) {
      return;
    }
    if (
      typeof faviconResolver === "function" &&
      (!icon || isDefaultGoogleFavicon(icon))
    ) {
      return resolveWeblinkFavicon(domain, faviconResolver);
    }
    return icon;
  })();

  useEffect(
    () => () => {
      refreshControllerRef.current?.abort();
      refreshControllerRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (!(fetcher && isEditable)) {
      return;
    }

    if (description && image) {
      return;
    }

    const fetchKey = `${nodeKey}:${url}`;
    if (fetchedKeyRef.current === fetchKey) {
      return;
    }

    const controller = new AbortController();
    let isCancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const meta = await fetcher(url, { signal: controller.signal });
        if (!isCancelled) {
          fetchedKeyRef.current = fetchKey;
          if (meta) {
            updateWeblinkNodeMetadata(editor, nodeKey, meta);
          }
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
    refreshControllerRef.current?.abort();
    const controller = new AbortController();
    refreshControllerRef.current = controller;

    setIsLoading(true);
    try {
      const meta = await fetcher(url, {
        forceRefresh: true,
        signal: controller.signal,
      });
      if (!controller.signal.aborted && meta) {
        updateWeblinkNodeMetadata(editor, nodeKey, meta);
      }
    } catch {
      // Ignore refresh failures or abort errors
    }

    if (refreshControllerRef.current === controller) {
      refreshControllerRef.current = null;
      setIsLoading(false);
    }
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
        if (!(parent && $isParagraphNode(parent))) {
          const paragraph = $createParagraphNode();
          node.replace(paragraph);
          paragraph.append(node);
          const space = $createTextNode(" ");
          paragraph.append(space);
          space.select();
        }
      } else if (parent && $isParagraphNode(parent)) {
        const grandParent = parent.getParent();
        if (
          grandParent &&
          $isRootNode(grandParent) &&
          (parent.getChildrenSize() === 1 ||
            parent.getTextContent().trim() === "")
        ) {
          parent.replace(node);
        } else if (grandParent && $isRootNode(grandParent)) {
          parent.insertAfter(node);
        } else {
          node.remove();
          $insertNodeToNearestRoot(node);
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
      currentFormat={format}
      isLoading={isLoading}
      onRefreshMetadata={handleRefreshMetadata}
      onRemoveNode={handleRemoveNode}
      onSetFormat={handleSetFormat}
      showRefresh={Boolean(fetcher)}
      url={safeHref}
    />
  ) : null;

  if (format === "inline") {
    return (
      <WeblinkInlineCard
        domain={domain}
        formatMenu={formatMenu}
        icon={resolvedIcon}
        isEditable={isEditable}
        title={title}
        url={safeHref}
      />
    );
  }

  if (format === "small") {
    return (
      <WeblinkSmallCard
        description={description}
        domain={domain}
        formatMenu={formatMenu}
        icon={resolvedIcon}
        isEditable={isEditable}
        isLoading={isLoading}
        title={title}
        url={safeHref}
      />
    );
  }

  return (
    <WeblinkWideCard
      description={description}
      domain={domain}
      formatMenu={formatMenu}
      icon={resolvedIcon}
      image={image}
      isEditable={isEditable}
      isLoading={isLoading}
      title={title}
      url={safeHref}
    />
  );
}
