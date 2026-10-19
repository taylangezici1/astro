/**
 * Phase 3 — Local Refinement (workflow.md §4 Phase 3).
 *
 * Each Phase 2 candidate is a moment someone could have been born. Their
 * planets are fixed by that moment, but their houses depend on where they
 * were born — so for every candidate we walk Türkiye's districts, compute the
 * partner's Placidus houses there, and keep the district where the house
 * rules fit best. The result is one theoretical person per candidate, ranked
 * by overall compatibility; the top one is the "Soulmate Profile".
 *
 * Compute budget: candidates × districts `houses_ex2` calls at ~14 µs each
 * (30 × 972 ≈ 0.4 s). Districts are only walked when a rule actually uses
 * the partner's houses, and the loop yields to the event loop between
 * candidates so one request never stalls the rest of the API.
 */

import { Injectable, Logger } from "@nestjs/common";
import { calcHouses, type HouseCusps } from "@synastry/ephemeris";
import {
  DEFAULT_HOUSE_RULES,
  type AspectHit,
  type District,
  type HouseRule,
  type PlanetaryChart,
  type RefinementHit,
  type RefinementResult,
} from "@synastry/api-types";

import { DISTRICT_TIMEZONE, DistrictsService } from "../districts/districts.service";
import { compatibility, scoreHouses, type HouseScore } from "../matching/scoring";
import { TimezoneService } from "../timezone/timezone.service";

// Re-export so existing imports from this module keep compiling.
export type { District, RefinementHit, RefinementResult };

export interface RefinementInput {
  /** User's natal chart. */
  selfNatal: PlanetaryChart;
  /** User's birth instant — needed to compute the user's own house cusps. */
  selfBirthTimestamp: Date;
  /** User's birth location (for the user's own houses, and tie-breaks). */
  selfLatitude: number;
  selfLongitude: number;
  /** Phase 2 candidates, best first. */
  candidates: readonly RefinementCandidate[];
  /** Optional rule override. */
  rules?: readonly HouseRule[];
}

/**
 * Internal candidate shape used by the matching service. We accept Date here
 * because Phase 2 hands us GlobalSky rows that have native Date timestamps;
 * the wire-format conversion to ISO string happens on the way out.
 */
export interface RefinementCandidate {
  timestamp: Date;
  natal: PlanetaryChart;
  aspectFit: number;
  aspects: AspectHit[];
}

const TOP_N = 10;

@Injectable()
export class RefinementService {
  private readonly logger = new Logger(RefinementService.name);

  constructor(
    private readonly districtsService: DistrictsService,
    private readonly timezone: TimezoneService,
  ) {}

  async refine(input: RefinementInput): Promise<RefinementResult> {
    const rules = input.rules ?? DEFAULT_HOUSE_RULES;
    const t0 = Date.now();

    // When no rule looks at the partner's houses, the district can't change
    // the score — every district ties, and the tie-break picks the nearest.
    const usesOtherHouses = rules.some((r) => r.houseOf === "other");
    const districts = this.districtsByDistanceFrom(input.selfLatitude, input.selfLongitude);
    const searched = usesOtherHouses ? districts : districts.slice(0, 1);

    const selfHouses = calcHouses(
      input.selfBirthTimestamp,
      input.selfLatitude,
      input.selfLongitude,
    );

    const hits: Omit<RefinementHit, "localISO" | "timezone">[] = [];
    for (const candidate of input.candidates) {
      const best = bestDistrict(rules, input.selfNatal, selfHouses, candidate, searched);
      if (best) {
        hits.push({
          timestamp: candidate.timestamp.toISOString(),
          natal: candidate.natal,
          district: best.district,
          compatibility: compatibility(candidate.aspectFit, best.score.houseFit),
          aspectFit: candidate.aspectFit,
          houseFit: best.score.houseFit,
          aspects: candidate.aspects,
          satisfiedRules: best.score.satisfied,
        });
      }
      await yieldToEventLoop();
    }

    hits.sort(
      (a, b) => b.compatibility - a.compatibility || a.timestamp.localeCompare(b.timestamp),
    );

    const top: RefinementHit[] = hits.slice(0, TOP_N).map((hit) => ({
      ...hit,
      ...this.timezone.toLocal(new Date(hit.timestamp), DISTRICT_TIMEZONE),
    }));
    const elapsedMs = Date.now() - t0;
    const pairsEvaluated = input.candidates.length * searched.length;

    this.logger.debug(
      `Phase 3: ${input.candidates.length} candidates × ${searched.length} districts = ` +
        `${pairsEvaluated} pairs in ${elapsedMs}ms`,
    );

    return {
      // The wire type is HouseRule[] (mutable); copy out of the readonly input.
      rules: [...rules],
      best: top[0] ?? null,
      top,
      stats: {
        candidatesEvaluated: input.candidates.length,
        districtsEvaluated: searched.length,
        pairsEvaluated,
        elapsedMs,
      },
    };
  }

  /**
   * All districts, nearest to the given point first. Iterating in this order
   * and only replacing the leader on a strictly better score makes "closest
   * to the user's own birthplace" the tie-break.
   */
  private districtsByDistanceFrom(latitude: number, longitude: number): readonly District[] {
    const cosLat = Math.cos((latitude * Math.PI) / 180);
    const dist2 = (d: District) =>
      (d.latitude - latitude) ** 2 + ((d.longitude - longitude) * cosLat) ** 2;
    return [...this.districtsService.all()].sort((a, b) => dist2(a) - dist2(b));
  }
}

/** The district where `candidate`'s houses best fit the rules. */
export function bestDistrict(
  rules: readonly HouseRule[],
  selfNatal: PlanetaryChart,
  selfHouses: HouseCusps,
  candidate: RefinementCandidate,
  districts: readonly District[],
): { district: District; score: HouseScore } | null {
  let best: { district: District; score: HouseScore } | null = null;
  for (const district of districts) {
    const score = scoreHouses({
      rules,
      selfNatal,
      otherNatal: candidate.natal,
      selfHouses,
      otherHouses: calcHouses(candidate.timestamp, district.latitude, district.longitude),
    });
    if (!best || score.houseFit > best.score.houseFit) {
      best = { district, score };
    }
  }
  return best;
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
