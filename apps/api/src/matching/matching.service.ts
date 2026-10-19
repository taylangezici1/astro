import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { createHash } from "node:crypto";

import type { GlobalSky, User as PrismaUser } from "@synastry/database";
import type {
  GoldenDegreeBand,
  HouseRule,
  MatchRequest,
  MatchResult,
  PlanetaryChart,
  PlanetKey,
  ResolvedBirth,
  SkyMatch,
  SynastryRule,
} from "@synastry/api-types";

import { PRISMA, type PrismaInstance } from "../prisma/prisma.module";
import { RefinementService } from "../refinement/refinement.service";
import {
  buildSkyWhereClause,
  computeGoldenDegrees,
  DEFAULT_RULES,
} from "./golden-degree";

// Re-export wire types so existing imports from this module keep compiling.
export type {
  HouseRule,
  MatchRequest,
  MatchResult,
  ResolvedBirth,
  SkyMatch,
  SynastryRule,
};

// Bumped to 5° from the workflow's nominal 3° so the demo flow against a
// small seeded window reliably returns rows. Tighten back to 3° once the
// full 40-year GlobalSky is seeded.
const DEFAULT_ORB = 5;
const DEFAULT_LIMIT = 1_000;
/**
 * How many Phase 2 candidates we hand to Phase 3. Phase 3 cost grows linearly
 * in candidates × districts; capping here keeps the worst-case bounded.
 */
const REFINEMENT_INPUT_CAP = 100;

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly refinement: RefinementService,
    // PRISMA is a Symbol token and CACHE_MANAGER is a string token, so SWC
    // can't infer them from a TypeScript class type — these stay explicit.
    @Inject(PRISMA) private readonly prisma: PrismaInstance,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * Run the matching pipeline for an authenticated user. Birth data, the
   * resolved timezone, and the cached natal chart all live on the User row;
   * the request only carries optional matching tunables (rules, orb, limit,
   * houseRules).
   */
  async findMatches(user: PrismaUser, request: MatchRequest): Promise<MatchResult> {
    const rules = request.rules ?? DEFAULT_RULES;
    const orb = request.orb ?? DEFAULT_ORB;
    const limit = request.limit ?? DEFAULT_LIMIT;

    // 1. Pull the cached natal chart off the user row.
    const natal: PlanetaryChart = {
      sun: user.natalSun,
      moon: user.natalMoon,
      mercury: user.natalMercury,
      venus: user.natalVenus,
      mars: user.natalMars,
      jupiter: user.natalJupiter,
      saturn: user.natalSaturn,
    };

    // 2. Resolve Golden Degrees per rule.
    const bands = computeGoldenDegrees(rules, natal);

    // 3. Cache by (natal, rules, orb, limit). Natal already encodes the
    //    resolved UTC instant, so we don't need the raw inputs in the key.
    const cacheKey = this.buildCacheKey(natal, rules, orb, limit);
    const cached = await this.cache.get<MatchResult>(cacheKey);
    if (cached) {
      this.logger.debug(`cache hit ${cacheKey}`);
      return cached;
    }

    // 4. Build the AND-of-ORs Prisma where clause and run the Fast Filter.
    const where = buildSkyWhereClause(bands, orb);
    const t0 = Date.now();
    const rows = await this.prisma.globalSky.findMany({
      where,
      take: limit,
      orderBy: { timestamp: "asc" },
    });
    this.logger.debug(
      `Phase 2 query: ${rows.length} rows in ${Date.now() - t0}ms`,
    );

    // 5. Score each row by how many bands it actually fell inside. With AND
    //    semantics every row already satisfies every rule, but the score is
    //    forward-compatible with future "soft match" relaxations.
    //
    //    The wire-format SkyMatch (defined in @synastry/api-types) carries
    //    `timestamp` as an ISO string, so we convert here. The original Date
    //    objects on `rows` are still used a few lines below for Phase 3,
    //    which needs them for `calcHouses`.
    const matches: SkyMatch[] = rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp.toISOString(),
      sun: row.sun,
      moon: row.moon,
      mercury: row.mercury,
      venus: row.venus,
      mars: row.mars,
      jupiter: row.jupiter,
      saturn: row.saturn,
      score: scoreRow(row, bands, orb),
    }));

    // 6. Phase 3 — Local Refinement. Hand a capped slice of Phase 2
    //    candidates to the refinement engine; it walks Türkiye's districts,
    //    computes house cusps, and applies the house-rule scoring.
    const refinement = this.refinement.refine({
      selfNatal: natal,
      selfBirthTimestamp: user.birthUtc,
      selfLatitude: user.latitude,
      selfLongitude: user.longitude,
      candidates: rows.slice(0, REFINEMENT_INPUT_CAP).map((row) => ({
        timestamp: row.timestamp,
        natal: extractNatal(row),
      })),
      rules: request.houseRules,
    });

    const result: MatchResult = {
      birth: {
        localISO: `${user.birthLocalDate}T${user.birthLocalTime}:00`,
        utcISO: user.birthUtc.toISOString(),
        timezone: user.birthTimezone,
      },
      natal,
      bands,
      orb,
      matches,
      refinement,
    };
    await this.cache.set(cacheKey, result);
    return result;
  }

  private buildCacheKey(
    natal: PlanetaryChart,
    rules: readonly SynastryRule[],
    orb: number,
    limit: number,
  ): string {
    const payload = JSON.stringify({
      // Round natal degrees to ~arc-minute precision so trivially-different
      // birth instants don't all bypass the cache.
      natal: Object.fromEntries(
        Object.entries(natal).map(([k, v]) => [k, Number(v.toFixed(2))]),
      ),
      rules,
      orb,
      limit,
    });
    return `match:${createHash("sha1").update(payload).digest("hex")}`;
  }
}

/** Pull the seven planet longitudes off a GlobalSky row into a PlanetaryChart. */
function extractNatal(row: GlobalSky): PlanetaryChart {
  return {
    sun: row.sun,
    moon: row.moon,
    mercury: row.mercury,
    venus: row.venus,
    mars: row.mars,
    jupiter: row.jupiter,
    saturn: row.saturn,
  };
}

function scoreRow(
  row: GlobalSky,
  bands: GoldenDegreeBand[],
  orb: number,
): number {
  let score = 0;
  for (const band of bands) {
    const value = (row as unknown as Record<PlanetKey, number>)[band.rule.other];
    if (band.targets.some((t) => angularDistance(value, t) <= orb)) {
      score++;
    }
  }
  return score;
}

/** Smallest angular distance between two longitudes (0..180). */
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}
