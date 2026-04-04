import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";

export function LinkBehaviorGuidePage() {
  return (
    <>
      <PageHeader
        badge="Feature Guide"
        description="Feature guide for built-in link handling: auto-linking, URL validation, sanitization, and the floating link editor."
        title="Link Behavior"
      />

      <Callout title="Feature guide" variant="info">
        This page explains built-in link UX. Consumers who only need to change
        whether the link editor appears should start with the editor
        <code>features</code> API.
      </Callout>

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
        items={[
          "src/components/editor/plugins/link-behavior/",
          "  constants.ts              ← AUTO_LINK_MATCHERS",
          "  utils.ts                  ← URL normalize / validate / sanitize",
          "  plugin.tsx                ← LinkBehaviorPlugin composition",
          "  floating-link-editor.tsx  ← FloatingLinkEditorPlugin",
        ]}
      />

      <SectionHeading id="constants">constants.ts</SectionHeading>
      <Paragraph>
        Two <code>AutoLinkPlugin</code> matchers — one for URLs and one for
        email addresses. Plain <code>www.</code> URLs are normalised to{" "}
        <code>https://</code> automatically; email addresses get the{" "}
        <code>mailto:</code> scheme.
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/link-behavior/constants.ts">
        {`import { createLinkMatcherWithRegExp } from "@lexical/react/LexicalAutoLinkPlugin";

const URL_MATCHER_PATTERN = /((https?:\\/\\/|www\\.)[^\\s<]+[^<.,:;"')\\]\\s])/i;
const EMAIL_MATCHER_PATTERN = /(([\\.w.+-]+@[\\w-]+\\.[\\w.-]+))/i;

const normalizeMatchedUrl = (text: string): string => {
  return text.startsWith("http") ? text : \`https://\${text}\`;
};

const normalizeMatchedEmail = (text: string): string => {
  return \`mailto:\${text}\`;
};

export const AUTO_LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_MATCHER_PATTERN, normalizeMatchedUrl),
  createLinkMatcherWithRegExp(EMAIL_MATCHER_PATTERN, normalizeMatchedEmail),
];`}
      </CodeBlock>

      <SectionHeading id="utils">utils.ts</SectionHeading>
      <Paragraph>
        Three URL helpers used by the floating editor and{" "}
        <code>LinkPlugin</code>'s <code>validateUrl</code> prop.
      </Paragraph>
      <Table headers={["Export", "Purpose"]}>
        <TableRow>
          <TableCell>
            <code>LINK_PLACEHOLDER_URL</code>
          </TableCell>
          <TableCell>
            Sentinel value (<code>"https://"</code>) used as the default when
            creating a new link so the input is pre-filled.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>normalizeEditorLinkUrl(value)</code>
          </TableCell>
          <TableCell>
            Trims whitespace, adds <code>mailto:</code> for bare email
            addresses, adds <code>https://</code> for <code>www.</code> prefixed
            strings.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>isValidEditorLinkUrl(value)</code>
          </TableCell>
          <TableCell>
            Returns <code>true</code> for any URL whose protocol is one of{" "}
            <code>http:</code>, <code>https:</code>, <code>mailto:</code>,{" "}
            <code>sms:</code>, <code>tel:</code> — or the placeholder.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>sanitizeEditorLinkUrl(value)</code>
          </TableCell>
          <TableCell>
            Returns <code>about:blank</code> for disallowed protocols, otherwise
            returns the normalised URL.
          </TableCell>
        </TableRow>
      </Table>
      <CodeBlock language="src/components/editor/plugins/link-behavior/utils.ts">
        {`const ALLOWED_LINK_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "sms:",
  "tel:",
]);

export const LINK_PLACEHOLDER_URL = "https://";

export const normalizeEditorLinkUrl = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.includes("@") && !trimmedValue.includes("://")) {
    return \`mailto:\${trimmedValue}\`;
  }

  if (trimmedValue.startsWith("tel:")) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("www.")) {
    return \`https://\${trimmedValue}\`;
  }

  return trimmedValue;
};

export const isValidEditorLinkUrl = (value: string): boolean => {
  const normalizedValue = normalizeEditorLinkUrl(value);
  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === LINK_PLACEHOLDER_URL) {
    return true;
  }

  try {
    const url = new URL(normalizedValue);
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
};

export const sanitizeEditorLinkUrl = (value: string): string => {
  const normalizedValue = normalizeEditorLinkUrl(value);

  try {
    const url = new URL(normalizedValue);
    if (!ALLOWED_LINK_PROTOCOLS.has(url.protocol)) {
      return "about:blank";
    }
  } catch {
    return normalizedValue;
  }

  return normalizedValue;
};`}
      </CodeBlock>

      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <Paragraph>
        <code>LinkBehaviorPlugin</code> is a thin composition of three Lexical
        React plugins. Pass <code>editable={"{true}"}</code> when the editor is
        in edit mode to disable <code>ClickableLinkPlugin</code> (links should
        not navigate while editing).
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/link-behavior/plugin.tsx">
        {`import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AUTO_LINK_MATCHERS } from "./constants";
import { isValidEditorLinkUrl } from "./utils";

interface LinkBehaviorPluginProps {
  editable: boolean;
}

export function LinkBehaviorPlugin({ editable }: LinkBehaviorPluginProps) {
  return (
    <>
      <LinkPlugin validateUrl={isValidEditorLinkUrl} />
      <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
      <ClickableLinkPlugin disabled={editable} newTab />
    </>
  );
}`}
      </CodeBlock>

      <SectionHeading id="floating-link-editor">
        floating-link-editor.tsx
      </SectionHeading>
      <Paragraph>
        <code>FloatingLinkEditorPlugin</code> is a portal-based floating panel
        that appears below the selection whenever a link node is selected. It
        has two modes: a <strong>preview mode</strong> (URL + edit / delete /
        open-in-tab buttons) and an <strong>edit mode</strong> (URL input +
        confirm / cancel buttons).
      </Paragraph>
      <SubHeading>Commands handled</SubHeading>
      <Table headers={["Command", "Priority", "Behaviour"]}>
        <TableRow>
          <TableCell>
            <code>SELECTION_CHANGE_COMMAND</code>
          </TableCell>
          <TableCell>LOW</TableCell>
          <TableCell>
            Syncs link URL and panel position on every selection change.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>OPEN_FLOATING_LINK_EDITOR_COMMAND</code>
          </TableCell>
          <TableCell>HIGH</TableCell>
          <TableCell>
            Enters edit mode immediately (dispatched by the floating toolbar's
            link button).
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>KEY_DOWN_COMMAND</code>
          </TableCell>
          <TableCell>HIGH</TableCell>
          <TableCell>
            Cmd/Ctrl+K toggles the link: removes it if the selection is already
            a link, otherwise creates a new one and enters edit mode.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>KEY_ESCAPE_COMMAND</code>
          </TableCell>
          <TableCell>HIGH</TableCell>
          <TableCell>Dismisses the panel when a link is focused.</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>CLICK_COMMAND</code>
          </TableCell>
          <TableCell>LOW</TableCell>
          <TableCell>
            Cmd/Ctrl+click opens the link URL in a new tab while editing.
          </TableCell>
        </TableRow>
      </Table>
      <CodeBlock language="src/components/editor/plugins/link-behavior/floating-link-editor.tsx">
        {`import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  Edit3Icon,
  ExternalLinkIcon,
  Link2Icon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  clearToolbarLink,
  submitToolbarLink,
} from "../floating-toolbar/actions";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "../floating-toolbar/link-command";
import {
  getFloatingToolbarSelectedNode,
  getSelectedLinkNode,
  isSelectionWithinSingleLink,
} from "../floating-toolbar/selection";
import { LINK_PLACEHOLDER_URL, sanitizeEditorLinkUrl } from "./utils";

interface FloatingLinkEditorPosition {
  left: number;
  top: number;
}

const LINK_EDITOR_OFFSET = 12;
const EMPTY_POSITION: FloatingLinkEditorPosition = { left: 0, top: 0 };

const getLinkEditorPosition = (
  editor: ReturnType<typeof useLexicalComposerContext>[0]
): FloatingLinkEditorPosition | null => {
  const selection = $getSelection();
  const nativeSelection = window.getSelection();
  const rootElement = editor.getRootElement();

  if (!(selection && rootElement && editor.isEditable())) {
    return null;
  }

  let rectangle: DOMRect | null = null;

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    const element = node ? editor.getElementByKey(node.getKey()) : null;
    rectangle = element?.getBoundingClientRect() ?? null;
  } else if (
    nativeSelection &&
    rootElement.contains(nativeSelection.anchorNode)
  ) {
    rectangle =
      nativeSelection.focusNode?.parentElement?.getBoundingClientRect() ??
      nativeSelection.getRangeAt(0).getBoundingClientRect();
  }

  if (!rectangle) {
    return null;
  }

  return {
    left: rectangle.left,
    top: rectangle.bottom + LINK_EDITOR_OFFSET,
  };
};

const readSelectedLinkUrl = () => {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    if (!isSelectionWithinSingleLink(selection)) {
      return "";
    }

    return (
      getSelectedLinkNode(
        getFloatingToolbarSelectedNode(selection)
      )?.getURL() ?? ""
    );
  }

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    return node ? (getSelectedLinkNode(node)?.getURL() ?? "") : "";
  }

  return "";
};

const selectionContainsLink = () => {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    return isSelectionWithinSingleLink(selection);
  }

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    return Boolean(node && getSelectedLinkNode(node));
  }

  return false;
};

export function FloatingLinkEditorPlugin() {
  const [editor] = useLexicalComposerContext();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isLink, setIsLink] = useState(false);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [editedLinkUrl, setEditedLinkUrl] = useState(LINK_PLACEHOLDER_URL);
  const [position, setPosition] =
    useState<FloatingLinkEditorPosition>(EMPTY_POSITION);

  const updateLinkEditor = useCallback(() => {
    const nextIsLink = selectionContainsLink();
    const nextLinkUrl = nextIsLink ? readSelectedLinkUrl() : "";
    const nextPosition = getLinkEditorPosition(editor);

    setIsLink(nextIsLink);
    setLinkUrl(nextLinkUrl);

    if (!isLinkEditMode) {
      setEditedLinkUrl(nextLinkUrl || LINK_PLACEHOLDER_URL);
    }

    if (nextPosition) {
      setPosition(nextPosition);
      return;
    }

    setIsLinkEditMode(false);
  }, [editor, isLinkEditMode]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        OPEN_FLOATING_LINK_EDITOR_COMMAND,
        () => {
          setIsLinkEditMode(true);
          setEditedLinkUrl(readSelectedLinkUrl() || LINK_PLACEHOLDER_URL);
          updateLinkEditor();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const isModifierPressed = event.metaKey || event.ctrlKey;
          if (!(isModifierPressed && event.key.toLowerCase() === "k")) {
            return false;
          }

          event.preventDefault();

          if (selectionContainsLink()) {
            setIsLinkEditMode(false);
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            return true;
          }

          setIsLinkEditMode(true);
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (!isLink) {
            return false;
          }

          setIsLink(false);
          setIsLinkEditMode(false);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const node = getFloatingToolbarSelectedNode(selection);
          const linkNode = $findMatchingParent(node, $isLinkNode);
          if ($isLinkNode(linkNode) && (event.metaKey || event.ctrlKey)) {
            window.open(linkNode.getURL(), "_blank", "noopener,noreferrer");
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, isLink, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isLinkEditMode) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isLinkEditMode]);

  useEffect(() => {
    const handleWindowChange = () => {
      editor.getEditorState().read(() => {
        updateLinkEditor();
      });
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    const floatingElement = editorRef.current;
    if (!floatingElement) {
      return;
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (
        !floatingElement.contains(event.relatedTarget as Node | null) &&
        isLink
      ) {
        setIsLink(false);
        setIsLinkEditMode(false);
      }
    };

    floatingElement.addEventListener("focusout", handleFocusOut);
    return () => {
      floatingElement.removeEventListener("focusout", handleFocusOut);
    };
  }, [isLink]);

  if (!isLink) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-50"
      ref={editorRef}
      style={{
        left: \`\${position.left}px\`,
        top: \`\${position.top}px\`,
      }}
    >
      <div
        className={cn(
          "flex min-w-72 items-center gap-2 rounded-lg bg-popover p-2 shadow-md ring-1 ring-foreground/10",
          "fade-in-0 zoom-in-95 animate-in duration-100"
        )}
      >
        {isLinkEditMode ? (
          <>
            <Input
              className="h-8 min-w-56 text-xs"
              onChange={(event) => setEditedLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitToolbarLink(editor, editedLinkUrl);
                  setIsLinkEditMode(false);
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setIsLinkEditMode(false);
                }
              }}
              ref={inputRef}
              value={editedLinkUrl}
            />
            <Button
              onClick={() => {
                submitToolbarLink(editor, editedLinkUrl);
                setIsLinkEditMode(false);
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Link2Icon />
            </Button>
            <Button
              onClick={() => setIsLinkEditMode(false)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <XIcon />
            </Button>
          </>
        ) : (
          <>
            <a
              className="max-w-64 truncate text-primary text-xs underline underline-offset-4"
              href={sanitizeEditorLinkUrl(linkUrl)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {linkUrl}
            </a>
            <Separator className="mx-0.5 h-4" orientation="vertical" />
            <Button
              onClick={(event) => {
                event.preventDefault();
                setEditedLinkUrl(linkUrl || LINK_PLACEHOLDER_URL);
                setIsLinkEditMode(true);
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Edit3Icon />
            </Button>
            <Button
              onClick={() => {
                clearToolbarLink(editor);
                setIsLinkEditMode(false);
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Trash2Icon />
            </Button>
            <Button
              onClick={() => {
                window.open(
                  sanitizeEditorLinkUrl(linkUrl),
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <ExternalLinkIcon />
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}`}
      </CodeBlock>

      <SectionHeading id="registration">Registration</SectionHeading>
      <Paragraph>
        No custom nodes are required. Mount both plugins inside your composer:
      </Paragraph>
      <CodeBlock language="tsx">
        {`// ui/content.tsx — mount the plugins
import { LinkBehaviorPlugin } from "../plugins/link-behavior/plugin";
import { FloatingLinkEditorPlugin } from "../plugins/link-behavior/floating-link-editor";

<LinkBehaviorPlugin editable={isEditable} />
<FloatingLinkEditorPlugin />`}
      </CodeBlock>

      <Callout title="Keyboard shortcut" variant="tip">
        Cmd/Ctrl+K is handled entirely inside{" "}
        <code>FloatingLinkEditorPlugin</code>. Pressing it on plain text creates
        a link and opens the editor; pressing it again on an existing link
        removes it. No toolbar wiring is needed for the shortcut to work.
      </Callout>
    </>
  );
}
