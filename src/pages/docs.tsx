import { Redirect, useRoute } from "wouter";
import { DocsLayout } from "@/components/docs/layout";
import { ArchitecturePage } from "./docs/architecture";
import { ComponentsPage } from "./docs/components";
import { GettingStartedPage } from "./docs/getting-started";
import { PluginsPage } from "./docs/plugins";
import { ThemingPage } from "./docs/theming";

const PAGES: Record<string, React.ComponentType> = {
  architecture: ArchitecturePage,
  components: ComponentsPage,
  "getting-started": GettingStartedPage,
  plugins: PluginsPage,
  theming: ThemingPage,
};

export function DocsPage() {
  const [, params] = useRoute("/docs/:slug*");
  const slug = params?.["slug*"];

  if (!slug) {
    return <Redirect to="/docs/getting-started" />;
  }

  const PageComponent = PAGES[slug];

  if (!PageComponent) {
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
      <PageComponent />
    </DocsLayout>
  );
}
