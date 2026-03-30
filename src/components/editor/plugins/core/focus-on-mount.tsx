import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export function FocusOnMountPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      editor.focus();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [editor]);

  return null;
}
