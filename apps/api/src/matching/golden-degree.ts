/**
 * Golden Degree logic — workflow.md §3.
 *
 * A "Synastry Rule" says: "I want to find someone whose <other> planet sits
 * <aspect> away from my own <self> planet, within ±<orb>°".
 *
 * Given a natal chart and a list of rules, this module produces:
 *   - The exact target longitudes (with wraparound) for each (planet, aspect)
 *     pair.
 *   - A Prisma `where` clause that the matching service can use to query
 *     GlobalSky.
 */

import type {
  AspectName,
  GoldenDegreeBand,
  PlanetKey,
  PlanetaryChart,
  SynastryRule,
} from "@synastry/api-types";
import type { Prisma } from "@synastry/database";

// Re-export so existing imports from this module keep compiling.
export type { AspectName, GoldenDegreeBand, SynastryRule };

// ---------- aspects ----------

/**
 * Harmonious aspects (workflow.md §3). Each aspect is symmetric: a 120° trine
 * works the same whether you add or subtract. Keys must stay in sync with the
 * `AspectName` literal union in @synastry/api-types.
 */
export const ASPECTS: Record<AspectName, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

/**
 * Default rule set. Intentionally minimal so the demo flow returns rows
 * against a small seeded window — four strict ANDed rules at ±3° rarely
 * intersect inside a single year of GlobalSky data. The "classic" four-rule
 * synastry set (sun-moon, venus-mars, mars-venus, moon-venus) is left as a
 * commented reference for when the full 40-year seed is in place.
 */
export const DEFAULT_RULES: readonly SynastryRule[] = [
  { self: "venus", aspect: "trine", other: "mars" },
  { self: "sun", aspect: "trine", other: "moon" },
];
// export const STRICT_RULES: readonly SynastryRule[] = [
//   { self: "sun", aspect: "trine", other: "moon" },
//   { self: "venus", aspect: "trine", other: "mars" },
//   { self: "mars", aspect: "trine", other: "venus" },
//   { self: "moon", aspect: "sextile", other: "venus" },
// ];

// ---------- target degree calculation ----------

/** Wrap a longitude into [0, 360). */
function wrap360(degrees: number): number {
  const mod = degrees % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * For a single rule, compute the partner-planet target longitudes. Symmetric
 * aspects yield two targets (e.g. trine = ±120°); conjunction yields one;
 * opposition collapses to one because +180 ≡ −180.
 */
export function computeTargets(rule: SynastryRule, natal: PlanetaryChart): number[] {
  const offset = ASPECTS[rule.aspect];
  const base = natal[rule.self];

  if (offset === 0) return [wrap360(base)];
  if (offset === 180) return [wrap360(base + 180)];

  return [wrap360(base + offset), wrap360(base - offset)];
}

export function computeGoldenDegrees(
  rules: readonly SynastryRule[],
  natal: PlanetaryChart,
): GoldenDegreeBand[] {
  return rules.map((rule) => ({ rule, targets: computeTargets(rule, natal) }));
}

// ---------- prisma where builder ----------

/**
 * For a given planet column, build the OR-list of range conditions that match
 * "this column lies within ±orb of any of the targets". Handles wraparound at
 * 0°/360° by emitting two ranges instead of one.
 */
function rangeConditionsForPlanet(
  planet: PlanetKey,
  targets: number[],
  orb: number,
): Prisma.GlobalSkyWhereInput[] {
  const out: Prisma.GlobalSkyWhereInput[] = [];
  for (const target of targets) {
    const low = target - orb;
    const high = target + orb;

    if (low < 0) {
      // e.g. target=2, orb=3 → [-1, 5] → [359, 360] ∪ [0, 5]
      out.push({ [planet]: { gte: low + 360, lte: 360 } });
      out.push({ [planet]: { gte: 0, lte: high } });
    } else if (high > 360) {
      // e.g. target=358, orb=3 → [355, 361] → [355, 360] ∪ [0, 1]
      out.push({ [planet]: { gte: low, lte: 360 } });
      out.push({ [planet]: { gte: 0, lte: high - 360 } });
    } else {
      out.push({ [planet]: { gte: low, lte: high } });
    }
  }
  return out;
}

/**
 * Build the AND-of-ORs Prisma `where` clause that finds GlobalSky rows
 * satisfying every rule simultaneously. This is the "Fast Filter" of
 * workflow.md §4 Phase 2.
 */
export function buildSkyWhereClause(
  bands: GoldenDegreeBand[],
  orb: number,
): Prisma.GlobalSkyWhereInput {
  return {
    AND: bands.map((band) => ({
      OR: rangeConditionsForPlanet(band.rule.other, band.targets, orb),
    })),
  };
}
