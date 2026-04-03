import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";

export function YouTubeGuidePage() {
  return (
    <>
      <PageHeader
        description="Full walkthrough of YouTubeNode (DecoratorBlockNode), INSERT_YOUTUBE_COMMAND, and YouTubePlugin. Embeds privacy-respecting YouTube iframes that serialize to HTML and JSON."
        title="YouTube Embed"
      />

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
        items={[
          "src/components/editor/core/nodes/youtube/",
          "  node.tsx          ← DecoratorBlockNode + serialization",
          "src/components/editor/plugins/youtube/",
          "  commands.ts       ← INSERT_YOUTUBE_COMMAND",
          "  plugin.tsx        ← YouTubePlugin (insert / replace)",
        ]}
      />

      <SectionHeading id="node">node.tsx</SectionHeading>
      <Paragraph>
        <code>YouTubeNode</code> extends <code>DecoratorBlockNode</code> and
        stores a single <code>__videoId</code> string. It renders an{" "}
        <code>iframe</code> pointing to{" "}
        <code>youtube-nocookie.com/embed/[videoId]</code> wrapped in{" "}
        <code>BlockWithAlignableContents</code> so the user can
        left/center/right align the embed. HTML export emits an{" "}
        <code>iframe</code> with a <code>data-lexical-youtube</code> attribute,
        which is also used by <code>importDOM</code> to reconstruct the node on
        paste.
      </Paragraph>
      <CodeBlock language="src/components/editor/core/nodes/youtube/node.tsx">
        {`import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
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
        src={\`https://www.youtube-nocookie.com/embed/\${videoId}\`}
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
      \`https://www.youtube-nocookie.com/embed/\${this.__videoId}\`
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
    return \`https://www.youtube.com/watch?v=\${this.__videoId}\`;
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
}`}
      </CodeBlock>

      <SectionHeading id="commands">commands.ts</SectionHeading>
      <Paragraph>
        A single typed command carries the video ID and an optional{" "}
        <code>targetNodeKey</code> that tells the plugin to replace an existing
        node (used by slash-command placeholders) rather than insert at the
        current selection.
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/youtube/commands.ts">
        {`import { createCommand } from "lexical";

export interface InsertYouTubePayload {
  targetNodeKey?: string;
  videoId: string;
}

export const INSERT_YOUTUBE_COMMAND = createCommand<InsertYouTubePayload>(
  "INSERT_YOUTUBE_COMMAND"
);`}
      </CodeBlock>

      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <Paragraph>
        <code>YouTubePlugin</code> registers <code>INSERT_YOUTUBE_COMMAND</code>{" "}
        at <code>COMMAND_PRIORITY_EDITOR</code>. When a{" "}
        <code>targetNodeKey</code> is supplied the target element node is
        replaced; otherwise the embed is inserted via{" "}
        <code>$insertNodeToNearestRoot</code>. A paragraph is always appended
        after so the cursor lands in an editable position.
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/youtube/plugin.tsx">
        {`import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { useEffect } from "react";
import { $createYouTubeNode, YouTubeNode } from "../../core/nodes/youtube/node";
import { INSERT_YOUTUBE_COMMAND } from "./commands";

const insertParagraphAfterYouTube = (
  youTubeNode: ReturnType<typeof $createYouTubeNode>
) => {
  const paragraph = $createParagraphNode();
  youTubeNode.insertAfter(paragraph);
  paragraph.select();
};

export function YouTubePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error("YouTubePlugin: YouTubeNode not registered on editor");
    }

    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      ({ targetNodeKey, videoId }) => {
        const trimmedVideoId = videoId.trim();
        if (!trimmedVideoId) {
          return false;
        }

        const youTubeNode = $createYouTubeNode(trimmedVideoId);

        if (targetNodeKey) {
          const targetNode = $getNodeByKey(targetNodeKey);
          if (!$isElementNode(targetNode)) {
            return false;
          }

          targetNode.replace(youTubeNode);
          insertParagraphAfterYouTube(youTubeNode);
          return true;
        }

        $insertNodeToNearestRoot(youTubeNode);
        insertParagraphAfterYouTube(youTubeNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}`}
      </CodeBlock>

      <SectionHeading id="registration">Registration</SectionHeading>
      <Paragraph>
        Register <code>YouTubeNode</code> in the Lexical config and mount{" "}
        <code>YouTubePlugin</code> inside your composer:
      </Paragraph>
      <CodeBlock language="tsx">
        {`// core/config.ts — add to the nodes array
import { YouTubeNode } from "./nodes/youtube/node";
nodes: [..., YouTubeNode]

// ui/content.tsx — mount the plugin
import { YouTubePlugin } from "../plugins/youtube/plugin";
<YouTubePlugin />`}
      </CodeBlock>

      <SubHeading>Inserting a video programmatically</SubHeading>
      <CodeBlock language="tsx">
        {`editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, {
  videoId: "dQw4w9WgXcQ",
});`}
      </CodeBlock>

      <Callout title="Privacy-enhanced embeds" variant="tip">
        All embeds use <code>youtube-nocookie.com</code> so YouTube does not set
        cookies until the user interacts with the player. The HTML export also
        targets this domain so the behaviour is preserved when content is copied
        out of the editor.
      </Callout>
    </>
  );
}
