/**
 * Lightweight module-level store to pass a selected match candidate from the
 * results list to the detail screen. Expo Router params can't carry complex
 * objects, so we stash the data here before navigating.
 */

import type { MatchResult, RefinementHit, SkyMatch } from "@/lib/api";

export type DetailPayload =
  | { kind: "phase3"; hit: RefinementHit; result: MatchResult }
  | { kind: "phase2"; match: SkyMatch; result: MatchResult };

let _payload: DetailPayload | null = null;

export function setDetailPayload(p: DetailPayload) {
  _payload = p;
}

export function consumeDetailPayload(): DetailPayload | null {
  const p = _payload;
  _payload = null;
  return p;
}
