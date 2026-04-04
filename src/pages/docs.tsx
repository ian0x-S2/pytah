import { Redirect, useRoute } from "wouter";
import { DocsLayout } from "@/components/docs/layout";
import { ApiPage } from "./docs/api";
import { ArchitecturePage } from "./docs/architecture";
import { ComponentsPage } from "./docs/components";
import { CompositionPage } from "./docs/composition";
import { GettingStartedPage } from "./docs/getting-started";
import { CollapsibleGuidePage } from "./docs/guides/collapsible";
import { DraggableBlockGuidePage } from "./docs/guides/draggable-block";
import { FloatingToolbarGuidePage } from "./docs/guides/floating-toolbar";
import { ImageGuidePage } from "./docs/guides/image";
import { LayoutGuidePage } from "./docs/guides/layout";
import { LinkBehaviorGuidePage } from "./docs/guides/link-behavior";
import { SlashCommandGuidePage } from "./docs/guides/slash-command";
import { TableBehaviorGuidePage } from "./docs/guides/table-behavior";
import { YouTubeGuidePage } from "./docs/guides/youtube";
import { PluginsPage } from "./docs/plugins";
import { ThemingPage } from "./docs/theming";

const PAGES: Record<string, React.ComponentType> = {
  api: ApiPage,
  architecture: ArchitecturePage,
  composition: CompositionPage,
  components: ComponentsPage,
  "getting-started": GettingStartedPage,
  "guides/collapsible": CollapsibleGuidePage,
  "guides/draggable-block": DraggableBlockGuidePage,
  "guides/floating-toolbar": FloatingToolbarGuidePage,
  "guides/image": ImageGuidePage,
  "guides/layout": LayoutGuidePage,
  "guides/link-behavior": LinkBehaviorGuidePage,
  "guides/slash-command": SlashCommandGuidePage,
  "guides/table-behavior": TableBehaviorGuidePage,
  "guides/youtube": YouTubeGuidePage,
  plugins: PluginsPage,
  theming: ThemingPage,
};

export function DocsPage() {
  const [, params] = useRoute("/docs/*");
  const slug = params?.["*"];

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
