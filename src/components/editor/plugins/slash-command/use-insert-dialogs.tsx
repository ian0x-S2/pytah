"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import { INSERT_IMAGE_COMMAND } from "../image/commands";
import { readFileAsDataUrl } from "../image/utils";
import { INSERT_LAYOUT_COMMAND } from "../layout/commands";
import { INSERT_YOUTUBE_COMMAND } from "../youtube/commands";
import { parseYouTubeUrl } from "../youtube/utils";
import { InsertImageDialog } from "./insert-image-dialog";
import { InsertYouTubeDialog } from "./insert-youtube-dialog";
import { SlashLayoutDialog } from "./layout-dialog";

interface ImageDialogState {
  altText: string;
  fileName: string;
  fileSrc: string | null;
  url: string;
}

interface UseInsertDialogsReturn {
  dialogs: ReactNode;
  openColumns: () => void;
  openImage: () => void;
  openYouTube: () => void;
}

const INITIAL_IMAGE_STATE: ImageDialogState = {
  altText: "",
  fileName: "",
  fileSrc: null,
  url: "",
};

/**
 * Shared image/YouTube insert dialogs for toolbar surfaces. Mirrors the slash
 * menu flows but inserts at the current selection instead of replacing a
 * target block. `idPrefix` keeps form input ids unique when several toolbar
 * surfaces mount at once.
 */
export function useInsertDialogs(idPrefix: string): UseInsertDialogsReturn {
  const [editor] = useLexicalComposerContext();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [imageState, setImageState] =
    useState<ImageDialogState>(INITIAL_IMAGE_STATE);
  const [isYouTubeOpen, setIsYouTubeOpen] = useState(false);
  const [youTubeUrl, setYouTubeUrl] = useState("");
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);

  const patchImageState = (patch: Partial<ImageDialogState>) => {
    setImageState((current) => ({ ...current, ...patch }));
  };

  const closeImageDialog = () => {
    setIsImageOpen(false);
    setImageState(INITIAL_IMAGE_STATE);
  };

  const handleImageSubmit = () => {
    const src = imageState.fileSrc ?? imageState.url.trim();
    if (!src) {
      return;
    }

    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      altText: imageState.altText.trim(),
      src,
    });

    closeImageDialog();
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      patchImageState({ fileName: "", fileSrc: null });
      return;
    }

    readFileAsDataUrl(file)
      .then((fileSrc) => {
        patchImageState({ fileName: file.name, fileSrc });
      })
      .catch(() => {
        patchImageState({ fileName: "", fileSrc: null });
      });
  };

  const closeYouTubeDialog = () => {
    setIsYouTubeOpen(false);
    setYouTubeUrl("");
  };

  const handleYouTubeSubmit = () => {
    const videoId = parseYouTubeUrl(youTubeUrl);
    if (!videoId) {
      return;
    }

    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, { videoId });
    closeYouTubeDialog();
  };

  const handleLayoutPresetSelect = (templateColumns: string) => {
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, { templateColumns });
    setIsLayoutOpen(false);
  };

  const dialogs = (
    <>
      <InsertImageDialog
        idPrefix={idPrefix}
        imageAltText={imageState.altText}
        imageFileName={imageState.fileName}
        imageFileSrc={imageState.fileSrc}
        imageUrl={imageState.url}
        onAltTextChange={(altText) => patchImageState({ altText })}
        onCancel={closeImageDialog}
        onImageFileChange={handleImageFileChange}
        onSubmit={handleImageSubmit}
        onUrlChange={(url) => patchImageState({ url })}
        open={isImageOpen}
      />
      <InsertYouTubeDialog
        idPrefix={idPrefix}
        onCancel={closeYouTubeDialog}
        onSubmit={handleYouTubeSubmit}
        onUrlChange={setYouTubeUrl}
        open={isYouTubeOpen}
        youTubeUrl={youTubeUrl}
      />
      <SlashLayoutDialog
        onCancel={() => setIsLayoutOpen(false)}
        onOpenChange={(open) => {
          if (!open) {
            setIsLayoutOpen(false);
          }
        }}
        onSelectPreset={handleLayoutPresetSelect}
        open={isLayoutOpen}
      />
    </>
  );

  return {
    dialogs,
    openColumns: () => setIsLayoutOpen(true),
    openImage: () => setIsImageOpen(true),
    openYouTube: () => setIsYouTubeOpen(true),
  };
}
