/**
 * Hands the latest match result from the results list to the detail screen.
 *
 * Expo Router params can only carry strings, so the list remembers the whole
 * result here and navigates with the hit's timestamp; the detail screen looks
 * the hit up again. Reads don't consume the entry, so re-mounts (React strict
 * mode, fast refresh, navigating back and forth) keep working.
 */

import type { MatchResult, RefinementHit } from "@/lib/api";

let latest: MatchResult | null = null;

export function rememberResult(result: MatchResult): void {
  latest = result;
}

export function findHit(
  timestamp: string,
): { hit: RefinementHit; result: MatchResult } | null {
  const hit = latest?.refinement.top.find((h) => h.timestamp === timestamp);
  return hit && latest ? { hit, result: latest } : null;
}
