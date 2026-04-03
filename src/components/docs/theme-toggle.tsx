import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();

  const cycleTheme = () => {
    const order: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const currentIndex = order.indexOf(theme);
    const next = order[(currentIndex + 1) % order.length];
    setTheme(next);
  };

  return (
    <Button
      aria-label={`Current theme: ${theme}. Click to change.`}
      onClick={cycleTheme}
      size="icon-sm"
      variant="ghost"
    >
      {resolvedTheme === "dark" ? (
        <MoonIcon className="size-4" />
      ) : (
        <SunIcon className="size-4" />
      )}
    </Button>
  );
}
