/**
 * House rules — Phase 3 input (workflow.md §4 Phase 3).
 *
 * A house rule says "<owner>'s <planet> falls in <party>'s <house>th house".
 * The party whose houses we use determines whose birth location matters.
 *
 *   - `houseOf: "self"`  → uses the user's house cusps (fixed per request,
 *                          computed from the user's birth lat/lng).
 *   - `houseOf: "other"` → uses the candidate partner's house cusps
 *                          (recomputed for every candidate timestamp +
 *                          district pair).
 */

import type { HouseRule, Party } from "@synastry/api-types";

// Re-export so existing imports from this module keep working.
export type { HouseRule, Party };

/**
 * Default Phase 3 rule set. These are classic synastry "soulmate" rules:
 *   - Partner's Venus in user's 7th house  → partner brings romantic energy
 *     into the user's marriage axis.
 *   - User's Sun in partner's 7th house    → user is the partner's "ideal".
 *   - Partner's Moon in user's 1st house   → emotional resonance with the
 *     user's identity.
 */
export const DEFAULT_HOUSE_RULES: readonly HouseRule[] = [
  { planetOf: "other", planet: "venus", houseOf: "self", house: 7 },
  { planetOf: "self", planet: "sun", houseOf: "other", house: 7 },
  { planetOf: "other", planet: "moon", houseOf: "self", house: 1 },
];
