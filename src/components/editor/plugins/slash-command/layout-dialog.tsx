import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LAYOUT_PRESETS } from "../layout/constants";

const TEMPLATE_COLUMN_SEPARATOR = /\s+/;

const getLayoutPreviewColumns = (templateColumns: string) => {
  return templateColumns.split(TEMPLATE_COLUMN_SEPARATOR).filter(Boolean);
};

function LayoutPresetPreview({ templateColumns }: { templateColumns: string }) {
  const columns = getLayoutPreviewColumns(templateColumns);
  const columnOccurrences = new Map<string, number>();

  return (
    <div className="grid h-14 w-full gap-2 rounded-xl border border-border/70 bg-muted/40 p-2">
      <div
        className="grid h-full gap-2"
        style={{ gridTemplateColumns: templateColumns }}
      >
        {columns.map((column) => {
          const currentCount = columnOccurrences.get(column) ?? 0;
          columnOccurrences.set(column, currentCount + 1);

          return (
            <div
              className="rounded-md border border-border/70 bg-background/90 shadow-xs"
              key={`${templateColumns}-${column}-${currentCount}`}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SlashLayoutDialogProps {
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
  onSelectPreset: (templateColumns: string) => void;
  open: boolean;
}

export function SlashLayoutDialog({
  onCancel,
  onOpenChange,
  onSelectPreset,
  open,
}: SlashLayoutDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
          <DialogTitle>Choose columns layout</DialogTitle>
          <DialogDescription>
            Pick one of the official Lexical-style column presets.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,34rem)] overflow-y-auto px-4 pt-2 pb-4 sm:px-6 sm:pb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {LAYOUT_PRESETS.map((preset) => (
              <Button
                className="h-auto min-h-32 justify-start rounded-2xl border border-border/80 px-4 py-4 text-left hover:bg-muted/60"
                key={preset.value}
                onClick={() => onSelectPreset(preset.value)}
                type="button"
                variant="ghost"
              >
                <span className="flex w-full flex-col items-start gap-3">
                  <LayoutPresetPreview templateColumns={preset.value} />
                  <span className="flex flex-col items-start gap-1">
                    <span className="font-medium text-foreground text-sm">
                      {preset.label}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {preset.description}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      {preset.value}
                    </span>
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter
          className="mt-0 px-4 py-3 sm:px-6"
          showCloseButton={false}
        >
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSelectPreset(LAYOUT_PRESETS[0]?.value ?? "1fr 1fr")
            }
            type="button"
          >
            Use default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
