import { addClassNamesToElement, IS_CHROME } from "@lexical/utils";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
  SerializedElementNode,
} from "lexical";
import { $createParagraphNode, $isElementNode, ElementNode } from "lexical";
import { $isCollapsibleContainerNode } from "./container-node";
import { $isCollapsibleContentNode } from "./content-node";

export type SerializedCollapsibleTitleNode = SerializedElementNode;

const convertSummaryElement = (): DOMConversionOutput => {
  return {
    node: $createCollapsibleTitleNode(),
  };
};

export class CollapsibleTitleNode extends ElementNode {
  static getType(): string {
    return "collapsible-title";
  }

  static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      summary: () => ({
        conversion: convertSummaryElement,
        priority: 1,
      }),
    };
  }

  static importJSON(
    serializedNode: SerializedCollapsibleTitleNode
  ): CollapsibleTitleNode {
    return $createCollapsibleTitleNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("summary");
    dom.setAttribute("data-lexical-collapsible-trigger", "true");

    const open = editor.getEditorState().read(() => {
      const container = this.getParent();
      return $isCollapsibleContainerNode(container)
        ? container.getOpen()
        : true;
    });
    dom.dataset.open = open ? "true" : "false";

    if (typeof config.theme.collapsibleTitle === "string") {
      addClassNamesToElement(dom, config.theme.collapsibleTitle);
    }

    if (IS_CHROME) {
      dom.addEventListener("click", () => {
        editor.update(() => {
          const container = this.getLatest().getParentOrThrow();
          if (!$isCollapsibleContainerNode(container)) {
            throw new Error(
              "Collapsible title expects a collapsible container"
            );
          }

          container.toggleOpen();
        });
      });
    }

    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    return { element: document.createElement("summary") };
  }

  exportJSON(): SerializedCollapsibleTitleNode {
    return {
      ...super.exportJSON(),
      type: "collapsible-title",
      version: 1,
    };
  }

  insertNewAfter(_: RangeSelection, restoreSelection = true): ElementNode {
    const containerNode = this.getParentOrThrow();
    if (!$isCollapsibleContainerNode(containerNode)) {
      throw new Error("Collapsible title expects a collapsible container");
    }

    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isCollapsibleContentNode(contentNode)) {
        throw new Error(
          "Collapsible title expects a collapsible content sibling"
        );
      }

      const firstChild = contentNode.getFirstChild();
      if ($isElementNode(firstChild)) {
        return firstChild;
      }

      const paragraph = $createParagraphNode();
      contentNode.append(paragraph);
      return paragraph;
    }

    const paragraph = $createParagraphNode();
    containerNode.insertAfter(paragraph, restoreSelection);
    return paragraph;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
  return new CollapsibleTitleNode();
}

export function $isCollapsibleTitleNode(
  node: LexicalNode | null | undefined
): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode;
}
