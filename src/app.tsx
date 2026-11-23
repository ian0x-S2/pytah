import { Link, Redirect, Route, Switch } from "wouter";

import { Button } from "@/components/ui/button";
import { DemoPage } from "@/pages/demo";
import { DocsPage } from "@/pages/docs-page";
import { HomePage } from "@/pages/home";

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-mono text-xs tracking-wider text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you requested does not exist or has moved.
      </p>
      <div className="flex items-center gap-2 pt-2">
        <Button nativeButton={false} render={<Link href="/" />} size="sm">
          Home
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/docs/overview" />}
          size="sm"
          variant="outline"
        >
          Documentation
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/demo" />}
          size="sm"
          variant="ghost"
        >
          Live demo
        </Button>
      </div>
    </main>
  );
}

function App() {
  return (
    <Switch>
      <Route component={HomePage} path="/" />
      <Route component={DemoPage} path="/demo" />
      <Route path="/docs">{() => <Redirect to="/docs/overview" />}</Route>
      <Route component={DocsPage} path="/docs/*" />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;
