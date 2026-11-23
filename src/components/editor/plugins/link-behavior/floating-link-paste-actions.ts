import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $isParagraphNode,
  $isRootNode,
  $isTextNode,
} from "lexical";
import type { LexicalEditor, LexicalNode } from "lexical";

import { $createWeblinkNode } from "../../core/nodes/weblink/node";
import type { LinkPasteOptionId } from "./constants";

const replaceLinkWithBlockWeblink = (
  linkNode: LexicalNode,
  url: string,
  format: "small" | "wide"
) => {
  const weblinkNode = $createWeblinkNode({
    format,
    url,
  });
  const parent = linkNode.getParent();
  const grandParent = parent?.getParent();

  if (
    parent &&
    $isParagraphNode(parent) &&
    grandParent &&
    $isRootNode(grandParent) &&
    parent.getTextContent().trim() === url
  ) {
    parent.replace(weblinkNode);
  } else if (
    parent &&
    $isParagraphNode(parent) &&
    grandParent &&
    $isRootNode(grandParent)
  ) {
    linkNode.remove();
    parent.insertAfter(weblinkNode);
  } else {
    linkNode.remove();
    $insertNodeToNearestRoot(weblinkNode);
  }

  const trailingParagraph = $createParagraphNode();
  weblinkNode.insertAfter(trailingParagraph);
  trailingParagraph.select();
};

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
        replaceLinkWithBlockWeblink(linkNode, url, "small");
        break;
      }
      case "wide-weblink": {
        replaceLinkWithBlockWeblink(linkNode, url, "wide");
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
