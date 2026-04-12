import { CodeBlock, FileTree, Paragraph, SectionHeading } from "./primitives";

export function GuideFilesSection({ items }: { items: string[] }) {
  return (
    <>
      <SectionHeading id="files">Files</SectionHeading>
      <FileTree items={items} />
    </>
  );
}

export function GuideSourceSection({
  children,
  code,
  id,
  language,
  path,
  title,
}: {
  children?: React.ReactNode;
  code: string;
  id: string;
  language: string;
  path: string;
  title: string;
}) {
  return (
    <>
      <SectionHeading id={id}>{title}</SectionHeading>
      {children ? <Paragraph>{children}</Paragraph> : null}
      <CodeBlock label={path} language={language}>
        {code}
      </CodeBlock>
    </>
  );
}
