"use client";

import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";
import type { JSX } from "react";

type YouTubeComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  videoId: string;
}>;

function YouTubeComponent({
  className,
  format,
  nodeKey,
  videoId,
}: YouTubeComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video h-auto w-full max-w-full rounded-xl border border-border/70 bg-muted shadow-xs md:w-[70%]"
        frameBorder="0"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="YouTube video"
      />
    </BlockWithAlignableContents>
  );
}

export type SerializedYouTubeNode = Spread<
  {
    videoId: string;
  },
  SerializedDecoratorBlockNode
>;

const convertYouTubeElement = (
  domNode: HTMLElement
): DOMConversionOutput | null => {
  const videoId = domNode.getAttribute("data-lexical-youtube");
  if (!videoId) {
    return null;
  }

  return {
    node: $createYouTubeNode(videoId),
  };
};

export class YouTubeNode extends DecoratorBlockNode {
  __videoId: string;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__videoId, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.videoId).updateFromJSON(
      serializedNode
    );
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-youtube")) {
          return null;
        }

        return {
          conversion: convertYouTubeElement,
          priority: 1,
        };
      },
    };
  }

  constructor(videoId: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__videoId = videoId;
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      videoId: this.__videoId,
      type: "youtube",
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("iframe");
    element.setAttribute("data-lexical-youtube", this.__videoId);
    element.setAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${this.__videoId}`
    );
    element.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    );
    element.setAttribute("allowfullscreen", "true");
    element.setAttribute("frameborder", "0");
    element.setAttribute("title", "YouTube video");
    return { element };
  }

  updateDOM(): false {
    return false;
  }

  getVideoId(): string {
    return this.getLatest().__videoId;
  }

  getTextContent(): string {
    return `https://www.youtube.com/watch?v=${this.__videoId}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock ?? {};
    const className = {
      base: embedBlockTheme.base ?? "",
      focus: embedBlockTheme.focus ?? "",
    };

    return (
      <YouTubeComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        videoId={this.__videoId}
      />
    );
  }
}

export function $createYouTubeNode(videoId: string): YouTubeNode {
  return new YouTubeNode(videoId);
}

export function $isYouTubeNode(
  node: LexicalNode | null | undefined
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
