import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
} from "lexical";
import type { LexicalEditor } from "lexical";

import { $createWeblinkNode } from "../../core/nodes/weblink/node";
import type { LinkPasteOptionId } from "./constants";

export function executeLinkPasteOption(
  editor: LexicalEditor,
  linkNodeKey: string,
  url: string,
  optionId: LinkPasteOptionId
): void {
  editor.update(() => {
    const linkNode = $getNodeByKey(linkNodeKey);
    if (!linkNode || !linkNode.isAttached()) {
      return;
    }

    switch (optionId) {
      case "inline-link": {
        // Keep as standard text link; select end of link
        linkNode.selectEnd();
        break;
      }
      case "inline-weblink": {
        const weblinkNode = $createWeblinkNode({
          format: "inline",
          url,
        });
        const nextSibling = linkNode.getNextSibling();
        linkNode.replace(weblinkNode);
        if (nextSibling && $isTextNode(nextSibling)) {
          nextSibling.select(0, 0);
        } else {
          const textAfter = $createTextNode(" ");
          weblinkNode.insertAfter(textAfter);
          textAfter.select();
        }
        break;
      }
      case "small-weblink": {
        const weblinkNode = $createWeblinkNode({
          format: "small",
          url,
        });
        const parent = linkNode.getParent();
        if (
          parent &&
          $isParagraphNode(parent) &&
          parent.getTextContent().trim() === url
        ) {
          parent.replace(weblinkNode);
        } else if (parent && $isElementNode(parent)) {
          linkNode.remove();
          parent.insertAfter(weblinkNode);
        } else {
          linkNode.replace(weblinkNode);
        }
        const trailingParagraph = $createParagraphNode();
        weblinkNode.insertAfter(trailingParagraph);
        trailingParagraph.select();
        break;
      }
      case "wide-weblink": {
        const weblinkNode = $createWeblinkNode({
          format: "wide",
          url,
        });
        const parent = linkNode.getParent();
        if (
          parent &&
          $isParagraphNode(parent) &&
          parent.getTextContent().trim() === url
        ) {
          parent.replace(weblinkNode);
        } else if (parent && $isElementNode(parent)) {
          linkNode.remove();
          parent.insertAfter(weblinkNode);
        } else {
          linkNode.replace(weblinkNode);
        }
        const trailingParagraph = $createParagraphNode();
        weblinkNode.insertAfter(trailingParagraph);
        trailingParagraph.select();
        break;
      }
      case "remove-link": {
        const textNode = $createTextNode(url);
        linkNode.replace(textNode);
        textNode.selectEnd();
        break;
      }
      default: {
        break;
      }
    }
  });
}
