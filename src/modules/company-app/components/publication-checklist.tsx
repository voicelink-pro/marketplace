"use client";

import { Check, ChevronDown, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Checklist } from "./app-readiness";

/** Short labels and where each item is fixed; `section` is an editor anchor on /company/app. */
const ITEM_META: Record<string, { label: string; section?: string; href?: string }> = {
  copy: { label: "Name & descriptions", section: "editor-basics" },
  taxonomy: { label: "Categories, platforms & languages", section: "editor-listing" },
  destinations: { label: "Website or store link", section: "editor-links" },
  visuals: { label: "Cover & logo", section: "editor-media" },
  plans: { label: "At least one plan", href: "/company/plans" },
  terms: { label: "Program terms", section: "editor-terms" },
};

function itemHref(id: string, editorPath: string): string {
  const meta = ITEM_META[id];
  if (meta?.href) return meta.href;
  return `${editorPath}#${meta?.section ?? "editor-basics"}`;
}

function ChecklistProgress({ checklist }: { checklist: Checklist }) {
  const done = checklist.items.filter((item) => item.complete).length;
  const total = checklist.items.length;
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="tabular text-sm font-semibold">
        {done} of {total} done
      </span>
      <div
        role="progressbar"
        aria-label="Publication checklist"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${(done / total) * 100}%` }} />
      </div>
    </div>
  );
}

/**
 * Publication checklist for the editor. Phones get a "X of 6 done" header
 * with the list collapsed; from `sm` the list is always shown.
 */
export function PublicationChecklist({
  checklist,
  editorPath = "",
}: {
  checklist: Checklist;
  /** Empty on /company/app itself, so items link to in-page anchors. */
  editorPath?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <ChecklistProgress checklist={checklist} />
        <button
          type="button"
          aria-expanded={open}
          aria-controls="publication-checklist"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:hidden"
        >
          {open ? "Hide list" : "Show list"}
          <ChevronDown aria-hidden className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>
      <ul id="publication-checklist" className={cn("gap-2 sm:grid sm:grid-cols-2", open ? "grid" : "hidden")}>
        {checklist.items.map((item) => (
          <li key={item.id}>
            <Link
              href={itemHref(item.id, editorPath)}
              className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3 text-xs outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {item.complete ? (
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary-ink" />
              ) : (
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {ITEM_META[item.id]?.label ?? item.label}
                  <span className="sr-only">{item.complete ? " (done)" : " (to do)"}</span>
                </span>
                <span className="text-muted-foreground">{item.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Overview card version: progress plus links to whatever is still missing. */
export function PublicationChecklistSummary({ checklist }: { checklist: Checklist }) {
  const missing = checklist.items.filter((item) => !item.complete);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <ChecklistProgress checklist={checklist} />
        <Link
          href="/company/app"
          className="text-sm font-medium underline underline-offset-4 hover:text-primary-ink"
        >
          {missing.length > 0 ? "Finish in App profile" : "Open App profile"}
        </Link>
      </div>
      {missing.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {missing.map((item) => (
            <li key={item.id}>
              <Link
                href={itemHref(item.id, "/company/app")}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <CircleAlert aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                {ITEM_META[item.id]?.label ?? item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
