import { $isLinkNode } from "@lexical/link";
import { $findMatchingParent } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import { $getNearestNodeFromDOMNode } from "lexical";

import type { FloatingLinkEditorAnchor } from "./floating-link-editor-position";
import { toFloatingLinkEditorAnchor } from "./floating-link-editor-position";

/** Hovered floating surfaces that keep the preview chip alive. */
const LINK_SURFACE_SELECTOR =
  '[data-slot="floating-link-preview"], [data-floating-link-card]';

export interface HoveredEditorLink {
  linkElement: HTMLAnchorElement;
  linkKey: string;
  linkText: string;
  linkUrl: string;
}

/**
 * True when the pointer moved over the preview chip itself. Hovering the
 * chip must not re-trigger detection (the chip floats over the link text,
 * so `pointerover` fires on it constantly).
 */
export const isInsideLinkSurface = (eventTarget: EventTarget | null): boolean =>
  eventTarget instanceof Element &&
  eventTarget.closest(LINK_SURFACE_SELECTOR) !== null;

/**
 * Snapshots the hovered link's rect. Re-running this on every hover tick
 * keeps the chip glued to the link while it reflows. A zero-size rect means
 * the element is dead (e.g. its text was wiped) and the chip must go.
 */
export const readLinkElementAnchor = (
  linkElement: Element
): FloatingLinkEditorAnchor | null => {
  const rect = linkElement.getBoundingClientRect();
  return rect.width === 0 && rect.height === 0
    ? null
    : toFloatingLinkEditorAnchor(rect);
};

const readLinkNodeMeta = (
  editor: LexicalEditor,
  linkElement: HTMLAnchorElement
): { key: string; text: string; url: string } | null => {
  let meta: { key: string; text: string; url: string } | null = null;

  // `editor.read` (not `getEditorState().read`) — the DOM→node lookup needs
  // this editor registered as the active editor for the duration of the call.
  editor.read(() => {
    const node = $getNearestNodeFromDOMNode(linkElement);
    const linkNode = $findMatchingParent(node, $isLinkNode);
    if (!$isLinkNode(linkNode)) {
      return;
    }

    meta = {
      key: linkNode.getKey(),
      text: linkNode.getTextContent(),
      url: linkNode.getURL(),
    };
  });

  return meta;
};

const getHoveredLinkFromElement = (
  editor: LexicalEditor,
  linkElement: HTMLAnchorElement
): HoveredEditorLink | null => {
  const rootElement = editor.getRootElement();
  if (!rootElement?.contains(linkElement)) {
    return null;
  }

  const meta = readLinkNodeMeta(editor, linkElement);
  return meta
    ? {
        linkElement,
        linkKey: meta.key,
        linkText: meta.text,
        linkUrl: meta.url,
      }
    : null;
};

/**
 * Resolves the link under a pointer event target. Hover is independent of
 * the selection: a collapsed caret inside a link plus the pointer elsewhere
 * must NOT pop the chip — only the pointer's link matters. Anchors outside
 * this editor's root (demo chrome, other editors) resolve to `null`.
 */
export const getHoveredEditorLink = (
  editor: LexicalEditor,
  eventTarget: EventTarget | null
): HoveredEditorLink | null => {
  if (!(eventTarget instanceof Element)) {
    return null;
  }

  // Over the chip itself: the chip's own pointer handlers own dismissal —
  // element detection here would re-target with a stale rect instead.
  if (isInsideLinkSurface(eventTarget)) {
    return null;
  }

  const linkElement = eventTarget.closest("a");
  return linkElement instanceof HTMLAnchorElement
    ? getHoveredLinkFromElement(editor, linkElement)
    : null;
};
