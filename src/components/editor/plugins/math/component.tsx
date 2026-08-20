"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import katex from "katex";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type NodeKey,
} from "lexical";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { $isMathNode } from "../../core/nodes/math/node";

interface MathComponentProps {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
}

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

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
  const mathRef = useRef<HTMLSpanElement | HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const openEditor = () => {
    setDraftEquation(equation);
    setDraftInline(inline);
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const html = useMemo(() => {
    try {
      return katex.renderToString(equation || "\\text{math}", {
        displayMode: !inline,
        errorColor: "#cc0000",
        throwOnError: false,
      });
    } catch (_err) {
      return `<span class="text-destructive">${escapeHtml(equation || "math")}</span>`;
    }
  }, [equation, inline]);

  const previewHtml = useMemo(() => {
    try {
      return katex.renderToString(draftEquation || "\\text{math}", {
        displayMode: !draftInline,
        errorColor: "#cc0000",
        throwOnError: false,
      });
    } catch (_err) {
      return `<span class="text-destructive">${escapeHtml(draftEquation || "math")}</span>`;
    }
  }, [draftEquation, draftInline]);

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
      if ($isMathNode(node)) {
        node.setEquation(draftEquation);
        node.setInline(draftInline);
      }
    });
    setIsEditing(false);

    // Re-select the edited math node so that, when the popover closes and the
    // ContentEditable regains focus, the browser keeps scroll anchored on the
    // node the user was editing instead of jumping back to the collapsed caret
    // elsewhere in the document.
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
  };

  return (
    <span
      className={cn(
        "relative inline-block align-middle",
        !inline && "my-2 block text-center"
      )}
      ref={mathRef}
    >
      <Popover
        onOpenChange={(open) => {
          if (editable) {
            if (open) {
              openEditor();
            } else {
              setIsEditing(false);
            }
          }
        }}
        open={isEditing && editable}
      >
        <PopoverTrigger
          render={
            // biome-ignore lint/a11y/useSemanticElements: span is used as container for inline rendered equation button
            <span
              aria-label="Math formula"
              className={cn(
                "rounded px-1.5 py-0.5 transition-all duration-150",
                isSelected && editable && "bg-muted/30 ring-2 ring-primary/40",
                editable && "cursor-pointer hover:bg-muted/40"
              )}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output HTML is sanitized equation output
              dangerouslySetInnerHTML={{ __html: html }}
              onClick={() => {
                if (editable) {
                  openEditor();
                }
              }}
              onKeyDown={(e) => {
                if (editable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  openEditor();
                }
              }}
              role="button"
              tabIndex={editable ? 0 : -1}
            />
          }
        />

        {editable ? (
          <PopoverContent
            align="center"
            className="w-72 p-3"
            finalFocus={false}
            initialFocus={false}
            side="bottom"
            sideOffset={4}
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between font-medium text-muted-foreground text-xs">
                <span>Edit TeX Equation</span>
                <div className="flex items-center gap-1 rounded-md bg-muted/50 p-0.5">
                  <button
                    className={cn(
                      "rounded px-2 py-0.5 font-medium text-[11px] transition-colors",
                      draftInline
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setDraftInline(true)}
                    type="button"
                  >
                    Inline
                  </button>
                  <button
                    className={cn(
                      "rounded px-2 py-0.5 font-medium text-[11px] transition-colors",
                      draftInline
                        ? "text-muted-foreground hover:text-foreground"
                        : "bg-background text-foreground shadow-xs"
                    )}
                    onClick={() => setDraftInline(false)}
                    type="button"
                  >
                    Block
                  </button>
                </div>
              </div>

              <textarea
                aria-label="TeX equation"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(e) => setDraftEquation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSave();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setIsEditing(false);
                  }
                }}
                placeholder="e.g. f(x) = x^2"
                ref={textareaRef}
                rows={2}
                value={draftEquation}
              />

              <div className="flex min-h-9 items-center justify-center overflow-x-auto rounded-md border border-border/40 bg-muted/20 p-2">
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output HTML is sanitized equation preview */}
                <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-destructive text-xs transition-colors hover:bg-destructive/10 hover:text-destructive/80"
                  onClick={handleDelete}
                  type="button"
                >
                  <Trash2Icon className="size-3.5" />
                  Remove
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    className="rounded px-2.5 py-1 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setIsEditing(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 font-medium text-primary-foreground text-xs shadow-xs transition-colors hover:bg-primary/90"
                    onClick={handleSave}
                    type="button"
                  >
                    <CheckIcon className="size-3.5" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </PopoverContent>
        ) : null}
      </Popover>
    </span>
  );
}
