"use client";

import { $isLinkNode } from "@lexical/link";
import { $findMatchingParent } from "@lexical/utils";
import { $getNodeByKey } from "lexical";
import type { LexicalEditor } from "lexical";
import type { Dispatch } from "react";

import { HoverCard, HoverCardContent } from "@/components/ui/hover-card";
import { Popover, PopoverContent } from "@/components/ui/popover";

import { FloatingLinkEditorPanel } from "./floating-link-editor-panel";
import type {
  FloatingLinkEditorAction,
  FloatingLinkEditorState,
} from "./floating-link-editor-reducer";
import { FloatingLinkPreviewChip } from "./floating-link-preview-chip";
import { LINK_PLACEHOLDER_URL, sanitizeEditorLinkUrl } from "./utils";

interface FloatingLinkEditorSurfacesProps {
  anchorElement: { getBoundingClientRect: () => DOMRect } | null;
  dispatch: Dispatch<FloatingLinkEditorAction>;
  editor: LexicalEditor;
  onInputRef: (element: HTMLInputElement | null) => void;
  onPointerOverChipChange: (isOver: boolean) => void;
  state: FloatingLinkEditorState;
}

/**
 * The two renderable states of the floating link editor: the hover preview
 * chip (caret-independent, pointer-driven) and the edit card (explicitly
 * opened via chip Edit, toolbar button or Cmd/Ctrl+K). Mounting and
 * anchoring decisions stay in the plugin component.
 */
export function FloatingLinkEditorSurfaces({
  anchorElement,
  dispatch,
  editor,
  onInputRef,
  onPointerOverChipChange,
  state,
}: FloatingLinkEditorSurfacesProps) {
  const {
    anchor: _anchor,
    editedLinkText,
    editedLinkUrl,
    hoverTarget,
    isLinkEditMode,
    linkUrl,
    surface,
  } = state;

  if (anchorElement === null) {
    return null;
  }

  if (surface === "preview" && hoverTarget !== null) {
    // HoverCard (Base UI preview card) is the purpose-built surface for
    // pointer previews: it keeps hover intent, Escape and outside press
    // dismissal native. Open state stays controlled — the link lives inside
    // Lexical-owned DOM, so hover detection stays with the plugin.
    return (
      <HoverCard
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            dispatch({ type: "unhover-link" });
          }
        }}
        open
      >
        <HoverCardContent
          align="start"
          anchor={anchorElement}
          className="editor-floating editor-floating-padding-sm w-72"
          onPointerEnter={() => onPointerOverChipChange(true)}
          onPointerLeave={() => onPointerOverChipChange(false)}
          side="bottom"
          sideOffset={6}
        >
          <FloatingLinkPreviewChip
            href={sanitizeEditorLinkUrl(hoverTarget.linkUrl)}
            label={hoverTarget.linkText}
            onEdit={() => {
              // Selecting the link first mirrors the reference flow and lets
              // the selection sync carry the card: an open edit card whose
              // selection lives elsewhere dies on the next sync.
              editor.update(() => {
                const node = $getNodeByKey(hoverTarget.linkKey);
                const linkNode = $findMatchingParent(node, $isLinkNode);
                linkNode?.select();
              });
              dispatch({
                payload: {
                  editedLinkText: hoverTarget.linkText,
                  editedLinkUrl: hoverTarget.linkUrl || LINK_PLACEHOLDER_URL,
                },
                type: "open-edit-mode",
              });
            }}
          />
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          // The card is always opened explicitly (chip Edit, toolbar
          // button, Cmd/Ctrl+K), so any dismissal is a real close request.
          dispatch({ type: "close-link-editor" });
        }
      }}
      open
    >
      <PopoverContent
        align="start"
        anchor={anchorElement}
        className="editor-floating editor-floating-padding-md"
        data-floating-link-card
        initialFocus={false}
        side="bottom"
        sideOffset={6}
      >
        <FloatingLinkEditorPanel
          editedLinkText={editedLinkText}
          editedLinkUrl={editedLinkUrl}
          editor={editor}
          inputRef={onInputRef}
          isLinkEditMode={isLinkEditMode}
          linkUrl={linkUrl}
          onEditedLinkTextChange={(value) =>
            dispatch({ payload: value, type: "set-edited-link-text" })
          }
          onEditedLinkUrlChange={(value) =>
            dispatch({ payload: value, type: "set-edited-link-url" })
          }
          onRequestClose={() => dispatch({ type: "close-link-editor" })}
        />
      </PopoverContent>
    </Popover>
  );
}
