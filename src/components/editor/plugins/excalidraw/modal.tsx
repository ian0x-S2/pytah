"use client";

import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import { XIcon } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

import type {
  ExcalidrawInitialElements,
  ExcalidrawScene,
  SaveableExcalidrawScene,
} from "./scene";
import { hasExcalidrawContent } from "./scene";

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

const getSceneSignature = (scene: SaveableExcalidrawScene): string => {
  const activeElements: string[] = [];
  for (const element of scene.elements ?? []) {
    if (!element.isDeleted) {
      activeElements.push(
        `${element.id}:${element.version}:${element.versionNonce}`
      );
    }
  }
  const fileKeys = Object.keys(scene.files ?? {}).toSorted();
  return `${activeElements.join(",")}|${fileKeys.join(",")}`;
};

const loadExcalidrawCanvas = async (): Promise<
  ComponentType<ExcalidrawProps>
> => {
  await import("@excalidraw/excalidraw/index.css");
  const module = await import("@excalidraw/excalidraw");
  return module.Excalidraw as unknown as ComponentType<ExcalidrawProps>;
};

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
  const [excalidrawCanvas, setExcalidrawCanvas] =
    useState<ComponentType<ExcalidrawProps> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const initialSignatureRef = useRef<string | null>(null);
  const latestSceneRef = useRef<SaveableExcalidrawScene>({
    elements: initialScene.elements,
    files: initialScene.files ?? {},
  });

  useEffect(() => {
    initialSignatureRef.current = getSceneSignature({
      elements: initialScene.elements,
      files: initialScene.files ?? {},
    });
  }, [initialScene.elements, initialScene.files]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const loadedCanvas = await loadExcalidrawCanvas();
        if (!cancelled) {
          setExcalidrawCanvas(() => loadedCanvas);
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();

    if (typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  const hasUnsavedChanges = () => {
    const baseline =
      initialSignatureRef.current ??
      getSceneSignature({
        elements: initialScene.elements,
        files: initialScene.files ?? {},
      });
    const currentSignature = getSceneSignature(latestSceneRef.current);
    if (currentSignature !== baseline) {
      return true;
    }
    return (
      !hasExcalidrawContent(initialScene) &&
      hasExcalidrawContent(latestSceneRef.current)
    );
  };

  const requestClose = () => {
    if (hasUnsavedChanges()) {
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

  const Canvas = excalidrawCanvas;

  const renderCanvasContent = () => {
    if (loadFailed) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load the drawing canvas.
          </p>
          <Button onClick={onClose} size="sm" variant="outline">
            Close
          </Button>
        </div>
      );
    }

    if (Canvas) {
      return (
        <Canvas
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
      );
    }

    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading drawing canvas…
      </div>
    );
  };

  return createPortal(
    <dialog
      aria-label="Excalidraw drawing editor"
      aria-modal="true"
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none flex-col border-0 bg-background p-0 outline-none"
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return;
        }

        if (isDiscardConfirmOpen) {
          event.preventDefault();
          event.stopPropagation();
          setIsDiscardConfirmOpen(false);
          return;
        }

        const target = event.target as HTMLElement | null;
        if (target?.closest(".excalidraw")) {
          return;
        }

        event.preventDefault();
        requestClose();
      }}
      open
      ref={dialogRef}
      tabIndex={-1}
    >
      <header className="flex items-center justify-between border-b px-4 py-2">
        <p className="text-sm font-medium">Excalidraw drawing</p>
        <div className="flex items-center gap-2">
          <Button onClick={requestClose} size="sm" variant="ghost">
            Discard
          </Button>
          <Button disabled={loadFailed} onClick={handleSave} size="sm">
            Save &amp; insert
          </Button>
          <Button
            aria-label="Close drawing editor"
            onClick={requestClose}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon aria-hidden />
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {renderCanvasContent()}

        {isDiscardConfirmOpen ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-xs">
            <dialog
              aria-label="Discard changes"
              aria-modal="true"
              className="editor-floating editor-floating-padding-lg m-0 max-h-none w-80 max-w-none border-0"
              open
              role="alertdialog"
            >
              <p className="font-medium">Discard changes?</p>
              <p className="mt-1 text-sm text-muted-foreground">
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
            </dialog>
          </div>
        ) : null}
      </div>
    </dialog>,
    document.body
  );
}
