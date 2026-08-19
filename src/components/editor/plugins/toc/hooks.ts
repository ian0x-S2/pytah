"use client";

import type { TableOfContentsEntry } from "@lexical/react/LexicalTableOfContentsPlugin";
import { mergeRegister } from "@lexical/utils";
import { $getNodeByKey, type LexicalEditor, type NodeKey } from "lexical";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { OBSERVER_ROOT_MARGIN } from "./constants";
import type { TocState } from "./types";
import {
  getScrollParent,
  resolveActiveHeadingKey,
  resolveSelectedHeadingKey,
  scrollToHeading,
} from "./utils";

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
): {
  activeKey: NodeKey | null;
  selectedKey: NodeKey | null;
  handleHeadingClick: (key: NodeKey) => void;
} {
  const [state, dispatch] = useReducer(tocReducer, {
    activeKey: null,
    selectedHeadingKey: null,
  });

  // Keep a ref to the latest state so callbacks can read it without dependencies
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // References to keep callbacks stable
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  // Track scroll direction and position
  const prevScrollTop = useRef(0);
  const scrollDirection = useRef<"up" | "down">("down");
  const isProgrammaticScrolling = useRef(false);

  // Cache scroll parent and header offset
  const scrollParentRef = useRef<HTMLElement | Window>(window);
  const stickyHeadersRef = useRef<HTMLElement[]>([]);
  const cachedOffset = useRef(24);

  // Resolve scroll parent of editor
  const updateScrollParent = useCallback(() => {
    const rootEl = editor.getRootElement();
    scrollParentRef.current = rootEl ? getScrollParent(rootEl) : window;
  }, [editor]);

  // Find fixed/sticky headers once and cache them
  const updateStickyHeaders = useCallback(() => {
    const headers = Array.from(document.querySelectorAll("header"));
    const sticky: HTMLElement[] = [];
    for (const header of headers) {
      if (header instanceof HTMLElement) {
        const { position } = window.getComputedStyle(header);
        if (position === "fixed" || position === "sticky") {
          sticky.push(header);
        }
      }
    }
    stickyHeadersRef.current = sticky;
  }, []);

  // Compute the current scroll top offset dynamically but extremely fast
  const updateCachedOffset = useCallback(() => {
    let maxHeaderBottom = 0;
    for (const header of stickyHeadersRef.current) {
      maxHeaderBottom = Math.max(
        maxHeaderBottom,
        header.getBoundingClientRect().bottom
      );
    }
    cachedOffset.current = Math.max(24, Math.round(maxHeaderBottom + 16));
  }, []);

  // Update layout info on resize
  const handleResize = useCallback(() => {
    updateScrollParent();
    updateStickyHeaders();
    updateCachedOffset();
  }, [updateScrollParent, updateStickyHeaders, updateCachedOffset]);

  // Sync active heading logic
  const syncActiveHeading = useCallback(() => {
    if (isProgrammaticScrolling.current) {
      return;
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      // Determine scroll direction
      const scrollParent = scrollParentRef.current;
      const isWindow = scrollParent === window;
      const scrollTop = isWindow
        ? window.scrollY
        : (scrollParent as HTMLElement).scrollTop;

      if (scrollTop > prevScrollTop.current) {
        scrollDirection.current = "down";
      } else if (scrollTop < prevScrollTop.current) {
        scrollDirection.current = "up";
      }
      prevScrollTop.current = scrollTop;

      // Update cached offset dynamically from sticky headers
      updateCachedOffset();

      dispatch({
        type: "set_active",
        payload: resolveActiveHeadingKey(entriesRef.current, editor, {
          currentActiveKey: stateRef.current.activeKey,
          scrollDirection: scrollDirection.current,
          scrollParent,
          offset: cachedOffset.current,
        }),
      });
    });
  }, [editor, updateCachedOffset]);

  // Handle selected heading (cursor selection)
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

  // Listen to keys of entries. Re-setup observers only when the keys list changes.
  const keysStr = entries.map(([key]) => key).join(",");
  const prevKeysStrRef = useRef("");

  useEffect(() => {
    // Initial setups
    handleResize();

    // Rebuild observer only when the list of heading keys changes
    const keysChanged = keysStr !== prevKeysStrRef.current;
    prevKeysStrRef.current = keysStr;

    let observer: IntersectionObserver | null = null;

    if (keysChanged) {
      observer = new IntersectionObserver(syncActiveHeading, {
        rootMargin: OBSERVER_ROOT_MARGIN,
        threshold: 0,
      });

      for (const [key] of entriesRef.current) {
        const element = editor.getElementByKey(key);
        if (element instanceof HTMLElement) {
          observer.observe(element);
        }
      }
    }

    // Always sync active heading when keys change or on mount
    syncActiveHeading();

    // Listen on window for scroll with capture: true to catch all scroll events
    window.addEventListener("scroll", syncActiveHeading, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observer?.disconnect();
      window.removeEventListener("scroll", syncActiveHeading, {
        capture: true,
      });
      window.removeEventListener("resize", handleResize);
    };
  }, [keysStr, editor, syncActiveHeading, handleResize]);

  // Scroll to heading click handler
  const handleHeadingClick = useCallback(
    (key: NodeKey) => {
      const headingElement = editor.getElementByKey(key);
      if (!(headingElement instanceof HTMLElement)) {
        return;
      }

      // Stop any pending animation frames
      cancelAnimationFrame(rafRef.current);

      // Instantly update active heading highlight in the UI for premium UX
      isProgrammaticScrolling.current = true;
      dispatch({ type: "set_active", payload: key });
      dispatch({ type: "set_selected", payload: key });

      // Focus editor and place cursor
      editor.update(
        () => {
          $getNodeByKey(key)?.selectStart();
        },
        { discrete: true }
      );
      editor.getRootElement()?.focus({ preventScroll: true });

      // Recalculate layout targets
      updateScrollParent();
      updateStickyHeaders();
      updateCachedOffset();

      const scrollParent = scrollParentRef.current;
      const offset = cachedOffset.current;

      const onScrollEnd = () => {
        isProgrammaticScrolling.current = false;
        cleanup();
      };

      const handleUserInterrupt = () => {
        isProgrammaticScrolling.current = false;
        cleanup();
      };

      const cleanup = () => {
        scrollParent.removeEventListener("scrollend", onScrollEnd);
        window.removeEventListener("wheel", handleUserInterrupt);
        window.removeEventListener("touchmove", handleUserInterrupt);
        window.removeEventListener("keydown", handleUserInterrupt);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      // Listen for scrollend or user interruption to restore scroll tracking
      scrollParent.addEventListener("scrollend", onScrollEnd, { once: true });
      window.addEventListener("wheel", handleUserInterrupt, { passive: true });
      window.addEventListener("touchmove", handleUserInterrupt, {
        passive: true,
      });
      window.addEventListener("keydown", handleUserInterrupt, {
        passive: true,
      });

      // Safety timeout in case scrollend doesn't trigger
      timeoutRef.current = setTimeout(() => {
        if (isProgrammaticScrolling.current) {
          onScrollEnd();
        }
      }, 800);

      // Perform smooth scroll
      scrollToHeading(headingElement, offset);
    },
    [editor, updateScrollParent, updateStickyHeaders, updateCachedOffset]
  );

  return {
    activeKey: state.activeKey,
    selectedKey: state.selectedHeadingKey,
    handleHeadingClick,
  };
}
