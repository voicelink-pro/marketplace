/**
 * How many creators earn with boostlink, for the home page's proof strip.
 * Async already, so the real query drops in here without touching the callers.
 */
export async function getCreatorCount(): Promise<number> {
  // TODO(Karol): replace with a public count of creator accounts (needs a public-safe query/RPC)
  return 10;
}
