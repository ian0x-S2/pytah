import {
  GuideFilesSection,
  GuideSourceSection,
} from "@/components/docs/guide-primitives";
import {
  Callout,
  CodeBlock,
  PageHeader,
  SubHeading,
} from "@/components/docs/primitives";
import collapsibleContainerNodeSource from "@/components/editor/core/nodes/collapsible/container-node.ts?raw";
import collapsibleContentNodeSource from "@/components/editor/core/nodes/collapsible/content-node.ts?raw";
import collapsibleTitleNodeSource from "@/components/editor/core/nodes/collapsible/title-node.ts?raw";
import collapsibleCommandsSource from "@/components/editor/plugins/collapsible/commands.ts?raw";
import collapsiblePluginSource from "@/components/editor/plugins/collapsible/plugin.tsx?raw";
import collapsibleUtilsSource from "@/components/editor/plugins/collapsible/utils.ts?raw";

export function CollapsibleGuidePage() {
  return (
    <>
      <PageHeader
        badge="Extension Guide"
        description="Extension guide for the collapsible block: nodes, commands, insertion helpers, and plugin logic for transforms and keyboard handling."
        title="Collapsible Block"
      />

      <Callout title="Extension guide" variant="info">
        This guide is a reference for multi-node block features that own both
        document structure and behavior.
      </Callout>

      <GuideFilesSection
        items={[
          "src/components/editor/core/nodes/collapsible/",
          "  container-node.ts  ← CollapsibleContainerNode (open/closed state)",
          "  title-node.ts      ← CollapsibleTitleNode (summary/trigger)",
          "  content-node.ts    ← CollapsibleContentNode (hidden body)",
          "  dom-utils.ts       ← setDomHiddenUntilFound / domOnBeforeMatch",
          "src/components/editor/plugins/collapsible/",
          "  commands.ts        ← INSERT_COLLAPSIBLE_COMMAND",
          "  utils.ts           ← createCollapsibleStructure helpers",
          "  plugin.tsx         ← CollapsiblePlugin",
        ]}
      />

      <Callout title="Chrome vs. other browsers" variant="info">
        Native <code>{"<details>"}</code>/<code>{"<summary>"}</code> elements
        handle expand/collapse in non-Chrome browsers automatically. Chrome
        requires manual DOM manipulation because it does not support the{" "}
        <code>hidden="until-found"</code> attribute. Both paths are handled in
        the node's <code>createDOM</code> / <code>updateDOM</code> methods.
      </Callout>

      <GuideSourceSection
        code={collapsibleContainerNodeSource}
        id="container-node"
        language="ts"
        path="src/components/editor/core/nodes/collapsible/container-node.ts"
        title="container-node.ts"
      >
        The root of the collapsible structure. Stores a single boolean{" "}
        <code>__open</code> and exposes <code>toggleOpen()</code>. Acts as a
        shadow root so inner selections stay contained.
      </GuideSourceSection>

      <GuideSourceSection
        code={collapsibleTitleNodeSource}
        id="title-node"
        language="ts"
        path="src/components/editor/core/nodes/collapsible/title-node.ts"
        title="title-node.ts"
      >
        Renders as a <code>{"<summary>"}</code> element. On Chrome, a click
        listener calls <code>container.toggleOpen()</code> via{" "}
        <code>editor.update()</code>. Pressing Enter in the title jumps into the
        content body.
      </GuideSourceSection>

      <GuideSourceSection
        code={collapsibleContentNodeSource}
        id="content-node"
        language="ts"
        path="src/components/editor/core/nodes/collapsible/content-node.ts"
        title="content-node.ts"
      >
        The body area. On Chrome uses <code>setDomHiddenUntilFound()</code> so
        the browser's Ctrl+F can still find text inside collapsed sections. Acts
        as a shadow root.
      </GuideSourceSection>

      <GuideSourceSection
        code={collapsibleCommandsSource}
        id="commands"
        language="ts"
        path="src/components/editor/plugins/collapsible/commands.ts"
        title="commands.ts"
      />

      <GuideSourceSection
        code={collapsibleUtilsSource}
        id="utils"
        language="ts"
        path="src/components/editor/plugins/collapsible/utils.ts"
        title="utils.ts"
      />

      <GuideSourceSection
        code={collapsiblePluginSource}
        id="plugin"
        language="tsx"
        path="src/components/editor/plugins/collapsible/plugin.tsx"
        title="plugin.tsx"
      >
        Registers node transforms to enforce the{" "}
        <code>container → [title, content]</code> invariant, four arrow-key
        handlers for cursor escape, an <code>INSERT_PARAGRAPH_COMMAND</code>{" "}
        handler to open the body on Enter in the title, and the{" "}
        <code>INSERT_COLLAPSIBLE_COMMAND</code> handler.
      </GuideSourceSection>

      <SubHeading>Registration</SubHeading>
      <CodeBlock language="tsx">
        {`// core/config.ts — nodes array
import { CollapsibleContainerNode } from "./nodes/collapsible/container-node";
import { CollapsibleTitleNode }     from "./nodes/collapsible/title-node";
import { CollapsibleContentNode }   from "./nodes/collapsible/content-node";
nodes: [..., CollapsibleContainerNode, CollapsibleTitleNode, CollapsibleContentNode]

// ui/content.tsx — plugins
import { CollapsiblePlugin } from "../plugins/collapsible/plugin";
<CollapsiblePlugin />`}
      </CodeBlock>

      <SubHeading>Inserting programmatically</SubHeading>
      <CodeBlock language="tsx">
        {`editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
// or replace a specific node:
editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, { targetNodeKey: "abc" });`}
      </CodeBlock>
    </>
  );
}
