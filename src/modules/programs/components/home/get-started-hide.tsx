"use client";

import { EyeOff } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HIDDEN_ATTRIBUTE, SKIP_ATTRIBUTE, SKIP_KEY } from "./home-data";

function hide() {
  document.documentElement.setAttribute(HIDDEN_ATTRIBUTE, "");
}

/** Remembers (or forgets) that this browser had no Get started to show. Storage may be blocked. */
function rememberSkip(skip: boolean) {
  try {
    if (skip) localStorage.setItem(SKIP_KEY, "1");
    else localStorage.removeItem(SKIP_KEY);
  } catch {}
  if (!skip) document.documentElement.removeAttribute(SKIP_ATTRIBUTE);
}

/** "Hide": remembers the choice per user in this browser. */
export function HideGetStarted({ storageKey }: { storageKey: string }) {
  // Client navigations don't run the inline script; check once on mount instead.
  useEffect(() => {
    let hidden = false;
    try {
      hidden = localStorage.getItem(storageKey) !== null;
    } catch {}
    if (hidden) hide();
    rememberSkip(hidden);
  }, [storageKey]);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        try {
          localStorage.setItem(storageKey, "1");
        } catch {}
        hide();
        rememberSkip(true);
      }}
      aria-label="Hide get started"
      className="size-10 rounded-full p-0 sm:h-9 sm:w-auto sm:px-3.5"
    >
      <EyeOff aria-hidden />
      <span className="hidden sm:inline">Hide</span>
    </Button>
  );
}

/** Rendered instead of the section once every step is done. */
export function RememberSetupDone() {
  useEffect(() => rememberSkip(true), []);
  return null;
}
