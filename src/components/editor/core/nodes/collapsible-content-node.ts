import { addClassNamesToElement, IS_CHROME } from "@lexical/utils";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  SerializedElementNode,
} from "lexical";
import { ElementNode } from "lexical";
import { $isCollapsibleContainerNode } from "./collapsible-container-node";
import {
  domOnBeforeMatch,
  setDomHiddenUntilFound,
} from "./collapsible-dom-utils";

export type SerializedCollapsibleContentNode = SerializedElementNode;

const convertCollapsibleContentElement = (): DOMConversionOutput => {
  return {
    node: $createCollapsibleContentNode(),
  };
};

export class CollapsibleContentNode extends ElementNode {
  static getType(): string {
    return "collapsible-content";
  }

  static clone(node: CollapsibleContentNode): CollapsibleContentNode {
    return new CollapsibleContentNode(node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-collapsible-content")) {
          return null;
        }

        return {
          conversion: convertCollapsibleContentElement,
          priority: 2,
        };
      },
    };
  }

  static importJSON(
    serializedNode: SerializedCollapsibleContentNode
  ): CollapsibleContentNode {
    return $createCollapsibleContentNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("div");
    dom.setAttribute("data-lexical-collapsible-content", "true");

    if (typeof config.theme.collapsibleContent === "string") {
      addClassNamesToElement(dom, config.theme.collapsibleContent);
    }

    if (IS_CHROME) {
      editor.getEditorState().read(() => {
        const containerNode = this.getParentOrThrow();
        if (!$isCollapsibleContainerNode(containerNode)) {
          throw new Error(
            "Collapsible content expects a collapsible container"
          );
        }

        if (!containerNode.getOpen()) {
          setDomHiddenUntilFound(dom);
        }
      });

      domOnBeforeMatch(dom, () => {
        editor.update(() => {
          const containerNode = this.getParentOrThrow().getLatest();
          if (!$isCollapsibleContainerNode(containerNode)) {
            throw new Error(
              "Collapsible content expects a collapsible container"
            );
          }

          if (!containerNode.getOpen()) {
            containerNode.toggleOpen();
          }
        });
      });
    }

    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-collapsible-content", "true");
    return { element };
  }

  exportJSON(): SerializedCollapsibleContentNode {
    return {
      ...super.exportJSON(),
      type: "collapsible-content",
      version: 1,
    };
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
  return new CollapsibleContentNode();
}

export function $isCollapsibleContentNode(
  node: LexicalNode | null | undefined
): node is CollapsibleContentNode {
  return node instanceof CollapsibleContentNode;
}
