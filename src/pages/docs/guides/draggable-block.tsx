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
} from "@/components/docs/primitives";
import draggableBlockPluginSource from "@/components/editor/plugins/draggable-block/plugin.tsx?raw";

export function DraggableBlockGuidePage() {
  return (
    <>
      <PageHeader
        badge="Feature Guide"
        description="Feature guide for the draggable block handle that reorders top-level blocks inside the editor."
        title="Draggable Block"
      />

      <Callout title="Feature guide" variant="info">
        This is a built-in editor capability. If you only need to disable it in
        an integration, prefer the editor <code>features</code> prop rather than
        editing plugin internals.
      </Callout>

      <GuideFilesSection
        items={[
          "src/components/editor/plugins/draggable-block/",
          "  plugin.tsx        ← DraggableBlockPlugin",
        ]}
      />

      <GuideSourceSection
        code={draggableBlockPluginSource}
        id="plugin"
        language="tsx"
        path="src/components/editor/plugins/draggable-block/plugin.tsx"
        title="plugin.tsx"
      >
        <code>DraggableBlockPlugin</code> wraps Lexical's experimental{" "}
        <code>DraggableBlockPlugin_EXPERIMENTAL</code>. It listens for the root
        element via <code>registerRootListener</code> to obtain the{" "}
        <code>anchorElem</code> (the root's parent container) and only renders
        when the editor is editable. The grip handle is a{" "}
        <code>GripVerticalIcon</code> that appears on hover, and a thin
        primary-coloured line shows the drop target position.
      </GuideSourceSection>

      <SectionHeading id="registration">Registration</SectionHeading>
      <Paragraph>
        Mount <code>DraggableBlockPlugin</code> inside your composer. No custom
        nodes are required — the plugin works with any top-level block.
      </Paragraph>
      <CodeBlock language="tsx">
        {`// ui/content.tsx — mount the plugin
import { DraggableBlockPlugin } from "../plugins/draggable-block/plugin";
<DraggableBlockPlugin />`}
      </CodeBlock>

      <Callout title="Editor-only" variant="tip">
        <code>DraggableBlockPlugin</code> checks{" "}
        <code>useLexicalEditable()</code> and renders <code>null</code> in
        read-only mode, so it is safe to mount unconditionally.
      </Callout>

      <Callout title="Anchor element" variant="info">
        The plugin needs the root element's <em>parent</em> as the anchor so the
        floating grip can be positioned outside the scrollable content area.{" "}
        <code>registerRootListener</code> fires once on mount (and again if the
        root changes), so <code>anchorElem</code> is always up to date.
      </Callout>
    </>
  );
}
