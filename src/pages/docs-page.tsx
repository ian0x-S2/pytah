import { useLayoutEffect } from "react";
import { Redirect, useRoute } from "wouter";
import { DocsLayout } from "@/components/docs/layout";
import { docsMdxComponents } from "@/components/docs/mdx-components";
import { PageHeader } from "@/components/docs/primitives";
import { DOCS_PAGE_BY_SLUG } from "./docs/manifest";

export function DocsPage() {
  const [, params] = useRoute("/docs/*");
  const slug = params?.["*"];

  useLayoutEffect(() => {
    if (!slug) {
      return;
    }

    window.scrollTo({ top: 0 });
  }, [slug]);

  if (!slug) {
    return <Redirect to="/docs/overview" />;
  }

  const page = DOCS_PAGE_BY_SLUG[slug];

  if (!page) {
    return (
      <DocsLayout>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Documentation page not found.</p>
        </div>
      </DocsLayout>
    );
  }

  const Page = page.component;

  return (
    <DocsLayout>
      <article>
        <PageHeader
          badge={page.frontmatter.badge}
          description={page.description}
          title={page.title}
        />
        <Page components={docsMdxComponents} />
      </article>
    </DocsLayout>
  );
}
