"use client";

import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from "lexical";
import { useEffect, useState } from "react";

import { AUTO_LINK_MATCHERS } from "./constants";
import type { FloatingLinkEditorAnchor } from "./floating-link-editor-position";
import { FloatingLinkPasteMenu } from "./floating-link-paste-menu";
import { handleLinkPaste } from "./paste";
import { isValidEditorLinkUrl } from "./utils";

interface LinkBehaviorPluginProps {
  editable: boolean;
  enablePasteMenu?: boolean;
}

export function LinkBehaviorPlugin({
  editable,
  enablePasteMenu = true,
}: LinkBehaviorPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [pasteMenuState, setPasteMenuState] = useState<{
    anchor: FloatingLinkEditorAnchor | null;
    isOpen: boolean;
    linkNodeKey: string | null;
    url: string;
  }>({
    anchor: null,
    isOpen: false,
    linkNodeKey: null,
    url: "",
  });

  useEffect(() => {
    if (!editable) {
      return;
    }

    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) =>
        handleLinkPaste(
          editor,
          event,
          enablePasteMenu
            ? {
                onShowPasteMenu: ({ anchor, linkNodeKey, url }) => {
                  setPasteMenuState({
                    anchor,
                    isOpen: true,
                    linkNodeKey,
                    url,
                  });
                },
              }
            : undefined
        ),
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, editable, enablePasteMenu]);

  return (
    <>
      <LinkPlugin validateUrl={isValidEditorLinkUrl} />
      <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
      <ClickableLinkPlugin disabled={editable} newTab />
      {editable && enablePasteMenu && (
        <FloatingLinkPasteMenu
          anchor={pasteMenuState.anchor}
          editor={editor}
          isOpen={pasteMenuState.isOpen}
          linkNodeKey={pasteMenuState.linkNodeKey}
          onClose={() =>
            setPasteMenuState((prev) => ({ ...prev, isOpen: false }))
          }
          url={pasteMenuState.url}
        />
      )}
    </>
  );
}
