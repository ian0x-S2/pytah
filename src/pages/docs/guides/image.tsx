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
import imageNodeSource from "@/components/editor/core/nodes/image/node.tsx?raw";
import imageCommandsSource from "@/components/editor/plugins/image/commands.ts?raw";
import imageComponentSource from "@/components/editor/plugins/image/component.tsx?raw";
import imagePluginSource from "@/components/editor/plugins/image/plugin.tsx?raw";
import imageResizerSource from "@/components/editor/plugins/image/resizer.tsx?raw";
import imageUtilsSource from "@/components/editor/plugins/image/utils.ts?raw";

export function ImageGuidePage() {
  return (
    <>
      <PageHeader
        badge="Extension Guide"
        description="Extension guide for the image block: ImageNode, insertion flows, rendering, alignment, selection, and resize behavior."
        title="Image Block"
      />

      <Callout title="Extension guide" variant="info">
        This page focuses on how the image feature is implemented as a reusable
        editor block. Use it when building or adapting custom node-backed editor
        features.
      </Callout>

      <GuideFilesSection
        items={[
          "src/components/editor/core/nodes/image/",
          "  node.tsx          ← DecoratorNode + serialization",
          "src/components/editor/plugins/image/",
          "  commands.ts       ← INSERT_IMAGE_COMMAND",
          "  utils.ts          ← file helpers",
          "  plugin.tsx        ← ImagePlugin (insert / paste / drop)",
          "  component.tsx     ← ImageComponent (click / select / delete / align)",
          "  resizer.tsx       ← ImageResizer (4-corner drag-to-resize)",
        ]}
      />

      <GuideSourceSection
        code={imageNodeSource}
        id="node"
        language="tsx"
        path="src/components/editor/core/nodes/image/node.tsx"
        title="node.tsx"
      >
        <code>ImageNode</code> extends <code>DecoratorNode</code> and stores{" "}
        <code>src</code>, <code>altText</code>, <code>alignment</code>,{" "}
        <code>width</code>, and <code>height</code>. It renders its React
        component via <code>decorate()</code> and handles HTML paste via{" "}
        <code>importDOM</code>.
      </GuideSourceSection>

      <GuideSourceSection
        code={imageCommandsSource}
        id="commands"
        language="ts"
        path="src/components/editor/plugins/image/commands.ts"
        title="commands.ts"
      />

      <GuideSourceSection
        code={imageUtilsSource}
        id="utils"
        language="ts"
        path="src/components/editor/plugins/image/utils.ts"
        title="utils.ts"
      >
        Three small helpers used by the plugin to detect and read image files
        from clipboard / drop events.
      </GuideSourceSection>

      <GuideSourceSection
        code={imagePluginSource}
        id="plugin"
        language="tsx"
        path="src/components/editor/plugins/image/plugin.tsx"
        title="plugin.tsx"
      >
        Registers three Lexical commands: <code>INSERT_IMAGE_COMMAND</code>{" "}
        (inserts by URL), <code>DRAG_DROP_PASTE</code> (handles file drops), and{" "}
        <code>PASTE_COMMAND</code> (intercepts image file pastes).
      </GuideSourceSection>

      <GuideSourceSection
        code={imageComponentSource}
        id="component"
        language="tsx"
        path="src/components/editor/plugins/image/component.tsx"
        title="component.tsx"
      >
        The React component rendered by <code>ImageNode.decorate()</code>.
        Handles click-to-select, Backspace/Delete to remove, and{" "}
        <code>FORMAT_ELEMENT_COMMAND</code> to change alignment. Mounts{" "}
        <code>ImageResizer</code> when the node is selected.
      </GuideSourceSection>

      <GuideSourceSection
        code={imageResizerSource}
        id="resizer"
        language="tsx"
        path="src/components/editor/plugins/image/resizer.tsx"
        title="resizer.tsx"
      >
        Renders four corner drag handles (<code>ne</code>, <code>se</code>,{" "}
        <code>sw</code>, <code>nw</code>) as absolute-positioned divs. Uses
        pointer events to track drag distance and update the image's inline
        style in real-time, then calls <code>onResizeEnd</code> with the final
        pixel dimensions.
      </GuideSourceSection>

      <SectionHeading id="registration">Registration</SectionHeading>
      <Paragraph>
        Register <code>ImageNode</code> in your Lexical config and mount{" "}
        <code>ImagePlugin</code> inside your composer:
      </Paragraph>
      <CodeBlock language="tsx">
        {`// core/config.ts — add to the nodes array
import { ImageNode } from "./nodes/image/node";
nodes: [..., ImageNode]

// ui/content.tsx — mount the plugin
import { ImagePlugin } from "../plugins/image/plugin";
<ImagePlugin />`}
      </CodeBlock>

      <SubHeading>Inserting an image programmatically</SubHeading>
      <CodeBlock language="tsx">
        {`editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
  src: "https://example.com/photo.jpg",
  altText: "A photo",
  alignment: "center",
});`}
      </CodeBlock>

      <Callout title="File paste / drop is automatic" variant="tip">
        <code>ImagePlugin</code> intercepts <code>PASTE_COMMAND</code> and{" "}
        <code>DROP_COMMAND</code> automatically. Any image file dragged into the
        editor or pasted from the clipboard is converted to a data URL and
        inserted as an <code>ImageNode</code>.
      </Callout>
    </>
  );
}
