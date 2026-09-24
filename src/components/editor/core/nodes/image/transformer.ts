import type { ElementTransformer } from "@lexical/markdown";

import { $createImageNode, $isImageNode, ImageNode } from "./node";

const IMAGE_REGEXP = /^!\[(?<altText>[^\]]*)\]\((?<src>[^)\s]+)\)$/u;

export const IMAGE_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    return `![${node.getAltText().replaceAll("]", "\\]")}](${node.getSrc()})`;
  },
  regExp: IMAGE_REGEXP,
  replace: (parentNode, _children, match) => {
    // Typed as `Array<string>` by Lexical, but at runtime this is the
    // `RegExpMatchArray` from `IMAGE_REGEXP`, so named groups are present.
    const { altText = "", src = "" } = (match as RegExpMatchArray).groups ?? {};
    parentNode.replace(
      $createImageNode({
        altText,
        src,
      })
    );
  },
  type: "element",
};
