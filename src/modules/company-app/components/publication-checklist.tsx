"use client";

import { Check, ChevronDown, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Checklist } from "./app-readiness";
import { checklistItemHref, checklistItemLabel } from "./checklist-items";

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
              href={checklistItemHref(item.id, editorPath)}
              className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3 text-xs outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {item.complete ? (
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary-ink" />
              ) : (
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {checklistItemLabel(item.id, item.label)}
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
