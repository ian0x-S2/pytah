import {
  Callout,
  CodeBlock,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";

export function ThemingPage() {
  return (
    <>
      <PageHeader
        description="How the design token system works and how to swap or customize themes with zero refactoring."
        title="Theming"
      />

      <SectionHeading id="how-it-works">How It Works</SectionHeading>
      <Paragraph>
        The entire visual system is driven by{" "}
        <strong>CSS custom properties</strong> (design tokens). The editor and
        all its UI components reference these tokens through Tailwind utility
        classes like <code>bg-background</code>,{" "}
        <code>text-muted-foreground</code>, <code>border-border</code>, etc.
      </Paragraph>
      <Paragraph>The token architecture has two layers:</Paragraph>
      <Paragraph>
        <strong>Source of truth</strong> -- the <code>:root</code> and{" "}
        <code>.dark</code> blocks in your CSS define every semantic color in
        oklch color space.
      </Paragraph>
      <Paragraph>
        <strong>Tailwind bridge</strong> -- the <code>@theme inline</code> block
        maps these properties into Tailwind v4's <code>--color-*</code>{" "}
        namespace, enabling utility classes.
      </Paragraph>

      <SectionHeading id="swapping-themes">
        Swapping a ShadCN Theme
      </SectionHeading>
      <Paragraph>
        To apply a different ShadCN theme, you only need to replace the{" "}
        <code>:root</code> and <code>.dark</code> blocks in{" "}
        <code>src/index.css</code>. The <code>@theme inline</code> bridge and
        all component code stay untouched.
      </Paragraph>

      <SubHeading>Step 1: Get new tokens</SubHeading>
      <Paragraph>
        Go to{" "}
        <a
          className="text-primary underline underline-offset-4"
          href="https://ui.shadcn.com/themes"
          rel="noopener noreferrer"
          target="_blank"
        >
          ui.shadcn.com/themes
        </a>{" "}
        and pick a theme. Copy the CSS variables for both light and dark modes.
      </Paragraph>

      <SubHeading>Step 2: Replace the token blocks</SubHeading>
      <Paragraph>
        Replace the <code>:root</code> and <code>.dark</code> blocks in your CSS
        with the new values. Keep the editor-specific <code>--highlight</code>{" "}
        tokens:
      </Paragraph>
      <CodeBlock language="css">
        {`:root {
  /* Paste new ShadCN light theme tokens here */
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... all standard ShadCN tokens ... */

  /* Keep these editor-specific tokens */
  --highlight: oklch(0.905 0.145 98);
  --highlight-foreground: oklch(0.145 0 0);
  --radius: 0.625rem;
}

.dark {
  /* Paste new ShadCN dark theme tokens here */
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... all standard ShadCN tokens ... */

  /* Keep these editor-specific tokens */
  --highlight: oklch(0.65 0.13 85);
  --highlight-foreground: oklch(0.985 0 0);
}`}
      </CodeBlock>

      <SubHeading>Step 3: Done</SubHeading>
      <Paragraph>
        That's it. No component code changes, no Tailwind config changes, no
        refactoring. Every editor surface updates automatically.
      </Paragraph>

      <SectionHeading id="token-reference">Token Reference</SectionHeading>
      <Paragraph>
        These are the ShadCN tokens consumed by the editor. All must be present
        for the editor to render correctly.
      </Paragraph>
      <Table headers={["Token", "Usage"]}>
        <TableRow>
          <TableCell>
            <code>--background</code>
          </TableCell>
          <TableCell>
            Editor surface, input backgrounds, resize handles
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--foreground</code>
          </TableCell>
          <TableCell>Body text, headings, code text</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--card</code>
          </TableCell>
          <TableCell>Collapsible container background</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--card-foreground</code>
          </TableCell>
          <TableCell>Collapsible container text</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--popover</code>
          </TableCell>
          <TableCell>
            Floating toolbar, slash menu, link editor backgrounds
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--popover-foreground</code>
          </TableCell>
          <TableCell>Popover text color</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--primary</code>
          </TableCell>
          <TableCell>
            Links, selected table cells, HR active, checked checkbox bg
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--primary-foreground</code>
          </TableCell>
          <TableCell>Checked checkbox icon, primary button text</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--muted</code>
          </TableCell>
          <TableCell>
            Code blocks, table headers, icon badges, drag handle hover
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--muted-foreground</code>
          </TableCell>
          <TableCell>
            Placeholder text, descriptions, secondary labels
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--accent</code>
          </TableCell>
          <TableCell>Hover/focus states in menus and toolbars</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--accent-foreground</code>
          </TableCell>
          <TableCell>Active menu item text</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--destructive</code>
          </TableCell>
          <TableCell>Delete actions in table menu</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--border</code>
          </TableCell>
          <TableCell>
            All borders: table cells, collapsible, layout grid, HR, inputs
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--input</code>
          </TableCell>
          <TableCell>Input field borders</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--ring</code>
          </TableCell>
          <TableCell>Focus rings on interactive elements</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--highlight</code>
          </TableCell>
          <TableCell>Text highlight marker background</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>--highlight-foreground</code>
          </TableCell>
          <TableCell>Text color on highlighted text</TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="dark-mode">Dark Mode</SectionHeading>
      <Paragraph>
        Dark mode is controlled by a <code>.dark</code> class on the{" "}
        <code>&lt;html&gt;</code> element. The included{" "}
        <code>ThemeProvider</code> manages this automatically with three modes:
        light, dark, and system (follows OS preference).
      </Paragraph>
      <Paragraph>
        Tailwind's <code>dark:</code> variant is configured as{" "}
        <code>@custom-variant dark (&amp;:is(.dark *))</code>, matching any
        element inside a <code>.dark</code> ancestor.
      </Paragraph>

      <SectionHeading id="customizing-highlight">
        Customizing the Highlight Color
      </SectionHeading>
      <Paragraph>
        The highlight token defaults to a warm yellow. To change it, update the{" "}
        <code>--highlight</code> values in your <code>:root</code> and{" "}
        <code>.dark</code> blocks:
      </Paragraph>
      <CodeBlock language="css">
        {`/* Example: blue highlight */
:root {
  --highlight: oklch(0.85 0.12 250);
  --highlight-foreground: oklch(0.145 0 0);
}
.dark {
  --highlight: oklch(0.45 0.12 250);
  --highlight-foreground: oklch(0.985 0 0);
}`}
      </CodeBlock>

      <Callout variant="tip">
        Use the oklch color space for consistency with the rest of the ShadCN
        palette. Tools like{" "}
        <a
          className="text-primary underline underline-offset-4"
          href="https://oklch.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          oklch.com
        </a>{" "}
        make it easy to pick values.
      </Callout>
    </>
  );
}
