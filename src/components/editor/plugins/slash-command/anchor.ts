import type { LexicalEditor } from "lexical";
import type { SlashMenuAnchor } from "./types";

const getFirstTextDescendant = (element: HTMLElement): HTMLElement => {
  let inner = element;

  while (inner.firstElementChild instanceof HTMLElement) {
    inner = inner.firstElementChild;
  }

  return inner;
};

export const getSelectionRectangle = (
  editor: LexicalEditor
): DOMRect | null => {
  const nativeSelection = window.getSelection();
  const rootElement = editor.getRootElement();

  if (
    !(
      nativeSelection &&
      nativeSelection.rangeCount > 0 &&
      rootElement?.contains(nativeSelection.anchorNode)
    )
  ) {
    return null;
  }

  const range = nativeSelection.getRangeAt(0);
  const firstClientRect = range.getClientRects().item(0);
  const rectangle =
    nativeSelection.anchorNode === rootElement
      ? getFirstTextDescendant(rootElement).getBoundingClientRect()
      : (firstClientRect ?? range.getBoundingClientRect());
  const fallbackRectangle =
    nativeSelection.focusNode?.parentElement?.getBoundingClientRect();
  const nextRectangle =
    rectangle.width === 0 && rectangle.height === 0 && fallbackRectangle
      ? fallbackRectangle
      : rectangle;

  if (nextRectangle.width === 0 && nextRectangle.height === 0) {
    return null;
  }

  return nextRectangle;
};

export const createSlashMenuAnchor = (
  editor: LexicalEditor
): SlashMenuAnchor => {
  return {
    getBoundingClientRect: () => {
      const rectangle = getSelectionRectangle(editor);

      if (!rectangle) {
        return new DOMRect();
      }

      return new DOMRect(
        rectangle.left,
        rectangle.top,
        Math.max(rectangle.width, 1),
        Math.max(rectangle.height, 1)
      );
    },
    getClientRects: () => {
      const rect = getSelectionRectangle(editor);

      if (!rect) {
        return {
          item: () => null,
          length: 0,
          [Symbol.iterator](): IterableIterator<DOMRect> {
            return [][Symbol.iterator]();
          },
        } as unknown as DOMRectList;
      }

      const anchorRect = new DOMRect(
        rect.left,
        rect.top,
        Math.max(rect.width, 1),
        Math.max(rect.height, 1)
      );

      return {
        0: anchorRect,
        item: (index: number) => {
          return index === 0 ? anchorRect : null;
        },
        length: 1,
        *[Symbol.iterator](): IterableIterator<DOMRect> {
          yield anchorRect;
        },
      } as unknown as DOMRectList;
    },
  };
};
