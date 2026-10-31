/**
 * Program figures the backend doesn't have yet, for the "Open programs" cards
 * on `/`: how many creators joined and how much of the program's budget is
 * used. Example values for the seeded demo apps only; apps without an entry
 * show neither the budget nor the creators count.
 *
 * TODO(Karol): replace with real data — program budget concept + public creators count.
 */
export type DemoProgramStats = {
  creatorsJoined: number;
  /** US cents, like other money amounts (minor units). */
  budgetUsedMinor: number;
  budgetTotalMinor: number;
};

export const DEMO_PROGRAM_STATS: Record<string, DemoProgramStats> = {
  boxora: { creatorsJoined: 12, budgetUsedMinor: 18_000, budgetTotalMinor: 50_000 },
  crewpass: { creatorsJoined: 48, budgetUsedMinor: 120_000, budgetTotalMinor: 300_000 },
  draftly: { creatorsJoined: 23, budgetUsedMinor: 41_000, budgetTotalMinor: 100_000 },
  lumio: { creatorsJoined: 31, budgetUsedMinor: 210_000, budgetTotalMinor: 500_000 },
  mellow: { creatorsJoined: 9, budgetUsedMinor: 6_000, budgetTotalMinor: 30_000 },
  monetra: { creatorsJoined: 17, budgetUsedMinor: 24_000, budgetTotalMinor: 80_000 },
  orbitly: { creatorsJoined: 26, budgetUsedMinor: 69_000, budgetTotalMinor: 200_000 },
  payvio: { creatorsJoined: 14, budgetUsedMinor: 15_000, budgetTotalMinor: 60_000 },
  pipely: { creatorsJoined: 21, budgetUsedMinor: 52_000, budgetTotalMinor: 150_000 },
  stacklane: { creatorsJoined: 11, budgetUsedMinor: 13_000, budgetTotalMinor: 70_000 },
};
