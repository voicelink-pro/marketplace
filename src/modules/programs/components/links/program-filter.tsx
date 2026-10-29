import { SegmentedNav } from "@/components/layout/segmented-nav";

export type ProgramFilterOption = { slug: string; appName: string };

/** "All programs" and one segment per program, as links; `hrefFor` keeps the page's other params. */
export function ProgramFilter({
  programs,
  selected,
  hrefFor,
}: {
  programs: ProgramFilterOption[];
  selected: string | null;
  hrefFor: (slug: string | null) => string;
}) {
  const options = [{ slug: null, appName: "All programs" }, ...programs];
  return (
    <SegmentedNav
      label="Filter by program"
      items={options.map((option) => ({
        key: option.slug ?? "all",
        href: hrefFor(option.slug),
        label: option.appName,
        active: option.slug === selected,
      }))}
    />
  );
}
