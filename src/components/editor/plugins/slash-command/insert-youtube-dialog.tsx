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
import { parseYouTubeUrl } from "../youtube/utils";

interface InsertYouTubeDialogProps {
  /** Prefix for form input ids so multiple mounted dialogs stay unique. */
  idPrefix?: string;
  onCancel: () => void;
  onSubmit: () => void;
  onUrlChange: (value: string) => void;
  open: boolean;
  youTubeUrl: string;
}

export function InsertYouTubeDialog({
  idPrefix = "slash",
  onCancel,
  onSubmit,
  onUrlChange,
  open,
  youTubeUrl,
}: InsertYouTubeDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Embed YouTube video</DialogTitle>
          <DialogDescription>
            Paste a YouTube URL and it will be embedded as a video block.
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
            <label
              className="font-medium text-sm"
              htmlFor={`${idPrefix}-youtube-url`}
            >
              YouTube URL
            </label>
            <Input
              id={`${idPrefix}-youtube-url`}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=jNQXAC9IVRw"
              ref={(element) => {
                if (element && open) {
                  element.focus();
                }
              }}
              type="url"
              value={youTubeUrl}
            />
            <p className="text-muted-foreground text-xs">
              Supports `youtube.com`, `youtu.be`, and embed links.
            </p>
          </div>

          <DialogFooter showCloseButton={false}>
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={!parseYouTubeUrl(youTubeUrl)} type="submit">
              Embed video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
