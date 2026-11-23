/* Hallmark · genre: modern-minimal · macrostructure: Long Document · design-system: design.md · designed-as-app · radius: sm-only */
import { useEffect, useLayoutEffect } from "react";
import { Redirect, useRoute } from "wouter";

import { DocsLayout } from "@/components/docs/layout";
import { docsMdxComponents } from "@/components/docs/mdx-mapping";
import { PageHeader } from "@/components/docs/primitives";

import { DOCS_PAGE_BY_SLUG } from "./docs/manifest";

export function DocsPage() {
  const [, params] = useRoute("/docs/*");
  const slug = params?.["*"];
  const page = slug ? DOCS_PAGE_BY_SLUG[slug] : undefined;

  useLayoutEffect(() => {
    if (!slug) {
      return;
    }

    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    document.title = page
      ? `${page.title} — Pytah Docs`
      : "Page not found — Pytah Docs";
  }, [page]);

  if (!slug) {
    return <Redirect to="/docs/overview" />;
  }

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
        <PageHeader description={page.description} title={page.title} />
        <Page components={docsMdxComponents} />
      </article>
    </DocsLayout>
  );
}
