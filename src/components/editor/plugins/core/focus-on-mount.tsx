"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useEffect } from "react";

export function FocusOnMountPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      editor.focus(
        () => {
          $getRoot().selectStart();
        },
        { defaultSelection: "rootStart" }
      );
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [editor]);

  return null;
}
