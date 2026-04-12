import {
  GuideFilesSection,
  GuideSourceSection,
} from "@/components/docs/guide-primitives";
import {
  Callout,
  CodeBlock,
  PageHeader,
  SubHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";
import layoutContainerNodeSource from "@/components/editor/core/nodes/layout/container-node.ts?raw";
import layoutItemNodeSource from "@/components/editor/core/nodes/layout/item-node.ts?raw";
import layoutCommandsSource from "@/components/editor/plugins/layout/commands.ts?raw";
import layoutConstantsSource from "@/components/editor/plugins/layout/constants.ts?raw";
import layoutPluginSource from "@/components/editor/plugins/layout/plugin.tsx?raw";
import layoutUtilsSource from "@/components/editor/plugins/layout/utils.ts?raw";

export function LayoutGuidePage() {
  return (
    <>
      <PageHeader
        badge="Extension Guide"
        description="Extension guide for the multi-column layout block: nodes, command, presets, insertion utilities, and plugin wiring."
        title="Layout Block"
      />

      <Callout title="Extension guide" variant="info">
        This page documents a block-level extension pattern: custom nodes plus a
        feature plugin. It is a good reference when adding new structural block
        types to the editor.
      </Callout>

      <GuideFilesSection
        items={[
          "src/components/editor/core/nodes/layout/",
          "  container-node.ts  ← LayoutContainerNode (CSS grid wrapper)",
          "  item-node.ts       ← LayoutItemNode (single column)",
          "src/components/editor/plugins/layout/",
          "  commands.ts        ← INSERT_LAYOUT_COMMAND",
          "  constants.ts       ← DEFAULT_LAYOUT_TEMPLATE + LAYOUT_PRESETS",
          "  utils.ts           ← applyLayoutPreset",
          "  plugin.tsx         ← LayoutPlugin",
        ]}
      />

      <GuideSourceSection
        code={layoutContainerNodeSource}
        id="container-node"
        language="ts"
        path="src/components/editor/core/nodes/layout/container-node.ts"
        title="container-node.ts"
      >
        Renders as a <code>{"<div>"}</code> with{" "}
        <code>data-lexical-layout-container</code> and{" "}
        <code>style.gridTemplateColumns</code> set to the stored template string
        (e.g. <code>"1fr 1fr"</code>). Acts as a shadow root.
      </GuideSourceSection>

      <GuideSourceSection
        code={layoutItemNodeSource}
        id="item-node"
        language="ts"
        path="src/components/editor/core/nodes/layout/item-node.ts"
        title="item-node.ts"
      >
        Each column is a <code>LayoutItemNode</code>. When the user backspaces
        at the start of the first column and all columns are empty, the entire
        layout container is removed via <code>collapseAtStart()</code>.
      </GuideSourceSection>

      <GuideSourceSection
        code={layoutCommandsSource}
        id="commands"
        language="ts"
        path="src/components/editor/plugins/layout/commands.ts"
        title="commands.ts"
      />

      <GuideSourceSection
        code={layoutConstantsSource}
        id="constants"
        language="ts"
        path="src/components/editor/plugins/layout/constants.ts"
        title="constants.ts"
      >
        Predefined grid templates. <code>DEFAULT_LAYOUT_TEMPLATE</code> is used
        by the slash-command executor.
      </GuideSourceSection>

      <Table headers={["Preset value", "Description"]}>
        <TableRow>
          <TableCell>
            <code>1fr 1fr</code>
          </TableCell>
          <TableCell>Two equal columns (default)</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>1fr 3fr</code>
          </TableCell>
          <TableCell>Narrow sidebar + wide content</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>1fr 1fr 1fr</code>
          </TableCell>
          <TableCell>Three equal columns</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>1fr 2fr 1fr</code>
          </TableCell>
          <TableCell>Three balanced columns</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>1fr 1fr 1fr 1fr</code>
          </TableCell>
          <TableCell>Four equal columns</TableCell>
        </TableRow>
      </Table>

      <GuideSourceSection
        code={layoutUtilsSource}
        id="utils"
        language="ts"
        path="src/components/editor/plugins/layout/utils.ts"
        title="utils.ts"
      />

      <GuideSourceSection
        code={layoutPluginSource}
        id="plugin"
        language="tsx"
        path="src/components/editor/plugins/layout/plugin.tsx"
        title="plugin.tsx"
      />

      <SubHeading>Registration</SubHeading>
      <CodeBlock language="tsx">
        {`// core/config.ts
import { LayoutContainerNode } from "./nodes/layout/container-node";
import { LayoutItemNode }      from "./nodes/layout/item-node";
nodes: [..., LayoutContainerNode, LayoutItemNode]

// ui/content.tsx
import { LayoutPlugin } from "../plugins/layout/plugin";
<LayoutPlugin />`}
      </CodeBlock>

      <SubHeading>Inserting a layout programmatically</SubHeading>
      <CodeBlock language="tsx">
        {`import { INSERT_LAYOUT_COMMAND } from "../plugins/layout/commands";

editor.dispatchCommand(INSERT_LAYOUT_COMMAND, {
  templateColumns: "1fr 1fr 1fr", // three equal columns
});

// replace a specific node:
editor.dispatchCommand(INSERT_LAYOUT_COMMAND, {
  templateColumns: "1fr 3fr",
  targetNodeKey: someNodeKey,
});`}
      </CodeBlock>

      <Callout title="Any valid CSS grid template works" variant="tip">
        The <code>templateColumns</code> value is written directly to{" "}
        <code>style.gridTemplateColumns</code>. You can pass any valid CSS grid
        template string — the column count is derived by splitting on
        whitespace, so named tracks or <code>repeat()</code> expressions should
        be pre-resolved to explicit values before passing them in.
      </Callout>
    </>
  );
}
