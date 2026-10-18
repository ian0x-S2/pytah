"use client";

import { $createParagraphNode, ElementNode } from "lexical";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from "lexical";

export type CalloutType = "note" | "tip" | "info" | "warning" | "caution";

export type SerializedCalloutNode = Spread<
  {
    calloutType: CalloutType;
    emoji?: string;
  },
  SerializedElementNode
>;

const VALID_CALLOUT_TYPES = new Set<string>([
  "note",
  "tip",
  "info",
  "warning",
  "caution",
]);

const normalizeCalloutType = (type?: string | null): CalloutType => {
  if (type && VALID_CALLOUT_TYPES.has(type.toLowerCase())) {
    return type.toLowerCase() as CalloutType;
  }
  return "note";
};

const convertCalloutElement = (domNode: HTMLElement): DOMConversionOutput => {
  const calloutType = normalizeCalloutType(domNode.dataset.calloutType);
  const emoji = domNode.dataset.calloutEmoji;
  return {
    node: $createCalloutNode(calloutType, emoji),
  };
};

export class CalloutNode extends ElementNode {
  __calloutType: CalloutType;
  __emoji?: string;

  constructor(
    calloutType: CalloutType = "note",
    emoji?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__calloutType = calloutType;
    this.__emoji = emoji;
  }

  static override getType(): string {
    return "callout";
  }

  static override clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__calloutType, node.__emoji, node.__key);
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement("aside");
    dom.classList.add("editor-callout", `editor-callout-${this.__calloutType}`);
    dom.dataset.lexicalCallout = "true";
    dom.dataset.calloutType = this.__calloutType;
    if (this.__emoji) {
      dom.dataset.calloutEmoji = this.__emoji;
    }
    return dom;
  }

  override updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__calloutType !== this.__calloutType) {
      dom.classList.remove(`editor-callout-${prevNode.__calloutType}`);
      dom.classList.add(`editor-callout-${this.__calloutType}`);
      dom.dataset.calloutType = this.__calloutType;
    }
    if (prevNode.__emoji !== this.__emoji) {
      if (this.__emoji) {
        dom.dataset.calloutEmoji = this.__emoji;
      } else {
        delete dom.dataset.calloutEmoji;
      }
    }
    return false;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      aside: (domNode: HTMLElement) => {
        if (
          !domNode.classList.contains("editor-callout") &&
          !domNode.dataset.calloutType
        ) {
          return null;
        }
        return {
          conversion: convertCalloutElement,
          priority: 2,
        };
      },
      div: (domNode: HTMLElement) => {
        if (
          !domNode.dataset.lexicalCallout &&
          !domNode.dataset.calloutType &&
          !domNode.classList.contains("editor-callout")
        ) {
          return null;
        }
        return {
          conversion: convertCalloutElement,
          priority: 2,
        };
      },
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("aside");
    element.classList.add(
      "editor-callout",
      `editor-callout-${this.__calloutType}`
    );
    element.dataset.calloutType = this.__calloutType;
    if (this.__emoji) {
      element.dataset.calloutEmoji = this.__emoji;
    }
    return { element };
  }

  static override importJSON(
    serializedNode: SerializedCalloutNode
  ): CalloutNode {
    return $createCalloutNode(
      serializedNode.calloutType,
      serializedNode.emoji
    ).updateFromJSON(serializedNode);
  }

  override exportJSON(): SerializedCalloutNode {
    return {
      ...super.exportJSON(),
      calloutType: this.__calloutType,
      emoji: this.__emoji,
      type: "callout",
      version: 1,
    };
  }

  getCalloutType(): CalloutType {
    return this.__calloutType;
  }

  setCalloutType(type: CalloutType): this {
    const writable = this.getWritable();
    writable.__calloutType = type;
    return writable;
  }

  getEmoji(): string | undefined {
    return this.__emoji;
  }

  setEmoji(emoji?: string): this {
    const writable = this.getWritable();
    writable.__emoji = emoji;
    return writable;
  }

  override canIndent(): boolean {
    return false;
  }

  override collapseAtStart(): boolean {
    const paragraph = $createParagraphNode();
    const children = this.getChildren();
    for (const child of children) {
      paragraph.append(child);
    }
    this.replace(paragraph);
    return true;
  }
}

export function $createCalloutNode(
  calloutType: CalloutType = "note",
  emoji?: string
): CalloutNode {
  return new CalloutNode(calloutType, emoji);
}

export function $isCalloutNode(
  node: LexicalNode | null | undefined
): node is CalloutNode {
  return node instanceof CalloutNode;
}
