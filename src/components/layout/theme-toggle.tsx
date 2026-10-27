"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/**
 * Icons and labels switch through the `dark:` variant rather than the theme
 * value, so the server render matches the client before next-themes resolves.
 */
function useToggleTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  return () => setTheme(resolvedTheme === "light" ? "dark" : "light");
}

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = useToggleTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={toggle}
      aria-label="Toggle light or dark theme"
      className={className}
    >
      <Sun aria-hidden className="hidden dark:block" />
      <Moon aria-hidden className="dark:hidden" />
    </Button>
  );
}

export function ThemeMenuItem() {
  const toggle = useToggleTheme();
  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        toggle();
      }}
    >
      <Sun aria-hidden className="hidden dark:block" />
      <Moon aria-hidden className="dark:hidden" />
      <span className="hidden dark:inline">Light theme</span>
      <span className="dark:hidden">Dark theme</span>
    </DropdownMenuItem>
  );
}
