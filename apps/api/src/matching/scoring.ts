/**
 * Scoring — the single definition of "how good is this match".
 *
 * Every rule (aspect or house) earns a credit in [0, 1]:
 *   - 0 when the rule is not met at all;
 *   - 0.5 for meeting it at the very edge (aspect at the orb limit, planet on
 *     a house cusp);
 *   - up to 1 for meeting it perfectly (exact aspect, planet mid-house).
 * Meeting a rule is worth half; precision is worth the other half. This keeps
 * "4 rules met loosely" ahead of "1 rule met exactly", while still ranking
 * tighter fits higher among candidates that meet the same rules.
 *
 * Fits average the credits of their rules; `compatibility` blends the
 * aspect and house fits (weights in @synastry/api-types).
 *
 * The aspect credit is mirrored in SQL by `buildSkySearchSql` — keep in sync.
 */

import { housePosition, type HouseCusps } from "@synastry/ephemeris";
import {
  ASPECT_WEIGHT,
  HOUSE_WEIGHT,
  type HouseRule,
  type PlanetaryChart,
} from "@synastry/api-types";

/** Smallest angular distance between two longitudes (0..180). */
export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Credit for one aspect rule whose partner planet is `distance`° off exact. */
export function aspectCredit(distance: number, orb: number): number {
  return distance <= orb ? 1 - (0.5 * distance) / orb : 0;
}

/**
 * Credit for one house rule: 0 when `longitude` is outside `house`, otherwise
 * 0.5 on the house's edge rising to 1 at its middle.
 */
export function houseCredit(longitude: number, cusps: HouseCusps, house: number): number {
  const pos = housePosition(longitude, cusps);
  if (pos.house !== house) return 0;
  const centrality = 1 - Math.abs(2 * pos.fraction - 1);
  return 0.5 + 0.5 * centrality;
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function compatibility(aspectFit: number, houseFit: number): number {
  return ASPECT_WEIGHT * aspectFit + HOUSE_WEIGHT * houseFit;
}

// ---------- house rules ----------

export interface HouseScoreInput {
  rules: readonly HouseRule[];
  selfNatal: PlanetaryChart;
  otherNatal: PlanetaryChart;
  selfHouses: HouseCusps;
  otherHouses: HouseCusps;
}

export interface HouseScore {
  /** Mean credit across all rules, 0..1. */
  houseFit: number;
  /** The rules whose planet landed in the requested house. */
  satisfied: HouseRule[];
}

/** Score a (user, partner) pair against the house rules. */
export function scoreHouses(input: HouseScoreInput): HouseScore {
  const satisfied: HouseRule[] = [];
  const credits = input.rules.map((rule) => {
    const natal = rule.planetOf === "self" ? input.selfNatal : input.otherNatal;
    const cusps = rule.houseOf === "self" ? input.selfHouses : input.otherHouses;
    const credit = houseCredit(natal[rule.planet], cusps, rule.house);
    if (credit > 0) satisfied.push(rule);
    return credit;
  });
  return { houseFit: mean(credits), satisfied };
}
