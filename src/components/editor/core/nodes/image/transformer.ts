import type { ElementTransformer } from "@lexical/markdown";

import { sanitizeMediaUrl } from "../../url";
import { $createImageNode, $isImageNode, ImageNode } from "./node";

const IMAGE_REGEXP = /^!\[(?<altText>(?:\\\]|[^\]])*)\]\((?<src>[^)\s]+)\)$/u;

export const IMAGE_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    const sanitizedAltText = node
      .getAltText()
      .replaceAll(/\r?\n+/gu, " ")
      .replaceAll("]", "\\]");

    return `![${sanitizedAltText}](${node.getSrc()})`;
  },
  regExp: IMAGE_REGEXP,
  replace: (parentNode, _children, match) => {
    // Typed as `Array<string>` by Lexical, but at runtime this is the
    // `RegExpMatchArray` from `IMAGE_REGEXP`, so named groups are present.
    const { altText = "", src = "" } = (match as RegExpMatchArray).groups ?? {};
    const safeSrc = sanitizeMediaUrl(src, {
      allowDataImage: true,
      allowRelative: true,
    });
    if (!safeSrc) {
      return;
    }

    parentNode.replace(
      $createImageNode({
        altText: altText.replaceAll("\\]", "]"),
        src: safeSrc,
      })
    );
  },
  type: "element",
};
