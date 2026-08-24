"use client";

import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import { XIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  ExcalidrawInitialElements,
  ExcalidrawScene,
  SaveableExcalidrawScene,
} from "./scene";
import { hasExcalidrawContent } from "./scene";

// The excalidraw runtime (component, styles and fonts) is loaded on demand:
// documents without drawings never download it.
const loadExcalidrawEditor = async (): Promise<{
  default: React.ComponentType<ExcalidrawProps>;
}> => {
  await import("@excalidraw/excalidraw/index.css");
  const { Excalidraw } = await import("@excalidraw/excalidraw");
  return {
    default: Excalidraw as unknown as React.ComponentType<ExcalidrawProps>,
  };
};

const LazyExcalidrawEditor = lazy(loadExcalidrawEditor);

export interface SaveExcalidrawScenePayload {
  appState: Partial<AppState>;
  elements: ExcalidrawInitialElements;
  files: BinaryFiles;
}

interface ExcalidrawEditorDialogProps {
  /** Scene shown when the editor opens. */
  initialScene: ExcalidrawScene;
  onClose: () => void;
  onSave: (payload: SaveExcalidrawScenePayload) => void;
}

/** Only the app state pieces worth persisting alongside a drawing. */
const pickPersistedAppState = (appState: AppState): Partial<AppState> => ({
  exportBackground: appState.exportBackground,
  exportScale: appState.exportScale,
  exportWithDarkMode: appState.theme === "dark",
  isBindingEnabled: appState.isBindingEnabled,
  name: appState.name,
  theme: appState.theme,
  viewBackgroundColor: appState.viewBackgroundColor,
  viewModeEnabled: appState.viewModeEnabled,
  zenModeEnabled: appState.zenModeEnabled,
});

/**
 * Full-screen editing surface for a single excalidraw scene. Saving hands the
 * current elements back to the caller; closing discards local edits.
 */
export function ExcalidrawEditorDialog({
  initialScene,
  onClose,
  onSave,
}: ExcalidrawEditorDialogProps) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const latestSceneRef = useRef<SaveableExcalidrawScene>({
    elements: initialScene.elements,
    files: initialScene.files ?? {},
  });

  useEffect(() => {
    // Focus the dialog wrapper so Escape reaches it before the canvas takes
    // over keyboard handling.
    dialogRef.current?.focus();
  }, []);

  const hasUnsavedContent = () => {
    return hasExcalidrawContent(latestSceneRef.current);
  };

  const requestClose = () => {
    if (hasUnsavedContent()) {
      setIsDiscardConfirmOpen(true);
      return;
    }

    onClose();
  };

  const handleSave = () => {
    const appState = api?.getAppState();
    onSave({
      appState: appState ? pickPersistedAppState(appState) : {},
      elements: latestSceneRef.current.elements,
      files: latestSceneRef.current.files ?? {},
    });
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: full-screen dialog wrapper captures Escape before page handlers
    <div
      aria-label="Excalidraw drawing editor"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
      onKeyDown={(event) => {
        // Only capture Escape before it reaches the page; the canvas keeps
        // its own Escape semantics (e.g. exiting zen mode).
        if (
          event.key === "Escape" &&
          !isDiscardConfirmOpen &&
          event.target === dialogRef.current
        ) {
          requestClose();
        }
      }}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <header className="flex items-center justify-between border-b px-4 py-2">
        <p className="font-medium text-sm">Excalidraw drawing</p>
        <div className="flex items-center gap-2">
          <Button onClick={requestClose} size="sm" variant="ghost">
            Discard
          </Button>
          <Button onClick={handleSave} size="sm">
            Save &amp; insert
          </Button>
          <Button
            aria-label="Close drawing editor"
            onClick={requestClose}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Loading drawing canvas…
            </div>
          }
        >
          <LazyExcalidrawEditor
            excalidrawAPI={setApi}
            initialData={{
              appState: initialScene.appState ?? {},
              elements: initialScene.elements,
              files: initialScene.files ?? {},
            }}
            onChange={(elements, _appState, files) => {
              latestSceneRef.current = { elements, files };
            }}
          />
        </Suspense>

        {isDiscardConfirmOpen ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-xs">
            <div
              aria-label="Discard changes"
              className="w-80 rounded-xl bg-popover p-4 shadow-lg ring-1 ring-border"
              role="alertdialog"
            >
              <p className="font-medium">Discard changes?</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Your drawing has unsaved edits that will be lost.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setIsDiscardConfirmOpen(false);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Keep editing
                </Button>
                <Button
                  onClick={() => {
                    setIsDiscardConfirmOpen(false);
                    onClose();
                  }}
                  size="sm"
                  variant="destructive"
                >
                  Discard
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
