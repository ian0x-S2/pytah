"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import { renderToString } from "katex";

import "katex/dist/katex.min.css";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isParagraphNode,
  $isRootNode,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from "lexical";
import type { NodeKey } from "lexical";
import { CheckIcon, Trash2Icon } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { $isMathNode } from "../../core/nodes/math/node";

interface MathComponentProps {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
}

const KATEX_MAX_SIZE = 20;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderEquationHtml = (source: string, displayMode: boolean): string => {
  const value = source || "\\text{math}";
  try {
    return renderToString(value, {
      displayMode,
      errorColor: "var(--destructive, #cc0000)",
      maxSize: KATEX_MAX_SIZE,
      throwOnError: false,
    });
  } catch {
    return `<span class="text-destructive">${escapeHtml(source || "math")}</span>`;
  }
};

interface MathEditorPopoverBodyProps {
  draftEquation: string;
  draftInline: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onDraftEquationChange: (value: string) => void;
  onDraftInlineChange: (value: boolean) => void;
  onSave: () => void;
  previewHtml: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

function MathEditorPopoverBody({
  draftEquation,
  draftInline,
  onCancel,
  onDelete,
  onDraftEquationChange,
  onDraftInlineChange,
  onSave,
  previewHtml,
  textareaRef,
}: MathEditorPopoverBodyProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Edit TeX equation</span>
        <div className="editor-math-segment flex items-center gap-1">
          <button
            aria-pressed={draftInline}
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              draftInline
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onDraftInlineChange(true)}
            type="button"
          >
            Inline
          </button>
          <button
            aria-pressed={!draftInline}
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              draftInline
                ? "text-muted-foreground hover:text-foreground"
                : "bg-background text-foreground shadow-xs"
            )}
            onClick={() => onDraftInlineChange(false)}
            type="button"
          >
            Block
          </button>
        </div>
      </div>

      <textarea
        aria-label="TeX equation"
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        onChange={(event) => onDraftEquationChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onSave();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        placeholder="e.g. f(x) = x^2"
        ref={textareaRef}
        rows={2}
        value={draftEquation}
      />

      <div className="editor-math-preview">
        <ScrollArea>
          <div className="flex items-center justify-center">
            <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </ScrollArea>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={onDelete}
          type="button"
        >
          <Trash2Icon aria-hidden className="size-3.5" />
          Remove
        </button>

        <div className="flex items-center gap-1.5">
          <button
            className="rounded px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={onSave}
            type="button"
          >
            <CheckIcon aria-hidden className="size-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function MathComponent({
  equation,
  inline,
  nodeKey,
}: MathComponentProps) {
  const [editor] = useLexicalComposerContext();
  const editable = useLexicalEditable();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isEditing, setIsEditing] = useState(false);
  const [draftEquation, setDraftEquation] = useState(equation);
  const [draftInline, setDraftInline] = useState(inline);
  const mathRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const openEditor = () => {
    setDraftEquation(equation);
    setDraftInline(inline);
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isEditing]);

  const html = renderEquationHtml(equation, !inline);
  const previewHtml = renderEquationHtml(draftEquation, !draftInline);

  useEffect(() => {
    if (!editable) {
      return;
    }

    const removeNode = (event: KeyboardEvent) => {
      const selection = $getSelection();
      if (!(isSelected && $isNodeSelection(selection))) {
        return false;
      }

      event.preventDefault();
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isMathNode(node)) {
          node.remove();
        }
      });
      return true;
    };

    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          if (mathRef.current?.contains(event.target as Node)) {
            if (event.shiftKey) {
              setSelected(!isSelected);
            } else {
              clearSelection();
              setSelected(true);
            }
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        removeNode,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        removeNode,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [clearSelection, editable, editor, isSelected, nodeKey, setSelected]);

  const handleSave = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!$isMathNode(node)) {
        return;
      }

      const wasInline = node.getInline();
      node.setEquation(draftEquation);

      if (wasInline === draftInline) {
        return;
      }

      node.setInline(draftInline);
      const parent = node.getParent();

      if (draftInline) {
        if (!(parent && $isParagraphNode(parent))) {
          const paragraph = $createParagraphNode();
          node.replace(paragraph);
          paragraph.append(node);
        }
      } else if (parent && $isParagraphNode(parent)) {
        const grandParent = parent.getParent();
        if (
          grandParent &&
          $isRootNode(grandParent) &&
          parent.getChildrenSize() === 1
        ) {
          parent.replace(node);
        } else {
          node.remove();
          $insertNodeToNearestRoot(node);
        }
        if (!node.getNextSibling()) {
          node.insertAfter($createParagraphNode());
        }
      }
    });
    setIsEditing(false);

    clearSelection();
    setSelected(true);
    requestAnimationFrame(() => {
      editor.getRootElement()?.focus({ preventScroll: true });
    });
  };

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMathNode(node)) {
        node.remove();
      }
    });
    setIsEditing(false);
    requestAnimationFrame(() => {
      editor.getRootElement()?.focus({ preventScroll: true });
    });
  };

  if (!editable) {
    return (
      <span
        className={cn(
          "relative inline-block align-middle",
          !inline && "editor-math-block"
        )}
        ref={mathRef}
      >
        <span
          className="editor-math-trigger inline-block"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-block align-middle",
        !inline && "editor-math-block"
      )}
      ref={mathRef}
    >
      <Popover
        onOpenChange={(open) => {
          if (open) {
            openEditor();
          } else {
            closeEditor();
          }
        }}
        open={isEditing}
      >
        <PopoverTrigger
          render={
            <button
              aria-label={
                equation ? `Edit equation: ${equation}` : "Edit TeX equation"
              }
              className={cn(
                "editor-math-trigger appearance-none border-0 bg-transparent p-0 text-inherit transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                isSelected && "editor-math-trigger-selected",
                "cursor-pointer hover:bg-muted/40"
              )}
              dangerouslySetInnerHTML={{ __html: html }}
              ref={triggerRef}
              title="Edit TeX equation"
              type="button"
            />
          }
        />

        <PopoverContent
          align="center"
          className="editor-floating w-72 p-3"
          initialFocus={false}
          side="bottom"
          sideOffset={4}
        >
          <MathEditorPopoverBody
            draftEquation={draftEquation}
            draftInline={draftInline}
            onCancel={closeEditor}
            onDelete={handleDelete}
            onDraftEquationChange={setDraftEquation}
            onDraftInlineChange={setDraftInline}
            onSave={handleSave}
            previewHtml={previewHtml}
            textareaRef={textareaRef}
          />
        </PopoverContent>
      </Popover>
    </span>
  );
}
