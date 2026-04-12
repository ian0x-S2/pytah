import {
  GuideFilesSection,
  GuideSourceSection,
} from "@/components/docs/guide-primitives";
import {
  Callout,
  CodeBlock,
  PageHeader,
  SubHeading,
} from "@/components/docs/primitives";
import floatingToolbarActionsSource from "@/components/editor/plugins/floating-toolbar/actions.ts?raw";
import floatingToolbarConstantsSource from "@/components/editor/plugins/floating-toolbar/constants.ts?raw";
import floatingToolbarLinkCommandSource from "@/components/editor/plugins/floating-toolbar/link-command.ts?raw";
import floatingToolbarPluginSource from "@/components/editor/plugins/floating-toolbar/plugin.tsx?raw";
import floatingToolbarSelectionSource from "@/components/editor/plugins/floating-toolbar/selection.ts?raw";
import floatingToolbarTypesSource from "@/components/editor/plugins/floating-toolbar/types.ts?raw";

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

      <GuideFilesSection
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

      <GuideSourceSection
        code={floatingToolbarTypesSource}
        id="types"
        language="ts"
        path="src/components/editor/plugins/floating-toolbar/types.ts"
        title="types.ts"
      />

      <GuideSourceSection
        code={floatingToolbarConstantsSource}
        id="constants"
        language="ts"
        path="src/components/editor/plugins/floating-toolbar/constants.ts"
        title="constants.ts"
      />

      <GuideSourceSection
        code={floatingToolbarLinkCommandSource}
        id="link-command"
        language="ts"
        path="src/components/editor/plugins/floating-toolbar/link-command.ts"
        title="link-command.ts"
      >
        A dedicated Lexical command that tells{" "}
        <code>FloatingLinkEditorPlugin</code>
        to open in edit mode. Kept in a separate file so the floating toolbar
        and link editor can import it without a circular dependency.
      </GuideSourceSection>

      <GuideSourceSection
        code={floatingToolbarSelectionSource}
        id="selection"
        language="ts"
        path="src/components/editor/plugins/floating-toolbar/selection.ts"
        title="selection.ts"
      >
        Pure read-only helpers that compute the toolbar's state from the current
        Lexical selection. Called inside{" "}
        <code>editor.getEditorState().read()</code>.
      </GuideSourceSection>

      <GuideSourceSection
        code={floatingToolbarActionsSource}
        id="actions"
        language="ts"
        path="src/components/editor/plugins/floating-toolbar/actions.ts"
        title="actions.ts"
      >
        Imperative helpers that dispatch Lexical commands or call{" "}
        <code>editor.update()</code>. Imported by the plugin and by the floating
        link editor.
      </GuideSourceSection>

      <GuideSourceSection
        code={floatingToolbarPluginSource}
        id="plugin"
        language="tsx"
        path="src/components/editor/plugins/floating-toolbar/plugin.tsx"
        title="plugin.tsx"
      >
        The plugin subscribes to <code>SELECTION_CHANGE_COMMAND</code> and the
        update listener, then renders the toolbar as a fixed portal over the
        selection. A <code>isColorPickerOpenRef</code> prevents the toolbar from
        disappearing while a color popover is open.
      </GuideSourceSection>

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
