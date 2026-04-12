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
import tableBehaviorActionsSource from "@/components/editor/plugins/table-behavior/actions.ts?raw";
import tableBehaviorPluginSource from "@/components/editor/plugins/table-behavior/plugin.tsx?raw";

export function TableBehaviorGuidePage() {
  return (
    <>
      <PageHeader
        badge="Feature Guide"
        description="Feature guide for built-in table behavior: Lexical table integration, floating action menu, and table mutation helpers."
        title="Table Behavior"
      />

      <Callout title="Feature guide" variant="info">
        This page describes the built-in table editing UX. Use it as a product
        feature reference; use the <code>Composition</code> page for top-level
        editor configuration decisions.
      </Callout>

      <GuideFilesSection
        items={[
          "src/components/editor/plugins/table-behavior/",
          "  actions.ts   ← insert/delete row & column helpers",
          "  plugin.tsx   ← TableBehaviorPlugin, TableCellActionMenuContainer, TableActionMenu",
        ]}
      />

      <Callout title="Depends on @lexical/table" variant="info">
        <code>TableBehaviorPlugin</code> composes the official{" "}
        <code>{"<TablePlugin>"}</code> from{" "}
        <code>@lexical/react/LexicalTablePlugin</code>. No custom table nodes
        are needed — the plugin adds the floating action-menu UI on top.
      </Callout>

      <GuideSourceSection
        code={tableBehaviorActionsSource}
        id="actions"
        language="ts"
        path="src/components/editor/plugins/table-behavior/actions.ts"
        title="actions.ts"
      >
        Thin wrappers around the <code>@lexical/table</code> mutations. These
        are kept separate so they can be called from outside the plugin (e.g.
        from a toolbar).
      </GuideSourceSection>

      <GuideSourceSection
        code={tableBehaviorPluginSource}
        id="plugin"
        language="tsx"
        path="src/components/editor/plugins/table-behavior/plugin.tsx"
        title="plugin.tsx"
      >
        Three components in one file. <code>TableBehaviorPlugin</code> is the
        public entry point — it renders <code>{"<TablePlugin>"}</code> and
        conditionally mounts the action-menu container.{" "}
        <code>TableCellActionMenuContainer</code>
        listens for selection changes and positions a small chevron button at
        the active cell. <code>TableActionMenu</code> is the popover content
        with insert/delete actions.
      </GuideSourceSection>

      <SubHeading>Registration</SubHeading>
      <CodeBlock language="tsx">
        {`// ui/content.tsx
import { TableBehaviorPlugin } from "../plugins/table-behavior/plugin";
<TableBehaviorPlugin />`}
      </CodeBlock>

      <Callout title="Anchor element" variant="tip">
        The action-menu portal renders inside <code>anchorElem</code>, which is
        the <em>parent</em> of the editor root (obtained via{" "}
        <code>rootElement.parentElement</code>). This ensures the absolute
        position calculations are relative to the same offset parent as the
        table cells.
      </Callout>
    </>
  );
}
