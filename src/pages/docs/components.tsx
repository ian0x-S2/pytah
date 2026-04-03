import {
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";

export function ComponentsPage() {
  return (
    <>
      <PageHeader
        description="ShadCN/Base UI primitives used by the editor and how they map to editor features."
        title="Components"
      />

      <SectionHeading id="overview">Overview</SectionHeading>
      <Paragraph>
        The editor depends on <strong>9 ShadCN UI primitives</strong> from{" "}
        <code>src/components/ui/</code>. These are standard shadcn/ui components
        using the <code>base-nova</code> style (Base UI headless primitives
        instead of Radix).
      </Paragraph>
      <Paragraph>
        All components follow the same patterns: <code>data-slot</code>{" "}
        attributes for CSS targeting, <code>cn()</code> for class merging,
        ShadCN design tokens for all colors, and React 19 ref-as-prop (no{" "}
        <code>forwardRef</code>).
      </Paragraph>

      <SectionHeading id="component-map">Component Map</SectionHeading>
      <Table headers={["Component", "Base Primitive", "Used By"]}>
        <TableRow>
          <TableCell>
            <code>Button</code>
          </TableCell>
          <TableCell>
            <code>@base-ui/react/button</code>
          </TableCell>
          <TableCell>Toolbar, action bar, dialogs, table menu</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>Popover</code>
          </TableCell>
          <TableCell>
            <code>@base-ui/react/popover</code>
          </TableCell>
          <TableCell>Block type dropdown, table actions</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>Toggle</code>
          </TableCell>
          <TableCell>
            <code>@base-ui/react/toggle</code>
          </TableCell>
          <TableCell>Floating format toolbar (bold, italic, etc.)</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>Input</code>
          </TableCell>
          <TableCell>
            <code>@base-ui/react/input</code>
          </TableCell>
          <TableCell>Link editor, slash command dialogs</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>Separator</code>
          </TableCell>
          <TableCell>
            <code>@base-ui/react/separator</code>
          </TableCell>
          <TableCell>Toolbar section dividers, table menu</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>Dialog</code>
          </TableCell>
          <TableCell>
            <code>@base-ui/react/dialog</code>
          </TableCell>
          <TableCell>Image/YouTube insert dialogs</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>Command</code>
          </TableCell>
          <TableCell>
            <code>cmdk</code>
          </TableCell>
          <TableCell>Slash command menu</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>Textarea</code>
          </TableCell>
          <TableCell>Native</TableCell>
          <TableCell>Output panels (HTML/Markdown preview)</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>InputGroup</code>
          </TableCell>
          <TableCell>Composite</TableCell>
          <TableCell>Link editor input with action buttons</TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="variant-system">Variant System</SectionHeading>
      <Paragraph>
        The <code>Button</code> component has the richest variant matrix: 6
        visual variants (<code>default</code>, <code>secondary</code>,{" "}
        <code>outline</code>, <code>ghost</code>, <code>link</code>,{" "}
        <code>destructive</code>) and 8 size variants including icon-specific
        sizes (<code>icon-xs</code>, <code>icon-sm</code>, <code>icon</code>,{" "}
        <code>icon-lg</code>).
      </Paragraph>
      <Paragraph>
        The <code>Toggle</code> has 2 variants (<code>default</code>,{" "}
        <code>outline</code>) and 3 sizes. All variants are implemented with{" "}
        <code>class-variance-authority</code> (CVA).
      </Paragraph>

      <SectionHeading id="design-patterns">
        Consistent Design Patterns
      </SectionHeading>

      <SubHeading id="focus">Focus Ring</SubHeading>
      <Paragraph>
        All interactive components use the same focus pattern:{" "}
        <code>
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/50
        </code>
        . This creates a consistent ring using the <code>--ring</code> design
        token.
      </Paragraph>

      <SubHeading id="disabled">Disabled State</SubHeading>
      <Paragraph>
        The standard disabled pattern is{" "}
        <code>disabled:pointer-events-none disabled:opacity-50</code>. Some
        components add <code>disabled:bg-input/50</code> for input-like
        elements.
      </Paragraph>

      <SubHeading id="error">Error/Invalid State</SubHeading>
      <Paragraph>
        Input components support{" "}
        <code>aria-invalid:border-destructive aria-invalid:ring-3</code> for
        accessible error indication driven by the <code>--destructive</code>{" "}
        token.
      </Paragraph>

      <SubHeading id="dark-mode">Dark Mode</SubHeading>
      <Paragraph>
        Dark mode is class-based via a <code>.dark</code> ancestor. Some
        components apply <code>dark:</code> overrides for fine-tuned contrast
        (e.g., <code>dark:bg-input/30</code>,{" "}
        <code>dark:hover:bg-muted/50</code>).
      </Paragraph>
    </>
  );
}
