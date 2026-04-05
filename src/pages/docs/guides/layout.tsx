import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";

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

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
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

      <SectionHeading id="container-node">container-node.ts</SectionHeading>
      <Paragraph>
        Renders as a <code>{"<div>"}</code> with{" "}
        <code>data-lexical-layout-container</code> and{" "}
        <code>style.gridTemplateColumns</code> set to the stored template string
        (e.g. <code>"1fr 1fr"</code>). Acts as a shadow root.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/core/nodes/layout/container-node.ts"
        language="ts"
      >
        {`import { addClassNamesToElement } from "@lexical/utils";
import type {
  DOMConversionMap, DOMConversionOutput, DOMExportOutput, EditorConfig,
  LexicalNode, LexicalUpdateJSON, NodeKey, SerializedElementNode, Spread,
} from "lexical";
import { ElementNode } from "lexical";

export type SerializedLayoutContainerNode = Spread<
  { templateColumns: string },
  SerializedElementNode
>;

export class LayoutContainerNode extends ElementNode {
  __templateColumns: string;

  constructor(templateColumns: string, key?: NodeKey) {
    super(key);
    this.__templateColumns = templateColumns;
  }

  static getType(): string { return "layout-container"; }
  static clone(node: LayoutContainerNode): LayoutContainerNode {
    return new LayoutContainerNode(node.__templateColumns, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-layout-container")) return null;
        return {
          conversion: (): DOMConversionOutput | null => {
            const templateColumns = domNode.style.gridTemplateColumns;
            if (!templateColumns) return null;
            return { node: $createLayoutContainerNode(templateColumns) };
          },
          priority: 2,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedLayoutContainerNode): LayoutContainerNode {
    return $createLayoutContainerNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("div");
    dom.setAttribute("data-lexical-layout-container", "true");
    dom.style.gridTemplateColumns = this.__templateColumns;
    if (typeof config.theme.layoutContainer === "string") addClassNamesToElement(dom, config.theme.layoutContainer);
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__templateColumns !== this.__templateColumns) {
      dom.style.gridTemplateColumns = this.__templateColumns;
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-layout-container", "true");
    element.style.gridTemplateColumns = this.__templateColumns;
    return { element };
  }

  exportJSON(): SerializedLayoutContainerNode {
    return { ...super.exportJSON(), templateColumns: this.__templateColumns, type: "layout-container", version: 1 };
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedLayoutContainerNode>): this {
    return super.updateFromJSON(serializedNode).setTemplateColumns(serializedNode.templateColumns);
  }

  getTemplateColumns(): string { return this.getLatest().__templateColumns; }
  setTemplateColumns(templateColumns: string): this {
    const self = this.getWritable();
    self.__templateColumns = templateColumns;
    return self;
  }

  isShadowRoot(): boolean { return true; }
  canBeEmpty(): boolean { return false; }
}

export function $createLayoutContainerNode(templateColumns = ""): LayoutContainerNode {
  return new LayoutContainerNode(templateColumns);
}
export function $isLayoutContainerNode(node: LexicalNode | null | undefined): node is LayoutContainerNode {
  return node instanceof LayoutContainerNode;
}`}
      </CodeBlock>

      <SectionHeading id="item-node">item-node.ts</SectionHeading>
      <Paragraph>
        Each column is a <code>LayoutItemNode</code>. When the user backspaces
        at the start of the first column and all columns are empty, the entire
        layout container is removed via <code>collapseAtStart()</code>.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/core/nodes/layout/item-node.ts"
        language="ts"
      >
        {`import { addClassNamesToElement } from "@lexical/utils";
import type {
  DOMConversionMap, DOMConversionOutput, EditorConfig, LexicalNode, SerializedElementNode,
} from "lexical";
import { $isParagraphNode, ElementNode } from "lexical";

export type SerializedLayoutItemNode = SerializedElementNode;

export function $isEmptyLayoutItemNode(node: LexicalNode): boolean {
  if (!$isLayoutItemNode(node) || node.getChildrenSize() !== 1) return false;
  const firstChild = node.getFirstChild();
  return $isParagraphNode(firstChild) && firstChild.isEmpty();
}

export class LayoutItemNode extends ElementNode {
  static getType(): string { return "layout-item"; }
  static clone(node: LayoutItemNode): LayoutItemNode { return new LayoutItemNode(node.__key); }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-layout-item")) return null;
        return { conversion: (): DOMConversionOutput => ({ node: $createLayoutItemNode() }), priority: 2 };
      },
    };
  }

  static importJSON(serializedNode: SerializedLayoutItemNode): LayoutItemNode {
    return $createLayoutItemNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("div");
    dom.setAttribute("data-lexical-layout-item", "true");
    if (typeof config.theme.layoutItem === "string") addClassNamesToElement(dom, config.theme.layoutItem);
    return dom;
  }

  updateDOM(): boolean { return false; }

  collapseAtStart(): boolean {
    const parent = this.getParentOrThrow();
    if (this.is(parent.getFirstChild()) && parent.getChildren().every($isEmptyLayoutItemNode)) {
      parent.remove();
      return true;
    }
    return false;
  }

  isShadowRoot(): boolean { return true; }
}

export function $createLayoutItemNode(): LayoutItemNode { return new LayoutItemNode(); }
export function $isLayoutItemNode(node: LexicalNode | null | undefined): node is LayoutItemNode {
  return node instanceof LayoutItemNode;
}`}
      </CodeBlock>

      <SectionHeading id="commands">commands.ts</SectionHeading>
      <CodeBlock
        label="src/components/editor/plugins/layout/commands.ts"
        language="ts"
      >
        {`import { createCommand } from "lexical";

export interface InsertLayoutPayload {
  targetNodeKey?: string;
  templateColumns: string;
}

export const INSERT_LAYOUT_COMMAND = createCommand<InsertLayoutPayload>(
  "INSERT_LAYOUT_COMMAND"
);`}
      </CodeBlock>

      <SectionHeading id="constants">constants.ts</SectionHeading>
      <Paragraph>
        Predefined grid templates. <code>DEFAULT_LAYOUT_TEMPLATE</code> is used
        by the slash-command executor.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/layout/constants.ts"
        language="ts"
      >
        {`export interface LayoutPreset {
  description: string;
  label: string;
  value: string;
}

export const DEFAULT_LAYOUT_TEMPLATE = "1fr 1fr";

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { description: "Two equal columns",      label: "2 columns (equal width)",    value: "1fr 1fr"       },
  { description: "Sidebar plus content",   label: "2 columns (25% - 75%)",      value: "1fr 3fr"       },
  { description: "Three equal columns",    label: "3 columns (equal width)",    value: "1fr 1fr 1fr"   },
  { description: "Three balanced columns", label: "3 columns (25% - 50% - 25%)",value: "1fr 2fr 1fr"   },
  { description: "Four equal columns",     label: "4 columns (equal width)",    value: "1fr 1fr 1fr 1fr"},
];`}
      </CodeBlock>

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

      <SectionHeading id="utils">utils.ts</SectionHeading>
      <CodeBlock
        label="src/components/editor/plugins/layout/utils.ts"
        language="ts"
      >
        {`import { $createParagraphNode, type ElementNode } from "lexical";
import { $createLayoutContainerNode } from "../../core/nodes/layout/container-node";
import { $createLayoutItemNode } from "../../core/nodes/layout/item-node";

const TEMPLATE_COLUMN_SEPARATOR = /\\s+/;

const getColumnCount = (templateColumns: string) =>
  templateColumns.split(TEMPLATE_COLUMN_SEPARATOR).filter(Boolean).length;

export const applyLayoutPreset = (targetElement: ElementNode, templateColumns: string) => {
  const layoutContainer = $createLayoutContainerNode(templateColumns);
  const columnCount = getColumnCount(templateColumns);
  let firstParagraph: ReturnType<typeof $createParagraphNode> | null = null;

  for (let index = 0; index < columnCount; index++) {
    const layoutItem = $createLayoutItemNode();
    const paragraph = $createParagraphNode();
    if (firstParagraph === null) firstParagraph = paragraph;
    layoutItem.append(paragraph);
    layoutContainer.append(layoutItem);
  }

  targetElement.replace(layoutContainer);
  firstParagraph?.selectEnd();
};`}
      </CodeBlock>

      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <CodeBlock
        label="src/components/editor/plugins/layout/plugin.tsx"
        language="tsx"
      >
        {`import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey, $getSelection, $isElementNode,
  $isRangeSelection, COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { useEffect } from "react";
import { INSERT_LAYOUT_COMMAND } from "./commands";
import { applyLayoutPreset } from "./utils";

export function LayoutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_LAYOUT_COMMAND,
      ({ targetNodeKey, templateColumns }) => {
        if (targetNodeKey) {
          const targetNode = $getNodeByKey(targetNodeKey);
          if (!$isElementNode(targetNode)) return false;
          applyLayoutPreset(targetNode, templateColumns);
          return true;
        }
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;
        const targetElement = selection.anchor.getNode().getTopLevelElementOrThrow();
        applyLayoutPreset(targetElement, templateColumns);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}`}
      </CodeBlock>

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
