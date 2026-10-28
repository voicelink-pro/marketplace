"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
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

const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
] as const;

/**
 * Theme row of the account menu: Dark/Light as two radio items, so arrow keys
 * reach them like any other item and picking one keeps the menu open. Menu
 * content mounts only when opened, after next-themes has resolved the theme.
 */
export function ThemeMenuRow() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <div className="flex h-11 items-center gap-3 px-2.5 text-sm">
      <SunMoon aria-hidden className="size-4 text-muted-foreground" />
      <span className="flex-1">Theme</span>
      <div role="group" aria-label="Theme" className="flex rounded-full border bg-background p-0.5">
        {THEMES.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            role="menuitemradio"
            aria-checked={resolvedTheme === value}
            onSelect={(event) => {
              event.preventDefault();
              setTheme(value);
            }}
            className="h-7 rounded-full px-3 text-xs font-semibold text-muted-foreground aria-checked:bg-foreground aria-checked:text-background aria-checked:focus:bg-foreground/85 aria-checked:focus:text-background"
          >
            {label}
          </DropdownMenuItem>
        ))}
      </div>
    </div>
  );
}
