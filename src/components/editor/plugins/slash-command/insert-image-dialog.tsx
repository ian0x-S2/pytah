import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface InsertImageDialogProps {
  imageAltText: string;
  imageFileName: string;
  imageFileSrc: string | null;
  imageUrl: string;
  onAltTextChange: (value: string) => void;
  onCancel: () => void;
  onImageFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onUrlChange: (value: string) => void;
  open: boolean;
}

export function InsertImageDialog({
  imageAltText,
  imageFileName,
  imageFileSrc,
  imageUrl,
  onAltTextChange,
  onCancel,
  onImageFileChange,
  onSubmit,
  onUrlChange,
  open,
}: InsertImageDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
          <DialogDescription>
            Add an external image URL and optional alt text.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid gap-2">
            <label className="font-medium text-sm" htmlFor="slash-image-url">
              Image URL
            </label>
            <Input
              id="slash-image-url"
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://example.com/image.jpg"
              ref={(element) => {
                if (element && open) {
                  element.focus();
                }
              }}
              type="url"
              value={imageUrl}
            />
          </div>

          <div className="grid gap-2">
            <label className="font-medium text-sm" htmlFor="slash-image-file">
              Local file
            </label>
            <Input
              accept="image/*"
              id="slash-image-file"
              onChange={onImageFileChange}
              type="file"
            />
            {imageFileName ? (
              <p className="text-muted-foreground text-xs">
                Selected: {imageFileName}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label className="font-medium text-sm" htmlFor="slash-image-alt">
              Alt text
            </label>
            <Textarea
              id="slash-image-alt"
              onChange={(event) => onAltTextChange(event.target.value)}
              placeholder="Describe the image for accessibility"
              rows={3}
              value={imageAltText}
            />
          </div>

          <DialogFooter showCloseButton={false}>
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={!(imageFileSrc || imageUrl.trim())} type="submit">
              Insert image
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
