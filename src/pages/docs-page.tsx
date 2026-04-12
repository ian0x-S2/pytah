import { Redirect, useRoute } from "wouter";
import { DocsLayout } from "@/components/docs/layout";
import { DOCS_PAGE_BY_SLUG } from "./docs/manifest";

export function DocsPage() {
  const [, params] = useRoute("/docs/*");
  const slug = params?.["*"];

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

  return (
    <DocsLayout>
      <page.component />
    </DocsLayout>
  );
}
