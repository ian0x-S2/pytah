import { useEffect, useLayoutEffect, useState } from "react";

import {
  applyThemeToDOM,
  getSystemTheme,
  readStoredTheme,
  STORAGE_KEY,
  ThemeContext,
} from "./theme-context";
import type { Theme, ThemeProviderState } from "./theme-context";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme
  );
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  const updateTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  // Layout effect so the .dark class flips in the same commit as consumers
  // (e.g. Shiki inline colors) — avoids a painted frame with mismatched
  // tokens, which shows up as a flash on theme-styled elements.
  useLayoutEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      setSystemTheme(getSystemTheme());
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  const value: ThemeProviderState = {
    resolvedTheme,
    setTheme: updateTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
