import {
  Callout,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";

export function ArchitecturePage() {
  return (
    <>
      <PageHeader
        badge="Core Doc"
        description="How the editor is organized and the design principles behind it."
        title="Architecture"
      />

      <SectionHeading id="overview">Overview</SectionHeading>
      <Paragraph>
        The editor is a self-contained module inside{" "}
        <code>src/components/editor/</code>. It composes a Lexical editor
        instance with a set of plugins and a themed UI layer. The architecture
        follows three rules:
      </Paragraph>
      <Paragraph>
        <strong>1. Separation of concerns</strong> -- Lexical node definitions,
        React composition, and plugin behavior live in separate directories.
      </Paragraph>
      <Paragraph>
        <strong>2. Feature-first organization</strong> -- Complex features get
        their own directory under <code>plugins/</code> and{" "}
        <code>core/nodes/</code>, aligned by name.
      </Paragraph>
      <Paragraph>
        <strong>3. ShadCN-first styling</strong> -- All visual decisions go
        through ShadCN design tokens. No hardcoded colors.
      </Paragraph>
      <Paragraph>
        <strong>4. Lego-like composition</strong> -- The default editor remains
        opinionated, but consumers can opt out of chrome, replace surfaces, add
        plugin mounts, and register extra nodes through the public API.
      </Paragraph>

      <Callout title="New to the repo?" variant="tip">
        Start with <code>/docs/overview</code> for project context and{" "}
        <code>/docs/contributing</code> for the day-to-day contributor workflow.
        This page explains the internal layers once you already know which path
        you are on.
      </Callout>

      <SectionHeading id="directory-structure">
        Directory Structure
      </SectionHeading>
      <FileTree
        items={[
          "src/components/editor/",
          "├── editor.tsx              # Composition root",
          "├── core/                   # Foundation layer",
          "│   ├── actions.ts          # Editor commands (copy, reset, load)",
          "│   ├── composition.ts      # Feature/chrome defaults + slot helpers",
          "│   ├── config.ts           # Lexical initial config + node registration",
          "│   ├── constants.ts        # Shared constants",
          "│   ├── theme.ts            # Lexical EditorThemeClasses (Tailwind)",
          "│   ├── types.ts            # Shared TypeScript types",
          "│   ├── utils.ts            # HTML/Markdown serialization helpers",
          "│   └── nodes/              # Custom Lexical node definitions",
          "│       ├── collapsible/    # CollapsibleContainer + CollapsibleContent + CollapsibleTitle",
          "│       ├── image/          # ImageNode (decorator)",
          "│       ├── layout/         # LayoutContainer + LayoutItem",
          "│       └── youtube/        # YouTubeNode (decorator)",
          "├── plugins/                # Behavior layer",
          "│   ├── block-type-toolbar/ # Block type dropdown + undo/redo/alignment + keyboard nav",
          "│   ├── collapsible/        # Collapsible block transforms + keyboard nav",
          "│   ├── core/               # Essential plugins (editable sync, state, focus)",
          "│   ├── draggable-block/    # Drag handle for block reordering",
          "│   ├── floating-toolbar/   # Floating format toolbar on selection",
          "│   ├── image/              # Image insert/paste/drop + resize",
          "│   ├── layout/             # Column layout commands",
          "│   ├── link-behavior/      # Link auto-detection + floating editor",
          "│   ├── markdown/           # Custom Markdown transformers",
          "│   ├── slash-command/      # Slash menu + insert dialogs",
          "│   ├── table-behavior/     # Table context menu + row/column ops",
          "│   └── youtube/            # YouTube embed commands",
          "└── ui/                     # React composition layer",
          "    ├── chrome.tsx          # Shell, header, footer",
          "    ├── content.tsx         # ContentEditable + plugin orchestration",
          "    └── panels.tsx          # Action bar + output panels",
        ]}
      />

      <SectionHeading id="where-to-change">
        Where to Change Things
      </SectionHeading>
      <Paragraph>
        When you are editing the core, start in the layer that owns the concern
        instead of reaching for <code>ui/content.tsx</code> first.
      </Paragraph>
      <Table headers={["Need", "Start in", "Why"]}>
        <TableRow>
          <TableCell>Change a public prop or extension point</TableCell>
          <TableCell>
            <code>editor.tsx</code> and <code>core/types.ts</code>
          </TableCell>
          <TableCell>
            Public contracts live where the ready-made editor and composition
            API meet.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Add or adjust built-in behavior</TableCell>
          <TableCell>
            <code>plugins/&lt;feature&gt;/</code>
          </TableCell>
          <TableCell>
            Feature behavior belongs with its Lexical commands, transforms, and
            feature-local UI.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Change toolbars, panels, or shell UI</TableCell>
          <TableCell>
            <code>ui/</code>
          </TableCell>
          <TableCell>
            The React composition layer owns the visual surfaces around the
            editor.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Add a new node or serialization helper</TableCell>
          <TableCell>
            <code>core/nodes/&lt;feature&gt;/</code>
          </TableCell>
          <TableCell>
            Node code stays feature-local and should align with its owning
            plugin when a feature spans both layers.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Update onboarding or examples</TableCell>
          <TableCell>
            <code>src/pages/docs/</code>, <code>README.md</code>, and{" "}
            <code>CONTRIBUTING.md</code>
          </TableCell>
          <TableCell>
            Repo context should stay consistent across the app docs and GitHub
            landing page.
          </TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="data-flow">Data Flow</SectionHeading>
      <Paragraph>
        The <code>Editor</code> component in <code>editor.tsx</code> is the
        composition root. It creates the <code>LexicalComposer</code> and
        manages a snapshot state (<code>EditorSnapshot</code>) containing the
        current HTML, Markdown, and plain text output.
      </Paragraph>
      <Paragraph>
        Changes flow like this: user edits content → Lexical fires an update →
        the <code>EditorStatePlugin</code> serializes the new state →{" "}
        <code>editor.tsx</code> receives the snapshot via callback → the output
        panels re-render.
      </Paragraph>

      <SectionHeading id="public-composition">
        Public Composition
      </SectionHeading>
      <Paragraph>
        The top-level <code>Editor</code> now exposes a two-layer model:
        opinionated defaults for product usage, plus public extension points for
        custom composition.
      </Paragraph>
      <Paragraph>
        <code>features</code> toggles built-in behavior plugins such as slash
        command, floating toolbar, focus-on-mount, and markdown shortcuts.
        <code>chrome</code> controls the default shell, header, action bar,
        footer, and output panels.
      </Paragraph>
      <Paragraph>
        <code>slots</code> replaces visual surfaces without forking the editor
        internals, while <code>pluginSlots</code> mounts additional React
        plugins around the built-in plugin stack. <code>extraNodes</code> adds
        custom Lexical nodes without editing <code>core/config.ts</code>.
      </Paragraph>
      <Paragraph>
        See the dedicated <code>Composition</code> and <code>API</code> pages
        for the consumer-facing contracts. This page focuses on how those public
        levers map onto the internal editor structure.
      </Paragraph>

      <SectionHeading id="styling">Styling Strategy</SectionHeading>
      <Paragraph>
        The editor has <strong>zero hardcoded colors</strong>. Every color
        reference goes through Tailwind utility classes backed by ShadCN CSS
        custom properties.
      </Paragraph>
      <Paragraph>
        Lexical content styling is defined in <code>core/theme.ts</code> as a
        map of Tailwind class strings. This keeps the visual mapping declarative
        and theme-aware.
      </Paragraph>
      <Paragraph>
        Editor UI components (toolbar, menus, dialogs) import ShadCN primitives
        from <code>src/components/ui/</code>. This ensures visual consistency
        with the host application.
      </Paragraph>

      <SubHeading id="custom-tokens">Editor-Specific Tokens</SubHeading>
      <Paragraph>
        The editor extends the ShadCN palette with two custom tokens:
      </Paragraph>
      <Paragraph>
        <code>--highlight</code> / <code>--highlight-foreground</code> -- used
        for text highlighting (the marker pen formatting option). These are
        defined in the project's CSS alongside the standard ShadCN tokens.
      </Paragraph>

      <Callout title="Theme compatibility" variant="info">
        Any ShadCN theme that defines the standard token set (background,
        foreground, primary, muted, accent, popover, card, border, etc.) will
        work with the editor out of the box. Just add the{" "}
        <code>--highlight</code> tokens and you're done.
      </Callout>

      <SectionHeading id="plugin-convention">Plugin Conventions</SectionHeading>
      <Paragraph>
        Each plugin directory contains at minimum a <code>plugin.tsx</code> file
        that exports a single React component. This component is rendered inside
        the Lexical composer context.
      </Paragraph>
      <Paragraph>
        Plugins that render UI (toolbars, menus, popovers) use ShadCN
        primitives. Plugins that only modify editor behavior (collapsible
        transforms, markdown shortcuts) return <code>null</code> and are
        headless.
      </Paragraph>
      <Paragraph>
        Support files (<code>types.ts</code>, <code>constants.ts</code>,{" "}
        <code>utils.ts</code>, <code>commands.ts</code>) keep the plugin
        component focused on React wiring.
      </Paragraph>
    </>
  );
}
