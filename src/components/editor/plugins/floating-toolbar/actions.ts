import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { FORMAT_TEXT_COMMAND, type LexicalEditor } from "lexical";
import {
  isValidEditorLinkUrl,
  normalizeEditorLinkUrl,
} from "../link-behavior/utils";

export const submitToolbarLink = (
  editor: LexicalEditor,
  linkUrl: string
): string => {
  const normalizedLinkUrl = normalizeEditorLinkUrl(linkUrl);

  if (isValidEditorLinkUrl(normalizedLinkUrl)) {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedLinkUrl);
  } else {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }

  return "";
};

export const clearToolbarLink = (editor: LexicalEditor) => {
  editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
};

export const toggleToolbarFormat = (
  editor: LexicalEditor,
  format: "bold" | "italic" | "underline" | "strikethrough" | "code"
) => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
};
