"use client";

import type { TableOfContentsEntry } from "@lexical/react/LexicalTableOfContentsPlugin";
import { mergeRegister } from "@lexical/utils";
import type { LexicalEditor, NodeKey } from "lexical";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { OBSERVER_ROOT_MARGIN } from "./constants";
import type { TocState } from "./types";
import { resolveActiveHeadingKey, resolveSelectedHeadingKey } from "./utils";

type TocAction =
  | { type: "set_active"; payload: NodeKey | null }
  | { type: "set_selected"; payload: NodeKey | null };

const tocReducer = (state: TocState, action: TocAction): TocState => {
  switch (action.type) {
    case "set_active":
      return state.activeKey === action.payload
        ? state
        : { ...state, activeKey: action.payload };
    case "set_selected":
      return state.selectedHeadingKey === action.payload
        ? state
        : { ...state, selectedHeadingKey: action.payload };
    default:
      return state;
  }
};

export function useActiveHeading(
  entries: readonly TableOfContentsEntry[],
  editor: LexicalEditor
): NodeKey | null {
  const [state, dispatch] = useReducer(tocReducer, {
    activeKey: null,
    selectedHeadingKey: null,
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          dispatch({
            type: "set_selected",
            payload: resolveSelectedHeadingKey(),
          });
        });
      })
    );
  }, [editor]);

  const syncActiveHeading = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      dispatch({
        type: "set_active",
        payload: resolveActiveHeadingKey(entries, editor),
      });
    });
  }, [entries, editor]);

  useEffect(() => {
    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(syncActiveHeading, {
      rootMargin: OBSERVER_ROOT_MARGIN,
      threshold: 0,
    });
    observerRef.current = observer;

    for (const [key] of entries) {
      const element = editor.getElementByKey(key);
      if (element instanceof HTMLElement) {
        observer.observe(element);
      }
    }

    syncActiveHeading();
    window.addEventListener("scroll", syncActiveHeading, { passive: true });
    window.addEventListener("resize", syncActiveHeading);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      window.removeEventListener("scroll", syncActiveHeading);
      window.removeEventListener("resize", syncActiveHeading);
    };
  }, [entries, editor, syncActiveHeading]);

  return state.selectedHeadingKey ?? state.activeKey;
}
