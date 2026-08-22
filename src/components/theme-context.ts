import { createContext, useContext } from "react";

export type Theme = "light" | "dark" | "system";

export interface ThemeProviderState {
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  theme: Theme;
}

export const STORAGE_KEY = "pytah-theme";

export const ThemeContext = createContext<ThemeProviderState | undefined>(
  undefined
);

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function disableTransitions(): () => void {
  const css = document.createElement("style");
  css.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important;-webkit-animation-play-state:paused!important;animation-play-state:paused!important}"
    )
  );
  document.head.appendChild(css);

  let removed = false;

  return () => {
    // Force synchronous style/layout calculation so the theme swap applies
    // while transitions are disabled and running animations are paused
    window.getComputedStyle(document.body);

    // Keep the suppression alive until the swapped frame has actually been
    // painted: a bare 1ms timeout can fire before that frame is committed,
    // letting elements with transition-* classes visibly interpolate.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (removed) {
          return;
        }
        removed = true;
        document.head.removeChild(css);
      });
    });
    setTimeout(() => {
      if (removed) {
        return;
      }
      removed = true;
      document.head.removeChild(css);
    }, 100);
  };
}

export function applyThemeToDOM(resolved: "light" | "dark"): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const shouldBeDark = resolved === "dark";

  if (isDark === shouldBeDark) {
    return;
  }

  const restoreTransitions = disableTransitions();

  if (shouldBeDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  restoreTransitions();
}

export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
