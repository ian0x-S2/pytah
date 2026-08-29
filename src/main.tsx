import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import App from "./app.tsx";
import "./index.css";

// Disable reload scroll restoration before the browser's first layout pass.
// Chrome re-applies the pre-reload offset (repeatedly, as late-loading
// images/fonts grow the page) and would otherwise land mid-page — racing and
// beating the per-page `window.scrollTo(0, 0)` calls that only run after
// first paint.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
