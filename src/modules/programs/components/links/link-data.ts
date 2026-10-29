/**
 * Pure helpers for link rows on the Links page and a program's page: each
 * link joined with its clicks and sign-ups, sorting, and how URLs and the
 * attribution window read.
 */
import type { CreatorProgramSummary } from "../../queries";

export type LinkSort = "clicks" | "signups";

/** The per-link part of the attribution summary. */
export type LinkResults = { link_id: string; clicks: number; registrations: number }[];

export type LinkRow = {
  id: string;
  label: string;
  channel: string;
  shareUrl: string;
  isDefault: boolean;
  appName: string;
  appSlug: string;
  logoUrl: string | null;
  /** Null when the results could not be loaded; 0 when the link has none yet. */
  clicks: number | null;
  signups: number | null;
};

/** Every link of the programs, in program order, with its results (0 when the summary has no row for it). */
export function linkRows(
  programs: Pick<CreatorProgramSummary, "appName" | "slug" | "logoUrl" | "links">[],
  results: LinkResults | undefined,
): LinkRow[] {
  const byId = new Map((results ?? []).map((row) => [row.link_id, row]));
  return programs.flatMap((program) =>
    program.links.map((link) => {
      const result = byId.get(link.id);
      return {
        id: link.id,
        label: link.label,
        channel: link.channel,
        shareUrl: link.shareUrl,
        isDefault: link.isDefault,
        appName: program.appName,
        appSlug: program.slug,
        logoUrl: program.logoUrl,
        clicks: results ? (result?.clicks ?? 0) : null,
        signups: results ? (result?.registrations ?? 0) : null,
      };
    }),
  );
}

/** The Links page URL for a program filter and a sort; defaults are left out. */
export function linksHref(program: string | null, sort: LinkSort): string {
  const params = new URLSearchParams();
  if (program) params.set("program", program);
  if (sort !== "clicks") params.set("sort", sort);
  const query = params.toString();
  return query ? `/creator/links?${query}` : "/creator/links";
}

export function parseSort(value: unknown): LinkSort {
  return value === "signups" ? "signups" : "clicks";
}

/** Most first; on a tie, named links before primary ones, then the original order. */
export function sortLinkRows(rows: LinkRow[], sort: LinkSort): LinkRow[] {
  const metric = (row: LinkRow) => (sort === "signups" ? row.signups : row.clicks) ?? -1;
  return rows.toSorted((a, b) => metric(b) - metric(a) || Number(a.isDefault) - Number(b.isDefault));
}

export function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** "/r/token" for a share URL. */
export function sharePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/** The URL without its scheme, as people would type it. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

const number = new Intl.NumberFormat("en");

/** "click" or "clicks", for when the number is styled on its own. */
export const pluralWord = (count: number, word: string) => (count === 1 ? word : `${word}s`);

/** "1 click", "1,320 clicks". */
export const plural = (count: number, word: string) => `${number.format(count)} ${pluralWord(count, word)}`;

/** "30 days", or the range when programs differ. */
export function windowPhrase(days: number[]): string {
  const unique = [...new Set(days)].toSorted((a, b) => a - b);
  if (unique.length === 0) return "the program's attribution window";
  if (unique.length === 1) return plural(unique[0]!, "day");
  return `${unique[0]}–${unique.at(-1)} days, depending on the program`;
}
