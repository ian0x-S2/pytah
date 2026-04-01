import { addClassNamesToElement, IS_CHROME } from "@lexical/utils";
import {
  $getSiblingCaret,
  $isElementNode,
  $rewindSiblingCaret,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  ElementNode,
  isHTMLElement,
  type LexicalEditor,
  type LexicalNode,
  type LexicalUpdateJSON,
  type NodeKey,
  type RangeSelection,
  type SerializedElementNode,
  type Spread,
} from "lexical";
import { setDomHiddenUntilFound } from "./collapsible-dom-utils";

export type SerializedCollapsibleContainerNode = Spread<
  {
    open: boolean;
  },
  SerializedElementNode
>;

const applyContainerOpenState = (dom: HTMLElement, open: boolean) => {
  dom.dataset.open = open ? "true" : "false";

  const titleDom = dom.firstElementChild;
  if (isHTMLElement(titleDom)) {
    titleDom.dataset.open = open ? "true" : "false";
  }
};

const convertDetailsElement = (domNode: HTMLElement): DOMConversionOutput => {
  const detailsElement = domNode as HTMLDetailsElement;
  return {
    node: $createCollapsibleContainerNode(detailsElement.open ?? true),
  };
};

const convertCollapsibleContainerElement = (
  domNode: HTMLElement
): DOMConversionOutput => {
  return {
    node: $createCollapsibleContainerNode(domNode.dataset.open !== "false"),
  };
};

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean;

  constructor(open: boolean, key?: NodeKey) {
    super(key);
    this.__open = open;
  }

  static getType(): string {
    return "collapsible-container";
  }

  static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      details: () => ({
        conversion: convertDetailsElement,
        priority: 1,
      }),
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-collapsible-container")) {
          return null;
        }

        return {
          conversion: convertCollapsibleContainerElement,
          priority: 2,
        };
      },
    };
  }

  static importJSON(
    serializedNode: SerializedCollapsibleContainerNode
  ): CollapsibleContainerNode {
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
        if (detailsDom.open !== open) {
          editor.update(() => {
            this.toggleOpen();
          });
        }
      });
      dom = detailsDom;
    }

    dom.setAttribute("data-lexical-collapsible-container", "true");
    applyContainerOpenState(dom, this.__open);

    if (this.__open) {
      dom.setAttribute("open", "");
    }

    if (typeof config.theme.collapsibleContainer === "string") {
      addClassNamesToElement(dom, config.theme.collapsibleContainer);
    }

    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__open === this.__open) {
      return false;
    }

    applyContainerOpenState(dom, this.__open);

    if (this.__open) {
      dom.setAttribute("open", "");
    } else {
      dom.removeAttribute("open");
    }

    if (IS_CHROME) {
      const contentDom = dom.children[1];
      if (!isHTMLElement(contentDom)) {
        throw new Error("Expected collapsible content DOM element");
      }

      if (this.__open) {
        contentDom.hidden = false;
      } else {
        setDomHiddenUntilFound(contentDom);
      }
    } else if (dom instanceof HTMLDetailsElement) {
      dom.open = this.__open;
    }

    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("details");
    element.setAttribute("data-lexical-collapsible-container", "true");
    element.dataset.open = this.__open ? "true" : "false";

    if (this.__open) {
      element.setAttribute("open", "");
    }

    return { element };
  }

  exportJSON(): SerializedCollapsibleContainerNode {
    return {
      ...super.exportJSON(),
      open: this.__open,
      type: "collapsible-container",
      version: 1,
    };
  }

  updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedCollapsibleContainerNode>
  ): this {
    return super.updateFromJSON(serializedNode).setOpen(serializedNode.open);
  }

  collapseAtStart(selection: RangeSelection): boolean {
    const nodesToInsert: LexicalNode[] = [];

    for (const child of this.getChildren()) {
      if ($isElementNode(child)) {
        nodesToInsert.push(...child.getChildren());
      }
    }

    const caret = $rewindSiblingCaret($getSiblingCaret(this, "previous"));
    caret.splice(1, nodesToInsert);

    const [firstChild] = nodesToInsert;
    if (firstChild) {
      firstChild.selectStart().deleteCharacter(true);
    }

    return selection.isCollapsed();
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getOpen(): boolean {
    return this.getLatest().__open;
  }

  setOpen(open: boolean): this {
    const writable = this.getWritable();
    writable.__open = open;
    return writable;
  }

  toggleOpen(): this {
    return this.setOpen(!this.getOpen());
  }
}

export function $createCollapsibleContainerNode(
  open = true
): CollapsibleContainerNode {
  return new CollapsibleContainerNode(open);
}

export function $isCollapsibleContainerNode(
  node: LexicalNode | null | undefined
): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode;
}
