import {
  Callout,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";

export function PluginsPage() {
  return (
    <>
      <PageHeader
        description="The editor's feature set is built as composable Lexical plugins."
        title="Plugins"
      />

      <SectionHeading id="overview">Overview</SectionHeading>
      <Paragraph>
        Every editor feature is implemented as a Lexical plugin -- a React
        component rendered inside the <code>LexicalComposer</code> context.
        Plugins are either <strong>visual</strong> (render UI like toolbars and
        menus) or <strong>headless</strong> (register commands and transforms,
        return <code>null</code>).
      </Paragraph>

      <SectionHeading id="visual-plugins">Visual Plugins</SectionHeading>
      <Table headers={["Plugin", "Description", "UI Components Used"]}>
        <TableRow>
          <TableCell>
            <strong>block-type-toolbar</strong>
          </TableCell>
          <TableCell>
            Block type dropdown (paragraph, headings, lists, code, quote) with
            undo/redo and alignment controls
          </TableCell>
          <TableCell>Button, Popover, Separator</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>floating-toolbar</strong>
          </TableCell>
          <TableCell>
            Appears on text selection with format toggles (bold, italic,
            underline, strikethrough, code, highlight, link)
          </TableCell>
          <TableCell>Toggle, Separator</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>slash-command</strong>
          </TableCell>
          <TableCell>
            Slash menu (type /) for inserting blocks, images, tables, YouTube
            embeds, column layouts, and collapsible sections
          </TableCell>
          <TableCell>Command, Dialog, Button, Input, Textarea</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>link-behavior</strong>
          </TableCell>
          <TableCell>
            Auto-link detection, clickable links, and a floating link editor for
            viewing/editing URLs
          </TableCell>
          <TableCell>Button, Input</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>table-behavior</strong>
          </TableCell>
          <TableCell>
            Context menu on table cells with insert/delete row/column/table
            actions
          </TableCell>
          <TableCell>Button, Popover, Separator</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>draggable-block</strong>
          </TableCell>
          <TableCell>
            Drag handle that appears on hover to reorder blocks via
            drag-and-drop
          </TableCell>
          <TableCell>None (DOM-level handles)</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>image</strong>
          </TableCell>
          <TableCell>
            Image rendering with selection ring, alignment support, and resize
            handles
          </TableCell>
          <TableCell>None (custom DOM)</TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="headless-plugins">Headless Plugins</SectionHeading>
      <Table headers={["Plugin", "Description"]}>
        <TableRow>
          <TableCell>
            <strong>core/editable</strong>
          </TableCell>
          <TableCell>
            Syncs the editable prop to the Lexical editor instance
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>core/editor-state</strong>
          </TableCell>
          <TableCell>
            Fires onChange callbacks and handles initial content loading (HTML
            or Markdown)
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>core/focus-on-mount</strong>
          </TableCell>
          <TableCell>Focuses the editor on first mount</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>core/horizontal-rule</strong>
          </TableCell>
          <TableCell>
            Horizontal rule insertion, click selection, and keyboard navigation
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>core/seed-content</strong>
          </TableCell>
          <TableCell>
            Seeds default Markdown content when the editor starts empty
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>collapsible</strong>
          </TableCell>
          <TableCell>
            Collapsible block node transforms and keyboard shortcuts
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>layout</strong>
          </TableCell>
          <TableCell>Column layout insert command registration</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>youtube</strong>
          </TableCell>
          <TableCell>YouTube embed insert command and URL parsing</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>markdown</strong>
          </TableCell>
          <TableCell>
            Custom Markdown transformers for images, YouTube embeds, and tables
          </TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="adding-plugins">
        Adding a Custom Plugin
      </SectionHeading>
      <Paragraph>
        To add a new plugin, create a directory under{" "}
        <code>plugins/your-feature/</code> with at minimum a{" "}
        <code>plugin.tsx</code> file:
      </Paragraph>

      <SubHeading>1. Create the plugin component</SubHeading>
      <Paragraph>
        Your plugin component receives no props -- it accesses the editor
        through <code>useLexicalComposerContext()</code>. Register commands,
        listeners, or transforms in a <code>useEffect</code>.
      </Paragraph>

      <SubHeading>2. Register it in content.tsx</SubHeading>
      <Paragraph>
        Import your plugin and add it inside the Lexical composer context in{" "}
        <code>ui/content.tsx</code>. That's where all plugins are orchestrated.
      </Paragraph>

      <SubHeading>3. Add custom nodes if needed</SubHeading>
      <Paragraph>
        If your feature needs custom Lexical nodes, define them under{" "}
        <code>core/nodes/your-feature/</code> and register them in{" "}
        <code>core/config.ts</code>.
      </Paragraph>

      <Callout variant="tip">
        Keep support files (<code>types.ts</code>, <code>commands.ts</code>,{" "}
        <code>utils.ts</code>) in the same plugin directory so each feature is
        self-contained and easy to remove.
      </Callout>
    </>
  );
}
