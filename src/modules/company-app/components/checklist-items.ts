/**
 * Short labels, where each publication checklist item is fixed (an editor
 * anchor on /company/app, or its own page) and the call to action for it.
 * Plain module, so server pages and the client checklist share it.
 */
const ITEM_META: Record<string, { label: string; next: string; section?: string; href?: string }> = {
  copy: { label: "Name & descriptions", next: "Next: add name & description", section: "editor-basics" },
  taxonomy: {
    label: "Categories, platforms & languages",
    next: "Next: choose categories & platforms",
    section: "editor-listing",
  },
  destinations: { label: "Website or store link", next: "Next: add a website or store link", section: "editor-links" },
  visuals: { label: "Cover & logo", next: "Next: add cover & logo", section: "editor-media" },
  plans: { label: "At least one plan", next: "Next: add a plan", href: "/company/plans" },
  terms: { label: "Program terms", next: "Next: write program terms", section: "editor-terms" },
};

/** `editorPath` is empty on /company/app itself, so items link to in-page anchors. */
export function checklistItemHref(id: string, editorPath: string): string {
  const meta = ITEM_META[id];
  if (meta?.href) return meta.href;
  return `${editorPath}#${meta?.section ?? "editor-basics"}`;
}

export function checklistItemLabel(id: string, fallback: string): string {
  return ITEM_META[id]?.label ?? fallback;
}

export function checklistItemNext(id: string): string {
  return ITEM_META[id]?.next ?? "Next: finish your app profile";
}
