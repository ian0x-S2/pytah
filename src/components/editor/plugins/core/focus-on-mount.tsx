"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useEffect } from "react";

export function FocusOnMountPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      editor.update(() => {
        const root = $getRoot();
        const firstDescendant = root.getFirstDescendant();
        if (firstDescendant) {
          firstDescendant.selectStart();
        } else {
          const firstChild = root.getFirstChild();
          if (firstChild) {
            firstChild.selectStart();
          } else {
            root.selectStart();
          }
        }
      });

      const rootElement = editor.getRootElement();
      if (rootElement) {
        rootElement.focus({ preventScroll: true });
      }
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [editor]);

  return null;
}
