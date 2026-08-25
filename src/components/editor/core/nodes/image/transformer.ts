import type { ElementTransformer } from "@lexical/markdown";
import { $createImageNode, $isImageNode, ImageNode } from "./node";

const IMAGE_REGEXP = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

export const IMAGE_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    return `![${node.getAltText().replace(/]/g, "\\]")}](${node.getSrc()})`;
  },
  regExp: IMAGE_REGEXP,
  replace: (parentNode, _children, match) => {
    const [, altText, src] = match;
    parentNode.replace(
      $createImageNode({
        altText,
        src,
      })
    );
  },
  type: "element",
};
