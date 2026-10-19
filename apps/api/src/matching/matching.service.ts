import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { createHash } from "node:crypto";

import type { User as PrismaUser } from "@synastry/database";
import {
  DEFAULT_HOUSE_RULES,
  DEFAULT_MAX_AGE_GAP,
  DEFAULT_ORB,
  DEFAULT_SYNASTRY_RULES,
  MIN_PARTNER_AGE,
  type AspectHit,
  type GoldenDegreeBand,
  type HouseRule,
  type MatchRequest,
  type MatchResult,
  type PlanetaryChart,
  type ResolvedBirth,
  type SkyMatch,
  type SynastryRule,
} from "@synastry/api-types";

import { PRISMA, type PrismaInstance } from "../prisma/prisma.module";
import { RefinementService } from "../refinement/refinement.service";
import {
  bandDistance,
  birthWindow,
  buildSkySearchSql,
  computeGoldenDegrees,
  dropNearDuplicates,
  type SkySearchRow,
} from "./golden-degree";
import { aspectCredit, mean } from "./scoring";

// Re-export wire types so existing imports from this module keep compiling.
export type {
  HouseRule,
  MatchRequest,
  MatchResult,
  ResolvedBirth,
  SkyMatch,
  SynastryRule,
};

/** How many Phase 2 candidates (distinct days) to return. */
const DEFAULT_LIMIT = 50;
/**
 * How many Phase 2 candidates we hand to Phase 3. Phase 3 cost grows linearly
 * in candidates × districts; capping here keeps the worst case bounded.
 * Candidates arrive best-first, so the tail rarely wins once houses are added.
 */
const REFINEMENT_INPUT_CAP = 30;
/** Bump whenever scoring changes so stale cached results are never served. */
const ENGINE_VERSION = 3;

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  /** Identical requests already being computed (e.g. a double-tapped button). */
  private readonly inflight = new Map<string, Promise<MatchResult>>();

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
   * the request only carries optional matching tunables.
   */
  async findMatches(user: PrismaUser, request: MatchRequest): Promise<MatchResult> {
    const params: MatchParams = {
      rules: request.rules ?? DEFAULT_SYNASTRY_RULES,
      orb: request.orb ?? DEFAULT_ORB,
      limit: request.limit ?? DEFAULT_LIMIT,
      houseRules: request.houseRules ?? DEFAULT_HOUSE_RULES,
      maxAgeGap: request.maxAgeGap ?? DEFAULT_MAX_AGE_GAP,
      // Day-granular, so the "18 or older" cutoff is part of the cache key
      // without making every request unique.
      today: new Date().toISOString().slice(0, 10),
    };

    const cacheKey = buildCacheKey(user, params);
    const cached = await this.cache.get<MatchResult>(cacheKey);
    if (cached) {
      this.logger.debug(`cache hit ${cacheKey}`);
      return cached;
    }

    const running = this.inflight.get(cacheKey);
    if (running) return running;

    const job = this.compute(user, params)
      .then(async (result) => {
        await this.cache.set(cacheKey, result);
        return result;
      })
      .finally(() => this.inflight.delete(cacheKey));
    this.inflight.set(cacheKey, job);
    return job;
  }

  private async compute(user: PrismaUser, params: MatchParams): Promise<MatchResult> {
    const natal = natalOf(user);

    // Phase 2 — Golden Degrees, then the ranked GlobalSky search over
    // partners of a plausible age.
    const bands = computeGoldenDegrees(params.rules, natal);
    const window = birthWindow(
      user.birthUtc,
      params.maxAgeGap,
      MIN_PARTNER_AGE,
      new Date(`${params.today}T00:00:00Z`),
    );
    const t0 = Date.now();
    const rows =
      window.from < window.to
        ? await this.prisma.$queryRaw<SkySearchRow[]>(
            buildSkySearchSql(bands, params.orb, params.limit, window),
          )
        : [];
    this.logger.debug(`Phase 2 query: ${rows.length} rows in ${Date.now() - t0}ms`);

    const candidates = dropNearDuplicates(rows).map((row) => {
      const chart = natalOf(row);
      const aspects = aspectHits(bands, chart, params.orb);
      return {
        row,
        chart,
        aspects,
        aspectFit: mean(aspects.map((a) => aspectCredit(a.distance, params.orb))),
      };
    });

    // The wire-format SkyMatch carries `timestamp` as an ISO string.
    const matches: SkyMatch[] = candidates.map((c) => ({
      id: c.row.id,
      timestamp: c.row.timestamp.toISOString(),
      ...c.chart,
      aspectFit: c.aspectFit,
      aspectsInOrb: c.aspects.filter((a) => a.inOrb).length,
    }));

    // Phase 3 — Local Refinement over the best candidates.
    const refinement = await this.refinement.refine({
      selfNatal: natal,
      selfBirthTimestamp: user.birthUtc,
      selfLatitude: user.latitude,
      selfLongitude: user.longitude,
      candidates: candidates.slice(0, REFINEMENT_INPUT_CAP).map((c) => ({
        timestamp: c.row.timestamp,
        natal: c.chart,
        aspectFit: c.aspectFit,
        aspects: c.aspects,
      })),
      rules: params.houseRules,
    });

    return {
      birth: {
        localISO: `${user.birthLocalDate}T${user.birthLocalTime}:00`,
        utcISO: user.birthUtc.toISOString(),
        timezone: user.birthTimezone,
      },
      natal,
      bands,
      orb: params.orb,
      searchWindow: { from: window.from.toISOString(), to: window.to.toISOString() },
      matches,
      refinement,
    };
  }
}

interface MatchParams {
  rules: readonly SynastryRule[];
  orb: number;
  limit: number;
  houseRules: readonly HouseRule[];
  maxAgeGap: number;
  /** YYYY-MM-DD (UTC) the request was computed for. */
  today: string;
}

/**
 * Everything the result depends on: the user's birth instant and place (for
 * their natal chart and their own houses) plus every tunable.
 */
function buildCacheKey(user: PrismaUser, params: MatchParams): string {
  const payload = JSON.stringify({
    v: ENGINE_VERSION,
    birthUtc: user.birthUtc.toISOString(),
    lat: user.latitude.toFixed(4),
    lng: user.longitude.toFixed(4),
    ...params,
  });
  return `match:${createHash("sha1").update(payload).digest("hex")}`;
}

function aspectHits(
  bands: readonly GoldenDegreeBand[],
  chart: PlanetaryChart,
  orb: number,
): AspectHit[] {
  return bands.map((band) => {
    const distance = bandDistance(band, chart);
    return { rule: band.rule, distance, inOrb: distance <= orb };
  });
}

/** The seven planet longitudes of a User (natal* columns) or GlobalSky row. */
function natalOf(source: PrismaUser | SkySearchRow): PlanetaryChart {
  if ("natalSun" in source) {
    return {
      sun: source.natalSun,
      moon: source.natalMoon,
      mercury: source.natalMercury,
      venus: source.natalVenus,
      mars: source.natalMars,
      jupiter: source.natalJupiter,
      saturn: source.natalSaturn,
    };
  }
  return {
    sun: source.sun,
    moon: source.moon,
    mercury: source.mercury,
    venus: source.venus,
    mars: source.mars,
    jupiter: source.jupiter,
    saturn: source.saturn,
  };
}
