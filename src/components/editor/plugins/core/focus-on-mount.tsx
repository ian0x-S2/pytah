"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useEffect, useRef } from "react";

const SETTLE_RETRY_DELAY_MS = 150;

export function FocusOnMountPlugin() {
  const [editor] = useLexicalComposerContext();
  const retryTimersRef = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    const clearRetryTimers = () => {
      for (const timer of retryTimersRef.current) {
        window.clearTimeout(timer);
      }
      retryTimersRef.current = [];
    };

    const placeMountCaret = () => {
      const hasContent = editor
        .getEditorState()
        .read(() => $getRoot().getFirstDescendant() !== null);
      if (!hasContent) {
        return false;
      }

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

      return true;
    };

    const settle = () => {
      if (cancelled) {
        return;
      }

      // Wait one frame so any in-flight layout pass is applied before the
      // caret is placed. Placing the caret before async assets (KaTeX fonts,
      // images) finish loading makes the browser scroll the caret back into
      // view when those assets later shift the layout, yanking the page away
      // from its position.
      requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }

        if (!placeMountCaret()) {
          const retryTimer = window.setTimeout(settle, SETTLE_RETRY_DELAY_MS);
          retryTimersRef.current.push(retryTimer);
        }
      });
    };

    const release = () => {
      if (cancelled) {
        return;
      }
      cancelled = true;
      window.removeEventListener("load", settle);
      clearRetryTimers();
    };

    window.addEventListener("load", settle);
    const fontsReady = document.fonts
      ? document.fonts.ready
      : Promise.resolve();
    fontsReady.then(settle).catch(settle);
    const fallbackTimer = window.setTimeout(settle, 1000);

    return () => {
      if (!cancelled) {
        release();
      }
      window.clearTimeout(fallbackTimer);
    };
  }, [editor]);

  return null;
}
