import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";

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

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
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

      <SectionHeading id="container-node">container-node.ts</SectionHeading>
      <Paragraph>
        The root of the collapsible structure. Stores a single boolean{" "}
        <code>__open</code> and exposes <code>toggleOpen()</code>. Acts as a
        shadow root so inner selections stay contained.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/core/nodes/collapsible/container-node.ts"
        language="ts"
      >
        {`import { addClassNamesToElement, IS_CHROME } from "@lexical/utils";
import {
  $getSiblingCaret, $isElementNode, $rewindSiblingCaret,
  type DOMConversionMap, type DOMConversionOutput, type DOMExportOutput,
  type EditorConfig, ElementNode, isHTMLElement,
  type LexicalEditor, type LexicalNode, type LexicalUpdateJSON,
  type NodeKey, type RangeSelection, type SerializedElementNode, type Spread,
} from "lexical";
import { setDomHiddenUntilFound } from "./dom-utils";

export type SerializedCollapsibleContainerNode = Spread<
  { open: boolean },
  SerializedElementNode
>;

const applyContainerOpenState = (dom: HTMLElement, open: boolean) => {
  dom.dataset.open = open ? "true" : "false";
  const titleDom = dom.firstElementChild;
  if (isHTMLElement(titleDom)) titleDom.dataset.open = open ? "true" : "false";
};

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean;

  constructor(open: boolean, key?: NodeKey) {
    super(key);
    this.__open = open;
  }

  static getType(): string { return "collapsible-container"; }
  static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      details: () => ({
        conversion: (domNode: HTMLElement) => ({
          node: $createCollapsibleContainerNode((domNode as HTMLDetailsElement).open ?? true),
        }),
        priority: 1,
      }),
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-collapsible-container")) return null;
        return {
          conversion: () => ({
            node: $createCollapsibleContainerNode(domNode.dataset.open !== "false"),
          }),
          priority: 2,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedCollapsibleContainerNode): CollapsibleContainerNode {
    return $createCollapsibleContainerNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    let dom: HTMLElement;
    if (IS_CHROME) {
      dom = document.createElement("div");
    } else {
      const detailsDom = document.createElement("details");
      detailsDom.addEventListener("toggle", () => {
        const open = editor.getEditorState().read(() => this.getOpen());
        if (detailsDom.open !== open) editor.update(() => { this.toggleOpen(); });
      });
      dom = detailsDom;
    }
    dom.setAttribute("data-lexical-collapsible-container", "true");
    applyContainerOpenState(dom, this.__open);
    if (this.__open) dom.setAttribute("open", "");
    if (typeof config.theme.collapsibleContainer === "string") {
      addClassNamesToElement(dom, config.theme.collapsibleContainer);
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__open === this.__open) return false;
    applyContainerOpenState(dom, this.__open);
    if (this.__open) { dom.setAttribute("open", ""); }
    else { dom.removeAttribute("open"); }
    if (IS_CHROME) {
      const contentDom = dom.children[1];
      if (!isHTMLElement(contentDom)) throw new Error("Expected collapsible content DOM element");
      if (this.__open) { contentDom.hidden = false; }
      else { setDomHiddenUntilFound(contentDom); }
    } else if (dom instanceof HTMLDetailsElement) {
      dom.open = this.__open;
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("details");
    element.setAttribute("data-lexical-collapsible-container", "true");
    element.dataset.open = this.__open ? "true" : "false";
    if (this.__open) element.setAttribute("open", "");
    return { element };
  }

  exportJSON(): SerializedCollapsibleContainerNode {
    return { ...super.exportJSON(), open: this.__open, type: "collapsible-container", version: 1 };
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedCollapsibleContainerNode>): this {
    return super.updateFromJSON(serializedNode).setOpen(serializedNode.open);
  }

  collapseAtStart(selection: RangeSelection): boolean {
    const nodesToInsert: LexicalNode[] = [];
    for (const child of this.getChildren()) {
      if ($isElementNode(child)) nodesToInsert.push(...child.getChildren());
    }
    const caret = $rewindSiblingCaret($getSiblingCaret(this, "previous"));
    caret.splice(1, nodesToInsert);
    const [firstChild] = nodesToInsert;
    if (firstChild) firstChild.selectStart().deleteCharacter(true);
    return selection.isCollapsed();
  }

  isShadowRoot(): boolean { return true; }
  canBeEmpty(): boolean { return false; }
  getOpen(): boolean { return this.getLatest().__open; }
  setOpen(open: boolean): this { const w = this.getWritable(); w.__open = open; return w; }
  toggleOpen(): this { return this.setOpen(!this.getOpen()); }
}

export function $createCollapsibleContainerNode(open = true): CollapsibleContainerNode {
  return new CollapsibleContainerNode(open);
}

export function $isCollapsibleContainerNode(
  node: LexicalNode | null | undefined
): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode;
}`}
      </CodeBlock>

      <SectionHeading id="title-node">title-node.ts</SectionHeading>
      <Paragraph>
        Renders as a <code>{"<summary>"}</code> element. On Chrome, a click
        listener calls <code>container.toggleOpen()</code> via{" "}
        <code>editor.update()</code>. Pressing Enter in the title jumps into the
        content body.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/core/nodes/collapsible/title-node.ts"
        language="ts"
      >
        {`import { addClassNamesToElement, IS_CHROME } from "@lexical/utils";
import type {
  DOMConversionMap, DOMConversionOutput, DOMExportOutput,
  EditorConfig, LexicalEditor, LexicalNode, RangeSelection, SerializedElementNode,
} from "lexical";
import { $createParagraphNode, $isElementNode, ElementNode } from "lexical";
import { $isCollapsibleContainerNode } from "./container-node";
import { $isCollapsibleContentNode } from "./content-node";

export type SerializedCollapsibleTitleNode = SerializedElementNode;

export class CollapsibleTitleNode extends ElementNode {
  static getType(): string { return "collapsible-title"; }
  static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key);
  }
  static importDOM(): DOMConversionMap | null {
    return { summary: () => ({ conversion: (): DOMConversionOutput => ({ node: $createCollapsibleTitleNode() }), priority: 1 }) };
  }
  static importJSON(serializedNode: SerializedCollapsibleTitleNode): CollapsibleTitleNode {
    return $createCollapsibleTitleNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("summary");
    dom.setAttribute("data-lexical-collapsible-trigger", "true");
    const open = editor.getEditorState().read(() => {
      const container = this.getParent();
      return $isCollapsibleContainerNode(container) ? container.getOpen() : true;
    });
    dom.dataset.open = open ? "true" : "false";
    if (typeof config.theme.collapsibleTitle === "string") addClassNamesToElement(dom, config.theme.collapsibleTitle);
    if (IS_CHROME) {
      dom.addEventListener("click", () => {
        editor.update(() => {
          const container = this.getLatest().getParentOrThrow();
          if (!$isCollapsibleContainerNode(container)) throw new Error("Collapsible title expects a collapsible container");
          container.toggleOpen();
        });
      });
    }
    return dom;
  }

  updateDOM(): boolean { return false; }
  exportDOM(): DOMExportOutput { return { element: document.createElement("summary") }; }
  exportJSON(): SerializedCollapsibleTitleNode {
    return { ...super.exportJSON(), type: "collapsible-title", version: 1 };
  }

  insertNewAfter(_: RangeSelection, restoreSelection = true): ElementNode {
    const containerNode = this.getParentOrThrow();
    if (!$isCollapsibleContainerNode(containerNode)) throw new Error("Collapsible title expects a collapsible container");
    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isCollapsibleContentNode(contentNode)) throw new Error("Collapsible title expects a collapsible content sibling");
      const firstChild = contentNode.getFirstChild();
      if ($isElementNode(firstChild)) return firstChild;
      const paragraph = $createParagraphNode();
      contentNode.append(paragraph);
      return paragraph;
    }
    const paragraph = $createParagraphNode();
    containerNode.insertAfter(paragraph, restoreSelection);
    return paragraph;
  }

  canBeEmpty(): boolean { return false; }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode { return new CollapsibleTitleNode(); }
export function $isCollapsibleTitleNode(node: LexicalNode | null | undefined): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode;
}`}
      </CodeBlock>

      <SectionHeading id="content-node">content-node.ts</SectionHeading>
      <Paragraph>
        The body area. On Chrome uses <code>setDomHiddenUntilFound()</code> so
        the browser's Ctrl+F can still find text inside collapsed sections. Acts
        as a shadow root.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/core/nodes/collapsible/content-node.ts"
        language="ts"
      >
        {`import { addClassNamesToElement, IS_CHROME } from "@lexical/utils";
import type {
  DOMConversionMap, DOMConversionOutput, DOMExportOutput,
  EditorConfig, LexicalEditor, LexicalNode, SerializedElementNode,
} from "lexical";
import { ElementNode } from "lexical";
import { $isCollapsibleContainerNode } from "./container-node";
import { domOnBeforeMatch, setDomHiddenUntilFound } from "./dom-utils";

export type SerializedCollapsibleContentNode = SerializedElementNode;

export class CollapsibleContentNode extends ElementNode {
  static getType(): string { return "collapsible-content"; }
  static clone(node: CollapsibleContentNode): CollapsibleContentNode {
    return new CollapsibleContentNode(node.__key);
  }
  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-collapsible-content")) return null;
        return { conversion: (): DOMConversionOutput => ({ node: $createCollapsibleContentNode() }), priority: 2 };
      },
    };
  }
  static importJSON(serializedNode: SerializedCollapsibleContentNode): CollapsibleContentNode {
    return $createCollapsibleContentNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("div");
    dom.setAttribute("data-lexical-collapsible-content", "true");
    if (typeof config.theme.collapsibleContent === "string") addClassNamesToElement(dom, config.theme.collapsibleContent);
    if (IS_CHROME) {
      editor.getEditorState().read(() => {
        const containerNode = this.getParentOrThrow();
        if (!$isCollapsibleContainerNode(containerNode)) throw new Error("Collapsible content expects a collapsible container");
        if (!containerNode.getOpen()) setDomHiddenUntilFound(dom);
      });
      domOnBeforeMatch(dom, () => {
        editor.update(() => {
          const containerNode = this.getParentOrThrow().getLatest();
          if (!$isCollapsibleContainerNode(containerNode)) throw new Error("Collapsible content expects a collapsible container");
          if (!containerNode.getOpen()) containerNode.toggleOpen();
        });
      });
    }
    return dom;
  }

  updateDOM(): boolean { return false; }
  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-collapsible-content", "true");
    return { element };
  }
  exportJSON(): SerializedCollapsibleContentNode {
    return { ...super.exportJSON(), type: "collapsible-content", version: 1 };
  }

  isShadowRoot(): boolean { return true; }
  canBeEmpty(): boolean { return false; }
}

export function $createCollapsibleContentNode(): CollapsibleContentNode { return new CollapsibleContentNode(); }
export function $isCollapsibleContentNode(node: LexicalNode | null | undefined): node is CollapsibleContentNode {
  return node instanceof CollapsibleContentNode;
}`}
      </CodeBlock>

      <SectionHeading id="commands">commands.ts</SectionHeading>
      <CodeBlock
        label="src/components/editor/plugins/collapsible/commands.ts"
        language="ts"
      >
        {`import { createCommand } from "lexical";

export interface InsertCollapsiblePayload {
  targetNodeKey?: string;
}

export const INSERT_COLLAPSIBLE_COMMAND = createCommand<
  InsertCollapsiblePayload | undefined
>("INSERT_COLLAPSIBLE_COMMAND");`}
      </CodeBlock>

      <SectionHeading id="utils">utils.ts</SectionHeading>
      <CodeBlock
        label="src/components/editor/plugins/collapsible/utils.ts"
        language="ts"
      >
        {`import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode, $getNodeByKey, $getSelection,
  $isElementNode, $isRangeSelection, type ElementNode,
} from "lexical";
import { $createCollapsibleContainerNode } from "../../core/nodes/collapsible/container-node";
import { $createCollapsibleContentNode } from "../../core/nodes/collapsible/content-node";
import { $createCollapsibleTitleNode } from "../../core/nodes/collapsible/title-node";

const createCollapsibleStructure = () => {
  const titleParagraph = $createParagraphNode();
  const contentParagraph = $createParagraphNode();
  const titleNode = $createCollapsibleTitleNode();
  const contentNode = $createCollapsibleContentNode();
  const containerNode = $createCollapsibleContainerNode(true);
  titleNode.append(titleParagraph);
  contentNode.append(contentParagraph);
  containerNode.append(titleNode, contentNode);
  return { containerNode, titleParagraph };
};

export const replaceElementWithCollapsible = (targetElement: ElementNode) => {
  const { containerNode, titleParagraph } = createCollapsibleStructure();
  targetElement.replace(containerNode);
  titleParagraph.selectEnd();
};

export const insertCollapsible = (targetNodeKey?: string) => {
  if (targetNodeKey) {
    const targetNode = $getNodeByKey(targetNodeKey);
    if (!$isElementNode(targetNode)) return false;
    replaceElementWithCollapsible(targetNode);
    return true;
  }
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    const targetElement = selection.anchor.getNode().getTopLevelElementOrThrow();
    replaceElementWithCollapsible(targetElement);
    return true;
  }
  const { containerNode, titleParagraph } = createCollapsibleStructure();
  $insertNodeToNearestRoot(containerNode);
  titleParagraph.selectEnd();
  return true;
};`}
      </CodeBlock>

      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <Paragraph>
        Registers node transforms to enforce the{" "}
        <code>container → [title, content]</code> invariant, four arrow-key
        handlers for cursor escape, an <code>INSERT_PARAGRAPH_COMMAND</code>{" "}
        handler to open the body on Enter in the title, and the{" "}
        <code>INSERT_COLLAPSIBLE_COMMAND</code> handler.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/collapsible/plugin.tsx"
        language="tsx"
      >
        {`import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode, $getSelection, $isRangeSelection,
  COMMAND_PRIORITY_LOW, INSERT_PARAGRAPH_COMMAND,
  KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND, KEY_ARROW_UP_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $isCollapsibleContainerNode, CollapsibleContainerNode } from "../../core/nodes/collapsible/container-node";
import { $isCollapsibleContentNode, CollapsibleContentNode } from "../../core/nodes/collapsible/content-node";
import { $isCollapsibleTitleNode, CollapsibleTitleNode } from "../../core/nodes/collapsible/title-node";
import { INSERT_COLLAPSIBLE_COMMAND, type InsertCollapsiblePayload } from "./commands";
import { insertCollapsible } from "./utils";

export function CollapsiblePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CollapsibleContainerNode, CollapsibleTitleNode, CollapsibleContentNode])) {
      throw new Error("CollapsiblePlugin requires collapsible nodes to be registered");
    }

    return mergeRegister(
      // Enforce structure invariants via transforms
      editor.registerNodeTransform(CollapsibleContentNode, (node) => {
        const parent = node.getParent();
        if ($isCollapsibleContainerNode(parent)) return;
        for (const child of node.getChildren()) node.insertBefore(child);
        node.remove();
      }),
      editor.registerNodeTransform(CollapsibleTitleNode, (node) => {
        const parent = node.getParent();
        if ($isCollapsibleContainerNode(parent)) return;
        node.replace($createParagraphNode().append(...node.getChildren()));
      }),
      editor.registerNodeTransform(CollapsibleContainerNode, (node) => {
        const children = node.getChildren();
        if (children.length === 2 && $isCollapsibleTitleNode(children[0]) && $isCollapsibleContentNode(children[1])) return;
        for (const child of children) node.insertBefore(child);
        node.remove();
      }),
      // Arrow key escape
      editor.registerCommand(KEY_ARROW_UP_COMMAND, () => {
        // insert paragraph before if cursor is at the very start of a container that is first child
        // (implementation omitted for brevity — see plugin.tsx for full logic)
        return false;
      }, COMMAND_PRIORITY_LOW),
      // INSERT_PARAGRAPH_COMMAND: jump into body when Enter pressed in title
      editor.registerCommand(INSERT_PARAGRAPH_COMMAND, () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;
        const titleNode = $findMatchingParent(selection.anchor.getNode(), $isCollapsibleTitleNode);
        if (!$isCollapsibleTitleNode(titleNode)) return false;
        const container = titleNode.getParent();
        if (!$isCollapsibleContainerNode(container)) return false;
        if (!container.getOpen()) container.toggleOpen();
        titleNode.getNextSibling()?.selectEnd();
        return true;
      }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(INSERT_COLLAPSIBLE_COMMAND, (payload?: InsertCollapsiblePayload) => {
        return insertCollapsible(payload?.targetNodeKey);
      }, COMMAND_PRIORITY_LOW)
    );
  }, [editor]);

  return null;
}`}
      </CodeBlock>

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
