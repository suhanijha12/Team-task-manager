"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  collapsed?: boolean;
  compact?: boolean;
};

export function ThemeToggle({
  collapsed = false,
  compact = false
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useClientMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        collapsed || compact ? "h-10 w-10 px-0" : "w-full justify-start"
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      size={collapsed || compact ? "icon" : "sm"}
      type="button"
      variant="ghost"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className={collapsed || compact ? "sr-only" : undefined}>
        {isDark ? "Light mode" : "Dark mode"}
      </span>
    </Button>
  );
}

function useClientMounted() {
  return useSyncExternalStore(
    useCallback(() => () => undefined, []),
    () => true,
    () => false
  );
}
