import {
  GuideFilesSection,
  GuideSourceSection,
} from "@/components/docs/guide-primitives";
import {
  Callout,
  CodeBlock,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";
import youTubeNodeSource from "@/components/editor/core/nodes/youtube/node.tsx?raw";
import youTubeCommandsSource from "@/components/editor/plugins/youtube/commands.ts?raw";
import youTubePluginSource from "@/components/editor/plugins/youtube/plugin.tsx?raw";

export function YouTubeGuidePage() {
  return (
    <>
      <PageHeader
        badge="Extension Guide"
        description="Extension guide for the YouTube embed block: DecoratorBlockNode implementation, insert command, and plugin wiring."
        title="YouTube Embed"
      />

      <Callout title="Extension guide" variant="info">
        This page is useful when you want to add a custom embed-style block with
        decorator rendering and HTML serialization support.
      </Callout>

      <GuideFilesSection
        items={[
          "src/components/editor/core/nodes/youtube/",
          "  node.tsx          ← DecoratorBlockNode + serialization",
          "src/components/editor/plugins/youtube/",
          "  commands.ts       ← INSERT_YOUTUBE_COMMAND",
          "  plugin.tsx        ← YouTubePlugin (insert / replace)",
        ]}
      />

      <GuideSourceSection
        code={youTubeNodeSource}
        id="node"
        language="tsx"
        path="src/components/editor/core/nodes/youtube/node.tsx"
        title="node.tsx"
      >
        <code>YouTubeNode</code> extends <code>DecoratorBlockNode</code> and
        stores a single <code>__videoId</code> string. It renders an{" "}
        <code>iframe</code> pointing to{" "}
        <code>youtube-nocookie.com/embed/[videoId]</code> wrapped in{" "}
        <code>BlockWithAlignableContents</code> so the user can
        left/center/right align the embed. HTML export emits an{" "}
        <code>iframe</code>
        with a <code>data-lexical-youtube</code> attribute, which is also used
        by <code>importDOM</code> to reconstruct the node on paste.
      </GuideSourceSection>

      <GuideSourceSection
        code={youTubeCommandsSource}
        id="commands"
        language="ts"
        path="src/components/editor/plugins/youtube/commands.ts"
        title="commands.ts"
      >
        A single typed command carries the video ID and an optional{" "}
        <code>targetNodeKey</code> that tells the plugin to replace an existing
        node (used by slash-command placeholders) rather than insert at the
        current selection.
      </GuideSourceSection>

      <GuideSourceSection
        code={youTubePluginSource}
        id="plugin"
        language="tsx"
        path="src/components/editor/plugins/youtube/plugin.tsx"
        title="plugin.tsx"
      >
        <code>YouTubePlugin</code> registers <code>INSERT_YOUTUBE_COMMAND</code>
        at <code>COMMAND_PRIORITY_EDITOR</code>. When a{" "}
        <code>targetNodeKey</code>
        is supplied the target element node is replaced; otherwise the embed is
        inserted via <code>$insertNodeToNearestRoot</code>. A paragraph is
        always appended after so the cursor lands in an editable position.
      </GuideSourceSection>

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
