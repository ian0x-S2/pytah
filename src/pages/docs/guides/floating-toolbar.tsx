import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";

export function FloatingToolbarGuidePage() {
  return (
    <>
      <PageHeader
        badge="Feature Guide"
        description="Feature guide for the selection-anchored floating toolbar: state, positioning, formatting actions, and plugin wiring."
        title="Floating Toolbar"
      />

      <Callout title="Feature guide" variant="info">
        This page describes a built-in product capability. Use the
        <code>features</code> prop on <code>Editor</code> if you only need to
        enable or disable it from a consumer integration.
      </Callout>

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
        items={[
          "src/components/editor/plugins/floating-toolbar/",
          "  types.ts          ← FloatingToolbarState + sub-types",
          "  constants.ts      ← default/empty state values",
          "  selection.ts      ← read selection, compute position + formats",
          "  actions.ts        ← format toggle, link submit/clear, color apply",
          "  link-command.ts   ← OPEN_FLOATING_LINK_EDITOR_COMMAND",
          "  plugin.tsx        ← FloatingToolbarPlugin (portal + event wiring)",
        ]}
      />

      <SectionHeading id="types">types.ts</SectionHeading>
      <CodeBlock
        label="src/components/editor/plugins/floating-toolbar/types.ts"
        language="ts"
      >
        {`export interface FloatingToolbarFormatState {
  /** Current background-color CSS value of the selection, or "" if none/mixed. */
  bgColor: string;
  isBold: boolean;
  isCode: boolean;
  isHighlight: boolean;
  isItalic: boolean;
  isLink: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
  /** Current color CSS value of the selection, or "" if none/mixed. */
  textColor: string;
}

export interface FloatingToolbarPosition {
  left: number;
  top: number;
}

export interface FloatingToolbarState {
  formats: FloatingToolbarFormatState;
  isVisible: boolean;
  linkUrl: string;
  position: FloatingToolbarPosition;
}`}
      </CodeBlock>

      <SectionHeading id="constants">constants.ts</SectionHeading>
      <CodeBlock
        label="src/components/editor/plugins/floating-toolbar/constants.ts"
        language="ts"
      >
        {`import type { FloatingToolbarFormatState, FloatingToolbarPosition } from "./types";

export const EMPTY_TOOLBAR_POSITION: FloatingToolbarPosition = { left: 0, top: 0 };

export const DEFAULT_FORMAT_STATE: FloatingToolbarFormatState = {
  isBold: false, isCode: false, isHighlight: false,
  isItalic: false, isLink: false, isStrikethrough: false,
  isUnderline: false, bgColor: "", textColor: "",
};`}
      </CodeBlock>

      <SectionHeading id="link-command">link-command.ts</SectionHeading>
      <Paragraph>
        A dedicated Lexical command that tells{" "}
        <code>FloatingLinkEditorPlugin</code> to open in edit mode. Kept in a
        separate file so the floating toolbar and link editor can import it
        without a circular dependency.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/floating-toolbar/link-command.ts"
        language="ts"
      >
        {`import { createCommand } from "lexical";

export const OPEN_FLOATING_LINK_EDITOR_COMMAND = createCommand(
  "OPEN_FLOATING_LINK_EDITOR_COMMAND"
);`}
      </CodeBlock>

      <SectionHeading id="selection">selection.ts</SectionHeading>
      <Paragraph>
        Pure read-only helpers that compute the toolbar's state from the current
        Lexical selection. Called inside{" "}
        <code>editor.getEditorState().read()</code>.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/floating-toolbar/selection.ts"
        language="ts"
      >
        {`import { $isCodeNode } from "@lexical/code";
import { $isAutoLinkNode, $isLinkNode } from "@lexical/link";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";
import {
  $getSelection, $isLineBreakNode, $isRangeSelection,
  type LexicalNode, type RangeSelection,
} from "lexical";
import { DEFAULT_FORMAT_STATE, EMPTY_TOOLBAR_POSITION } from "./constants";
import type { FloatingToolbarFormatState, FloatingToolbarPosition, FloatingToolbarState } from "./types";

export const getFloatingToolbarSelectedNode = (selection: RangeSelection) => {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) return anchorNode;
  return selection.isBackward() ? anchorNode : focusNode;
};

export const getSelectedLinkNode = (node: LexicalNode) => {
  const parent = node.getParent();
  if ($isLinkNode(parent) || $isAutoLinkNode(parent)) return parent;
  if ($isLinkNode(node) || $isAutoLinkNode(node)) return node;
  return null;
};

export const isSelectionWithinSingleLink = (selection: RangeSelection) => {
  const focusNode = getFloatingToolbarSelectedNode(selection);
  const focusLinkNode = getSelectedLinkNode(focusNode);
  if (!focusLinkNode) return false;
  const invalidNode = selection
    .getNodes()
    .filter((node) => !$isLineBreakNode(node))
    .find((node) => {
      const linkNode = getSelectedLinkNode(node);
      if (focusLinkNode && !focusLinkNode.is(linkNode)) return true;
      return $isAutoLinkNode(linkNode) && linkNode.getIsUnlinked();
    });
  return invalidNode === undefined;
};

const getToolbarPosition = (): FloatingToolbarPosition | null => {
  const nativeSelection = window.getSelection();
  if (!(nativeSelection && nativeSelection.rangeCount > 0)) return null;
  const range = nativeSelection.getRangeAt(0);
  const rectangle = range.getBoundingClientRect();
  if (rectangle.width === 0 && rectangle.height === 0) return null;
  return { left: rectangle.left + rectangle.width / 2, top: rectangle.top - 10 };
};

const getFormatState = (
  selection: RangeSelection,
  node: LexicalNode
): FloatingToolbarFormatState => {
  const linkNode = getSelectedLinkNode(node);
  return {
    isBold: selection.hasFormat("bold"),
    isCode: selection.hasFormat("code"),
    isHighlight: selection.hasFormat("highlight"),
    isItalic: selection.hasFormat("italic"),
    isLink: linkNode !== null,
    isStrikethrough: selection.hasFormat("strikethrough"),
    isUnderline: selection.hasFormat("underline"),
    bgColor: $getSelectionStyleValueForProperty(selection, "background-color", ""),
    textColor: $getSelectionStyleValueForProperty(selection, "color", ""),
  };
};

export const readFloatingToolbarState = (): FloatingToolbarState => {
  const selection = $getSelection();
  if (!($isRangeSelection(selection) && !selection.isCollapsed())) {
    return { formats: DEFAULT_FORMAT_STATE, isVisible: false, linkUrl: "", position: EMPTY_TOOLBAR_POSITION };
  }

  const node = getFloatingToolbarSelectedNode(selection);
  const parent = node.getParent();
  const isInsideCodeBlock = $isCodeNode(node) || (parent && $isCodeNode(parent));

  if (isInsideCodeBlock) {
    return { formats: DEFAULT_FORMAT_STATE, isVisible: false, linkUrl: "", position: EMPTY_TOOLBAR_POSITION };
  }

  const position = getToolbarPosition();
  if (!position) {
    return { formats: DEFAULT_FORMAT_STATE, isVisible: false, linkUrl: "", position: EMPTY_TOOLBAR_POSITION };
  }

  const linkNode = isSelectionWithinSingleLink(selection) ? getSelectedLinkNode(node) : null;
  return {
    formats: getFormatState(selection, node),
    isVisible: true,
    linkUrl: linkNode?.getURL() ?? "",
    position,
  };
};`}
      </CodeBlock>

      <SectionHeading id="actions">actions.ts</SectionHeading>
      <Paragraph>
        Imperative helpers that dispatch Lexical commands or call{" "}
        <code>editor.update()</code>. Imported by the plugin and by the floating
        link editor.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/floating-toolbar/actions.ts"
        language="ts"
      >
        {`import { $createLinkNode, $isAutoLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $patchStyleText } from "@lexical/selection";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, type LexicalEditor } from "lexical";
import { isValidEditorLinkUrl, normalizeEditorLinkUrl } from "../link-behavior/utils";
import { getFloatingToolbarSelectedNode, getSelectedLinkNode } from "./selection";

export const submitToolbarLink = (editor: LexicalEditor, linkUrl: string): string => {
  const normalizedLinkUrl = normalizeEditorLinkUrl(linkUrl);
  if (isValidEditorLinkUrl(normalizedLinkUrl)) {
    editor.update(() => {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedLinkUrl);
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const selectedNode = getFloatingToolbarSelectedNode(selection);
      const linkNode = getSelectedLinkNode(selectedNode);
      if (!$isAutoLinkNode(linkNode)) return;
      const replacementLinkNode = $createLinkNode(linkNode.getURL(), {
        rel: linkNode.__rel, target: linkNode.__target, title: linkNode.__title,
      });
      linkNode.replace(replacementLinkNode, true);
    });
  } else {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }
  return "";
};

export const clearToolbarLink = (editor: LexicalEditor) => {
  editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
};

export const toggleToolbarFormat = (
  editor: LexicalEditor,
  format: "bold" | "italic" | "underline" | "strikethrough" | "code" | "highlight"
) => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
};

/** Applies an inline \`color\` CSS property to the selection. Empty string removes it. */
export const applyTextColor = (editor: LexicalEditor, color: string) => {
  editor.update(() => {
    const selection = $getSelection();
    if (selection !== null) $patchStyleText(selection, { color: color || null });
  });
};

/** Applies an inline \`background-color\` CSS property to the selection. */
export const applyBgColor = (editor: LexicalEditor, color: string) => {
  editor.update(() => {
    const selection = $getSelection();
    if (selection !== null) $patchStyleText(selection, { "background-color": color || null });
  });
};`}
      </CodeBlock>

      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <Paragraph>
        The plugin subscribes to <code>SELECTION_CHANGE_COMMAND</code> and the
        update listener, then renders the toolbar as a fixed portal over the
        selection. A <code>isColorPickerOpenRef</code> prevents the toolbar from
        disappearing while a color popover is open.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/floating-toolbar/plugin.tsx"
        language="tsx"
      >
        {`import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from "lexical";
import {
  BaselineIcon, BoldIcon, CodeIcon, HighlighterIcon,
  ItalicIcon, LinkIcon, PaintBucketIcon, StrikethroughIcon, UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { ColorSwatches } from "../../ui/color-swatches";
import { LINK_PLACEHOLDER_URL } from "../link-behavior/utils";
import { applyBgColor, applyTextColor, toggleToolbarFormat } from "./actions";
import { DEFAULT_FORMAT_STATE, EMPTY_TOOLBAR_POSITION } from "./constants";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "./link-command";
import { readFloatingToolbarState } from "./selection";
import type { FloatingToolbarFormatState, FloatingToolbarPosition } from "./types";

const TOOLBAR_FORMAT_ACTIONS = [
  { format: "bold",          icon: BoldIcon,          key: "isBold"          },
  { format: "italic",        icon: ItalicIcon,        key: "isItalic"        },
  { format: "underline",     icon: UnderlineIcon,     key: "isUnderline"     },
  { format: "strikethrough", icon: StrikethroughIcon, key: "isStrikethrough" },
  { format: "highlight",     icon: HighlighterIcon,   key: "isHighlight"     },
  { format: "code",          icon: CodeIcon,          key: "isCode"          },
] as const;

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<FloatingToolbarPosition>(EMPTY_TOOLBAR_POSITION);
  const [formats, setFormats] = useState<FloatingToolbarFormatState>(DEFAULT_FORMAT_STATE);
  // Prevent hide/reposition while a color picker popover is open
  const isColorPickerOpenRef = useRef(false);

  const updateToolbar = useCallback(() => {
    const toolbarState = readFloatingToolbarState();
    setFormats(toolbarState.formats);
    if (!isColorPickerOpenRef.current) {
      setIsVisible(toolbarState.isVisible);
      setPosition(toolbarState.position);
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => { updateToolbar(); return false; }, COMMAND_PRIORITY_LOW),
      editor.registerUpdateListener(({ editorState }) => { editorState.read(() => { updateToolbar(); }); })
    );
  }, [editor, updateToolbar]);

  const handleLinkToggle = useCallback(() => {
    if (formats.isLink) { editor.dispatchCommand(TOGGLE_LINK_COMMAND, null); return; }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
    editor.dispatchCommand(OPEN_FLOATING_LINK_EDITOR_COMMAND, undefined);
  }, [editor, formats.isLink]);

  const handleColorPickerOpenChange = useCallback((open: boolean) => {
    isColorPickerOpenRef.current = open;
  }, []);

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed z-50"
      ref={toolbarRef}
      style={{ left: \`\${position.left}px\`, top: \`\${position.top}px\`, transform: "translate(-50%, -100%)" }}
    >
      <div
        aria-label="Formatting options"
        className={cn(
          "flex items-center gap-0.5 rounded-xl bg-popover p-1.5 shadow-lg ring-1 ring-border",
          "fade-in-0 zoom-in-95 animate-in duration-100"
        )}
        role="toolbar"
      >
        {TOOLBAR_FORMAT_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Toggle
              key={action.format}
              onPressedChange={() => toggleToolbarFormat(editor, action.format)}
              pressed={formats[action.key]}
              size="sm"
            >
              <Icon />
            </Toggle>
          );
        })}

        <Separator className="mx-0.5 h-5" orientation="vertical" />

        <ColorSwatches
          activeColor={formats.textColor}
          icon={BaselineIcon}
          label="Text color"
          onColorChange={(color) => applyTextColor(editor, color)}
          onOpenChange={handleColorPickerOpenChange}
        />

        <ColorSwatches
          activeColor={formats.bgColor}
          icon={PaintBucketIcon}
          label="Background color"
          onColorChange={(color) => applyBgColor(editor, color)}
          onOpenChange={handleColorPickerOpenChange}
        />

        <Separator className="mx-0.5 h-5" orientation="vertical" />

        <Toggle onPressedChange={handleLinkToggle} pressed={formats.isLink} size="sm">
          <LinkIcon />
        </Toggle>
      </div>
    </div>,
    document.body
  );
}`}
      </CodeBlock>

      <SubHeading>How to mount it</SubHeading>
      <CodeBlock language="tsx">
        {`// ui/content.tsx
import { FloatingToolbarPlugin } from "../plugins/floating-toolbar/plugin";
<FloatingToolbarPlugin />`}
      </CodeBlock>

      <Callout title="Color picker stability" variant="tip">
        The plugin uses a <code>ref</code> (not state) to track whether a color
        picker is open. This avoids re-registering the{" "}
        <code>SELECTION_CHANGE_COMMAND</code> listener on every open/close cycle
        while still preventing the toolbar from being hidden while the user
        browses swatches.
      </Callout>
    </>
  );
}
