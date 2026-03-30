import { $createParagraphNode, type ElementNode } from "lexical";
import { $createLayoutContainerNode } from "../../core/nodes/layout-container-node";
import { $createLayoutItemNode } from "../../core/nodes/layout-item-node";

const TEMPLATE_COLUMN_SEPARATOR = /\s+/;

const getColumnCount = (templateColumns: string) => {
  return templateColumns.split(TEMPLATE_COLUMN_SEPARATOR).filter(Boolean)
    .length;
};

export const applyLayoutPreset = (
  targetElement: ElementNode,
  templateColumns: string
) => {
  const layoutContainer = $createLayoutContainerNode(templateColumns);
  const columnCount = getColumnCount(templateColumns);
  let firstParagraph: ReturnType<typeof $createParagraphNode> | null = null;

  for (let index = 0; index < columnCount; index += 1) {
    const layoutItem = $createLayoutItemNode();
    const paragraph = $createParagraphNode();

    if (firstParagraph === null) {
      firstParagraph = paragraph;
    }

    layoutItem.append(paragraph);
    layoutContainer.append(layoutItem);
  }

  targetElement.replace(layoutContainer);
  firstParagraph?.selectEnd();
};
