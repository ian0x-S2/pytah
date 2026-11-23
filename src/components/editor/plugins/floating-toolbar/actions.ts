import { $patchStyleText } from "@lexical/selection";
import {
  $getSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import type { LexicalEditor } from "lexical";

export {
  applyToolbarLink,
  clearToolbarLink,
  submitToolbarLink,
  submitToolbarLinkText,
} from "../link-behavior/actions";

export type ToggleableTextFormat =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "code"
  | "highlight"
  | "subscript"
  | "superscript";

export const toggleToolbarFormat = (
  editor: LexicalEditor,
  format: ToggleableTextFormat
) => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
};

/**
 * Applies a horizontal alignment to the current block-level selection.
 * Passing `""` resets it (left in LTR documents).
 */
export const alignToolbarSelection = (
  editor: LexicalEditor,
  align: "left" | "center" | "right" | "justify" | ""
) => {
  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
};

/**
 * Applies an inline `color` CSS property to the current Lexical selection.
 * Passing an empty string removes the property from all selected text nodes.
 */
export const applyTextColor = (editor: LexicalEditor, color: string) => {
  editor.update(() => {
    const selection = $getSelection();
    if (selection !== null) {
      $patchStyleText(selection, { color: color || null });
    }
  });
};

/**
 * Applies an inline `background-color` CSS property to the current Lexical
 * selection. Passing an empty string removes the property.
 */
export const applyBgColor = (editor: LexicalEditor, color: string) => {
  editor.update(() => {
    const selection = $getSelection();
    if (selection !== null) {
      $patchStyleText(selection, { "background-color": color || null });
    }
  });
};
