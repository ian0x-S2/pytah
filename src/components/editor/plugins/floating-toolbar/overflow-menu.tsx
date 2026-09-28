"use client";

import {
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";
import type { LexicalEditor } from "lexical";
import {
  CheckIcon,
  EllipsisVerticalIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  SubscriptIcon,
  SuperscriptIcon,
} from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ToolbarTooltip } from "../../ui/toolbar-tooltip";
import { alignToolbarSelection } from "./actions";
import { TOOLBAR_ALIGN_ACTIONS } from "./constants";
import type { FloatingToolbarFormatState } from "./types";

const TOOLBAR_SUPER_SUB_ACTIONS = [
  {
    format: "superscript",
    icon: SuperscriptIcon,
    key: "isSuperscript",
    label: "Superscript",
  },
  {
    format: "subscript",
    icon: SubscriptIcon,
    key: "isSubscript",
    label: "Subscript",
  },
] as const;

interface FloatingToolbarOverflowMenuProps {
  editor: LexicalEditor;
  formats: FloatingToolbarFormatState;
  /** Keeps the floating toolbar alive while the menu is open. */
  onOpenChange?: (open: boolean) => void;
}

const MenuItemCheck = () => (
  <CheckIcon className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground" />
);

/**
 * Overflow menu ("⋮") of the floating toolbar: super/subscript, alignment and
 * indent controls grouped in a dropdown so the toolbar itself stays a single
 * row. Reuses the static toolbar's command wiring so both surfaces stay
 * consistent.
 */
export const FloatingToolbarOverflowMenu = memo(
  ({ editor, formats, onOpenChange }: FloatingToolbarOverflowMenuProps) => {
    const toggleSubSup = (format: "superscript" | "subscript") => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    };

    return (
      <DropdownMenu onOpenChange={onOpenChange}>
        <ToolbarTooltip label="More formatting options">
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="More formatting options"
                size="icon-sm"
                type="button"
                variant="ghost"
              />
            }
          >
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
        </ToolbarTooltip>

        <DropdownMenuContent className="w-44" sideOffset={6}>
          {TOOLBAR_SUPER_SUB_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isActive = formats[action.key];

            return (
              <DropdownMenuItem
                key={action.format}
                onClick={() => toggleSubSup(action.format)}
              >
                <Icon aria-hidden />
                <span>{action.label}</span>
                {isActive ? <MenuItemCheck /> : null}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />

          {TOOLBAR_ALIGN_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <DropdownMenuItem
                key={action.align}
                onClick={() => alignToolbarSelection(editor, action.align)}
              >
                <Icon aria-hidden />
                <span>{action.label}</span>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND)}
          >
            <IndentDecreaseIcon aria-hidden />
            <span>Outdent</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND)}
          >
            <IndentIncreaseIcon aria-hidden />
            <span>Indent</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

FloatingToolbarOverflowMenu.displayName = "FloatingToolbarOverflowMenu";
