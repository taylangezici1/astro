/**
 * Golden Degree logic — workflow.md §3.
 *
 * A "Synastry Rule" says: "I want to find someone whose <other> planet sits
 * <aspect> away from my own <self> planet, within ±<orb>°".
 *
 * Given a natal chart and a list of rules, this module produces:
 *   - The exact target longitudes (with wraparound) for each (planet, aspect)
 *     pair.
 *   - The parameterised SQL that ranks GlobalSky rows by how well they meet
 *     those targets (Phase 2's "Fast Filter").
 */

import type {
  AspectName,
  GoldenDegreeBand,
  PlanetKey,
  PlanetaryChart,
  SynastryRule,
} from "@synastry/api-types";
import { Prisma } from "@synastry/database";

import { angularDistance } from "./scoring";

// Re-export so existing imports from this module keep compiling.
export type { AspectName, GoldenDegreeBand, SynastryRule };

// ---------- aspects ----------

/**
 * Supported aspects (workflow.md §3). Each aspect is symmetric: a 120° trine
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

export const PLANET_KEYS: readonly PlanetKey[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
];

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

// ---------- age window ----------

export interface BirthWindow {
  /** Inclusive. */
  from: Date;
  /** Exclusive. */
  to: Date;
}

function addYears(date: Date, years: number): Date {
  const out = new Date(date);
  out.setUTCFullYear(out.getUTCFullYear() + years);
  return out;
}

/**
 * Births a partner may have: within `maxAgeGap` years of the user, and at
 * least `minAge` years old at `now`. `from >= to` means nobody qualifies.
 */
export function birthWindow(
  userBirth: Date,
  maxAgeGap: number,
  minAge: number,
  now: Date,
): BirthWindow {
  const from = addYears(userBirth, -maxAgeGap);
  const latestByGap = addYears(userBirth, maxAgeGap);
  const latestAdult = addYears(now, -minAge);
  return { from, to: latestByGap < latestAdult ? latestByGap : latestAdult };
}

/** Degrees between `chart[band.rule.other]` and the nearest target of `band`. */
export function bandDistance(band: GoldenDegreeBand, chart: PlanetaryChart): number {
  const value = chart[band.rule.other];
  return Math.min(...band.targets.map((t) => angularDistance(value, t)));
}

// ---------- SQL ----------

/** A whitelisted, quoted column identifier. Never interpolate unchecked input. */
function column(planet: PlanetKey): Prisma.Sql {
  if (!PLANET_KEYS.includes(planet)) {
    throw new Error(`Unknown planet column: ${String(planet)}`);
  }
  return Prisma.raw(`"${planet}"`);
}

function num(value: number): Prisma.Sql {
  return Prisma.sql`${value}::double precision`;
}

/**
 * Range conditions matching "this column lies within ±orb of a target".
 * Wraparound at 0°/360° becomes two ranges instead of one.
 */
export function rangeConditions(
  planet: PlanetKey,
  targets: readonly number[],
  orb: number,
): Prisma.Sql[] {
  const col = column(planet);
  const out: Prisma.Sql[] = [];
  for (const target of targets) {
    const low = target - orb;
    const high = target + orb;
    if (low < 0) {
      // e.g. target=2, orb=3 → [-1, 5] → [359, 360] ∪ [0, 5]
      out.push(Prisma.sql`${col} >= ${num(low + 360)}`);
      out.push(Prisma.sql`${col} <= ${num(high)}`);
    } else if (high > 360) {
      // e.g. target=358, orb=3 → [355, 361] → [355, 360] ∪ [0, 1]
      out.push(Prisma.sql`${col} >= ${num(low)}`);
      out.push(Prisma.sql`${col} <= ${num(high - 360)}`);
    } else {
      out.push(Prisma.sql`${col} BETWEEN ${num(low)} AND ${num(high)}`);
    }
  }
  return out;
}

/** SQL for `bandDistance`: the angular distance to the nearest target. */
function distanceSql(band: GoldenDegreeBand): Prisma.Sql {
  const col = column(band.rule.other);
  const perTarget = band.targets.map((t) => {
    // |a − b| folded into [0, 180]. Postgres has no float modulo, so fold via
    // floor: a − b − 360·⌊(a − b + 180) / 360⌋ lies in [−180, 180).
    const diff = Prisma.sql`(${col} - ${num(t)})`;
    return Prisma.sql`ABS(${diff} - 360 * FLOOR((${diff} + 180) / 360))`;
  });
  return perTarget.length === 1
    ? perTarget[0]
    : Prisma.sql`LEAST(${Prisma.join(perTarget, ", ")})`;
}

/**
 * Keep rows (already sorted best first) that are at least `minGapMs` from
 * every better row. The SQL keeps one row per UTC day, but two days' bests
 * can sit either side of midnight — the same person twice.
 */
export function dropNearDuplicates<T extends { timestamp: Date }>(
  rows: readonly T[],
  minGapMs = 12 * 60 * 60_000,
): T[] {
  const kept: T[] = [];
  for (const row of rows) {
    const t = row.timestamp.getTime();
    if (kept.every((k) => Math.abs(k.timestamp.getTime() - t) >= minGapMs)) kept.push(row);
  }
  return kept;
}

/** Shape of each row returned by `buildSkySearchSql`. */
export interface SkySearchRow extends PlanetaryChart {
  id: number;
  timestamp: Date;
  aspect_fit: number;
}

/**
 * Phase 2 query (workflow.md §4): rank GlobalSky by aspect fit and return
 * the best tick of each UTC day, best days first.
 *
 *   1. WHERE keeps rows inside the birth window that meet at least one rule
 *      within the orb — rows that meet none would score 0 anyway. Each
 *      branch is an index range.
 *   2. Every remaining row is scored with the same formula as
 *      `scoring.aspectCredit` (keep the two in sync).
 *   3. DISTINCT ON collapses each day to its best tick. Neighbouring
 *      15-minute ticks share almost the same chart, so without this the top
 *      results would be one person repeated dozens of times.
 */
export function buildSkySearchSql(
  bands: readonly GoldenDegreeBand[],
  orb: number,
  limit: number,
  window: BirthWindow,
): Prisma.Sql {
  if (bands.length === 0) throw new Error("At least one rule is required");

  const anyRuleInOrb = Prisma.join(
    bands.flatMap((b) => rangeConditions(b.rule.other, b.targets, orb)),
    " OR ",
  );
  const credits = bands.map((band) => {
    const d = distanceSql(band);
    return Prisma.sql`CASE WHEN ${d} <= ${num(orb)} THEN 1 - 0.5 * ${d} / ${num(orb)} ELSE 0 END`;
  });
  const aspectFit = Prisma.sql`(${Prisma.join(credits, " + ")}) / ${num(bands.length)}`;

  return Prisma.sql`
    SELECT * FROM (
      SELECT DISTINCT ON (date_trunc('day', "timestamp"))
        "id", "timestamp", "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
        ${aspectFit} AS "aspect_fit"
      FROM "GlobalSky"
      WHERE "timestamp" >= ${window.from} AND "timestamp" < ${window.to}
        AND (${anyRuleInOrb})
      ORDER BY date_trunc('day', "timestamp"), "aspect_fit" DESC, "timestamp" ASC
    ) AS best_per_day
    ORDER BY "aspect_fit" DESC, "timestamp" ASC
    LIMIT ${limit}
  `;
}
