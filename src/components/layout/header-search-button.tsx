"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** On the home page it jumps to the catalog search box; elsewhere it opens the home page there. */
export function HeaderSearchButton() {
  const pathname = usePathname();
  return (
    <Link
      href="/#offers"
      aria-label="Search apps"
      onClick={(event) => {
        if (pathname !== "/") return;
        const input = document.getElementById("catalog-search");
        if (!input) return;
        event.preventDefault();
        input.scrollIntoView({ block: "center" });
        input.focus({ preventScroll: true });
      }}
      className="inline-flex size-10 items-center justify-center rounded-full border bg-background outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Search aria-hidden className="size-4.5" />
    </Link>
  );
}
