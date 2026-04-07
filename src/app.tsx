import { Route, Switch } from "wouter";
import { DemoPage } from "@/pages/demo";
import { DocsPage } from "@/pages/docs-page";
import { HomePage } from "@/pages/home";

function App() {
  return (
    <Switch>
      <Route component={HomePage} path="/" />
      <Route component={DemoPage} path="/demo" />
      <Route component={DocsPage} path="/docs/*" />
      <Route>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Page not found</p>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
