import type { MDXComponents } from "mdx/types.js";
import type { ReactElement, ReactNode } from "react";
import {
  extractExportedInterface,
  extractMarkedSource,
} from "@/components/docs/source-utils";
import { FeatureTable, TransformersTable } from "./data-tables";
import {
  Callout,
  CodeBlock,
  FileTree,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "./primitives";

interface CodeProps {
  children?: ReactNode;
  className?: string;
}

interface CodeBlockInfo {
  code: string;
  language?: string;
}

const CODE_LANGUAGE_REGEX = /language-([\w-]+)/;

const collectText = (node: ReactNode): string => {
  if (node == null || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(collectText).join("");
  }
  const element = node as ReactElement<{ children?: ReactNode }>;
  if (element.props) {
    return collectText(element.props.children);
  }
  return "";
};

const findCodeElement = (
  node: ReactNode
): ReactElement<CodeProps> | undefined => {
  if (node == null || typeof node !== "object") {
    return undefined;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findCodeElement(child);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
  const element = node as ReactElement<CodeProps>;
  if (
    typeof element.props?.className === "string" &&
    element.props.className.includes("language-")
  ) {
    return element;
  }
  return findCodeElement(element.props?.children);
};

const extractCodeBlock = (children: ReactNode): CodeBlockInfo => {
  const codeElement = findCodeElement(children);
  const className = String(codeElement?.props?.className ?? "");
  const languageMatch = CODE_LANGUAGE_REGEX.exec(className);
  return {
    code: collectText(codeElement),
    language: languageMatch?.[1],
  };
};

function MDXCodeBlock({ children }: { children?: ReactNode }) {
  const { code, language } = extractCodeBlock(children);
  return <CodeBlock language={language}>{code}</CodeBlock>;
}

function InlineCode({ children }: { children?: ReactNode }) {
  return (
    <code className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.2 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  );
}

function MDXList({
  children,
  ordered = false,
}: {
  children?: ReactNode;
  ordered?: boolean;
}) {
  const className =
    "mb-3.5 space-y-1 text-[13px] text-foreground/80 leading-relaxed sm:text-[13.5px] [&_code]:rounded [&_code]:border [&_code]:border-border/60 [&_code]:bg-muted/40 [&_code]:px-1.5 [&_code]:py-0.2 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground";
  return ordered ? (
    <ol className={className}>{children}</ol>
  ) : (
    <ul className={className}>{children}</ul>
  );
}

function MDXTable({ children }: { children?: ReactNode }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-border/50 bg-transparent shadow-xs">
      <table className="w-full text-left text-[12px] sm:text-[13px] [&_tbody]:divide-y [&_tbody]:divide-border/40 [&_tbody_tr:hover]:bg-muted/15 [&_td]:px-3.5 [&_td]:py-2.5 [&_td]:text-foreground/80 [&_td]:leading-relaxed sm:[&_td]:px-4 sm:[&_td]:py-3 [&_th]:px-3.5 [&_th]:py-2.5 [&_th]:font-medium sm:[&_th]:px-4 [&_thead_tr]:border-border/50 [&_thead_tr]:border-b [&_thead_tr]:bg-muted/25 [&_thead_tr]:font-mono [&_thead_tr]:text-[10px] [&_thead_tr]:text-muted-foreground [&_thead_tr]:uppercase [&_thead_tr]:tracking-wider [&_tr]:transition-colors">
        {children}
      </table>
    </div>
  );
}

interface MarkedSourceProps {
  marker: string;
  source: string;
}

function MarkedSource({ marker, source }: MarkedSourceProps) {
  const extracted = source ? extractMarkedSource(source, marker) : "";
  return <CodeBlock language="text">{extracted}</CodeBlock>;
}

interface InterfaceSourceProps {
  name: string;
  source: string;
}

function InterfaceSource({ name, source }: InterfaceSourceProps) {
  const extracted = source ? extractExportedInterface(source, name) : "";
  return <CodeBlock language="typescript">{extracted}</CodeBlock>;
}

interface ChildrenProps {
  children?: ReactNode;
}

interface AnchorProps extends ChildrenProps {
  href?: string;
}

interface HeadingProps extends ChildrenProps {
  id?: string;
}

export const docsMdxComponents: MDXComponents = {
  a: ({ children, href }: AnchorProps) => (
    <a
      className="font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
      href={href}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: ChildrenProps) => <Callout>{children}</Callout>,
  code: InlineCode,
  h1: ({ children }: ChildrenProps) => (
    <h1 className="mt-8 mb-3 font-semibold text-foreground text-lg tracking-tight first:mt-0 sm:mt-10 sm:text-xl">
      {children}
    </h1>
  ),
  h2: ({ children, id }: HeadingProps) => (
    <SectionHeading id={id}>{children}</SectionHeading>
  ),
  h3: ({ children, id }: HeadingProps) => (
    <SubHeading id={id}>{children}</SubHeading>
  ),
  li: ({ children }: ChildrenProps) => (
    <li className="[&>ol]:mt-1 [&>ul]:mt-1">{children}</li>
  ),
  ol: ({ children }: ChildrenProps) => <MDXList ordered>{children}</MDXList>,
  p: ({ children }: ChildrenProps) => <Paragraph>{children}</Paragraph>,
  pre: MDXCodeBlock,
  table: MDXTable,
  ul: ({ children }: ChildrenProps) => <MDXList>{children}</MDXList>,
  Callout,
  CodeBlock,
  FeatureTable,
  FileTree,
  InterfaceSource,
  MarkedSource,
  TransformersTable,
};
