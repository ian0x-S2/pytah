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
import linkBehaviorConstantsSource from "@/components/editor/plugins/link-behavior/constants.ts?raw";
import floatingLinkEditorSource from "@/components/editor/plugins/link-behavior/floating-link-editor.tsx?raw";
import linkBehaviorPluginSource from "@/components/editor/plugins/link-behavior/plugin.tsx?raw";
import linkBehaviorUtilsSource from "@/components/editor/plugins/link-behavior/utils.ts?raw";

function LinkBehaviorFilesSection() {
  return (
    <>
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
    </>
  );
}

function LinkBehaviorConstantsSection() {
  return (
    <>
      <SectionHeading id="constants">constants.ts</SectionHeading>
      <Paragraph>
        Two <code>AutoLinkPlugin</code> matchers — one for URLs and one for
        email addresses. Plain <code>www.</code> URLs are normalised to{" "}
        <code>https://</code> automatically; email addresses get the{" "}
        <code>mailto:</code> scheme.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/link-behavior/constants.ts"
        language="ts"
      >
        {linkBehaviorConstantsSource}
      </CodeBlock>
    </>
  );
}

function LinkBehaviorUtilsSection() {
  return (
    <>
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
      <CodeBlock
        label="src/components/editor/plugins/link-behavior/utils.ts"
        language="ts"
      >
        {linkBehaviorUtilsSource}
      </CodeBlock>
    </>
  );
}

function LinkBehaviorPluginSection() {
  return (
    <>
      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <Paragraph>
        <code>LinkBehaviorPlugin</code> is a thin composition of three Lexical
        React plugins. Pass <code>editable={"{true}"}</code> when the editor is
        in edit mode to disable <code>ClickableLinkPlugin</code> (links should
        not navigate while editing).
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/link-behavior/plugin.tsx"
        language="tsx"
      >
        {linkBehaviorPluginSource}
      </CodeBlock>
    </>
  );
}

function FloatingLinkEditorSection() {
  return (
    <>
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
      <CodeBlock
        label="src/components/editor/plugins/link-behavior/floating-link-editor.tsx"
        language="tsx"
      >
        {floatingLinkEditorSource}
      </CodeBlock>
    </>
  );
}

function LinkBehaviorRegistrationSection() {
  return (
    <>
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

      <LinkBehaviorFilesSection />
      <LinkBehaviorConstantsSection />
      <LinkBehaviorUtilsSection />
      <LinkBehaviorPluginSection />
      <FloatingLinkEditorSection />
      <LinkBehaviorRegistrationSection />
    </>
  );
}
